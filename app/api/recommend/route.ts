// app/api/recommend/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// 🚨 [핵심] 시도할 모델 리스트 (순서대로 시도함)
const MODELS_TO_TRY = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-pro" // 최후의 보루
];

// 자동 재시도 함수
async function generateWithFallback(prompt: string) {
  let lastError: unknown = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`🤖 [Gemini] '${modelName}' 모델로 요청 시도 중...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text) return text; // 성공하면 반환
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ [Gemini] '${modelName}' 모델 실패:`, errorMessage);
      lastError = error;
      // 실패하면 다음 모델로 넘어감 (Loop)
    }
  }
  throw lastError; // 모든 모델 실패 시 에러 던짐
}

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      console.error("❌ [API Error] API 키가 설정되지 않았습니다.");
      return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
    }

    const { destination, people, budgetLevel, departureDate, tripNights } = await req.json();

    const prompt = `
      너는 한국인 여행객을 위한 전문 여행 플래너야.
      아래 사용자 조건에 맞춰서 **서로 다른 매력을 가진 여행지 6곳**을 추천해줘.
      
      [사용자 조건]
      - 인원: ${people}
      - 예산 등급: ${budgetLevel}
      - 여행 기간: ${tripNights ? tripNights + "박" : "일정 미정"}
      - 출발일: ${departureDate || "미정"}
      - 선호 키워드: ${destination || "없음 (네가 알아서 다양하게 추천해줘)"}

      [요청 사항]
      1. 사용자의 예산과 상황에 맞는 현실적인 여행지 6곳을 선정해. (국가는 겹쳐도 되지만 도시는 달라야 해)
      2. 항공권과 숙박비는 '한국 출발 기준(KRW)'으로 현실적인 최저가를 숫자만 적거나 '약 00만원' 형태로 적어줘.
      3. 추천 이유는 각 도시의 매력을 살려 감성적으로 작성해줘.
      4. **중요:** 응답은 반드시 **JSON 배열([ ... ])** 형식이어야 해. 마크다운이나 잡담은 절대 넣지 마.

      [JSON 스키마 예시]
      [
        {
          "cityName": "후쿠오카",
          "country": "일본",
          "emoji": "🍜",
          "matchScore": 98,
          "tags": ["#먹방", "#온천", "#가깝음"],
          "reason": "비행시간이 짧고 맛집이 많아 가볍게 다녀오기 최고의 도시입니다.",
          "flightPrice": "약 250,000원",
          "hotelPrice": "1박 약 80,000원",
          "weather": "선선하고 맑음"
        }
      ]
    `;

    // 모델 자동 전환 실행
    const text = await generateWithFallback(prompt);

    console.log("✅ [Gemini] 응답 성공 (길이):", text.length);

    // JSON 파싱
    let data;
    try {
      let cleanText = text.replace(/```json|```/g, "").trim();
      const firstBracket = cleanText.indexOf('[');
      const lastBracket = cleanText.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      }

      data = JSON.parse(cleanText);
      if (!Array.isArray(data)) data = [data];

    } catch (parseError) {
      console.error("❌ [JSON Parse Error]:", text);
      throw new Error("AI 응답 형식이 올바르지 않습니다.");
    }

    return NextResponse.json(data);

  } catch (error: unknown) {
    // 🚨 [수정됨] any 제거 및 타입 안전하게 에러 메시지 추출
    let errorMessage = "알 수 없는 오류가 발생했습니다.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    console.error("🚨 [Final Error]:", errorMessage);
    return NextResponse.json(
      { error: "여행지를 추천하는 중 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}