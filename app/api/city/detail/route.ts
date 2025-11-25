//app/api/city/detail/route.ts  
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 응답 데이터 타입 정의 (AI가 생성할 구조)
interface PlaceDetail {
  name: string;
  description: string;
}

interface DayItinerary {
  day: number;
  theme: string;
  schedule: string[]; // "오전: OO 방문", "오후: XX 체험"
}

interface CityDetailResponse {
  intro: string; // 도시 한 줄 소개
  bestSeason: string; // 추천 여행 시기
  currency: string; // 통화 정보
  spots: PlaceDetail[]; // 주요 명소 3곳
  foods: PlaceDetail[]; // 추천 음식 3가지
  itinerary: DayItinerary[]; // 3일 추천 코스
}

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { cityName, country } = await req.json();

    if (!cityName || !country) {
      return NextResponse.json(
        { error: "Bad Request", message: "도시명과 국가 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 프롬프트 작성
    const prompt = `
      당신은 전문 여행 가이드입니다.
      "${country}"의 도시 "${cityName}"에 대한 상세 여행 정보를 JSON 형식으로 생성해주세요.
      
      다음 요구사항을 정확히 따라주세요:
      1. 한국어로 작성할 것.
      2. 'intro': 이 도시의 매력을 2-3문장으로 요약.
      3. 'bestSeason': 여행하기 가장 좋은 시기와 그 이유.
      4. 'currency': 사용하는 통화와 대략적인 환율 정보.
      5. 'spots': 반드시 가봐야 할 관광지 3곳 (이름, 설명).
      6. 'foods': 꼭 먹어야 할 현지 음식 3가지 (이름, 설명).
      7. 'itinerary': 3박 4일 기준의 알찬 여행 코스 (1일차, 2일차, 3일차). 각 날짜별 테마와 주요 일정 3-4개.

      응답은 오직 JSON 형식으로만 출력하세요. 마크다운 코드 블록(\`\`\`json)을 사용하지 마세요.
      
      예시 구조:
      {
        "intro": "...",
        "bestSeason": "...",
        "currency": "...",
        "spots": [{ "name": "...", "description": "..." }],
        "foods": [{ "name": "...", "description": "..." }],
        "itinerary": [
          { 
            "day": 1, 
            "theme": "도심 탐방", 
            "schedule": ["오전: 광장 산책", "점심: 현지식", "오후: 박물관 투어"] 
          }
        ]
      }
    `;

    // 2. 모델 선택 및 생성 요청
    // 상세 정보는 복잡하므로 gemini-pro가 더 적합할 수 있으나, 속도를 위해 flash 우선 시도
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. JSON 파싱 및 정제
    let data: CityDetailResponse;
    try {
      // 혹시 모를 마크다운 제거
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw Text:", text);
      return NextResponse.json(
        { error: "AI Error", message: "데이터 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("[API/City/Detail] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}