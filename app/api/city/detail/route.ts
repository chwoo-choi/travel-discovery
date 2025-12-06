// app/api/city/detail/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { differenceInCalendarDays, parseISO, isAfter, isValid } from "date-fns";

// API 키 설정
const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 모델 우선순위 설정
const MODELS_TO_TRY = ["gemini-2.5-flash-preview-09-2025", "gemini-2.0-flash-exp", "gemini-1.5-flash"];

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
    } catch (error: unknown) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { cityName, country, startDate, endDate, tripNights } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 여행 기간 계산 로직
    const start = startDate ? parseISO(startDate) : null;
    const end = endDate ? parseISO(endDate) : null;
    const hasValidDates = start && end && isValid(start) && isValid(end) && !isAfter(start, end);

    let durationText = "3박 4일"; 
    let days = 4; 
    let periodText = "";

    if (hasValidDates) {
      const diffDays = Math.max(differenceInCalendarDays(end!, start!), 0);
      const nights = diffDays; 
      days = diffDays + 1;
      durationText = `${nights}박 ${days}일`;
      periodText = `${startDate} ~ ${endDate}`;
    } else if (tripNights) {
      const nights = Math.max(Number(tripNights), 0);
      days = nights + 1;
      durationText = `${nights}박 ${days}일`;
    }

    // ✅ [핵심 수정] englishName 필드 추가 요청
    const prompt = `
      당신은 전문 여행 플래너입니다.
      "${country} ${cityName}" 여행을 위한 상세 정보를 JSON 형식으로 생성해주세요.
      여행 기간은 ${periodText ? `${periodText}, ` : ""}총 ${durationText}입니다.

      다음 정보를 반드시 포함하세요:
      1. englishName: 도시의 정확한 영어 이름 (예: Bangkok, Taipei, Osaka). 날씨 검색용입니다.
      2. intro: 도시 매력을 2~3문장으로 요약.
      3. bestSeason: 여행하기 좋은 계절.
      4. currency: 통화 정보.
      5. spots: 필수 명소 3곳 (name, description).
      6. foods: 추천 음식 3가지 (name, description).
      7. flights: 한국 출발 기준 대략적인 항공권 가격대와 추천 항공사/팁.
      8. accommodation: 추천 숙소 지역(위치)과 그 이유.
      9. itinerary: 반드시 ${durationText} (${days}일) 일정. Day 1부터 Day ${days}까지 작성.

      응답은 오직 JSON 형식으로만 주세요. (마크다운 없이)
      
      예시 구조:
      {
        "englishName": "CityName",
        "intro": "...",
        "bestSeason": "...",
        "currency": "...",
        "flights": { "price": "...", "tip": "..." },
        "accommodation": { "area": "...", "reason": "..." },
        "spots": [{ "name": "...", "description": "..." }],
        "foods": [{ "name": "...", "description": "..." }],
        "itinerary": [
          { "day": 1, "theme": "...", "schedule": ["...", "..."] }
        ]
      }
    `;

    const text = await generateWithFallback(prompt);

    let data;
    try {
      let cleanText = text.replace(/```json|```/g, "").trim();
      const firstBrace = cleanText.indexOf("{");
      const lastBrace = cleanText.lastIndexOf("}");
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
