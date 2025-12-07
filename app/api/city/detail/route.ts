// app/api/city/detail/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { differenceInCalendarDays, parseISO, isAfter, isValid } from "date-fns";

// 🚨 [수정 1] 캐싱 방지 (매번 새로운 정보 생성)
export const dynamic = "force-dynamic";

const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 모델 우선순위
const MODELS_TO_TRY = ["gemini-2.5-flash-preview-09-2025", "gemini-2.0-flash-exp", "gemini-1.5-flash"];

// 🛠️ [수정 2] AI 응답에서 순수 JSON만 추출하는 함수 (에러 원천 차단)
function extractJson(text: string) {
  try {
    // 1. 마크다운 및 공백 제거
    let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 2. 중괄호의 시작과 끝을 찾아 그 사이만 추출 (앞뒤 잡담 제거)
    const firstBrace = cleanText.indexOf("{");
    const lastBrace = cleanText.lastIndexOf("}");
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parsing Failed. Raw text:", text);
    throw new Error("AI 응답을 분석할 수 없습니다.");
  }
}

// 자동 재시도 함수
async function generateWithFallback(prompt: string) {
  let lastError: unknown = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) return text;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { cityName, country, startDate, endDate, tripNights } = await req.json();

    if (!apiKey) return NextResponse.json({ error: "Configuration Error" }, { status: 500 });

    // 기간 계산 로직 (기존 유지)
    const start = startDate ? parseISO(startDate) : null;
    const end = endDate ? parseISO(endDate) : null;
    let durationText = "3박 4일";
    let days = 4;
    let periodText = "";

    if (start && end && isValid(start) && isValid(end) && !isAfter(start, end)) {
      const diffDays = Math.max(differenceInCalendarDays(end, start), 0);
      days = diffDays + 1;
      durationText = `${diffDays}박 ${days}일`;
      periodText = `${startDate} ~ ${endDate}`;
    } else if (tripNights) {
      const nights = Math.max(Number(tripNights), 0);
      days = nights + 1;
      durationText = `${nights}박 ${days}일`;
    }

    // 🚨 [수정 3] englishName 필드 필수 요청 및 JSON 포맷 강조
    const prompt = `
      Create a travel plan for "${country} ${cityName}".
      Duration: ${durationText}.

      RESPONSE FORMAT (JSON ONLY):
      {
        "englishName": "Standard English city name for Weather API (e.g. Taipei, Osaka, Bangkok)", 
        "intro": "Korean description...",
        "bestSeason": "Korean text...",
        "currency": "Korean text...",
        "flights": { "price": "...", "tip": "..." },
        "accommodation": { "area": "...", "reason": "..." },
        "spots": [{ "name": "...", "description": "..." }],
        "foods": [{ "name": "...", "description": "..." }],
        "itinerary": [
          { "day": 1, "theme": "...", "schedule": ["...", "..."] }
        ]
      }
      * Important: Output ONLY valid JSON. No markdown, no intro text.
    `;

    const text = await generateWithFallback(prompt);
    
    // [수정 4] 안전한 파싱 함수 사용
    const data = extractJson(text); 

    return NextResponse.json(data);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}