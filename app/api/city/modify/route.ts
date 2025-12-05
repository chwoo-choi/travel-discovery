// app/api/city/modify/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// API 키 설정 (기존 환경변수 재사용)
const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// ✅ [수정] 모델 우선순위 설정 (2.5 -> 2.0 -> 1.5 순서로 시도)
const MODELS_TO_TRY = ["gemini-2.5-flash-preview-09-2025", "gemini-2.0-flash-exp", "gemini-1.5-flash"];

// ✅ [추가] 자동 재시도 함수 (모델 Fallback 로직)
async function generateWithFallback(prompt: string) {
  let lastError: unknown = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) return text;
    } catch (error: unknown) {
      lastError = error;
      // 실패 시 다음 모델 시도 (조용히 넘어감)
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  try {
    // 1. 프론트엔드(ChatBot)에서 보낸 데이터 받기
    const { cityName, currentItinerary, userRequest } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    if (!cityName || !currentItinerary || !userRequest) {
      return NextResponse.json({ error: "Invalid Request Data" }, { status: 400 });
    }

    // 2. AI 프롬프트 구성 (일정 수정 지시)
    const prompt = `
      당신은 여행 플래너입니다.
      현재 "${cityName}" 여행 일정은 다음과 같습니다:
      ${JSON.stringify(currentItinerary)}

      사용자의 수정 요청: "${userRequest}"

      위 요청을 반영하여 일정을 수정해주세요.
      - 기존 일정을 바탕으로 하되, 요청에 맞춰 장소나 테마, 순서를 변경하세요.
      - 전체적인 날짜 수(Day N)와 구조는 유지해야 합니다.
      - 응답은 오직 JSON 형식의 'itinerary' 배열만 반환하세요. 
      - 마크다운(\`\`\`json)이나 추가 설명 없이 순수 JSON 배열만 출력하세요.
      
      예시 형식:
      [
        { "day": 1, "theme": "변경된 테마", "schedule": ["일정1", "일정2", "일정3"] },
        { "day": 2, "theme": "...", "schedule": [...] }
      ]
    `;

    // 3. AI 생성 요청 (Fallback 로직 적용)
    // 기존의 단일 모델 호출 대신 generateWithFallback 함수 사용
    const text = await generateWithFallback(prompt);

    // 4. JSON 파싱 및 정제
    let newItinerary;
    try {
      let cleanText = text.replace(/```json|```/g, "").trim();
      // 배열의 시작([)과 끝(])을 찾아 그 사이만 추출
      const firstBracket = cleanText.indexOf("[");
      const lastBracket = cleanText.lastIndexOf("]");
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      }
      
      newItinerary = JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      throw new Error("AI가 생성한 일정을 처리하는 중 오류가 발생했습니다.");
    }

    // 5. 결과 반환
    return NextResponse.json({ itinerary: newItinerary });

  } catch (error) {
    console.error("Modify API Error:", error);
    return NextResponse.json(
      { error: "일정 수정 중 서버 오류가 발생했습니다." }, 
      { status: 500 }
    );
  }
}