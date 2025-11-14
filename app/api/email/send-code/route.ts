// app/api/auth/email/send-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// 아주 간단한 이메일 형식 검증용 정규식
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 6자리 숫자 인증 코드 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 실제 이메일 발송 함수
async function sendVerificationEmail(to: string, code: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || "여행의 발견 <no-reply@example.com>";
  const secure = process.env.SMTP_SECURE === "true";
  const isDev = process.env.NODE_ENV !== "production";

  // SMTP 설정이 없고 개발 환경이면 → 실제 메일 전송 대신 콘솔 로그
  if (!host || !user || !pass) {
    if (isDev) {
      console.log("[DEV] 이메일 전송 생략. 아래 인증 코드를 사용하세요.");
      console.log("수신 이메일:", to);
      console.log("인증 코드:", code);
      return;
    }

    // 운영 환경인데 SMTP 설정이 없으면 에러
    throw new Error("SMTP 설정이 구성되어 있지 않습니다.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: "여행의 발견 - 이메일 인증 코드",
    text: `안녕하세요, 여행의 발견입니다.\n\n이메일 인증 코드는 ${code} 입니다.\n10분 이내에 입력해 주세요.\n\n감사합니다.`,
    html: `
      <p>안녕하세요, <strong>여행의 발견</strong>입니다.</p>
      <p>이메일 인증 코드는 <strong style="font-size: 18px;">${code}</strong> 입니다.</p>
      <p>보안을 위해 <strong>10분 이내</strong>에 입력해 주세요.</p>
      <p>감사합니다.</p>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email as string | undefined;

    if (!email) {
      return NextResponse.json(
        { message: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "이메일 형식을 다시 확인해주세요." },
        { status: 400 }
      );
    }

    // 간단 레이트 리밋: 같은 이메일로 1분 이내 재요청 방지
    const recent = await prisma.emailVerificationCode.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (
      recent &&
      recent.createdAt.getTime() > Date.now() - 60 * 1000 // 1분
    ) {
      return NextResponse.json(
        {
          message:
            "인증 코드는 1분에 한 번만 요청할 수 있습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 429 }
      );
    }

    const code = generateVerificationCode();

    // 기존 미사용 코드는 모두 사용 처리(무효화)
    await prisma.emailVerificationCode.updateMany({
      where: {
        email: normalizedEmail,
        used: false,
      },
      data: {
        used: true,
      },
    });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 유효

    // 새 인증 코드 저장
    await prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
        used: false,
      },
    });

    // 이메일 발송 (개발 환경에서는 콘솔에만 찍힘)
    await sendVerificationEmail(normalizedEmail, code);

    return NextResponse.json(
      {
        message:
          "인증 코드가 이메일로 발송되었습니다. 메일함을 확인해주세요.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification send-code error:", error);
    return NextResponse.json(
      {
        message:
          "인증 코드 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
