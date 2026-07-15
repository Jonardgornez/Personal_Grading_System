export interface AuthUserPayload {
  userId: number;
  tokenVersion: number;
  email: string;
}

export interface JWTPayloadData extends AuthUserPayload {
  tokenId: string; // Anti-replay identifier
}

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      validationErrors?: Record<string, string[]>;
    };

export interface AccessTokenPayload {
  jti: string;
  teacherId: string;
  email: string;
  tokenVersion: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sessionId: string;
  tokenId: string;
  teacherId: string;
}

export interface AuthResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}
