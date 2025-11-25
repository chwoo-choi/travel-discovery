// app/api/bookmark/route.ts
// 🚨 [핵심] API 응답 캐싱 방지
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// 💡 중요: 'prisma.bookmark' 오류가 뜨면 터미널에서 'npx prisma generate'를 실행하세요.
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

// 🚨 [수정] 사용자 인증 헬퍼 함수 (비동기 처리 적용)
async function getUserId() {
  // Next.js 15+에서는 cookies()가 Promise를 반환하므로 await 필수
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded.sub;
  } catch (error) {
    return null;
  }
}

// 1. 북마크 조회 (GET)
export async function GET(req: NextRequest) {
  try {
    // 🚨 [수정] await 추가
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // 태그 문자열을 배열로 변환 (JSON 파싱)
    const formattedBookmarks = bookmarks.map((b) => {
      let tags = [];
      try {
        // DB에 문자열로 저장된 JSON 배열을 다시 객체로 변환
        tags = b.tags ? JSON.parse(b.tags as string) : [];
      } catch (e) {
        tags = [];
      }
      return { ...b, tags };
    });

    return NextResponse.json({ data: formattedBookmarks });
  } catch (error) {
    console.error("북마크 조회 실패:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

// 2. 북마크 추가 (POST)
export async function POST(req: NextRequest) {
  try {
    // 🚨 [수정] await 추가
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const { cityName, country, emoji, description, price, tags } = body;

    // 중복 저장 방지
    const existing = await prisma.bookmark.findFirst({
      where: { userId, cityName },
    });

    if (existing) {
      return NextResponse.json({ message: "이미 저장된 여행지입니다." }, { status: 409 });
    }

    const newBookmark = await prisma.bookmark.create({
      data: {
        userId,
        cityName,
        country,
        emoji,
        description,
        price,
        tags: JSON.stringify(tags), // 배열을 문자열로 변환하여 저장
      },
    });

    return NextResponse.json({ message: "저장되었습니다.", data: newBookmark });
  } catch (error) {
    console.error("북마크 저장 실패:", error);
    return NextResponse.json({ message: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 3. 북마크 삭제 (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    // 🚨 [수정] await 추가
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 🔹 [수정] Next.js 전용 URL 파서 사용 (더 안전함)
    const searchParams = req.nextUrl.searchParams;
    const bookmarkId = searchParams.get("id");

    if (!bookmarkId) {
      return NextResponse.json({ message: "ID missing" }, { status: 400 });
    }

    await prisma.bookmark.delete({
      where: { 
        id: bookmarkId,
        userId, // 내 북마크만 삭제 가능하도록 안전장치
      },
    });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("북마크 삭제 실패:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}