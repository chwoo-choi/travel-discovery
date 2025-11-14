// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // token 쿠키를 삭제하기 위해 maxAge=0으로 재설정
  const res = NextResponse.json(
    {
      message: "로그아웃되었습니다.",
    },
    { status: 200 }
  );

  res.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0, // 즉시 만료
  });

  return res;
}

