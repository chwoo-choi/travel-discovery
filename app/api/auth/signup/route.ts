import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// 비밀번호 규칙 (8자 이상, 영문/숫자/특수문자)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const name = body?.name as string | undefined;
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    // 1. 입력값 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "이름, 이메일, 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. 비밀번호 규칙 서버 검증
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { message: "비밀번호는 8자 이상이며, 영문/숫자/특수문자를 포함해야 합니다." },
        { status: 400 }
      );
    }

    // 3. 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "이미 가입된 이메일입니다." },
        { status: 409 }
      );
    }

    // 4. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. 유저 생성
    // 🚨 [수정됨] DB 필드명 오류 해결: password -> passwordHash
    // (만약 DB에 passwordHash 필드도 없다면 schema.prisma에 추가해야 합니다)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashedPassword, // ✅ 여기를 수정했습니다!
      },
    });

    // 6. JWT 토큰 발급 (자동 로그인)
    // JWT_SECRET이 .env에 있는지 확인 (없으면 임시 키 사용 - 보안상 .env 권장)
    const secret = process.env.JWT_SECRET || "default-secret-key"; 
    
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret,
      { expiresIn: "7d" }
    );

    // 7. 응답 생성
    const res = NextResponse.json(
      {
        message: "회원가입이 완료되었습니다.",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );

    // 8. 쿠키 설정
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // ✅ HTTP 환경 지원을 위해 false로 고정
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}