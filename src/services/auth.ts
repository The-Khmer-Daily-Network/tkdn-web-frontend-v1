import type { UserResponse, User, LoginCredentials } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_EXPIRES_AT_KEY = "authExpiresAt";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

if (!API_BASE_URL) {
  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not defined in environment variables",
  );
}

/**
 * Get the full API URL with proper path
 */
function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined in environment variables",
    );
  }

  // Remove trailing slash from API_BASE_URL if present
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  // Ensure path starts with /
  const apiPath = path.startsWith("/") ? path : `/${path}`;

  // Simply concatenate baseUrl and path since baseUrl already includes /api
  return `${baseUrl}${apiPath}`;
}

/**
 * Fetch current user data from /user endpoint
 * This endpoint returns all users, so we need to filter by credentials
 */
export async function getCurrentUser(
  credentials?: LoginCredentials,
): Promise<User | null> {
  try {
    const url = getApiUrl("/user");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch user: ${response.status} ${response.statusText}`,
      );
    }

    const data: UserResponse = await response.json();

    if (!data.success || !data.data || data.data.length === 0) {
      return null;
    }

    // If credentials provided, find matching user
    if (credentials) {
      const user = data.data.find(
        (u) =>
          u.gmail === credentials.gmail && u.password === credentials.password,
      );
      return user || null;
    }

    // For now, return the first user if no credentials provided
    // In a real app, you'd use session/token authentication
    return data.data[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Login user with credentials
 */
export async function login(
  credentials: LoginCredentials,
): Promise<User | null> {
  try {
    const user = await getCurrentUser(credentials);

    if (user) {
      // Store user in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(user));
        localStorage.setItem(
          AUTH_EXPIRES_AT_KEY,
          String(Date.now() + SESSION_DURATION_MS),
        );
      }
      return user;
    }

    return null;
  } catch (error) {
    console.error("Error logging in:", error);
    return null;
  }
}

/**
 * Logout user
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser");
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    // Remove common token keys in case other modules use them.
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  }
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const expiresAtRaw = localStorage.getItem(AUTH_EXPIRES_AT_KEY);
    const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
    if (!expiresAt || Number.isNaN(expiresAt) || Date.now() >= expiresAt) {
      logout();
      return null;
    }

    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as User;
  } catch (error) {
    console.error("Error parsing stored user:", error);
    return null;
  }
}

/**
 * Persist user to localStorage (used after profile updates)
 */
export function setStoredUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}

/**
 * Check if user can access admin features.
 * Keeps backward-compat name because many components still call isSME().
 */
export function isSME(user: User | null): boolean {
  const role = user?.role?.trim().toUpperCase();
  return role === "SME" || role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Update only the current user's password.
 */
export async function updateUserPassword(
  userId: number,
  password: string,
): Promise<User> {
  const url = getApiUrl(`/user/${userId}`);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "omit",
    mode: "cors",
    body: JSON.stringify({ password }),
  });

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    // Keep raw for error below
  }

  if (!response.ok) {
    const message =
      parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message?: unknown }).message ?? "Failed to update password")
        : `Failed to update password: ${response.status} ${response.statusText}. ${raw}`;
    throw new Error(message);
  }

  const payload = parsed as { success?: boolean; data?: User; message?: string } | null;
  if (!payload?.data) {
    throw new Error("Password updated but invalid user payload returned");
  }

  const stored = getStoredUser();
  const mergedUser: User = {
    ...(stored ?? payload.data),
    ...payload.data,
    password: payload.data.password || password,
  };
  setStoredUser(mergedUser);
  return mergedUser;
}
