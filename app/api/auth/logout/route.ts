import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });

  // 🚨 핵심 수정: secure: false로 설정해야 http 환경에서 삭제가 됨
  response.cookies.set("token", "", {
    path: "/",
    expires: new Date(0), // 즉시 만료
    maxAge: 0,
    httpOnly: true,
    secure: false, // ✅ DuckDNS(http) 환경에 맞춤
    sameSite: "lax",
  });

  return response;
}

