// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 로그인 실패 시 항상 동일하게 보여줄 메시지 (보안상 이메일/비번 구분 X)
const INVALID_MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다.";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as LoginRequestBody | null;

    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      // 이메일 형식이 이상해도 같은 실패 메시지를 사용하거나, 형식 에러를 따로 줄 수 있음
      return NextResponse.json(
        { message: INVALID_MESSAGE },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 소셜 전용 계정(비밀번호 없음) 또는 유저 없음
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: INVALID_MESSAGE },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: INVALID_MESSAGE },
        { status: 400 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
      return NextResponse.json(
        {
          message:
            "서버 설정에 오류가 있습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    // 현재 요청이 https인지 여부 (HTTP인 duckdns 환경에서는 false)
    const isHttps = req.nextUrl.protocol === "https:";

    // JWT 발급
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json(
      {
        message: "로그인되었습니다.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // 세션 토큰 쿠키 설정
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      // 👉 HTTPS일 때만 secure 쿠키로, HTTP(dduckdns:80)에서는 false → 실제로 브라우저에 저장됨
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        message:
          "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
