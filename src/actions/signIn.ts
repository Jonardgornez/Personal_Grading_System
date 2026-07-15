"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/jwt/token";
import {
  setAuthCookies,
  clearAuthCookies,
  getTokensFromCookies,
} from "@/lib/cookies/authCookies";
import { AuthResponse } from "@/types/auth";

export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const start = Date.now();
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = loginSchema.safeParse(rawData);

    if (!validatedFields.success) {
      // Return inside try so the finally block still enforces the 400ms minimum delay
      return {
        success: false,
        error: "Invalid input layout parameters passed.",
      };
    }

    const { email, password } = validatedFields.data;
    const teacher = await prisma.teacher.findUnique({ where: { email } });

    if (!teacher) {
      await fakeConstantTimeVerification(password);
      return { success: false, error: "Invalid credentials." };
    }

    const isValidPassword = await bcrypt.compare(
      password,
      teacher.password_hash,
    );
    if (!isValidPassword) {
      return { success: false, error: "Invalid credentials." };
    }

    const accessToken = await signAccessToken({
      teacherId: teacher.id,
      email: teacher.email,
      tokenVersion: teacher.token_version,
    });

    const tokenId = crypto.randomUUID();
    const dbSession = await prisma.refreshSession.create({
      data: {
        teacher_id: teacher.id,
        token_id: tokenId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const refreshToken = await signRefreshToken({
      sessionId: dbSession.id,
      tokenId: dbSession.token_id,
      teacherId: teacher.id,
    });

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, accessToken, refreshToken);

    return { success: true };
  } catch (err) {
    return { success: false, error: "Internal runtime execution error." };
  } finally {
    const elapsed = Date.now() - start;
    if (elapsed < 400) {
      await new Promise((res) => setTimeout(res, 400 - elapsed));
    }
  }
}

export async function registerAction(
  formData: FormData,
): Promise<AuthResponse> {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = registerSchema.safeParse(rawData);

    if (!validatedFields.success) {
      const errorMessage = validatedFields.error.issues
        .map((i) => i.message)
        .join(", ");
      return { success: false, error: errorMessage };
    }

    const { email, password, firstName, lastName } = validatedFields.data;
    const existingTeacher = await prisma.teacher.findUnique({
      where: { email },
    });

    if (existingTeacher) {
      return {
        success: false,
        error: "This institutional email is already registered.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const teacher = await prisma.teacher.create({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        password_hash: hashedPassword,
      },
    });

    const accessToken = await signAccessToken({
      teacherId: teacher.id,
      email: teacher.email,
      tokenVersion: teacher.token_version,
    });

    const tokenId = crypto.randomUUID();
    const dbSession = await prisma.refreshSession.create({
      data: {
        teacher_id: teacher.id,
        token_id: tokenId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const refreshToken = await signRefreshToken({
      sessionId: dbSession.id,
      tokenId: dbSession.token_id,
      teacherId: teacher.id,
    });

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, accessToken, refreshToken);

    return { success: true };
  } catch (err) {
    return { success: false, error: "Account initialization failed." };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const { refreshToken, accessToken } = getTokensFromCookies(cookieStore);

  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload) {
        await prisma.refreshSession.update({
          where: { token_id: payload.tokenId },
          data: { is_revoked: true },
        });
      }
    } catch {}
  }

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      if (payload?.jti && payload?.exp) {
        await prisma.$transaction([
          prisma.revokedToken.deleteMany({ where: { expires_at: { lt: new Date() } } }),
          prisma.revokedToken.create({
            data: { jti: payload.jti, expires_at: new Date(payload.exp * 1000) },
          }),
        ]);
      }
    } catch {}

  }

  clearAuthCookies(cookieStore);
  redirect("/auth");
}

export async function refreshSessionAction(): Promise<
  AuthResponse<{ accessToken: string }>
> {
  const cookieStore = await cookies();
  const { refreshToken } = getTokensFromCookies(cookieStore);

  if (!refreshToken)
    return { success: false, error: "Session context absent." };

  try {
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      clearAuthCookies(cookieStore);
      return { success: false, error: "Malformed token profile." };
    }

    const session = await prisma.refreshSession.findUnique({
      where: { token_id: payload.tokenId },
      include: { teacher: true },
    });

    if (!session || session.is_revoked || session.expires_at < new Date()) {
      if (session) {
        await prisma.refreshSession.updateMany({
          where: { teacher_id: session.teacher_id },
          data: { is_revoked: true },
        });
      }
      clearAuthCookies(cookieStore);
      return {
        success: false,
        error: "Session signature breached or expired.",
      };
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

    setAuthCookies(cookieStore, newAccessToken, newRefreshToken);
    return { success: true, data: { accessToken: newAccessToken } };
  } catch {
    clearAuthCookies(cookieStore);
    return { success: false, error: "Token rotation engine failure." };
  }
}

async function fakeConstantTimeVerification(password: string) {
  const fakeHash =
    "$2a$12$K89sO4R9Xm/rZ9Pca78We.T4Rz3Pq9mUeYmOmYkW7C7F3X.6E2D12";
  await bcrypt.compare(password, fakeHash);
}
