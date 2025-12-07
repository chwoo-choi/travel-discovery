// app/api/recommend/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 🚨 [핵심] 시도할 모델 리스트 (순서대로 시도함)
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

// 자동 재시도 함수
async function generateWithFallback(prompt: string): Promise<string | null> {
  if (!genAI) return null;

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

const FALLBACK_RECOMMENDATIONS = [
  {
    cityName: "오사카",
    country: "일본",
    emoji: "🍣",
    matchScore: 94,
    tags: ["#맛집", "#쇼핑", "#야경"],
    reason:
      "비행 시간이 짧고 맛집과 쇼핑, 유니버설 스튜디오까지 즐길 거리가 풍부해요.",
    flightPrice: "약 320,000원",
    hotelPrice: "1박 약 95,000원",
    weather: "온화하고 맑음",
  },
  {
    cityName: "다낭",
    country: "베트남",
    emoji: "🏖️",
    matchScore: 91,
    tags: ["#해변", "#리조트", "#가성비"],
    reason:
      "합리적인 예산으로 호이안·바나힐까지 함께 즐길 수 있는 휴양 도시예요.",
    flightPrice: "약 450,000원",
    hotelPrice: "1박 약 80,000원",
    weather: "따뜻하고 맑음",
  },
  {
    cityName: "타이베이",
    country: "대만",
    emoji: "🥟",
    matchScore: 89,
    tags: ["#야시장", "#온천", "#근거리"],
    reason:
      "야시장 먹거리와 온천, 지우펀 감성까지 가까운 거리에서 모두 경험할 수 있어요.",
    flightPrice: "약 370,000원",
    hotelPrice: "1박 약 85,000원",
    weather: "선선하고 흐림",
  },
  {
    cityName: "파리",
    country: "프랑스",
    emoji: "🗼",
    matchScore: 87,
    tags: ["#예술", "#미식", "#야경"],
    reason:
      "루브르, 에펠탑, 미슐랭 레스토랑까지 예술과 미식이 가득한 낭만 여행지예요.",
    flightPrice: "약 1,200,000원",
    hotelPrice: "1박 약 180,000원",
    weather: "선선하고 맑음",
  },
  {
    cityName: "발리",
    country: "인도네시아",
    emoji: "🌺",
    matchScore: 90,
    tags: ["#풀빌라", "#스파", "#바다"],
    reason:
      "풀빌라 휴식과 서핑, 우붓 사원까지 다양한 매력을 저렴하게 즐길 수 있어요.",
    flightPrice: "약 750,000원",
    hotelPrice: "1박 약 110,000원",
    weather: "따뜻하고 맑음",
  },
  {
    cityName: "바르셀로나",
    country: "스페인",
    emoji: "🎨",
    matchScore: 86,
    tags: ["#건축", "#축구", "#해변"],
    reason:
      "가우디 건축과 캄프누, 바르셀로네타 해변까지 감성 충만한 일정이 가능해요.",
    flightPrice: "약 1,050,000원",
    hotelPrice: "1박 약 150,000원",
    weather: "따뜻하고 맑음",
  },
];

export async function POST(req: Request) {
  try {
    const usingFallback = !apiKey;

    if (!apiKey) {
      console.warn(
        "⚠️ [API Warning] GOOGLE_GENERATIVE_AI_KEY가 없어 기본 추천 데이터로 응답합니다."
      );
    }

    const { destination, people, budgetLevel, departureDate, tripNights } =
      await req.json();

    const prompt = `
      너는 한국인 여행객을 위한 전문 여행 플래너야.
      아래 사용자 조건에 맞춰서 **서로 다른 매력을 가진 여행지 6곳**을 추천해줘.

      [사용자 조건]
      - 인원: ${people}
      - 예산 등급: ${budgetLevel}
      - 여행 기간: ${tripNights ? tripNights + "박" : "일정 미정"}
      - 출발일: ${departureDate || "미정"}
      - 선호 키워드: ${
        destination || "없음 (네가 알아서 다양하게 추천해줘)"
      }

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
    let text: string | null = null;

    if (!usingFallback) {
      text = await generateWithFallback(prompt);
    }

    if (text) {
      console.log("✅ [Gemini] 응답 성공 (길이):", text.length);
      // JSON 파싱
      let data;
      try {
        let cleanText = text.replace(/```json|```/g, "").trim();
        const firstBracket = cleanText.indexOf("[");
        const lastBracket = cleanText.lastIndexOf("]");

        if (firstBracket !== -1 && lastBracket !== -1) {
          cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }

        data = JSON.parse(cleanText);
        if (!Array.isArray(data)) data = [data];
      } catch {
        console.error("❌ [JSON Parse Error]:", text);
        throw new Error("AI 응답 형식이 올바르지 않습니다.");
      }

      return NextResponse.json(data);
    }

    // Gemini 호출을 생략하거나 실패한 경우 기본값 반환
    return NextResponse.json(FALLBACK_RECOMMENDATIONS);
  } catch (error: unknown) {
    // 🚨 [수정됨] any 제거 및 타입 안전하게 에러 메시지 추출
    let errorMessage = "알 수 없는 오류가 발생했습니다.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    console.error("🚨 [Final Error]:", errorMessage);
    console.warn("⚠️ [Fallback] Gemini 호출 실패로 기본 추천 데이터를 반환합니다.");
    return NextResponse.json(FALLBACK_RECOMMENDATIONS);
  }
}
