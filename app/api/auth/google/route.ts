// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

function getCookieSecureFlag(): boolean {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const isHttps = baseUrl.startsWith("https://");
  const isProd = process.env.NODE_ENV === "production";

  // 🔹 로그인 / 회원가입과 동일한 기준:
  // 프로덕션 + HTTPS 일 때만 secure 쿠키 사용
  // 현재 duckdns(http) 환경에서는 secure = false
  return isProd && isHttps;
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!clientId || !redirectUri) {
    throw new Error("GOOGLE_CLIENT_ID 또는 GOOGLE_REDIRECT_URI가 설정되어 있지 않습니다.");
  }

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL 환경 변수가 설정되어 있지 않습니다.");
  }

  return { clientId, redirectUri, baseUrl };
}

export async function GET(req: NextRequest) {
  try {
    const { clientId, redirectUri } = getGoogleConfig();

    const searchParams = req.nextUrl.searchParams;
    const redirectTo = searchParams.get("redirect") || "/";

    // CSRF 방지를 위한 state 값
    const state = randomUUID();

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("access_type", "offline");

    const useSecureCookies = getCookieSecureFlag();

    const response = NextResponse.redirect(authUrl.toString(), { status: 302 });

    // 🔹 여기서 굽는 쿠키의 secure 설정이 핵심
    response.cookies.set("google_oauth_state", state, {
      httpOnly: true,
      secure: useSecureCookies, // ✅ HTTP 환경에서는 false
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10분
    });

    response.cookies.set("google_oauth_redirect_to", redirectTo, {
      httpOnly: true,
      secure: useSecureCookies, // ✅ 동일하게 처리
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("Google OAuth 시작 에러:", error);
    return NextResponse.json(
      {
        message:
          "Google 로그인 준비 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

