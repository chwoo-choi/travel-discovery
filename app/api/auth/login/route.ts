// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

const INVALID_CREDENTIALS_MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다.";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경 변수가 설정되어 있지 않습니다.");
  }
  return secret;
}

export async function POST(req: NextRequest) {
  try {
    // 1) 요청 body 파싱
    let body: LoginRequestBody;
    try {
      body = (await req.json()) as LoginRequestBody;
    } catch {
      return NextResponse.json(
        { message: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const emailRaw = body.email ?? "";
    const password = body.password ?? "";

    const email = emailRaw.trim().toLowerCase();

    // 2) 필수 값 체크
    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 3) 이메일 형식 1차 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 }
      );
    }

    // 4) 유저 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 }
      );
    }

    // 5) 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 }
      );
    }

    // 6) JWT 생성
    const jwtSecret = getJwtSecret();

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // 7) 응답 + 쿠키 세팅
    const response = NextResponse.json(
      {
        message: "로그인에 성공했습니다.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );

    // 🚨 [최종 수정] HTTP 환경 호환을 위해 secure 옵션을 'false'로 고정
    // 변수 사용 없이 직접 false를 입력하여 실수를 방지합니다.
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false, // ✅ 여기가 핵심입니다. 무조건 false.
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        message:
          "로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}