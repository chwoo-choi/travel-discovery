// app/api/auth/email/send/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ 안전한 DB 연결 방식 사용
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    // 1. 요청 데이터 파싱
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
    }
    
    const email = body.email?.trim().toLowerCase();

    // 2. 이메일 유효성 검사
    if (!email) {
      return NextResponse.json({ message: "이메일을 입력해주세요." }, { status: 400 });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
       return NextResponse.json({ message: "올바른 이메일 형식이 아닙니다." }, { status: 400 });
    }

    // 3. 6자리 랜덤 인증번호 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. DB 저장 (기존 코드 삭제 후 덮어쓰기)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 1000 * 60 * 5), // 5분 유효
      },
    });

    // 5. 실제 이메일 발송 (Nodemailer)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        // ✅ [핵심 수정] .env 파일에 적은 이름(GMAIL_USER)과 똑같이 맞췄습니다.
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      // ✅ 보내는 사람도 환경 변수에서 가져오도록 수정
      from: process.env.GMAIL_USER,
      to: email,
      subject: "[스마트 트래블 플래너] 회원가입 인증번호",
      html: `
        <div style="max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #6f6bff; text-align: center;">인증번호 안내</h2>
          <p style="font-size: 14px; color: #555; text-align: center;">
            아래 인증번호 6자리를 입력하여 회원가입을 진행해주세요.
          </p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">
            이 인증번호는 5분간 유효합니다.
          </p>
        </div>
      `,
    });

    console.log(`[Server] 이메일 발송 성공: ${email}`);

    return NextResponse.json({ message: "인증번호 전송 성공" });

  } catch (error) {
    console.error("메일 전송 실패:", error);
    return NextResponse.json({ message: "메일 전송에 실패했습니다." }, { status: 500 });
  }
}