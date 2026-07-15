import { cache } from "react";
import { cookies } from "next/headers";
import { getTokensFromCookies } from "@/lib/cookies/authCookies";
import { verifyAccessToken } from "@/lib/jwt/token";
import { prisma } from "@/lib/prisma";

// Token rotation is handled by middleware (src/middleware.ts).
// By the time this runs, the access token is guaranteed to be fresh.
// cache() deduplicates calls within the same request render tree (layout + page).
export const getCurrentTeacher = cache(async function getCurrentTeacher() {
  const cookieStore = await cookies();
  const { accessToken } = getTokensFromCookies(cookieStore);

  if (!accessToken) return null;

  const payload = await verifyAccessToken(accessToken);
  if (!payload) return null;

  try {
    if (payload.jti) {
      const revoked = await prisma.revokedToken.findUnique({ where: { jti: payload.jti } });
      if (revoked) return null;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Can't reach database") || msg.includes("connect")) {
      throw new Error("DATABASE_UNAVAILABLE: Can't reach database server at localhost:3308");
    }
    throw err;
  }

  return { teacherId: payload.teacherId, email: payload.email };
});
