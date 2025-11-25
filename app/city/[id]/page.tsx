// app/city/[id]/page.tsx
"use client";

export const dynamic = "force-dynamic";
import { TopNavAuth } from "@/components/TopNavAuth";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

// ----------------------------------------------------------------------
// ✅ 데이터 타입 정의 (Strict Typing)
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
  spots: PlaceDetail[];
  foods: PlaceDetail[];
  itinerary: DayItinerary[];
}

// ----------------------------------------------------------------------
// ✅ 상세 페이지 컨텐츠 컴포넌트
// ----------------------------------------------------------------------

function CityDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 쿼리 파라미터에서 도시명과 국가 가져오기 (타입 가드)
  const cityName = searchParams?.get("cityName") || "";
  const country = searchParams?.get("country") || "";

  const [data, setData] = useState<CityDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 필수 정보 누락 시 처리
    if (!cityName || !country) {
      if (typeof window !== "undefined") {
         alert("잘못된 접근입니다. 도시 정보가 없습니다.");
         router.back();
      }
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        
        // 실제 API 호출 (Gemini 연동)
        const res = await fetch("/api/city/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cityName, country }),
        });

        if (!res.ok) {
          throw new Error("상세 정보를 불러오는데 실패했습니다.");
        }

        const result = await res.json();
        
        // 데이터 타입 검증 (간단한 체크)
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
  }, [cityName, country, router]);

  // 1. 로딩 UI
  if (loading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
        <p className="animate-pulse text-lg font-medium text-gray-600">
          AI가 <strong>{cityName}</strong> 여행 계획을 짜고 있어요... ✈️
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
    <div className="animate-fade-in mx-auto w-full max-w-5xl pb-20">
      {/* 헤더 섹션 */}
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

      {/* 정보 요약 카드 (Bento Grid 스타일) */}
      <section className="mb-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-orange-50 p-6 text-orange-900 transition-transform hover:scale-[1.01]">
          <h3 className="mb-2 flex items-center text-sm font-bold uppercase tracking-wider opacity-70">
            ☀️ Best Season
          </h3>
          <p className="text-lg font-medium">{data?.bestSeason}</p>
        </div>
        <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-900 transition-transform hover:scale-[1.01]">
          <h3 className="mb-2 flex items-center text-sm font-bold uppercase tracking-wider opacity-70">
            💵 Currency
          </h3>
          <p className="text-lg font-medium">{data?.currency}</p>
        </div>
      </section>

      {/* 3박 4일 일정 (Timeline 스타일) */}
      <section className="mb-16">
        <h2 className="mb-8 flex items-center text-2xl font-bold text-gray-900">
          <span className="mr-2 text-3xl">🗓️</span> 3박 4일 추천 코스
        </h2>
        <div className="space-y-8 pl-4">
          {data?.itinerary.map((day, idx) => (
            <div key={idx} className="relative border-l-2 border-indigo-100 pl-8 pb-2 last:border-0">
              {/* 타임라인 점 */}
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
        {/* 주요 명소 */}
        <section>
          <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900">
            <span className="mr-2 text-3xl">📸</span> Must Visit
          </h2>
          <div className="space-y-4">
            {data?.spots.map((spot, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
              >
                <h3 className="mb-1 font-bold text-gray-900 group-hover:text-indigo-600">
                  {spot.name}
                </h3>
                <p className="text-sm text-gray-500">{spot.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 추천 맛집 */}
        <section>
          <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900">
            <span className="mr-2 text-3xl">🍽️</span> Local Food
          </h2>
          <div className="space-y-4">
            {data?.foods.map((food, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-orange-100 hover:shadow-md"
              >
                <h3 className="mb-1 font-bold text-gray-900 group-hover:text-orange-600">
                  {food.name}
                </h3>
                <p className="text-sm text-gray-500">{food.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-16 text-center">
        <Link
          href="/bookmark"
          className="inline-flex items-center rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
        >
          목록으로 돌아가기
        </Link>
      </div>
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