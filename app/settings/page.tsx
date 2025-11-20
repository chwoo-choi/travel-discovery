"use client";

import Link from "next/link";
import { TopNavAuth } from "@/components/TopNavAuth";
import { useEffect, useState } from "react"; // ✅ 1. 상태 관리 훅 추가

export default function SettingsPage() {
  // ✅ 2. 로그인 상태를 저장할 변수 (기본값: 로그인 안 됨)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // ✅ 3. 페이지가 켜지자마자 로그인 여부 확인 (API 호출)
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          // 인증되었다면 상태 업데이트 -> 화면이 바뀜
          if (data.authenticated) {
            setIsLoggedIn(true);
            setUserEmail(data.user?.email || "사용자");
          }
        }
      } catch (error) {
        console.error("인증 확인 실패", error);
      }
    }
    checkAuth();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      
      {/* 상단 네비게이션 */}
      <TopNavAuth />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-8 md:pt-10">
        {/* 헤더 */}
        <header className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-500">
            설정
          </p>
          <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
            나에게 맞는 기본 여행 설정을 관리하세요.
          </h1>
          <p className="mt-2 text-xs text-gray-500 md:text-sm">
            여기에서 기본 여행 스타일과 표시 단위를 설정해 두면, 이후 검색과
            추천 결과에 순차적으로 반영될 예정입니다. 현재는 UI 설정 화면이며,
            실제 저장/연동 기능은 추후 백엔드 및 DB와 연결됩니다.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {/* 기본 여행 설정 카드 */}
          <section className="md:col-span-2 rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.12)] md:p-5">
            <h2 className="text-sm font-semibold text-gray-900 md:text-base">
              기본 여행 설정
            </h2>
            <p className="mt-1 text-[11px] text-gray-500 md:text-xs">
              자주 사용하는 여행 스타일을 미리 설정해 두면, 홈 화면의 기본값과
              추천 결과에 점차 반영됩니다.
            </p>

            <div className="mt-4 space-y-4 text-xs md:text-sm">
              {/* 기본 여행 스타일 */}
              <div>
                <p className="mb-1 text-[12px] font-medium text-gray-700">
                  선호 여행 스타일
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:border-[#c0b5ff]"
                  >
                    휴양 중심
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:border-[#c0b5ff]"
                  >
                    관광/도시 위주
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:border-[#c0b5ff]"
                  >
                    액티비티/체험
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:border-[#c0b5ff]"
                  >
                    문화/전시
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  현재는 예시 버튼만 제공되며, 클릭해도 실제 저장되지는
                  않습니다.
                </p>
              </div>

              {/* 기본 인원 / 예산 등급 */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-[12px] font-medium text-gray-700">
                    기본 인원
                  </p>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-8 text-[12px] text-gray-900 outline-none focus:border-[#7b6bff] focus:ring-1 focus:ring-[#7b6bff]">
                      <option>1명</option>
                      <option>2명 (기본값)</option>
                      <option>3명</option>
                      <option>4명 이상</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-gray-400">
                      ▼
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[12px] font-medium text-gray-700">
                    기본 예산 등급
                  </p>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-8 text-[12px] text-gray-900 outline-none focus:border-[#7b6bff] focus:ring-1 focus:ring-[#7b6bff]">
                      <option>실속형</option>
                      <option>스탠다드 (기본값)</option>
                      <option>프리미엄</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-gray-400">
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* 직항 선호 / 날씨 선호 */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-[12px] font-medium text-gray-700">
                      직항 우선 추천
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      기본적으로 직항이 있는 목적지를 먼저 보여줄지 설정합니다.
                    </p>
                  </div>
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                    <span className="inline-block h-5 w-5 translate-x-1 rounded-full bg-white shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-[12px] font-medium text-gray-700">
                      선호 온도대
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      따뜻한 여행 / 선선한 여행 중 어떤 쪽을 선호하는지
                      설정합니다.
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm">
                    18℃ ~ 26℃
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 표시 및 단위 / 계정 안내 카드 */}
          <section className="space-y-4">
            {/* 표시 및 단위 */}
            <div className="rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.1)] md:p-5">
              <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                표시 및 단위
              </h2>
              <p className="mt-1 text-[11px] text-gray-500 md:text-xs">
                온도·통화 단위는 향후 업데이트에서 실제 추천 결과에 반영될
                예정입니다.
              </p>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <p className="mb-1 text-[12px] font-medium text-gray-700">
                    온도 단위
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="flex-1 rounded-2xl border border-transparent bg-gray-900 px-3 py-2 text-[11px] font-medium text-white"
                    >
                      ℃ (섭씨)
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-700 hover:border-[#c0b5ff]"
                    >
                      ℉ (화씨)
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[12px] font-medium text-gray-700">
                    통화 단위
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="flex-1 rounded-2xl border border-transparent bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] px-3 py-2 text-[11px] font-medium text-white"
                    >
                      KRW (₩)
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-700 hover:border-[#c0b5ff]"
                    >
                      USD ($)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 계정 및 데이터 (핵심 수정 부분!) */}
            <div className="rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.1)] md:p-5">
              <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                계정 및 데이터
              </h2>
              <p className="mt-1 text-[11px] text-gray-500 md:text-xs">
                로그인 후에는 북마크, 기본 설정, 최근 검색 내역 등이 계정에
                안전하게 저장될 예정입니다.
              </p>

              {/* ✅ 4. 로그인 여부(isLoggedIn)에 따라 내용 다르게 보여주기 */}
              {isLoggedIn ? (
                // [CASE 1] 로그인 되었을 때 -> 저장 버튼 & 이메일 표시
                <div className="mt-4">
                  <div className="mb-3 rounded-xl bg-indigo-50 p-3">
                    <p className="text-[11px] font-medium text-indigo-900">
                      현재 로그인 중:
                    </p>
                    <p className="text-xs text-indigo-700">{userEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("설정 값이 저장되었습니다! (데모)")}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] px-3 py-2 text-[11px] font-bold text-white shadow-md hover:opacity-90"
                  >
                    설정 저장하기
                  </button>
                </div>
              ) : (
                // [CASE 2] 로그인 안 되었을 때 -> 로그인 버튼 표시 (기존 화면)
                <>
                  <div className="mt-3 space-y-2 text-[11px] text-gray-500">
                    <p>
                      · 현재 버전에서는 설정 값이 실제로 저장되지는 않습니다.
                    </p>
                    <p>
                      · 추후 MySQL·API 연동이 완료되면, 여기에서 저장/초기화
                      기능이 활성화됩니다.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gray-900 px-3 py-2 text-[11px] font-medium text-white hover:bg-gray-800"
                  >
                    로그인하러 가기
                  </Link>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}