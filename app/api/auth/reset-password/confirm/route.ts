// app/api/auth/reset-password/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// signup과 동일한 비밀번호 규칙 (서버에서도 한 번 더 검증)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const token = body?.token as string | undefined;
    const password = body?.password as string | undefined;

    if (!token || !password) {
      return NextResponse.json(
        { message: "토큰과 새 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

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

    // 토큰으로 유저 조회
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
      },
    });

    // 토큰이 없거나, 만료되었으면 에러
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          message:
            "비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다. 다시 요청해주세요.",
        },
        { status: 400 }
      );
    }

    // 새 비밀번호 해시 생성
    const passwordHash = await bcrypt.hash(password, 10);

    // 비밀번호 변경 + 토큰 무효화
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json(
      {
        message:
          "비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 다시 로그인해주세요.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset-password confirm error:", error);
    return NextResponse.json(
      {
        message:
          "비밀번호 재설정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
