// app/api/bookmark/route.ts

// 🚨 API 응답 캐싱 방지 (항상 최신 데이터 로드)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

// 사용자 인증 헬퍼 함수
async function getUserId() {
  const cookieStore = await cookies(); // Next.js 15+ 호환
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded.sub;
  } catch {
    return null;
  }
}

// 1. 북마크 조회 (GET)
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const formattedBookmarks = bookmarks.map((b) => {
      let tags = [];
      try {
        tags = b.tags ? JSON.parse(b.tags as string) : [];
      } catch {
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
        tags: JSON.stringify(tags),
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
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 🔹 [수정됨] 쿼리 파라미터에서 id 가져오기
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

