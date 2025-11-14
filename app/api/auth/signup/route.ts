// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// 프론트에서도 1차 검증하지만, 보안을 위해 서버에서도 한 번 더 체크
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const name = body?.name as string | undefined;
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "이름, 이메일, 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 비밀번호 규칙 서버 검증
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          message:
            "비밀번호 규칙을 다시 확인해주세요. (8자 이상, 영문, 숫자, 특수문자 포함)",
        },
        { status: 400 }
      );
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 10);

    // 유저 생성
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // JWT 발급 (자동 로그인)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
      return NextResponse.json(
        { message: "서버 설정 오류로 인해 요청을 처리할 수 없습니다." },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret,
      { expiresIn: "7d" } // 7일 유지
    );

    const res = NextResponse.json(
      {
        message: "회원가입이 완료되었습니다.",
        user,
      },
      { status: 201 }
    );

    // HttpOnly 쿠키로 세션 토큰 전달
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    return res;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        message:
          "회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
