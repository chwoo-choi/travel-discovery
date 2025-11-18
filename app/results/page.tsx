// app/results/page.tsx
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { ko } from "date-fns/locale";

type ResultsSearchParams = {
  departureDate?: string;
  returnDate?: string;
  tripNights?: string;
  people?: string;
  budgetLevel?: string;
  destination?: string;
};

type ResultsPageProps = {
  searchParams: ResultsSearchParams;
};

type CitySummary = {
  id: string;
  name: string;
  country: string;
  description: string;
  rating: number;
  reviewCount: number;
  minFlightPrice: number;
  minStayPricePerNight: number;
  tags: string[];
};

const MOCK_CITIES: CitySummary[] = [
  {
    id: "seoul",
    name: "서울",
    country: "대한민국",
    description: "전통과 현대가 공존하는 야경·맛집·쇼핑의 도시",
    rating: 4.8,
    reviewCount: 12847,
    minFlightPrice: 150_000,
    minStayPricePerNight: 80_000,
    tags: ["도시", "야경", "맛집", "쇼핑"],
  },
  {
    id: "tokyo",
    name: "도쿄",
    country: "일본",
    description: "미식, 쇼핑, 디즈니까지 한 번에 즐길 수 있는 여행지",
    rating: 4.7,
    reviewCount: 21540,
    minFlightPrice: 180_000,
    minStayPricePerNight: 90_000,
    tags: ["미식", "도시", "쇼핑", "가족"],
  },
  {
    id: "bangkok",
    name: "방콕",
    country: "태국",
    description: "합리적인 물가와 휴양·야시장·마사지가 함께하는 도시",
    rating: 4.6,
    reviewCount: 17320,
    minFlightPrice: 220_000,
    minStayPricePerNight: 60_000,
    tags: ["휴양", "야시장", "가성비", "마사지"],
  },
];

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default function ResultsPage({ searchParams }: ResultsPageProps) {
  const {
    departureDate: departureParam,
    returnDate: returnParam,
    tripNights: tripNightsParam,
    people: peopleParam,
    budgetLevel: budgetLevelParam,
    destination: destinationParam,
  } = searchParams;

  const destination = destinationParam?.trim() ?? "";

  const departureDate = parseDate(departureParam);
  const returnDate = parseDate(returnParam);

  // 여행 기간 계산
  let tripNights: number | null = null;
  if (tripNightsParam) {
    const n = Number(tripNightsParam);
    if (!Number.isNaN(n) && n >= 0) {
      tripNights = n;
    }
  }
  if (
    tripNights === null &&
    departureDate &&
    returnDate &&
    differenceInCalendarDays(returnDate, departureDate) >= 0
  ) {
    tripNights = differenceInCalendarDays(returnDate, departureDate);
  }

  const tripDays = tripNights !== null ? tripNights + 1 : null;

  const hasDates = !!departureDate && !!returnDate;
  const hasDestination = destination.length > 0;

  const peopleLabel = peopleParam ?? "2명";
  const budgetLevelLabel = budgetLevelParam ?? "스탠다드";

  // 상단 타이틀
  let title = "여행지 추천 결과";
  if (hasDestination) {
    title = `"${destination}"에 대한 여행지 추천 결과`;
  } else if (hasDates) {
    title = "선택하신 조건에 맞는 여행지 추천 결과";
  }

  // 조건 요약 배지들
  const conditionChips: string[] = [];

  if (hasDates && departureDate && returnDate) {
    const dateLabel = `${format(departureDate, "M월 d일", { locale: ko })} ~ ${format(
      returnDate,
      "M월 d일",
      { locale: ko },
    )}`;
    if (tripNights !== null && tripDays !== null) {
      conditionChips.push(`${dateLabel} · ${tripNights}박 ${tripDays}일`);
    } else {
      conditionChips.push(dateLabel);
    }
  }

  conditionChips.push(`인원: ${peopleLabel}`);
  conditionChips.push(`예산 등급: ${budgetLevelLabel}`);

  if (hasDestination) {
    conditionChips.push(`키워드: ${destination}`);
  } else {
    conditionChips.push("키워드 없음 (조건 기반 자동 추천)");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 상단 네비게이션 (홈과 톤 맞춤) */}
      <nav className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] shadow-md">
              <span className="text-sm text-white">✈️</span>
            </div>
            <span className="text-sm font-semibold text-gray-800 md:text-base">
              스마트 트래블 플래너
            </span>
          </Link>

          {/* 중앙 메뉴 */}
          <div className="hidden items-center gap-4 text-sm text-gray-500 md:flex">
            <Link
              href="/"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white/70 md:text-sm"
            >
              <span>🏠</span>
              <span>홈</span>
            </Link>
            <Link
              href="/bookmark"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white/70 md:text-sm"
            >
              <span>🔖</span>
              <span>북마크</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white/70 md:text-sm"
            >
              <span>⚙️</span>
              <span>설정</span>
            </Link>
          </div>

          {/* 우측 버튼 */}
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 font-medium text-gray-700 hover:bg-white"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] px-4 py-1.5 font-semibold text-white shadow-md shadow-[#7a6bff33] hover:opacity-95"
            >
              회원가입
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 영역 */}
      <main className="flex flex-1 justify-center px-4 pb-16 pt-8 md:pt-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          {/* 헤더 */}
          <header className="mb-6 md:mb-8">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-500">
              결과
            </p>
            <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
              {title}
            </h1>

            {/* 서브 설명 */}
            <p className="mt-2 text-xs text-gray-500 md:text-sm">
              홈에서 선택하신{" "}
              <span className="font-medium text-gray-800">
                날짜 · 인원 · 예산{hasDestination ? " · 키워드" : ""}
              </span>{" "}
              조건을 바탕으로, 여행지 후보를 정리한 화면입니다. 실제 추천
              알고리즘과 가격 데이터는 추후 MySQL · API 연동 시점에
              연결됩니다.
            </p>

            {/* 조건 요약 배지 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {conditionChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-100"
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* 날짜가 없을 때 안내 (직접 URL 접근 등) */}
            {!hasDates && (
              <p className="mt-3 text-[11px] text-gray-400 md:text-xs">
                출발일과 귀국일이 없으면 정확한 추천이 어려울 수 있습니다.
                홈 화면에서 날짜를 선택한 뒤 다시 검색해 주세요.
              </p>
            )}
          </header>

          {/* 도시 카드 리스트 */}
          <section className="space-y-4 md:space-y-6">
            {MOCK_CITIES.map((city) => (
              <article
                key={city.id}
                className="overflow-hidden rounded-3xl bg-white shadow-[0_18px_40px_rgba(123,104,238,0.14)] ring-1 ring-gray-50"
              >
                {/* 이미지 영역 (임시 그래디언트) */}
                <div className="relative h-40 w-full overflow-hidden md:h-48">
                  <div className="h-full w-full bg-gradient-to-br from-[#6f6bff] via-[#7b6bff] to-[#ba7bff]" />
                  <div className="absolute inset-0 flex items-end justify-between px-4 pb-3">
                    <div className="text-left text-white">
                      <p className="text-xs font-medium text-white/80">
                        {city.country}
                      </p>
                      <h2 className="text-xl font-semibold md:text-2xl">
                        {city.name}
                      </h2>
                    </div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                      ★ {city.rating.toFixed(1)} ·{" "}
                      {city.reviewCount.toLocaleString()}개 리뷰
                    </div>
                  </div>
                </div>

                {/* 내용 영역 */}
                <div className="space-y-3 px-4 py-4 md:px-5 md:py-5">
                  {/* 소개 문구 */}
                  <p className="text-xs text-gray-600 md:text-sm">
                    {city.description}
                  </p>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-1.5">
                    {city.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600 ring-1 ring-gray-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 가격 요약 */}
                  <div className="grid gap-3 text-xs text-gray-700 md:grid-cols-3 md:text-sm">
                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-gray-500">
                        항공권 (왕복 기준)
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 md:text-base">
                        최저 ₩{city.minFlightPrice.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        실제 가격은 날짜 · 항공사에 따라 달라질 수 있습니다.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-gray-500">
                        숙박비 (1박 기준)
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 md:text-base">
                        최저 ₩{city.minStayPricePerNight.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        평균적인 1박 최저가 수준을 기준으로 보여줍니다.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-gray-500">
                        추천 이유
                      </p>
                      <p className="mt-1 text-[11px] text-gray-600 md:text-xs">
                        현재는 예시 데이터이며, 추후{" "}
                        <span className="font-medium">
                          날짜 · 예산 · 관심사
                        </span>{" "}
                        조건에 맞는 점수 기반 추천 로직이 연결될 예정입니다.
                      </p>
                    </div>
                  </div>

                  {/* 하단 액션 */}
                  <div className="mt-1 flex items-center justify-between">
                    <Link
                      href={`/city/${city.id}`}
                      className="inline-flex items-center gap-1 rounded-2xl bg-gray-900 px-3 py-2 text-[11px] font-medium text-white hover:bg-gray-800 md:text-xs"
                    >
                      상세 정보 보기
                      <span>→</span>
                    </Link>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-700 hover:border-[#c0b5ff] md:text-xs"
                    >
                      <span>♡</span>
                      <span>북마크</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {/* (예시) 실제 추천 데이터 연결 안내 */}
            <p className="mt-2 text-[11px] text-gray-400 md:text-xs">
              ※ 위 도시는 UI와 흐름을 확인하기 위한 예시 데이터입니다.
              추후에는 MySQL에 저장된 도시/가격/날씨 정보와 연동하여 실제
              추천 결과가 표시됩니다.
            </p>
          </section>
        </div>
      </main>

      {/* 채팅 플로팅 버튼 (UI만, 홈과 동일) */}
      <button
        type="button"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] text-xl text-white shadow-[0_18px_40px_rgba(123,104,238,0.6)]"
      >
        💬
      </button>
    </div>
  );
}
