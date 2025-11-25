import { NextResponse } from "next/server";

export async function GET() {
  // UI 테스트를 위한 더미 데이터 (나중에 DB 연동 필요)
  const dummyBookmarks = [
    {
      id: "1",
      cityName: "파리",
      country: "프랑스",
      description: "낭만적인 에펠탑과 미식의 도시. 예술과 역사가 살아숨쉬는 곳입니다.",
      price: "약 150만원",
      tags: ["예술", "미식", "낭만"],
      emoji: "🥐",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      cityName: "방콕",
      country: "태국",
      description: "저렴한 물가와 맛있는 길거리 음식, 화려한 사원들이 매력적인 도시.",
      price: "약 50만원",
      tags: ["가성비", "먹방", "마사지"],
      emoji: "🌴",
      createdAt: new Date().toISOString(),
    }
  ];

  return NextResponse.json({ data: dummyBookmarks });
}

// 삭제 요청 등을 처리하기 위한 더미 POST 핸들러 (에러 방지용)
export async function POST() {
    // 실제 삭제 로직이 없으므로 성공 응답만 보냄
    return NextResponse.json({ action: 'removed' });
}