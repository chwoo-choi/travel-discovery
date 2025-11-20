//  app/api/recommend/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// API 키 로드 확인
const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    // 0. API 키 확인
    if (!apiKey) {
      console.error("❌ [API Error] GOOGLE_GENERATIVE_AI_KEY가 설정되지 않았습니다.");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const { destination, people, budgetLevel, departureDate, tripNights } = await req.json();

    // 1. 모델 설정
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. 프롬프트 (기존 유지)
    const prompt = `
      너는 20대~30대를 위한 트렌디한 여행 플래너야.
      아래 사용자 조건에 맞춰서 가장 완벽한 여행지 **딱 1곳**을 추천해줘.
      
      [사용자 조건]
      - 인원: ${people}
      - 예산 등급: ${budgetLevel}
      - 여행 기간: ${tripNights ? tripNights + "박" : "일정 미정"}
      - 출발일: ${departureDate || "미정"}
      - 선호 키워드/관심사: ${destination || "없음 (네가 알아서 추천해줘)"}

      [요청 사항]
      1. 사용자의 키워드나 상황에 딱 맞는 도시를 선정해.
      2. 항공권과 숙박비는 한국 출발 기준(KRW)으로 현실적인 '1인당 예상 최저가'를 추정해줘.
      3. 추천 이유는 감성적이고 설득력 있게 작성해줘.
      4. 반드시 아래 JSON 형식으로만 답변해. 마크다운이나 다른 말은 붙이지 마.

      [JSON 형식 예시]
      {
        "cityName": "도시 이름 (예: 후쿠오카)",
        "country": "국가 이름 (예: 일본)",
        "emoji": "도시를 대표하는 이모지 1개 (예: 🍜)",
        "matchScore": 95,
        "tags": ["#태그1", "#태그2", "#태그3"],
        "reason": "추천 이유 (3문장 이내)",
        "flightPrice": "약 000,000원",
        "hotelPrice": "1박 약 00,000원",
        "weather": "여행 시기의 예상 날씨와 옷차림 팁"
      }
    `;

    // 3. AI 요청 및 응답 대기
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 [Gemini Raw Response]:", text); // 디버깅용 로그

    // 4. JSON 파싱 (스마트 파싱 적용)
    let data;
    try {
      // (1) ```json ... ``` 제거
      let cleanText = text.replace(/```json|```/g, "").trim();
      
      // (2) 혹시 앞뒤에 잡담이 있을 경우, 첫 '{' 부터 마지막 '}' 까지만 추출
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      data = JSON.parse(cleanText);

    } catch (parseError) {
      console.error("❌ [JSON Parse Error] AI 응답을 파싱할 수 없습니다:", text);
      throw new Error("AI 응답 형식이 올바르지 않습니다.");
    }

    return NextResponse.json(data);

  } catch (error) {
    // 🚨 [수정됨] any 제거 및 타입 안전하게 에러 메시지 처리
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    console.error("🚨 [Server Error]:", errorMessage);
    
    return NextResponse.json(
      { error: "여행지를 추천하는 중 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}