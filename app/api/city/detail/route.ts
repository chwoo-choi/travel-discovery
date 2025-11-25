// app/api/city/detail/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// 🚨 [핵심 수정] 추천 API와 동일하게 '사용 가능한 최신 모델'로 변경
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

// 자동 재시도 함수
async function generateWithFallback(prompt: string) {
  let lastError: unknown = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`🤖 [CityDetail] '${modelName}' 모델로 상세 정보 생성 시도...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text) return text; 
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ [CityDetail] '${modelName}' 모델 실패:`, errorMessage);
      lastError = error;
    }
  }
  throw lastError; 
}

export async function POST(req: Request) {
  try {
    const { cityName, country } = await req.json();

    if (!apiKey) {
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

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

      반드시 아래 JSON 형식을 준수해줘. 마크다운 없이 순수 JSON만 줘.
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

    // 모델 자동 전환 실행
    const text = await generateWithFallback(prompt);
    
    // JSON 파싱
    let data;
    try {
      let cleanText = text.replace(/```json|```/g, "").trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      data = JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON Parsing Error:", text);
      throw new Error("AI 응답 형식이 올바르지 않습니다.");
    }

    return NextResponse.json(data);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("City Detail Error:", errorMessage);
    return NextResponse.json(
      { error: "정보 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}