"use server";

import { cookies, headers } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/prisma";
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
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * TEACHER REGISTRATION ACTION
 */
export async function registerAction(
  formData: FormData,
): Promise<AuthResponse> {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      "unknown";
    const { allowed } = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      return { success: false, error: "Too many registration attempts. Please try again later." };
    }

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = registerSchema.safeParse(rawData);

    if (!validatedFields.success) {
      // FIXED: Use .issues instead of .errors to read Zod array tracking structures
      const errorMessage = validatedFields.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errorMessage };
    }

    const { email, password, firstName, lastName } = validatedFields.data;

    // Concurrency collision defense check
    const existingTeacher = await prisma.teacher.findUnique({
      where: { email },
    });
    if (existingTeacher) {
      return {
        success: false,
        error: "This institutional email is already registered.",
      };
    }

    // FIXED: Handled with explicit bcryptjs hashing allocation
    const hashedPassword = await bcrypt.hash(password, 12);

    // Map camelCase Zod properties cleanly into snake_case MySQL database columns
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
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
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
    console.error("[registerAction]", err);
    return {
      success: false,
      error: "Account initialization failed. System error.",
    };
  }
}

/**
 * TEACHER LOGIN ACTION
 */
export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const start = Date.now();
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      "unknown";
    const { allowed } = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return { success: false, error: "Too many login attempts. Please try again later." };
    }

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = loginSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return { success: false, error: "Invalid credentials provided." };
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
    console.error("[loginAction]", err);
    return { success: false, error: "Authentication engine failure." };
  } finally {
    const elapsed = Date.now() - start;
    if (elapsed < 400) {
      await new Promise((resolve) => setTimeout(resolve, 400 - elapsed));
    }
  }
}

/**
 * TEACHER LOGOUT ACTION
 */
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
    } catch {
      // Absorb errors cleanly to enforce global layout cookie wipeouts
    }
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
    } catch (e) {
      console.error("[logoutAction] blocklist error:", e);
    }
  }

  clearAuthCookies(cookieStore);
  redirect("/auth");
}

/**
 * ACTIVE AUTH REFRESH PIPELINE ACTION
 */
export async function refreshSessionAction(): Promise<
  AuthResponse<{ accessToken: string }>
> {
  const cookieStore = await cookies();
  const { refreshToken } = getTokensFromCookies(cookieStore);

  if (!refreshToken) return { success: false, error: "Session absent." };

  try {
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      clearAuthCookies(cookieStore);
      return { success: false, error: "Malformed token payload." };
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
      return { success: false, error: "Breached or expired session context." };
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
    return { success: false, error: "Internal rotation failure." };
  }
}

async function fakeConstantTimeVerification(password: string) {
  const fakeHash =
    "$2a$12$K89sO4R9Xm/rZ9Pca78We.T4Rz3Pq9mUeYmOmYkW7C7F3X.6E2D12";
  await bcrypt.compare(password, fakeHash);
}
