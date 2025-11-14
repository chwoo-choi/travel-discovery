// app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PEOPLE_OPTIONS = ["1명", "2명", "3명", "4명 이상"];
const BUDGET_LEVEL_OPTIONS = ["실속형", "스탠다드", "프리미엄"];

const THEME_OPTIONS = ["휴양", "관광", "액티비티", "문화"];
const ACCOMMODATION_OPTIONS = ["호텔", "리조트", "에어비앤비", "호스텔"];

export default function HomePage() {
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [people, setPeople] = useState("2명");
  const [budgetLevel, setBudgetLevel] = useState("스탠다드");

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [budget, setBudget] = useState(1000000); // ₩
  const [directFlightOnly, setDirectFlightOnly] = useState(false);
  const [minTemp, setMinTemp] = useState(15);
  const [maxTemp, setMaxTemp] = useState(28);
  const [maxRainChance, setMaxRainChance] = useState(50);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedAccommodations, setSelectedAccommodations] = useState<
    string[]
  >([]);

  const toggleTheme = (value: string) => {
    setSelectedThemes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleAccommodation = (value: string) => {
    setSelectedAccommodations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (destination) params.set("destination", destination);
    if (departureDate) params.set("departureDate", departureDate);
    if (returnDate) params.set("returnDate", returnDate);
    if (people) params.set("people", people);
    if (budgetLevel) params.set("budgetLevel", budgetLevel);

    // 고급 필터 값도 쿼리에 포함
    params.set("budget", String(budget));
    params.set("directFlightOnly", String(directFlightOnly));
    params.set("minTemp", String(minTemp));
    params.set("maxTemp", String(maxTemp));
    params.set("maxRainChance", String(maxRainChance));

    if (selectedThemes.length > 0) {
      params.set("themes", selectedThemes.join(","));
    }
    if (selectedAccommodations.length > 0) {
      params.set("accommodations", selectedAccommodations.join(","));
    }

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* 상단 네비게이션 */}
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
              className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-900 shadow-sm md:text-sm"
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

      {/* 메인 콘텐츠 */}
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-10 md:pt-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          {/* 히어로 텍스트 */}
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl font-extrabold leading-tight text-gray-900 md:text-4xl lg:text-5xl">
              여행의 시작, 맞춤형 플랜을 경험하세
              <br className="hidden md:block" />
              <span>요.</span>
            </h1>
            <p className="mt-4 text-xs text-gray-500 md:text-sm">
              항공·숙소·맛집·날씨·안전을 한 화면에서 비교하세요.
            </p>
          </div>

          {/* 검색 카드 */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl rounded-3xl bg-white/90 p-4 shadow-[0_24px_60px_rgba(123,104,238,0.18)] backdrop-blur md:p-6"
          >
            {/* 여행지 입력 */}
            <div className="mb-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 md:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[11px]">
                  🌐
                </span>
                <span>여행지</span>
              </div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="도시 또는 국가를 입력하세요 (예: 파리, 일본)"
                className="w-full rounded-2xl border border-transparent bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-gray-100 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
              />
            </div>

            {/* 날짜 / 인원 / 예산 등급 */}
            <div className="mb-4 grid gap-3 text-left md:grid-cols-4">
              {/* 출발일 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <span>📅</span>
                  <span>출발일</span>
                </label>
                <input
                  type="data"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  placeholder="년-월-일"
                  className="w-full rounded-2xl border border-transparent bg-gray-50 px-3 py-2.5 text-xs md:text-sm text-gray-900 outline-none ring-1 ring-gray-100 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
                />
              </div>

              {/* 귀국일 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <span>📅</span>
                  <span>귀국일</span>
                </label>
                <input
                  type="data"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  placeholder="년-월-일"
                  className="w-full rounded-2xl border border-transparent bg-gray-50 px-3 py-2.5 text-xs md:text-sm text-gray-900 outline-none ring-1 ring-gray-100 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
                />
              </div>

              {/* 인원 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  인원
                </label>
                <div className="relative">
                  <select
                    value={people}
                    onChange={(e) => setPeople(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-transparent bg-gray-50 px-3 py-2.5 pr-8 text-xs md:text-sm text-gray-900 outline-none ring-1 ring-gray-100 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
                  >
                    {PEOPLE_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                    ▼
                  </span>
                </div>
              </div>

              {/* 예산 등급 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  예산 등급
                </label>
                <div className="relative">
                  <select
                    value={budgetLevel}
                    onChange={(e) => setBudgetLevel(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-transparent bg-gray-50 px-3 py-2.5 pr-8 text-xs md:text-sm text-gray-900 outline-none ring-1 ring-gray-100 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
                  >
                    {BUDGET_LEVEL_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* 고급 필터 열기 */}
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(true)}
              className="mb-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span>🔍</span>
                <span>고급 필터 열기</span>
              </div>
              <span className="text-[11px] text-gray-400">옵션 설정</span>
            </button>

            {/* 검색 버튼 */}
            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(123,104,238,0.55)] hover:opacity-95"
            >
              ✨ 여행지 비교 및 플랜 시작
            </button>
          </form>
        </div>
      </main>

      {/* 채팅 플로팅 버튼 (UI만) */}
      <button
        type="button"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] text-xl text-white shadow-[0_18px_40px_rgba(123,104,238,0.6)]"
      >
        💬
      </button>

      {/* 고급 필터 모달 */}
      {isAdvancedOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl md:p-6">
            {/* 헤더 */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h2 className="text-base font-semibold text-gray-900">
                    고급 필터
                  </h2>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  원하는 여행 스타일 선택
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm text-gray-800">
              {/* 예산 */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-600">
                  <span>예산</span>
                  <span className="text-[#6f6bff]">
                    ₩{budget.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={200000}
                  max={3000000}
                  step={100000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-[#6f6bff]"
                />
              </div>

              {/* 직항만 */}
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">직항만</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    직항 항공편이 있는 목적지만 필터링
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectFlightOnly((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    directFlightOnly ? "bg-[#6f6bff]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      directFlightOnly ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* 온도 범위 */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-600">
                  <span>온도 범위</span>
                  <span>
                    {minTemp}℃ - {maxTemp}℃
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={-10}
                    max={40}
                    value={minTemp}
                    onChange={(e) =>
                      setMinTemp(
                        Math.min(Number(e.target.value), maxTemp - 1)
                      )
                    }
                    className="w-full accent-[#6f6bff]"
                  />
                  <input
                    type="range"
                    min={-10}
                    max={40}
                    value={maxTemp}
                    onChange={(e) =>
                      setMaxTemp(
                        Math.max(Number(e.target.value), minTemp + 1)
                      )
                    }
                    className="w-full accent-[#6f6bff]"
                  />
                </div>
              </div>

              {/* 최대 강수 확률 */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-600">
                  <span>최대 강수 확률</span>
                  <span>{maxRainChance}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={maxRainChance}
                  onChange={(e) => setMaxRainChance(Number(e.target.value))}
                  className="w-full accent-[#6f6bff]"
                />
              </div>

              {/* 여행 테마 */}
              <div>
                <p className="text-xs font-medium text-gray-700">여행 테마</p>
                <p className="mb-2 mt-0.5 text-[11px] text-gray-500">
                  원하는 여행 스타일 선택
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_OPTIONS.map((theme) => {
                    const active = selectedThemes.includes(theme);
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => toggleTheme(theme)}
                        className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                          active
                            ? "border-transparent bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-[#c0b5ff]"
                        }`}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 숙소 유형 */}
              <div>
                <p className="text-xs font-medium text-gray-700">숙소 유형</p>
                <p className="mb-2 mt-0.5 text-[11px] text-gray-500">
                  선호하는 숙소 타입 선택
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOMMODATION_OPTIONS.map((type) => {
                    const active = selectedAccommodations.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleAccommodation(type)}
                        className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                          active
                            ? "border-transparent bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-[#c0b5ff]"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="mt-6 flex justify-end gap-2 text-xs md:text-sm">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(false)}
                className="rounded-2xl border border-gray-200 px-4 py-2 font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(false)}
                className="rounded-2xl bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] px-4 py-2 font-semibold text-white shadow-sm hover:opacity-95"
              >
                고급 필터 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
