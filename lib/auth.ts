// lib/auth.ts
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

// jsonwebtoken의 JwtPayload에 우리가 쓰는 필드만 살짝 얹어서 사용
type AppJwtPayload = jwt.JwtPayload & {
  sub?: string;   // JWT spec상 string이 정상 타입 → 나중에 number로 파싱
  email?: string;
  name?: string;
};

// JWT payload에서 user id 추출
function getUserIdFromPayload(payload: AppJwtPayload): number | null {
  if (!payload.sub) return null;
  const parsed = Number(payload.sub);
  return Number.isNaN(parsed) ? null : parsed;
}

// 실제 토큰 문자열을 받아서 DB에서 유저 조회
async function getUserFromToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AppJwtPayload;
    const userId = getUserIdFromPayload(decoded);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;
  } catch (error) {
    console.error("JWT 검증 실패:", error);
    return null;
  }
}

// Route Handler (app/api/**/route.ts) 같은 곳에서 사용
export async function getCurrentUserFromRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  const token = req.cookies.get("token")?.value;
  return getUserFromToken(token);
}

// 서버 컴포넌트 / 서버 훅에서 사용 (cookies() 기반)
export async function getCurrentUser(): Promise<AuthUser | null> {
  // 네 환경에서 cookies() 타입이 Promise<ReadonlyRequestCookies>로 잡혀 있어서 await 사용
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  return getUserFromToken(token);
}

