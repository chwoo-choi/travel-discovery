// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const explicitRedirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) {
    console.error("GOOGLE_CLIENT_ID 환경변수가 설정되어 있지 않습니다.");
    return NextResponse.json(
      {
        message:
          "구글 로그인 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.",
      },
      { status: 500 }
    );
  }

  // 콜백 URL 결정:
  // 1순위: GOOGLE_REDIRECT_URI (env에서 명시적으로 지정)
  // 2순위: 현재 요청 origin 기반으로 /api/auth/google/callback
  const callbackUrl =
    explicitRedirectUri ||
    new URL("/api/auth/google/callback", req.nextUrl.origin).toString();

  // 현재 요청이 https인지 여부에 따라 secure 쿠키 여부 결정
  // (duckdns에서 http라면 secure=false가 되어 쿠키가 정상 동작함)
  const isHttps = req.nextUrl.protocol === "https:";

  // CSRF 방지를 위한 랜덤 state 생성
  const state = crypto.randomBytes(16).toString("hex");

  // 로그인 후 어디로 보낼지 (선택 사항)
  // 예: /api/auth/google?redirect=/bookmark
  const redirectParam = req.nextUrl.searchParams.get("redirect");
  const redirectTo =
    redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";

  const scope = ["openid", "email", "profile"].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope,
    access_type: "offline", // refresh token을 받을 수 있음 (필요 없으면 제거 가능)
    prompt: "consent", // 항상 동의 화면을 띄우고 싶지 않다면 조정 가능
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const res = NextResponse.redirect(googleAuthUrl);

  // CSRF 방지를 위한 state 값을 쿠키에 저장
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps, // ★ http 환경에서는 false → 쿠키가 제대로 저장됨
    path: "/",
    maxAge: 60 * 10, // 10분
  });

  // 로그인 완료 후 리다이렉트할 경로도 쿠키에 저장 (없으면 "/")
  res.cookies.set("google_oauth_redirect_to", redirectTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 60 * 10,
  });

  return res;
}
