"use client";

import { TopNavAuth } from "@/components/TopNavAuth";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// 데이터 타입 정의 (Gemini 응답 구조)
type Recommendation = {
  cityName: string;
  country: string;
  emoji: string;
  matchScore: number;
  tags: string[];
  reason: string;
  flightPrice: string;
  hotelPrice: string;
  weather: string;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // URL 파라미터
  const destination = searchParams.get("destination") || "";
  const people = searchParams.get("people") || "2명";
  const budgetLevel = searchParams.get("budgetLevel") || "스탠다드";
  const departureDate = searchParams.get("departureDate") || "";
  const tripNights = searchParams.get("tripNights");

  // 조건 배지 표시용 텍스트 생성
  const dateText = departureDate ? `${departureDate} 출발` : "날짜 미정";
  const stayText = tripNights ? `· ${tripNights}박` : "";

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            people,
            budgetLevel,
            departureDate,
            tripNights,
          }),
        });

        if (!res.ok) throw new Error("추천 정보를 가져오지 못했습니다.");

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError("여행지를 추천하는 도중 오류가 발생했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [destination, people, budgetLevel, departureDate, tripNights]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNavAuth />

      <main className="flex flex-1 justify-center px-4 pb-16 pt-8 md:pt-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          
          {/* 헤더 영역: 기존 스타일 유지 */}
          <header className="mb-6 md:mb-8 text-center md:text-left">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6f6bff]">
              AI 여행 분석 결과
            </p>
            <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
              {loading
                ? "고객님의 취향을 분석하고 있어요..."
                : error
                ? "문제가 발생했습니다."
                : `"${data?.cityName}" 여행을 추천합니다!`}
            </h1>

            <p className="mt-2 text-xs text-gray-500 md:text-sm">
              선택하신 조건을 바탕으로 AI가 최적의 여행지를 선정했습니다.
            </p>

            {/* 조건 요약 배지 (기존 디자인) */}
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-100">
                📅 {dateText} {stayText}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-100">
                👥 {people}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-100">
                💰 {budgetLevel}
              </span>
              {destination && (
                <span className="inline-flex items-center rounded-full bg-[#6f6bff]/10 px-3 py-1 text-[11px] font-medium text-[#6f6bff] ring-1 ring-[#6f6bff]/20">
                  ✨ {destination}
                </span>
              )}
            </div>
          </header>

          {/* 1. 로딩 상태 UI (스켈레톤) */}
          {loading && (
            <div className="flex h-96 w-full flex-col items-center justify-center rounded-3xl bg-white shadow-[0_18px_40px_rgba(123,104,238,0.1)] ring-1 ring-gray-50">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-100 border-t-[#6f6bff]"></div>
              <p className="mt-6 font-medium text-gray-400 animate-pulse">
                최적의 여행지를 찾는 중...
              </p>
            </div>
          )}

          {/* 2. 에러 상태 UI */}
          {error && !loading && (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl bg-gray-50 text-center p-6">
              <span className="text-4xl mb-3">😵</span>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
              >
                다시 시도하기
              </button>
            </div>
          )}

          {/* 3. 결과 카드 (Bento Grid + 기존 디자인 스타일) */}
          {!loading && !error && data && (
            <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_24px_60px_rgba(123,104,238,0.18)] ring-1 ring-gray-50 animate-fade-in-up">
              
              {/* 🟣 히어로 섹션: 님의 시그니처 그라디언트 적용 */}
              <div className="relative flex h-72 flex-col items-center justify-center bg-gradient-to-br from-[#6f6bff] via-[#7b6bff] to-[#ba7bff] text-white p-8 text-center">
                {/* 배경 데코레이션 (살짝 흐린 원) */}
                <div className="absolute top-[-50%] left-[-20%] h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
                
                {/* AI 매칭 점수 배지 */}
                <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md border border-white/20 shadow-sm">
                  <span className="text-xs font-semibold text-white/90">AI 추천 적합도</span>
                  <span className="text-sm font-extrabold text-yellow-300">{data.matchScore}%</span>
                </div>
                
                {/* 대형 이모지 & 텍스트 */}
                <span className="text-7xl mb-4 drop-shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
                  {data.emoji}
                </span>
                <div className="z-10">
                  <p className="text-sm font-medium text-white/80 tracking-widest uppercase mb-1">
                    {data.country}
                  </p>
                  <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl drop-shadow-sm">
                    {data.cityName}
                  </h2>
                </div>
              </div>

              {/* ⚪ 상세 정보 그리드 */}
              <div className="grid gap-5 p-5 md:gap-6 md:p-8 lg:grid-cols-3 bg-white">
                
                {/* 1. 추천 이유 (가장 넓게) */}
                <div className="lg:col-span-2 flex flex-col justify-center rounded-3xl bg-[#f8f7ff] p-6 border border-[#efecff]">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#6f6bff]">
                    <span className="text-lg">💡</span> 왜 이곳일까요?
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-gray-700 font-medium">
                    {data.reason}
                  </p>
                  
                  {/* 태그 모음 - 기존 칩 디자인 유지 */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-gray-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. 날씨 카드 */}
                <div className="flex flex-col justify-center rounded-3xl bg-sky-50 p-6 border border-sky-100">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-sky-700">
                    <span className="text-lg">🌤️</span> 현지 날씨
                  </h3>
                  <p className="mt-3 text-sm text-sky-800 leading-relaxed">
                    {data.weather}
                  </p>
                </div>

                {/* 3. 비용 정보 (가로로 긴 카드 - 기존 가격표 스타일 반영) */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-lg">
                        ✈️
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400">예상 항공권 (1인)</p>
                        <p className="text-base font-bold text-gray-900">{data.flightPrice}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-lg">
                        🏨
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400">평균 숙박비 (1박)</p>
                        <p className="text-base font-bold text-gray-900">{data.hotelPrice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 md:px-8">
                <Link href="/" className="flex-1">
                  <button className="w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors">
                    ↺ 다시 검색하기
                  </button>
                </Link>
                <button 
                  onClick={() => alert("상세 일정 생성 기능은 다음 업데이트에 추가됩니다!")}
                  className="flex-[2] rounded-2xl bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7a6bff33] hover:opacity-95 transition-transform hover:scale-[1.01]"
                >
                  ✨ 이 도시로 상세 일정 만들기
                </button>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* 채팅 플로팅 버튼 (기존 유지) */}
      <button
        type="button"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] text-xl text-white shadow-[0_18px_40px_rgba(123,104,238,0.6)] transition-transform hover:scale-110"
      >
        💬
      </button>
    </div>
  );
}