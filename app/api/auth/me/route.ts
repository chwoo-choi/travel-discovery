// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type AuthTokenPayload = {
  sub: string | number;
  email: string;
  name?: string | null;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경 변수가 설정되어 있지 않습니다.");
  }
  return secret;
}

export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get("token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const token = tokenCookie.value;
    const jwtSecret = getJwtSecret();

    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    } catch {
      // 토큰 만료 또는 변조 → 동일하게 "로그인이 필요합니다."
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const userId = decoded.sub;
    const email = decoded.email;
    const name = decoded.name ?? null;

    if (!userId || !email) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          // number든 string이든 그대로 반환 (프론트에서 string으로만 쓰고 싶으면 거기서 변환)
          id: userId,
          email,
          name,
        },
      },
      { status: 200 }
    );
  } catch {
    // JWT_SECRET 누락 등 서버 내부 문제
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        message:
          "인증 정보를 확인하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
