// app/api/bookmark/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ✅ 싱글톤 인스턴스 사용 (중요)
import jwt from 'jsonwebtoken';

// 🚨 API 응답 캐싱 방지 (항상 최신 데이터 로드)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. 사용자 인증 (커스텀 쿠키 확인)
    const tokenCookie = req.cookies.get('token');
    const token = tokenCookie?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요한 서비스입니다.' },
        { status: 401 }
      );
    }

    // 2. 토큰 검증 및 User ID 추출
    const secret = process.env.JWT_SECRET || "";
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, secret) as { sub: string };
      userId = decoded.sub;
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid Token', message: '세션이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 3. 데이터 파싱
    const body = await req.json();
    const { cityName, country, description, price, tags, emoji } = body;

    if (!cityName) {
      return NextResponse.json({ message: "도시 정보가 누락되었습니다." }, { status: 400 });
    }

    // 4. 북마크 토글 로직 (핵심)
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_cityName: {
          userId,
          cityName,
        },
      },
    });

    if (existingBookmark) {
      // ✅ 이미 존재하면 -> 삭제 (Unbookmark)
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      });

      return NextResponse.json({
        action: 'removed',
        message: '북마크가 해제되었습니다.',
        cityName,
        isBookmarked: false
      });
    } else {
      // ✅ 없으면 -> 생성 (Bookmark)
      await prisma.bookmark.create({
        data: {
          userId,
          cityName,
          country,
          description: description || "",
          price: price || "",
          tags: tags || [], // Prisma Json 타입은 배열을 바로 받음
          emoji: emoji || '✈️',
        },
      });

      return NextResponse.json({
        action: 'added',
        message: '여행지가 북마크에 저장되었습니다.',
        cityName,
        isBookmarked: true
      });
    }

  } catch (error: unknown) {
    console.error('[API/Bookmark] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 5. 북마크 목록 조회 (GET)
export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('token');
    const token = tokenCookie?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || "";
    let userId: string;
    try {
        const decoded = jwt.verify(token, secret) as { sub: string };
        userId = decoded.sub;
    } catch {
        return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ count: bookmarks.length, data: bookmarks });

  } catch (error) {
    console.error('[API/Bookmark/GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}