import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.nextUrl.hostname || "unknown";
  return ip;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/** Next.js 16 proxy (replaces middleware). Only runs on /api to limit Vercel Fluid CPU. */
export function proxy(request: NextRequest) {
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

  const response = NextResponse.next();
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

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
