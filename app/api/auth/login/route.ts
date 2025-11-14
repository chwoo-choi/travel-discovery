// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 유저가 없거나(존재하지 않는 이메일), 소셜 전용 계정(비밀번호 없음)일 경우
    if (!user || !user.passwordHash) {
      // 일부러 이메일/비밀번호가 틀렸다는 동일 메시지 사용 → 보안상 유리
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
      return NextResponse.json(
        { message: "서버 설정 오류로 인해 요청을 처리할 수 없습니다." },
        { status: 500 }
      );
    }

    // 회원가입 때와 동일 형식의 JWT 발급 (sub = user.id)
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
        message: "로그인이 완료되었습니다.",
      },
      { status: 200 }
    );

    // HttpOnly 쿠키로 세션 토큰 설정
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
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
