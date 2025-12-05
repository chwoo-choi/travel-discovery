// app/city/[id]/page.tsx
"use client";

// 🚨 [필수] 빌드 에러 방지
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { TopNavAuth } from "@/components/TopNavAuth";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// ----------------------------------------------------------------------
// ✅ 데이터 타입 정의
// ----------------------------------------------------------------------

interface PlaceDetail {
  name: string;
  description: string;
}

interface DayItinerary {
  day: number;
  theme: string;
  schedule: string[];
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
        🚫 지도 API 키가 설정되지 않았습니다.
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
    // 필수 정보가 없으면 처리 (클라이언트 환경 체크)
    if (!cityName || !country) {
      if (typeof window !== "undefined") {
         // alert("잘못된 접근입니다.");
         // router.back();
      }
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 🚀 실제 백엔드 API 호출
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
          throw new Error("상세 정보를 불러오는데 실패했습니다.");
        }

        const result = await res.json();
        
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
  }, [cityName, country, tripNights, router]);

  // 로딩 UI
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

  // 에러 UI
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

  return (
    <div className="animate-fade-in mx-auto w-full max-w-5xl pb-20">
      {/* 헤더 */}
      <header className="mb-10 text-center">
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

      {/* 정보 요약 (Bento Grid) */}
      <section className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-orange-50 p-6 text-orange-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            ☀️ Best Season
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.bestSeason}</p>
        </div>
        <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            💵 Currency
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.currency}</p>
        </div>
        <div className="rounded-3xl bg-sky-50 p-6 text-sky-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            ✈️ Flight Estimate
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.flights?.price || "정보 없음"}</p>
          <p className="mt-1 text-xs opacity-80">{data?.flights?.tip}</p>
        </div>
        <div className="rounded-3xl bg-purple-50 p-6 text-purple-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            🏨 Stay Area
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.accommodation?.area || "정보 없음"}</p>
          <p className="mt-1 text-xs opacity-80 line-clamp-2">{data?.accommodation?.reason}</p>
        </div>
      </section>

      {/* 일정 (Timeline) */}
      <section className="mb-16">
        <h2 className="mb-8 flex items-center text-2xl font-bold text-gray-900">
          <span className="mr-2 text-3xl">🗓️</span> {nights}박 {days}일 추천 코스
        </h2>
        <div className="space-y-8 pl-4">
          {data?.itinerary.map((day, idx) => (
            <div key={idx} className="relative border-l-2 border-indigo-100 pl-8 pb-2 last:border-0">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-indigo-600 ring-4 ring-white"></div>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-bold text-white">
                  Day {day.day}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{day.theme}</h3>
              </div>
              <ul className="space-y-2 rounded-2xl bg-gray-50 p-5 text-sm text-gray-700 shadow-sm">
                {day.schedule.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 관광지 (지도) */}
        <section>
          <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900">
            <span className="mr-2 text-3xl">📍</span> Must Visit
          </h2>
          <div className="space-y-6">
            {data?.spots.map((spot, idx) => (
              <div
                key={idx}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
              >
                <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-indigo-600">
                  {spot.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{spot.description}</p>
                <GoogleMapEmbed query={`${cityName} ${spot.name}`} apiKey={googleMapsApiKey} />
              </div>
            ))}
          </div>
        </section>

        {/* 맛집 (지도) */}
        <section>
          <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900">
            <span className="mr-2 text-3xl">🍽️</span> Local Food
          </h2>
          <div className="space-y-6">
            {data?.foods.map((food, idx) => (
              <div
                key={idx}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-orange-100 hover:shadow-md"
              >
                <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-orange-600">
                  {food.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{food.description}</p>
                <GoogleMapEmbed query={`${cityName} ${food.name} 맛집`} apiKey={googleMapsApiKey} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-16 text-center">
        {/* ✅ [핵심 수정] Link 태그를 button으로 교체하여 에러 해결 */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

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