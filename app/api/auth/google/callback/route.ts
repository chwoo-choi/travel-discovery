// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// Google 토큰 응답 타입
type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

// Google 사용자 정보 타입
type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

// 공통: 구글 OAuth 관련 쿠키 제거
function clearGoogleOauthCookies(res: NextResponse) {
  res.cookies.set("google_oauth_state", "", {
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("google_oauth_redirect_to", "", {
    path: "/",
    maxAge: 0,
  });
}

// 에러 발생 시 로그인 페이지로 리다이렉트
function redirectToLogin(req: NextRequest, errorCode: string) {
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("error", errorCode);

  const res = NextResponse.redirect(url);
  clearGoogleOauthCookies(res);
  return res;
}

// 성공 시 원래 가고자 했던 페이지(또는 /)로 리다이렉트 + JWT 쿠키 설정
function redirectWithToken(
  req: NextRequest,
  redirectPath: string,
  token: string
) {
  const safePath = redirectPath.startsWith("/") ? redirectPath : "/";
  const url = new URL(safePath, req.nextUrl.origin);

  const res = NextResponse.redirect(url);

  // 구글 OAuth 관련 임시 쿠키 제거
  clearGoogleOauthCookies(res);

  // 세션 토큰 설정 (이전에 만든 login/signup 과 동일 규칙)
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  return res;
}

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const explicitRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const jwtSecret = process.env.JWT_SECRET;

    if (!clientId || !clientSecret || !jwtSecret) {
      console.error(
        "Google OAuth 또는 JWT 환경변수가 설정되어 있지 않습니다."
      );
      return redirectToLogin(req, "google_config_error");
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = req.cookies.get("google_oauth_state")?.value;
    const redirectCookie = req.cookies.get("google_oauth_redirect_to")?.value;
    const redirectTo = redirectCookie && redirectCookie.startsWith("/")
      ? redirectCookie
      : "/";

    // 필수 파라미터/상태 검증
    if (!code) {
      console.error("Google OAuth callback: code가 없습니다.");
      return redirectToLogin(req, "google_no_code");
    }

    if (!state || !storedState || state !== storedState) {
      console.error("Google OAuth callback: state 불일치 또는 누락.");
      return redirectToLogin(req, "google_state_mismatch");
    }

    // redirect_uri는 시작 단계와 동일하게 맞춰야 함
    const callbackUrl =
      explicitRedirectUri ||
      new URL("/api/auth/google/callback", req.nextUrl.origin).toString();

    // 1) code로 access_token 교환
    const tokenEndpoint = "https://oauth2.googleapis.com/token";

    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      console.error("Google OAuth token 요청 실패:", tokenRes.status);
      return redirectToLogin(req, "google_token_error");
    }

    const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;

    if (tokenJson.error) {
      console.error(
        "Google OAuth token 에러:",
        tokenJson.error,
        tokenJson.error_description
      );
      return redirectToLogin(req, "google_token_error");
    }

    if (!tokenJson.access_token) {
      console.error("Google OAuth: access_token이 없습니다.");
      return redirectToLogin(req, "google_no_access_token");
    }

    // 2) access_token으로 사용자 정보 가져오기
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
      }
    );

    if (!userInfoRes.ok) {
      console.error("Google 사용자 정보 요청 실패:", userInfoRes.status);
      return redirectToLogin(req, "google_userinfo_error");
    }

    const profile = (await userInfoRes.json()) as GoogleUserInfo;

    const googleId = profile.sub;
    const email =
      profile.email?.trim().toLowerCase() ?? null;
    const name =
      profile.name ||
      profile.given_name ||
      "구글 사용자";

    if (!googleId) {
      console.error("Google 사용자 정보에 sub(googleId)가 없습니다.");
      return redirectToLogin(req, "google_no_id");
    }

    if (!email) {
      console.error("Google 사용자 정보에 email이 없습니다.");
      return redirectToLogin(req, "google_no_email");
    }

    const emailVerifiedAt =
      profile.email_verified === true ? new Date() : null;

    // 3) DB에서 유저 조회/생성
    // 3-1) googleId로 계정이 이미 연결된 경우
    let user = await prisma.user.findFirst({
      where: { googleId },
    });

    // 3-2) googleId는 없지만 같은 이메일 유저가 있는 경우 → 해당 계정에 googleId 연결
    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId,
            // 기존에 이메일 인증 시간이 없다면, 구글이 email_verified == true 일 때만 세팅
            emailVerifiedAt:
              existingByEmail.emailVerifiedAt ?? emailVerifiedAt,
          },
        });
      }
    }

    // 3-3) 아예 처음 로그인하는 구글 계정이면 새 유저 생성
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          passwordHash: null, // 소셜 전용 계정 → 비밀번호 없음
          emailVerifiedAt,
        },
      });
    }

    // 4) JWT 발급 (기존 login/signup 과 동일한 payload/옵션)
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // 5) 쿠키에 token 설정 후, 원래 요청했던 경로(또는 /)로 리다이렉트
    return redirectWithToken(req, redirectTo, token);
  } catch (error) {
    console.error("Google OAuth callback 처리 중 오류:", error);
    return redirectToLogin(req, "google_unknown_error");
  }
}
