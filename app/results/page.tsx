//  app/results/page.tsx
"use client";

// 🚨 빌드 에러 방지
export const dynamic = "force-dynamic";

import { TopNavAuth } from "@/components/TopNavAuth";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

// 데이터 타입 정의
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

// 🔹 알맹이 컴포넌트
function SearchResultsContent() {
  const searchParams = useSearchParams(); 
  
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 안전하게 파라미터 가져오기
  const destination = searchParams?.get("destination") || "";
  const people = searchParams?.get("people") || "2명";
  const budgetLevel = searchParams?.get("budgetLevel") || "스탠다드";
  const departureDate = searchParams?.get("departureDate") || "";
  const tripNights = searchParams?.get("tripNights");

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
        
        if (Array.isArray(result)) {
          setRecommendations(result);
        } else {
          setRecommendations([result]);
        }

      } catch (err) {
        setError("여행지를 추천하는 도중 오류가 발생했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (searchParams) {
        fetchRecommendation();
    }
  }, [searchParams, destination, people, budgetLevel, departureDate, tripNights]);

  // 북마크 저장 핸들러 (API 연동 전 UI만 구현)
  const handleBookmark = (city: Recommendation) => {
    alert(`'${city.cityName}'이(가) 북마크에 저장되었습니다! (실제 저장은 DB 연동 후 가능)`);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col">
      
      {/* 헤더 영역 */}
      <header className="mb-8 text-center animate-fade-in-up">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6f6bff]">
          AI SMART TRAVEL PLANNER
        </p>
        <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
          {loading
            ? "최적의 여행지를 찾고 있어요..."
            : error
            ? "잠시 문제가 발생했습니다."
            : `당신을 위한 추천 여행지 ${recommendations.length}곳`}
        </h1>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
            📅 {dateText} {stayText}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
            👥 {people}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
            💰 {budgetLevel}
          </span>
          {destination && (
            <span className="inline-flex items-center rounded-full bg-[#6f6bff]/10 px-3 py-1 text-[11px] font-medium text-[#6f6bff] ring-1 ring-[#6f6bff]/20">
              ✨ {destination}
            </span>
          )}
        </div>
      </header>

      {/* 로딩 상태 */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex h-80 w-full flex-col items-center justify-center rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-50 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-gray-100 mb-4"></div>
              <div className="h-4 w-32 rounded bg-gray-100 mb-2"></div>
              <div className="h-3 w-20 rounded bg-gray-50"></div>
            </div>
          ))}
        </div>
      )}

      {/* 에러 상태 */}
      {error && !loading && (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl bg-gray-50 text-center p-6">
          <span className="text-4xl mb-3">😵</span>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-transform hover:scale-105"
          >
            다시 시도하기
          </button>
        </div>
      )}

      {/* 결과 리스트 */}
      {!loading && !error && recommendations.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-10">
            {recommendations.map((city, index) => (
              <div 
                key={index} 
                className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_40px_rgba(123,104,238,0.12)] ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-[0_25px_50px_rgba(123,104,238,0.2)] animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 left-0 h-32 w-full bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-white/30 px-2.5 py-1 backdrop-blur-md border border-white/20">
                  <span className="text-[10px] font-bold text-white">{city.matchScore}% 일치</span>
                </div>

                <div className="relative z-10 mt-12 flex flex-col items-center px-6 pb-6 text-center h-full">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {city.emoji}
                  </div>

                  <h2 className="text-xl font-extrabold text-gray-900">{city.cityName}</h2>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">{city.country}</p>

                  <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                    {city.tags.slice(0, 3).map((tag, tIndex) => (
                      <span key={tIndex} className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 border border-gray-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="w-full rounded-2xl bg-indigo-50/50 p-4 mb-4 text-left">
                    <p className="text-xs leading-relaxed text-gray-700 line-clamp-3">
                      &quot;{city.reason}&quot;
                    </p>
                  </div>

                  <div className="mt-auto w-full space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2">
                      <span className="text-[10px] text-gray-500">✈️ 항공권</span>
                      <span className="text-xs font-bold text-gray-900">{city.flightPrice}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                         <Link
                            href={`/city/${index}?cityName=${encodeURIComponent(city.cityName)}&country=${encodeURIComponent(city.country)}`}
                            className="flex-1 mr-2 rounded-xl bg-gray-900 py-2 text-xs font-bold text-white text-center hover:bg-gray-800 transition-colors"
                         >
                            상세 보기
                         </Link>
                         <button 
                            onClick={() => handleBookmark(city)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                         >
                            ♥
                         </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pb-10">
             <Link href="/">
              <button className="rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-gray-800 hover:scale-105 transition-all">
                ↺ 다시 검색하기
              </button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// 🔹 [메인 페이지] Suspense 적용
export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNavAuth />
      <main className="flex flex-1 justify-center px-4 pt-8 md:pt-10">
        <Suspense fallback={
          <div className="flex h-96 w-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#6f6bff]"></div>
          </div>
        }>
          <SearchResultsContent />
        </Suspense>
      </main>
      <button
        type="button"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] text-xl text-white shadow-[0_18px_40px_rgba(123,104,238,0.6)] transition-transform hover:scale-110 z-50"
      >
        💬
      </button>
    </div>
  );
}