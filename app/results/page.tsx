// app/results/page.tsx
import Link from "next/link";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type ResultsPageProps = {
  searchParams: SearchParams;
};

function normalizeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseNumber(value: string | string[] | undefined): number | null {
  const raw = normalizeParam(value);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isNaN(num) ? null : num;
}

function parseBoolean(value: string | string[] | undefined): boolean {
  return normalizeParam(value) === "true";
}

function parseList(value: string | string[] | undefined): string[] {
  const raw = normalizeParam(value);
  if (!raw) return [];
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function TopNav() {
  return (
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
  );
}

export default function ResultsPage({ searchParams }: ResultsPageProps) {
  const destination = normalizeParam(searchParams.destination);
  const departureDate = normalizeParam(searchParams.departureDate);
  const returnDate = normalizeParam(searchParams.returnDate);
  const people = normalizeParam(searchParams.people);
  const budgetLevel = normalizeParam(searchParams.budgetLevel);

  const budget = parseNumber(searchParams.budget);
  const directFlightOnly = parseBoolean(searchParams.directFlightOnly);
  const minTemp = parseNumber(searchParams.minTemp);
  const maxTemp = parseNumber(searchParams.maxTemp);
  const maxRainChance = parseNumber(searchParams.maxRainChance);

  const themes = parseList(searchParams.themes);
  const accommodations = parseList(searchParams.accommodations);

  const hasSearchInput =
    destination ||
    departureDate ||
    returnDate ||
    people ||
    budgetLevel ||
    budget !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-8 md:pt-10">
        {/* 제목 영역 */}
        <header className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-500">
            맞춤형 여행 추천 결과
          </p>
          <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
            선택하신 조건에 맞는 여행지를 찾아봤어요.
          </h1>
          <p className="mt-2 text-xs text-gray-500 md:text-sm">
            홈 화면에서 입력한 날짜·인원·예산·여행 테마를 바탕으로 추천
            결과가 표시됩니다.
          </p>
        </header>

        {/* 검색 조건 요약 카드 */}
        <section className="mb-8 rounded-3xl bg-white/90 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.16)] backdrop-blur md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-800 md:text-base">
              검색 조건 요약
            </h2>
            <Link
              href="/"
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              조건 다시 설정하기
            </Link>
          </div>

          {hasSearchInput ? (
            <div className="grid gap-3 text-xs text-gray-700 md:grid-cols-2 md:text-sm">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 md:text-xs">
                  여행지
                </p>
                <p className="rounded-2xl bg-gray-50 px-3 py-2">
                  {destination || "지정된 여행지가 없습니다."}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 md:text-xs">
                  여행 기간
                </p>
                <p className="rounded-2xl bg-gray-50 px-3 py-2">
                  {departureDate || returnDate
                    ? `${departureDate || "출발일 미입력"} ~ ${
                        returnDate || "귀국일 미입력"
                      }`
                    : "여행 기간 정보가 없습니다."}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 md:text-xs">
                  인원 / 예산 등급
                </p>
                <p className="rounded-2xl bg-gray-50 px-3 py-2">
                  {(people || "인원 미입력") +
                    " · " +
                    (budgetLevel || "예산 등급 미입력")}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 md:text-xs">
                  세부 예산
                </p>
                <p className="rounded-2xl bg-gray-50 px-3 py-2">
                  {budget !== null
                    ? `약 ₩${budget.toLocaleString()} 기준`
                    : "세부 예산 정보가 없습니다."}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 md:text-xs">
                  직항 여부 / 날씨 조건
                </p>
                <p className="rounded-2xl bg-gray-50 px-3 py-2">
                  {directFlightOnly ? "직항 노선만" : "직항/경유 모두 허용"}
                  {" · "}
                  {minTemp !== null && maxTemp !== null
                    ? `${minTemp}℃ ~ ${maxTemp}℃`
                    : "온도 조건 없음"}
                  {" · "}
                  {maxRainChance !== null
                    ? `최대 강수 확률 ${maxRainChance}%`
                    : "강수 확률 조건 없음"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 md:text-xs">
                  여행 테마 / 숙소 유형
                </p>
                <p className="rounded-2xl bg-gray-50 px-3 py-2">
                  {themes.length > 0 ? themes.join(", ") : "선택한 여행 테마 없음"}
                  {" · "}
                  {accommodations.length > 0
                    ? accommodations.join(", ")
                    : "선호 숙소 유형 없음"}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl bg-gray-50 px-3 py-2 text-xs text-gray-500 md:text-sm">
              아직 검색 조건이 제대로 전달되지 않았습니다. 홈 화면에서 여행
              정보를 입력한 뒤 다시 시도해 주세요.
            </p>
          )}
        </section>

        {/* 추천 결과 리스트 (지금은 UI 샘플용 더미 카드) */}
        <section className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 md:text-base">
              추천 여행지
            </h2>
            <span className="text-xs text-gray-400">
              ※ 현재는 UI 테스트용 더미 데이터입니다.
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* 카드 1 */}
            <article className="flex h-full flex-col rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.14)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    도쿄
                  </h3>
                  <p className="text-[11px] text-gray-500">일본 · 쇼핑 & 미식</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-500">
                  추천도 92점
                </span>
              </div>
              <p className="mb-3 text-[11px] text-gray-500">
                대중교통이 편리하고, 단거리 노선 직항이 많아 주말 여행으로
                적합해요.
              </p>
              <dl className="mb-3 space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <dt className="text-gray-500">예상 기온</dt>
                  <dd>18℃ ~ 24℃</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">강수 확률</dt>
                  <dd>30% 내외</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">예산 체감</dt>
                  <dd>{budgetLevel || "스탠다드 기준"}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-1">
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #근거리
                </span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #쇼핑
                </span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #맛집
                </span>
              </div>
            </article>

            {/* 카드 2 */}
            <article className="flex h-full flex-col rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.14)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    방콕
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    태국 · 휴양 & 야시장
                  </p>
                </div>
                <span className="rounded-full bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-500">
                  가성비 좋음
                </span>
              </div>
              <p className="mb-3 text-[11px] text-gray-500">
                저렴한 물가와 다양한 숙소 옵션으로, 장기 여행이나 가족 여행에
                적합해요.
              </p>
              <dl className="mb-3 space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <dt className="text-gray-500">예상 기온</dt>
                  <dd>26℃ ~ 32℃</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">강수 확률</dt>
                  <dd>40% 내외</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">예산 체감</dt>
                  <dd>실속형 ~ 스탠다드</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-1">
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #휴양
                </span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #야시장
                </span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #스파
                </span>
              </div>
            </article>

            {/* 카드 3 */}
            <article className="flex h-full flex-col rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.14)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    파리
                  </h3>
                  <p className="text-[11px] text-gray-500">프랑스 · 예술 & 문화</p>
                </div>
                <span className="rounded-full bg-pink-50 px-2 py-1 text-[11px] font-semibold text-pink-500">
                  로망 가득
                </span>
              </div>
              <p className="mb-3 text-[11px] text-gray-500">
                미술관·박물관 중심의 일정과 카페 투어에 잘 어울리는 도시예요.
              </p>
              <dl className="mb-3 space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <dt className="text-gray-500">예상 기온</dt>
                  <dd>14℃ ~ 22℃</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">강수 확률</dt>
                  <dd>35% 내외</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">예산 체감</dt>
                  <dd>스탠다드 ~ 프리미엄</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-1">
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #예술
                </span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #카페투어
                </span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                  #야경
                </span>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
