import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (in production, use Redis or a proper cache)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
};

function getRateLimitKey(request: NextRequest): string {
  // Get IP address from headers (works with proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  // Fall back to request.nextUrl.hostname for lack of better server-side IP; otherwise "unknown"
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.nextUrl.hostname || "unknown";
  return ip;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Clean expired records inline to avoid background timers in middleware runtime.
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false; // Rate limit exceeded
  }

  // Increment count
  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // CRITICAL: Early return for sitemap.xml and robots.txt - must return pure XML/text
  // No scripts, no HTML, no layout wrapping
  // The route handler at /sitemap.xml/route.ts will handle this
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    // Let the route handler process it - don't add any headers that might interfere
    return NextResponse.next();
  }

  // Security headers for all other routes
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  // Apply rate limiting only on API routes.
  // Page routes are handled by CDN/page cache and should not pay middleware compute.
  if (pathname.startsWith("/api")) {
    const ip = getRateLimitKey(request);
    const allowed = checkRateLimit(ip);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    // Add rate limit headers
    const record = rateLimitMap.get(ip);
    if (record) {
      response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT.maxRequests));
      response.headers.set(
        "X-RateLimit-Remaining",
        String(RATE_LIMIT.maxRequests - record.count),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        String(Math.ceil(record.resetTime / 1000)),
      );
    }
  }

  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    // Keep middleware off public page traffic to reduce Vercel Fluid CPU usage.
    "/api/:path*",
  ],
};
