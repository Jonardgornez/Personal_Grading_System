import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const ACCESS_COOKIE_NAME = "at_secure_ctx";
const REFRESH_COOKIE_NAME = "rt_secure_ctx";

const isProduction = process.env.NODE_ENV === "production";

const baseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
};

export function setAuthCookies(
  cookieJar: ResponseCookies | ReadonlyRequestCookies,
  accessToken: string,
  refreshToken: string,
) {
  cookieJar.set(ACCESS_COOKIE_NAME, accessToken, {
    ...baseOptions,
    maxAge: 15 * 60, // 15 minutes
  });

  cookieJar.set(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookies(
  cookieJar: ResponseCookies | ReadonlyRequestCookies,
) {
  cookieJar.set(ACCESS_COOKIE_NAME, "", { ...baseOptions, maxAge: 0 });
  cookieJar.set(REFRESH_COOKIE_NAME, "", { ...baseOptions, maxAge: 0 });
}

export function getTokensFromCookies(
  cookieJar: ReadonlyRequestCookies | ResponseCookies,
) {
  const accessToken = cookieJar.get(ACCESS_COOKIE_NAME)?.value || null;
  const refreshToken = cookieJar.get(REFRESH_COOKIE_NAME)?.value || null;
  return { accessToken, refreshToken };
}
