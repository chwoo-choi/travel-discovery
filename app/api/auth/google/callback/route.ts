// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
};

function getCookieSecureFlag(): boolean {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const isHttps = baseUrl.startsWith("https://");
  const isProd = process.env.NODE_ENV === "production";

  // 🔹 로그인/회원가입, /api/auth/google 시작점과 동일한 기준
  // 프로덕션 + HTTPS 일 때만 secure 쿠키 사용
  // 현재 duckdns(http) 환경에서는 secure = false
  return isProd && isHttps;
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI 중 하나 이상이 설정되지 않았습니다."
    );
  }

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL 환경 변수가 설정되어 있지 않습니다.");
  }

  return { clientId, clientSecret, redirectUri, baseUrl };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경 변수가 설정되어 있지 않습니다.");
  }
  return secret;
}

export async function GET(req: NextRequest) {
  try {
    const { clientId, clientSecret, redirectUri, baseUrl } = getGoogleConfig();

    const url = req.nextUrl;
    const searchParams = url.searchParams;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const stateCookie = req.cookies.get("google_oauth_state")?.value;
    const redirectCookie = req.cookies.get("google_oauth_redirect_to")?.value;

    const useSecureCookies = getCookieSecureFlag();

    // 기본 리다이렉트 목적지 (쿠키에 없으면 / 로)
    const redirectPath =
      redirectCookie && redirectCookie.startsWith("/") ? redirectCookie : "/";
    const redirectTarget = new URL(redirectPath, baseUrl).toString();

    // 쿠키 정리용 헬퍼 함수
    const clearAuthCookies = (res: NextResponse) => {
      res.cookies.set("google_oauth_state", "", {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      res.cookies.set("google_oauth_redirect_to", "", {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    };

    // 1) code 유무 확인
    if (!code) {
      console.error("Google OAuth callback: code가 없습니다.");
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      clearAuthCookies(res);
      return res;
    }

    // 2) state 검증
    if (!state || !stateCookie || stateCookie !== state) {
      console.error(
        "Google OAuth callback: state 불일치 또는 누락.",
        "query state:", state,
        "cookie state:", stateCookie
      );
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      clearAuthCookies(res);
      return res;
    }

    // 3) code로 access_token 교환
    const tokenParams = new URLSearchParams();
    tokenParams.set("client_id", clientId);
    tokenParams.set("client_secret", clientSecret);
    tokenParams.set("code", code);
    tokenParams.set("redirect_uri", redirectUri);
    tokenParams.set("grant_type", "authorization_code");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = (await tokenResponse.text()).slice(0, 500);
      console.error(
        "Google OAuth callback: 토큰 교환 실패.",
        "status:",
        tokenResponse.status,
        "body:",
        errorBody
      );
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      clearAuthCookies(res);
      return res;
    }

    const tokenJson =
      (await tokenResponse.json()) as GoogleTokenResponse;

    if (tokenJson.error) {
      console.error(
        "Google OAuth callback: 토큰 응답 에러.",
        tokenJson.error,
        tokenJson.error_description
      );
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      clearAuthCookies(res);
      return res;
    }

    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      console.error("Google OAuth callback: access_token이 없습니다.");
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      clearAuthCookies(res);
      return res;
    }

    // 4) 사용자 정보 조회
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      const errorBody = (await userInfoResponse.text()).slice(0, 500);
      console.error(
        "Google OAuth callback: 사용자 정보 조회 실패.",
        "status:",
        userInfoResponse.status,
        "body:",
        errorBody
      );
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      clearAuthCookies(res);
      return res;
    }

    const profile = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!profile.id || !profile.email) {
      console.error("Google OAuth callback: 프로필 정보가 부족합니다.", profile);
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      clearAuthCookies(res);
      return res;
    }

    const googleId = profile.id;
    const email = profile.email.toLowerCase().trim();
    const name = profile.name ?? "Google 사용자";
    const picture = profile.picture;

    // 5) DB에서 유저 찾기/생성 (Account 테이블 사용 방식으로 변경)
    
    // 5-1. 이미 연동된 계정인지 확인 (Account 테이블 조회)
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: "google",
        providerAccountId: googleId,
      },
      include: { user: true },
    });

    let user = existingAccount?.user;

    if (!user) {
      // 5-2. 연동된 계정이 없다면, 이메일로 기존 유저 찾기
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // 유저는 있는데 구글 연동이 안 된 경우 -> Account 연결
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "google",
            providerAccountId: googleId,
            access_token: tokenJson.access_token,
            refresh_token: tokenJson.refresh_token,
            expires_at: Math.floor(Date.now() / 1000 + (tokenJson.expires_in || 3600)),
            token_type: tokenJson.token_type,
            scope: tokenJson.scope,
            id_token: tokenJson.id_token,
          },
        });
        user = existingUser;
        
        // 필요하다면 프로필 이미지 등 업데이트 (선택)
        if (picture && !user.image) {
           await prisma.user.update({
             where: { id: user.id },
             data: { image: picture },
           });
        }
      } else {
        // 5-3. 아예 새로운 유저 -> User 생성 + Account 생성
        user = await prisma.user.create({
          data: {
            name,
            email,
            image: picture,
            emailVerified: new Date(), // 구글 인증이므로 이메일 인증 완료 처리
            accounts: {
              create: {
                type: "oauth",
                provider: "google",
                providerAccountId: googleId,
                access_token: tokenJson.access_token,
                refresh_token: tokenJson.refresh_token,
                expires_at: Math.floor(Date.now() / 1000 + (tokenJson.expires_in || 3600)),
                token_type: tokenJson.token_type,
                scope: tokenJson.scope,
                id_token: tokenJson.id_token,
              },
            },
          },
        });
      }
    }

    // 6) JWT 발급 후 token 쿠키 설정
    const jwtSecret = getJwtSecret();

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const res = NextResponse.redirect(redirectTarget, { status: 302 });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    // 더 이상 필요 없는 상태/리다이렉트 쿠키 정리
    clearAuthCookies(res);

    return res;
  } catch (error) {
    console.error("Google OAuth callback 처리 중 예외:", error);
    // 심각한 내부 오류가 나면 일단 홈으로 돌려보내되, 쿠키는 정리
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const useSecureCookies = getCookieSecureFlag();

    const res = NextResponse.redirect(baseUrl, { status: 302 });
    res.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    res.cookies.set("google_oauth_redirect_to", "", {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  }
}