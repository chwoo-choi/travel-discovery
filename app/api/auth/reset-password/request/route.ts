// app/api/auth/reset-password/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 안전한 랜덤 토큰 생성 (비밀번호 재설정 링크용)
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// 비밀번호 재설정 메일 발송
async function sendResetPasswordEmail(to: string, resetLink: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || "여행의 발견 <no-reply@example.com>";
  const secure = process.env.SMTP_SECURE === "true";
  const isDev = process.env.NODE_ENV !== "production";

  // 개발 환경에서 SMTP 설정이 없다면, 실제 메일 대신 콘솔에만 출력
  if (!host || !user || !pass) {
    if (isDev) {
      console.log("[DEV] 비밀번호 재설정 메일 전송 생략.");
      console.log("수신 이메일:", to);
      console.log("재설정 링크:", resetLink);
      return;
    }
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
    subject: "여행의 발견 - 비밀번호 재설정 안내",
    text: `안녕하세요, 여행의 발견입니다.

아래 링크를 클릭하여 비밀번호를 재설정해주세요.

${resetLink}

이 링크는 1시간 동안만 유효합니다.

감사합니다.`,
    html: `
      <p>안녕하세요, <strong>여행의 발견</strong>입니다.</p>
      <p>아래 버튼을 클릭하여 비밀번호를 재설정해주세요.</p>
      <p style="margin: 16px 0;">
        <a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#6f6bff;color:#ffffff;text-decoration:none;border-radius:6px;">
          비밀번호 재설정하기
        </a>
      </p>
      <p>또는 아래 링크를 브라우저 주소창에 붙여넣어 접속하실 수 있습니다.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>이 링크는 <strong>1시간 동안만 유효</strong>합니다.</p>
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

    // 해당 이메일의 유저 조회
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 보안상: 유저가 없더라도 "성공" 응답을 준다 (이메일 존재 여부 노출 방지)
    if (!user) {
      return NextResponse.json(
        {
          message:
            "비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해주세요.",
        },
        { status: 200 }
      );
    }

    // 재설정 토큰 및 만료 시간 생성 (1시간 유효)
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiresAt,
      },
    });

    // BASE URL 결정: env 우선, 없으면 현재 요청 origin 사용
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
    const resetLink = `${baseUrl}/reset-password/${token}`;

    await sendResetPasswordEmail(normalizedEmail, resetLink);

    return NextResponse.json(
      {
        message:
          "비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해주세요.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset-password request error:", error);
    return NextResponse.json(
      {
        message:
          "비밀번호 재설정 메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
