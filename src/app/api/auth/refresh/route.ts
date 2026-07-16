import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt/token";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)rt_secure_ctx=([^;]+)/);
    const refreshToken = match?.[1] ?? null;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const session = await prisma.refreshSession.findUnique({
      where: { token_id: payload.tokenId },
      include: { teacher: true },
    });

    if (!session || session.is_revoked || session.expires_at < new Date()) {
      return NextResponse.json({ error: "Session expired or revoked" }, { status: 401 });
    }

    const newAccessToken = await signAccessToken({
      teacherId: session.teacher.id,
      email: session.teacher.email,
      tokenVersion: session.teacher.token_version,
    });

    const newTokenId = crypto.randomUUID();
    const newDbSession = await prisma.refreshSession.create({
      data: {
        teacher_id: session.teacher_id,
        token_id: newTokenId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const newRefreshToken = await signRefreshToken({
      sessionId: newDbSession.id,
      tokenId: newDbSession.token_id,
      teacherId: session.teacher_id,
    });

    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { is_revoked: true },
    });

    return NextResponse.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
