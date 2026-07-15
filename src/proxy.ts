import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_COOKIE = "at_secure_ctx";
const REFRESH_COOKIE = "rt_secure_ctx";

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
};

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Fast path: access token still valid
  if (accessToken) {
    try {
      await jwtVerify(accessToken, ACCESS_SECRET);
      return NextResponse.next();
    } catch {
      // Expired or invalid — fall through to refresh
    }
  }

  // No refresh token → redirect to login, preserving the intended destination
  if (!refreshToken) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Call the refresh route handler (runs in Node.js runtime with Prisma)
  try {
    const refreshUrl = new URL("/api/auth/refresh", request.url);
    const refreshResponse = await fetch(refreshUrl, {
      method: "POST",
      headers: { cookie: `${REFRESH_COOKIE}=${refreshToken}` },
    });

    if (!refreshResponse.ok) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await refreshResponse.json();

    // Forward the new access token to the upstream Server Component/Action
    const requestHeaders = new Headers(request.headers);
    const existingCookies = request.headers.get("cookie") ?? "";
    const stripped = existingCookies
      .split(";")
      .filter(
        (c) =>
          !c.trim().startsWith(`${ACCESS_COOKIE}=`) &&
          !c.trim().startsWith(`${REFRESH_COOKIE}=`),
      )
      .join(";");
    const newCookieHeader = [stripped, `${ACCESS_COOKIE}=${newAccessToken}`, `${REFRESH_COOKIE}=${newRefreshToken}`]
      .filter(Boolean)
      .join("; ");
    requestHeaders.set("cookie", newCookieHeader);

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Tell the browser to update its stored cookies
    response.cookies.set(ACCESS_COOKIE, newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60,
    });
    response.cookies.set(REFRESH_COOKIE, newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /auth (login page)
     * - /api/auth/* (refresh + future auth endpoints — must be excluded to avoid loops)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, static files
     */
    "/((?!auth|api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
