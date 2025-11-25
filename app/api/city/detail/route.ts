// app/api/city/detail/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const { cityName, country } = await req.json();

    if (!apiKey) {
        console.error("API Key Missing");
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 가장 안정적인 최신 플래시 모델 사용
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // JSON 포맷 강제 (응답 파싱 에러 방지)
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      너는 전문 여행 플래너야.
      "${country} ${cityName}" 여행을 위한 알찬 정보를 알려줘.
      
      [필수 포함 내용]
      1. 도시 소개 (intro): 2~3문장으로 매력 어필.
      2. 여행하기 좋은 계절 (bestSeason).
      3. 통화 정보 (currency).
      4. 주요 명소 (spots): 3곳 (이름, 설명).
      5. 추천 음식 (foods): 3가지 (이름, 설명).
      6. 3박 4일 추천 일정 (itinerary): Day 1~4 별 테마와 주요 동선.

      반드시 아래 JSON 형식을 준수해줘.
      {
        "intro": "...",
        "bestSeason": "...",
        "currency": "...",
        "spots": [{ "name": "...", "description": "..." }],
        "foods": [{ "name": "...", "description": "..." }],
        "itinerary": [
          { "day": 1, "theme": "...", "schedule": ["장소1", "장소2", "장소3"] },
          ... (4일차까지)
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const data = JSON.parse(text);

    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error("City Detail Error:", error);
    return NextResponse.json(
      { error: "정보 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}