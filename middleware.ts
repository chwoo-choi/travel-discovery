// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// JWT 토큰 검증 함수 (Edge 런타임용)
async function verifyJwtToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
      return false;
    }

    const encodedKey = new TextEncoder().encode(secret);

    // signup/login에서 jsonwebtoken으로 만든 HS256 토큰을 jose로 검증
    await jwtVerify(token, encodedKey);
    return true;
  } catch (error) {
    console.error("JWT 검증 실패:", error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // matcher에서 이미 /bookmark 경로만 들어오도록 제한하지만,
  // 혹시 모를 확장을 위해 여기서도 의미상 주석을 남김.
  // if (!pathname.startsWith("/bookmark")) return NextResponse.next();

  const token = req.cookies.get("token")?.value;

  // 쿠키가 없거나, 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
  if (!token || !(await verifyJwtToken(token))) {
    const loginUrl = new URL("/login", req.url);

    // 나중에 로그인 성공 후 redirect에 활용할 수 있도록 쿼리 파라미터 부여
    const redirectTo = pathname + search;
    loginUrl.searchParams.set("redirect", redirectTo);

    return NextResponse.redirect(loginUrl);
  }

  // 토큰이 유효하면 그대로 진행
  return NextResponse.next();
}

// 이 미들웨어가 적용될 경로 설정
export const config = {
  matcher: ["/bookmark/:path*"],
};
