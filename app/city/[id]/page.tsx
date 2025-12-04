// app/city/[id]/page.tsx
"use client";
"use client";

// 🚨 [필수] 빌드 에러 방지: 동적 페이지 강제 설정
export const dynamic = "force-dynamic";

// ✅ [필수] 이 줄은 절대 지우지 마세요! (React 필수 기능)
import { useEffect, useState, Suspense } from "react";
import { TopNavAuth } from "@/components/TopNavAuth";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// ----------------------------------------------------------------------
// ✅ 데이터 타입 정의 (항공권, 숙소 정보 추가)
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
  // [추가됨] 항공권 정보
  flights: {
    price: string;
    tip: string;
  };
  // [추가됨] 숙소 정보
  accommodation: {
    area: string;
    reason: string;
  };
  spots: PlaceDetail[];
  foods: PlaceDetail[];
  itinerary: DayItinerary[];
}

// ----------------------------------------------------------------------
// ✅ 지도 뷰어 컴포넌트 (내부용)
// ----------------------------------------------------------------------
function GoogleMapEmbed({ query, apiKey }: { query: string; apiKey?: string }) {
  if (!apiKey) {
    return (
      <div className="mt-3 flex h-[200px] w-full items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 border border-gray-200">
        🚫 지도 API 키 미설정 (Preview)
      </div>
    );
  }

  // 검색어를 URL 인코딩
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
// ✅ 상세 페이지 컨텐츠 (알맹이 컴포넌트)
// ----------------------------------------------------------------------

function CityDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 쿼리 파라미터에서 정보 가져오기
  const cityName = searchParams?.get("cityName") || "";
  const country = searchParams?.get("country") || "";
  
  // 여행 기간 가져오기 (없으면 기본값 3)
  const tripNights = searchParams?.get("tripNights") || "3"; 
  const nights = parseInt(tripNights);
  const days = nights + 1;

  // 구글 맵 API 키 (환경변수)
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [data, setData] = useState<CityDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 필수 정보가 없으면 뒤로가기 처리
    if (!cityName || !country) {
      if (typeof window !== "undefined") {
         // 실제 환경에서는 주석 해제
         alert("잘못된 접근입니다. 도시 정보가 없습니다.");
         router.back();
      }
      // 미리보기 환경에서는 리턴만 함
      if (!cityName) return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        
        // 🚀 [실제 통신] 백엔드 API 호출
        // 미리보기 환경에서는 API가 없으므로 에러가 발생하거나 더미 데이터를 사용해야 합니다.
        
        try {
            const res = await fetch("/api/city/detail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                cityName, 
                country, 
                tripNights 
            }),
            });

            if (!res.ok) throw new Error("API call failed");
            const result = await res.json();
            setData(result);
        } catch (apiError) {
            // 💡 [미리보기용 Fallback] API가 없는 환경이므로 UI 확인용 더미 데이터 표시
            console.warn("API 호출 실패 (미리보기 환경 예상): 더미 데이터를 표시합니다.");
            await new Promise(r => setTimeout(r, 1000)); // 로딩 시늉
            setData({
                intro: `${cityName}는(은) 맛집과 쇼핑의 천국입니다. 짧은 비행 시간으로 가볍게 다녀오기 좋은 여행지입니다.`,
                bestSeason: "봄, 가을",
                currency: "엔화 (JPY)",
                flights: {
                    price: "왕복 약 20~30만원",
                    tip: "LCC 특가를 노리면 10만원 후반대도 가능합니다."
                },
                accommodation: {
                    area: "하카타역 또는 텐진",
                    reason: "교통이 편리하고 맛집과 쇼핑몰이 밀집해 있어 이동 시간을 줄일 수 있습니다."
                },
                spots: [
                    { name: "나카스 포장마차 거리", description: "강변의 낭만과 맛있는 안주를 즐길 수 있는 곳" },
                    { name: "모모치 해변 공원", description: "현대적인 타워와 해변이 어우러진 산책 코스" },
                    { name: "캐널시티 하카타", description: "운하가 흐르는 복합 쇼핑몰" }
                ],
                foods: [
                    { name: "돈코츠 라멘", description: "진한 돼지뼈 육수의 하카타 스타일 라멘" },
                    { name: "모츠나베", description: "부추가 듬뿍 들어가는 후쿠오카 명물 대창 전골" },
                    { name: "멘타이코", description: "어디에나 잘 어울리는 짭조름한 명란젓" }
                ],
                itinerary: Array.from({ length: days }).map((_, i) => ({
                    day: i + 1,
                    theme: `Day ${i + 1} 먹방 및 시티 투어`,
                    schedule: ["오전: 신사 산책", "점심: 라멘 맛집", "오후: 쇼핑몰 구경 및 카페"]
                }))
            });
        }

      } catch (err) {
        console.error("City Detail Error:", err);
        setError("정보를 생성하는 도중 문제가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [cityName, country, tripNights, router, days]);

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

      {/* 정보 요약 카드 (Bento Grid 스타일) - 4칸으로 확장 */}
      <section className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Best Season */}
        <div className="rounded-3xl bg-orange-50 p-6 text-orange-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            ☀️ Best Season
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.bestSeason}</p>
        </div>

        {/* Currency */}
        <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            💵 Currency
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.currency}</p>
        </div>

        {/* [추가됨] Flights */}
        <div className="rounded-3xl bg-sky-50 p-6 text-sky-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            ✈️ Flight Estimate
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.flights?.price || "정보 없음"}</p>
          <p className="mt-1 text-xs opacity-80">{data?.flights?.tip}</p>
        </div>

        {/* [추가됨] Accommodation */}
        <div className="rounded-3xl bg-purple-50 p-6 text-purple-900 transition-transform hover:scale-[1.02]">
          <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider opacity-70">
            🏨 Stay Area
          </h3>
          <p className="text-sm font-bold md:text-base">{data?.accommodation?.area || "정보 없음"}</p>
          <p className="mt-1 text-xs opacity-80 line-clamp-2">{data?.accommodation?.reason}</p>
        </div>
      </section>

      {/* 일정 (Timeline 스타일) */}
      <section className="mb-16">
        <h2 className="mb-8 flex items-center text-2xl font-bold text-gray-900">
          <span className="mr-2 text-3xl">🗓️</span> {nights}박 {days}일 추천 코스
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
        {/* 주요 명소 (지도 포함) */}
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
                <h3 className="mb-1 font-bold text-gray-900 group-hover:text-indigo-600 text-lg">
                  {spot.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{spot.description}</p>
                {/* 🗺️ 관광지 지도 연동 */}
                <GoogleMapEmbed query={`${cityName} ${spot.name}`} apiKey={googleMapsApiKey} />
              </div>
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
              <div
                key={idx}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-orange-100 hover:shadow-md"
              >
                <h3 className="mb-1 font-bold text-gray-900 group-hover:text-orange-600 text-lg">
                  {food.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{food.description}</p>
                {/* 🗺️ 맛집 지도 연동 */}
                <GoogleMapEmbed query={`${cityName} ${food.name} 맛집`} apiKey={googleMapsApiKey} />
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