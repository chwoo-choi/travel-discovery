import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// API 키 로드
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY || "");

export async function POST(req: Request) {
  try {
    // 1. 프론트엔드에서 보낸 데이터 받기
    const { destination, people, budgetLevel, departureDate, tripNights } = await req.json();

    // 2. 제미나이 모델 선택 (가장 빠르고 효율적인 Flash 모델 권장)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. 프롬프트 엔지니어링 (가장 중요!)
    // AI에게 명확한 페르소나와 출력 형식을 지정합니다.
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
        "matchScore": 95, (0~100 사이 적합도 점수),
        "tags": ["#태그1", "#태그2", "#태그3"],
        "reason": "추천 이유 (3문장 이내)",
        "flightPrice": "약 000,000원",
        "hotelPrice": "1박 약 00,000원",
        "weather": "여행 시기(${departureDate})의 예상 날씨와 옷차림 팁"
      }
    `;

    // 4. AI 응답 생성
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. JSON 파싱 (AI가 가끔 ```json ... ``` 형태로 줄 때가 있어서 정제 필요)
    const jsonString = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "여행지를 추천하는 중 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}