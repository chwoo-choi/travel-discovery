// app/page.tsx
"use client";

// ✅ [핵심 수정] 캘린더 스타일 CSS를 불러옵니다. (이게 없어서 깨져 보였던 것입니다)
import "react-day-picker/dist/style.css";

import { TopNavAuth } from "@/components/TopNavAuth"; 
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { format, differenceInCalendarDays, isAfter } from "date-fns";
import { ko } from "date-fns/locale";

const PEOPLE_OPTIONS = ["1명", "2명", "3명", "4명 이상"];
const BUDGET_LEVEL_OPTIONS = ["실속형", "스탠다드", "프리미엄"];

export default function HomePage() {
  const router = useRouter();

  // 🔹 입력 값 상태
  const [destination, setDestination] = useState("");

  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();

  const [isDepartureOpen, setIsDepartureOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const [people, setPeople] = useState("2명");
  const [budgetLevel, setBudgetLevel] = useState("스탠다드");

  const [dateError, setDateError] = useState<string | null>(null);

  // 🔹 여행 기간 계산
  let tripNights: number | null = null;
  let tripDays: number | null = null;

  if (departureDate && returnDate && !isAfter(departureDate, returnDate)) {
    const diff = differenceInCalendarDays(returnDate, departureDate);
    if (diff >= 0) {
      tripNights = diff;
      tripDays = diff + 1;
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDateError(null);

    if (!departureDate || !returnDate) {
      setDateError("출발일과 귀국일을 모두 선택해 주세요.");
      return;
    }

    if (isAfter(departureDate, returnDate)) {
      setDateError("귀국일은 출발일 이후여야 합니다.");
      return;
    }

    const params = new URLSearchParams();

    if (destination.trim()) {
      params.set("destination", destination.trim());
    }

    params.set("departureDate", format(departureDate, "yyyy-MM-dd"));
    params.set("returnDate", format(returnDate, "yyyy-MM-dd"));

    if (tripNights !== null && tripNights >= 0) {
      params.set("tripNights", String(tripNights));
    }

    params.set("people", people);
    params.set("budgetLevel", budgetLevel);

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      
      <TopNavAuth />

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
            className="relative w-full max-w-4xl rounded-3xl bg-white/90 p-4 shadow-[0_24px_60px_rgba(123,104,238,0.18)] md:p-6"
          >
            {/* 여행지/키워드 입력 (선택) */}
            <div className="mb-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 md:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[11px]">
                  🌐
                </span>
                <span>여행지 또는 키워드 (선택)</span>
              </div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="도시명 또는 관심사를 입력하세요 (예: 파리, 온천, 야시장, 유럽 감성)"
                className="w-full rounded-2xl border border-transparent bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-gray-100 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
              />
              <p className="text-[11px] text-gray-400 md:text-xs">
                입력하지 않으면 날짜·인원·예산에 맞는 여행지를 자동으로
                추천해 드립니다.
              </p>
            </div>

            {/* 날짜 관련 에러 메시지 */}
            {dateError && (
              <p className="mb-2 text-left text-[11px] text-red-500 md:text-xs">
                {dateError}
              </p>
            )}

            {/* 날짜 / 인원 / 예산 등급 */}
            <div className="mb-2 grid gap-3 text-left md:grid-cols-4">
              {/* 출발일 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <span>📅</span>
                  <span>출발일 (필수)</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    onClick={() => {
                      setIsDepartureOpen((v) => !v);
                      setIsReturnOpen(false);
                    }}
                    value={
                      departureDate
                        ? format(departureDate, "yyyy-MM-dd")
                        : ""
                    }
                    placeholder="년-월-일"
                    className="w-full cursor-pointer rounded-2xl border border-transparent bg-gray-50 px-3 py-2.5 text-xs md:text-sm text-gray-900 outline-none ring-1 ring-gray-100 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
                  />

                  {isDepartureOpen && (
                    <div className="absolute left-0 z-20 mt-2 w-auto rounded-2xl border border-gray-100 bg-white p-3 shadow-lg">
                      <DayPicker
                        mode="single"
                        locale={ko}
                        selected={departureDate}
                        onSelect={(date) => {
                          setDepartureDate(date ?? undefined);
                          setIsDepartureOpen(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 귀국일 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <span>📅</span>
                  <span>귀국일 (필수)</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    onClick={() => {
                      setIsReturnOpen((v) => !v);
                      setIsDepartureOpen(false);
                    }}
                    value={
                      returnDate ? format(returnDate, "yyyy-MM-dd") : ""
                    }
                    placeholder="년-월-일"
                    className="w-full cursor-pointer rounded-2xl border border-transparent bg-gray-50 px-3 py-2.5 text-xs md:text-sm text-gray-900 outline-none ring-1 ring-gray-100 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#7b6bff]"
                  />

                  {isReturnOpen && (
                    <div className="absolute left-0 z-20 mt-2 w-auto rounded-2xl border border-gray-100 bg-white p-3 shadow-lg">
                      <DayPicker
                        mode="single"
                        locale={ko}
                        selected={returnDate}
                        onSelect={(date) => {
                          setReturnDate(date ?? undefined);
                          setIsReturnOpen(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 인원 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  인원 (필수)
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
                  예산 등급 (필수)
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

            {/* 여행 기간 표시 */}
            <div className="mb-4 text-left">
              {tripNights !== null && tripDays !== null ? (
                <p className="text-[11px] text-gray-600 md:text-xs">
                  여행 기간:{" "}
                  <span className="font-medium text-gray-900">
                    {tripNights}박 {tripDays}일
                  </span>{" "}
                  ·{" "}
                  {departureDate && format(departureDate, "M월 d일")} ~{" "}
                  {returnDate && format(returnDate, "M월 d일")}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 md:text-xs">
                  출발일과 귀국일을 선택하면 자동으로 여행 기간을 계산해
                  드립니다.
                </p>
              )}
            </div>

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
    </div>
  );
}