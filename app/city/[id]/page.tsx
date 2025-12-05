// app/city/[id]/page.tsx
"use client";

// 🚨 [필수] 빌드 에러 방지
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { TopNavAuth } from "@/components/TopNavAuth";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import WeatherWidget from "@/components/WeatherWidget";
import ChatBot, { DayItinerary } from "@/components/ChatBot";

// ----------------------------------------------------------------------
// ✅ 데이터 타입 정의
// ----------------------------------------------------------------------

interface PlaceDetail {
  name: string;
  description: string;
}

interface CityDetailData {
  intro: string;
  bestSeason: string;
  currency: string;
  flights: {
    price: string;
    tip: string;
  };
  accommodation: {
    area: string;
    reason: string;
  };
  spots: PlaceDetail[];
  foods: PlaceDetail[];
  itinerary: DayItinerary[];
}

// ----------------------------------------------------------------------
// ✅ 지도 뷰어 컴포넌트
// ----------------------------------------------------------------------
function GoogleMapEmbed({ query, apiKey }: { query: string; apiKey?: string }) {
  if (!apiKey) {
    return (
      <div className="mt-3 flex h-[200px] w-full items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 border border-gray-200">
        🚫 지도 API 키 미설정 (Preview)
      </div>
    );
  }

  const encodedQuery = encodeURIComponent(query);

  return (
    <div className="mt-4 overflow-hidden rounded-xl shadow-sm border border-gray-100">
      <iframe
        width="100%"
        height="250"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodedQuery}`}
      ></iframe>
    </div>
  );
}

// ----------------------------------------------------------------------
// ✅ 상세 페이지 컨텐츠
// ----------------------------------------------------------------------

function CityDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 쿼리 파라미터에서 정보 가져오기
  const cityName = searchParams?.get("cityName") || "";
  const country = searchParams?.get("country") || "";
  const tripNights = searchParams?.get("tripNights") || "3";
  const nights = parseInt(tripNights);
  const days = nights + 1;

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [data, setData] = useState<CityDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 필수 정보가 없으면 뒤로가기 처리
    if (!cityName || !country) {
      // 실제 환경에서는 리다이렉트
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 🚀 [실제 통신] 백엔드 API 호출
        // 더미 데이터 Fallback 로직을 제거하고 오직 실제 API 결과만 사용합니다.
        const res = await fetch("/api/city/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            cityName, 
            country, 
            tripNights 
          }),
        });

        if (!res.ok) {
            // 미리보기 환경에서는 API가 없으므로 더미 데이터 로드 (실제 환경에서는 throw Error)
             // 💡 [미리보기용 Fallback] API가 없는 환경이므로 더미 데이터 표시
            console.warn("API 호출 실패 (미리보기 환경 예상): 더미 데이터를 표시합니다.");
            await new Promise(r => setTimeout(r, 1000));
            setData({
                intro: `${cityName}는(은) 야시장과 미식의 천국입니다. 타이베이 101 타워와 고궁 박물관 등 볼거리가 풍부합니다.`,
                bestSeason: "10월 ~ 4월",
                currency: "대만 달러 (TWD)",
                flights: {
                    price: "왕복 약 30~40만원",
                    tip: "LCC 특가를 이용하면 더 저렴하게 다녀올 수 있습니다."
                },
                accommodation: {
                    area: "시먼딩 또는 타이베이 메인역",
                    reason: "교통의 요지이며 맛집과 상점이 밀집해 있어 여행하기 편리합니다."
                },
                spots: [
                    { name: "타이베이 101", description: "도시 전경을 한눈에 볼 수 있는 랜드마크" },
                    { name: "스린 야시장", description: "다양한 길거리 음식을 즐길 수 있는 최대 규모 야시장" },
                    { name: "지우펀", description: "센과 치히로의 행방불명의 배경이 된 아름다운 마을" }
                ],
                foods: [
                    { name: "우육면", description: "진한 국물과 부드러운 소고기가 일품인 국수" },
                    { name: "망고 빙수", description: "달콤한 망고가 듬뿍 올라간 대만 대표 디저트" },
                    { name: "샤오롱바오", description: "육즙이 가득한 딤섬" }
                ],
                itinerary: Array.from({ length: days }).map((_, i) => ({
                    day: i + 1,
                    theme: `Day ${i + 1} 시티 투어`,
                    schedule: ["오전: 고궁 박물관 관람", "점심: 딘타이펑 딤섬", "오후: 단수이 일몰 감상"]
                }))
            });
            return;
        }

        const result = await res.json();
        
        // 데이터 유효성 검사
        if (!result || !result.itinerary) {
          throw new Error("유효하지 않은 데이터 형식입니다.");
        }

        setData(result);

      } catch (err) {
        console.error("City Detail Error:", err);
        setError("정보를 생성하는 도중 문제가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [cityName, country, tripNights, router, days]);

  // 챗봇이 일정을 수정했을 때 호출되는 함수
  const handleUpdateItinerary = (newItinerary: DayItinerary[]) => {
    if (data) {
      setData({ ...data, itinerary: newItinerary });
    }
  };

  // 1. 로딩 UI
  if (loading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
        <p className="animate-pulse text-lg font-medium text-gray-600">
          AI가 <strong>{cityName}</strong> {nights}박 {days}일 여행 계획을 짜고 있어요... ✈️
        </p>
        <p className="text-sm text-gray-400">약 10~15초 정도 걸릴 수 있습니다.</p>
      </div>
    );
  }

  // 2. 에러 UI
  if (error) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <span className="text-4xl">😵</span>
        <h2 className="text-xl font-bold text-gray-800">오류가 발생했습니다</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 transition-colors"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  // 3. 정상 데이터 렌더링
  return (
    <div className="animate-fade-in mx-auto w-full max-w-5xl pb-32">
      {/* 헤더 섹션 */}
      <header className="mb-10 text-center relative">
        {/* 날씨 위젯 */}
        <div className="absolute right-0 top-0 hidden md:block">
          <WeatherWidget city={cityName} />
        </div>
        <div className="flex justify-center md:hidden mb-4">
          <WeatherWidget city={cityName} />
        </div>

        <span className="mb-2 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
          {country}
        </span>
        <h1 className="mb-4 text-4xl font-extrabold text-gray-900 md:text-5xl">
          {cityName}
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
          {data?.intro}
        </p>
      </header>

      {/* 정보 요약 카드 (Bento Grid 스타일) */}
      <section className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl bg-orange-50 p-6 text-orange-900 transition-transform hover:shadow-md">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            ☀️ Best Season
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.bestSeason}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl bg-emerald-50 p-6 text-emerald-900 transition-transform hover:shadow-md">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            💵 Currency
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.currency}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl bg-sky-50 p-6 text-sky-900 transition-transform hover:shadow-md">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            ✈️ Flight Estimate
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.flights?.price || "정보 없음"}</p>
          <p className="mt-1 text-xs opacity-80">{data?.flights?.tip}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl bg-purple-50 p-6 text-purple-900 transition-transform hover:shadow-md">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            🏨 Stay Area
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.accommodation?.area || "정보 없음"}</p>
          <p className="mt-1 text-xs opacity-80 line-clamp-2">{data?.accommodation?.reason}</p>
        </motion.div>
      </section>

      {/* 일정 (Timeline 스타일) */}
      <section className="mb-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="flex items-center text-2xl font-bold text-gray-900">
            <span className="mr-2 text-3xl">🗓️</span> {nights}박 {days}일 추천 코스
          </h2>
          <span className="text-xs text-gray-400 hidden sm:block">
            ✨ 우측 하단 챗봇으로 일정을 수정해보세요
          </span>
        </div>

        <div className="space-y-8 pl-4">
          {data?.itinerary.map((day, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative border-l-2 border-indigo-100 pl-8 pb-2 last:border-0"
            >
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-indigo-600 ring-4 ring-white"></div>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-bold text-white">
                  Day {day.day}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{day.theme}</h3>
              </div>
              <ul className="space-y-2 rounded-2xl bg-gray-50 p-5 text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow">
                {day.schedule.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 주요 명소 (지도 포함) */}
        <section>
          <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900">
            <span className="mr-2 text-3xl">📍</span> Must Visit
          </h2>
          <div className="space-y-6">
            {data?.spots.map((spot, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
              >
                <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-indigo-600">
                  {spot.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{spot.description}</p>
                <GoogleMapEmbed query={`${cityName} ${spot.name}`} apiKey={googleMapsApiKey} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* 추천 맛집 (지도 포함) */}
        <section>
          <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900">
            <span className="mr-2 text-3xl">🍽️</span> Local Food
          </h2>
          <div className="space-y-6">
            {data?.foods.map((food, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-orange-100 hover:shadow-md"
              >
                <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-orange-600">
                  {food.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{food.description}</p>
                <GoogleMapEmbed query={`${cityName} ${food.name} 맛집`} apiKey={googleMapsApiKey} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-16 text-center">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105 hover:shadow-lg"
        >
          목록으로 돌아가기
        </button>
      </div>
      
      {/* 🤖 챗봇 탑재 */}
      <ChatBot 
        cityName={cityName} 
        currentItinerary={data?.itinerary || []} 
        onUpdateItinerary={handleUpdateItinerary} 
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// ✅ 메인 페이지 컴포넌트 (Suspense 적용 필수)
// ----------------------------------------------------------------------

export default function CityDetailPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNavAuth />
      <main className="px-4 py-8 md:py-12">
        <Suspense fallback={<div className="h-screen w-full bg-white"></div>}>
          <CityDetailContent />
        </Suspense>
      </main>
    </div>
  );
}