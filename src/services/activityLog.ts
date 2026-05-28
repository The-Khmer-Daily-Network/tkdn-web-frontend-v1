import type { User } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in environment variables");
  }
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

export interface ActivityLogRow {
  id: number;
  created_at: string;
  created_at_display: string;
  user_id: number | null;
  username: string | null;
  action: string;
  action_type?: 'login' | 'create' | 'update' | 'delete' | null;
  details: string;
  subject_type: string | null;
  subject_id: number | null;
  summary_line: string;
}

export interface ActivityLogListResponse {
  success: boolean;
  data: ActivityLogRow[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export type ActivityLogPerPage = 30 | 50 | 100;

export interface ActivityLogQueryOptions {
  page?: number;
  perPage?: ActivityLogPerPage;
  /** Maps to API `user_id` — filter rows by who performed the action */
  filterByUserId?: number | null;
  /** Maps to API `action` — substring match */
  actionContains?: string | null;
  /** Maps to API `action_type` — structured filter: 'login'|'create'|'update'|'delete' */
  actionType?: 'login' | 'create' | 'update' | 'delete' | null;
}

/**
 * SME-only listing. Always send `X-User-Id` with the current SME account id.
 * Use `filterByUserId` / `actionContains` for server-side filters (do not conflate with SME auth).
 */
export async function getActivityLogs(
  smeUserId: number,
  options: ActivityLogQueryOptions = {},
): Promise<ActivityLogListResponse> {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 30;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (options.filterByUserId != null && options.filterByUserId > 0) {
    params.set("user_id", String(options.filterByUserId));
  }
  if (options.actionContains?.trim()) {
    params.set("action", options.actionContains.trim());
  }
  if (options.actionType) {
    params.set("action_type", options.actionType);
  }

  const url = `${getApiUrl("/admin/activity-logs")}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-User-Id": String(smeUserId),
    },
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to load activity log: ${response.status} ${response.statusText}. ${text}`,
    );
  }

  return response.json();
}

/** Load `/user` list for filter dropdown and manual-log attribution. */
export async function fetchUsersList(): Promise<User[]> {
  const url = getApiUrl("/user");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to load users: ${response.status} ${response.statusText}. ${text}`,
    );
  }

  const data = (await response.json()) as { success?: boolean; data?: User[] };
  return Array.isArray(data.data) ? data.data : [];
}

export async function deleteActivityLog(
  smeUserId: number,
  logId: number,
): Promise<{ success: boolean; message?: string }> {
  const url = getApiUrl(`/admin/activity-logs/${logId}`);
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-User-Id": String(smeUserId),
    },
    body: JSON.stringify({ user_id: smeUserId }),
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to delete activity log: ${response.status} ${response.statusText}. ${text}`,
    );
  }

  return response.json();
}

export async function createActivityLogEntry(
  smeUserId: number,
  payload: {
    action: string;
    details: string;
    action_type?: 'login' | 'create' | 'update' | 'delete';
    user_id?: number;
    subject_type?: string;
    subject_id?: number;
  },
): Promise<{ success: boolean; message?: string }> {
  const url = getApiUrl("/admin/activity-logs");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-User-Id": String(smeUserId),
    },
    body: JSON.stringify({
      ...payload,
      user_id: payload.user_id ?? smeUserId,
    }),
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to create activity log: ${response.status} ${response.statusText}. ${text}`,
    );
  }

  return response.json();
}
