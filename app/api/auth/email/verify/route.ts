import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
    }

    // 1. DB에서 토큰 조회
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: code,
      },
    });

    if (!record) {
      return NextResponse.json({ message: "인증번호가 일치하지 않습니다." }, { status: 400 });
    }

    // 2. 만료 시간 확인
    if (new Date() > record.expires) {
      return NextResponse.json({ message: "인증번호가 만료되었습니다." }, { status: 400 });
    }

    // 3. 인증 성공 시 DB에서 삭제 (재사용 방지 및 보안)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return NextResponse.json({ message: "인증 성공" });
  } catch (error) {
    console.error("인증 확인 에러:", error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}