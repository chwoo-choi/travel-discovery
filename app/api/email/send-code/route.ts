// app/api/auth/email/send-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type EmailSendCodeRequestBody = {
  email?: string;
};

const INVALID_EMAIL_MESSAGE = "유효한 이메일 주소를 입력해주세요.";

function normalizeEmail(raw: string | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    // 1) 요청 파싱
    let body: EmailSendCodeRequestBody;
    try {
      body = (await req.json()) as EmailSendCodeRequestBody;
    } catch {
      return NextResponse.json(
        { message: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(body.email);

    // 2) 이메일 유효성 검사
    if (!email) {
      return NextResponse.json(
        { message: INVALID_EMAIL_MESSAGE },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: INVALID_EMAIL_MESSAGE },
        { status: 400 }
      );
    }

    // 3) 6자리 인증 코드 생성 (000000 ~ 999999)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10분 후 만료

    // 4) 해당 이메일로 기존 코드들 삭제 후 새 코드 저장
    //    (prisma.schema 에 EmailVerificationCode 모델이 있다고 가정)
    await prisma.emailVerificationCode.deleteMany({
      where: { email },
    });

    await prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // 5) 실제 메일 발송은 나중에 (지금은 콘솔로 대체)
    //    - SMTP 설정이 없는 환경에서도 항상 200 OK를 주기 위함
    //    - 개발 중에는 서버 콘솔에서 코드를 확인할 수 있음
    console.log(
      `[DEV] 이메일 인증 코드 발급: ${email} -> ${code} (10분 유효)`
    );

    return NextResponse.json(
      {
        message: "인증 메일을 전송했습니다. (개발 환경에서는 서버 콘솔에서 코드를 확인하세요.)",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "인증 메일 전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
