"use client";
import { TopNavAuth } from "@/components/TopNavAuth"; // ✅ 새로 만든 네비게이션 불러오기
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 🗑️ [삭제됨] 기존 function TopNav() {...} 코드는 이제 필요 없어서 지웠습니다.

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let message = "이메일 또는 비밀번호가 올바르지 않습니다.";
        try {
          const data = (await res.json()) as { message?: string };
          if (data.message) {
            message = data.message;
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        setErrorMessage(message);
        return;
      }

      // ✅ 로그인 성공 시 홈 화면으로 이동
      router.push("/");
    } catch {
      setErrorMessage("로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 구글 로그인 버튼 클릭 시 OAuth 엔드포인트로 이동
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-screen flex-col">
      
      {/* 👇👇👇 [수정된 부분] 기존 <TopNav /> 대신 이걸로 교체! 👇👇👇 */}
      <TopNavAuth />
      {/* 👆👆👆 이제 로그인 상태에 따라 메뉴가 자동으로 바뀝니다 */}

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl shadow-indigo-100">
          {/* 상단 아이콘 & 타이틀 */}
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] text-2xl text-white shadow-md">
              ➜
            </div>
            <h1 className="mb-1 text-center text-2xl font-semibold text-gray-900">
              다시 오신 것을 환영합니다
            </h1>
            <p className="text-center text-sm text-gray-500">
              계정에 로그인하세요
            </p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 shadow-inner shadow-gray-100 outline-none transition focus:border-[#6f6bff] focus:bg-white focus:ring-2 focus:ring-[#6f6bff33]"
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-800"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 shadow-inner shadow-gray-100 outline-none transition focus:border-[#6f6bff] focus:bg-white focus:ring-2 focus:ring-[#6f6bff33]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                >
                  <span className="text-lg" aria-hidden="true">
                    {showPassword ? "🙈" : "👁️"}
                  </span>
                </button>
              </div>
              <div className="mt-1 flex justify-end">
                <Link
                  href="/reset-password"
                  className="text-xs font-medium text-[#6f6bff] hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-600">
                {errorMessage}
              </div>
            )}

            {/* 구분선 + 소셜 로그인 */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">
                  또는 소셜 계정으로 계속하기
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="flex justify-center gap-3">
                {/* 네이버 */}
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#03c75a] text-lg font-bold text-white shadow-md shadow-[#03c75a33] transition hover:translate-y-[1px] hover:shadow-sm"
                  aria-label="네이버로 계속하기"
                >
                  N
                </button>

                {/* 구글 (연동) */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-lg font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  aria-label="Google로 계속하기"
                >
                  G
                </button>

                {/* 카카오 */}
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fee500] text-xl text-gray-900 shadow-md shadow-[#facc1533] transition hover:translate-y-[1px] hover:shadow-sm"
                  aria-label="카카오로 계속하기"
                >
                  💬
                </button>
              </div>
            </div>

            {/* 기본 로그인 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6f8bff] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#6f8bff55] transition hover:bg-[#607bff] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>로그인 중…</span>
                  </>
                ) : (
                  <>
                    <span>로그인</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 하단 링크들 */}
          <div className="mt-6 space-y-4 text-center text-xs text-gray-500">
            <p>
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#6f6bff] hover:underline"
              >
                회원가입
              </Link>
            </p>

            <div className="h-px bg-gray-100" />

            <p className="leading-relaxed">
              로그인하면{" "}
              <button
                type="button"
                className="font-medium text-[#6f6bff] underline-offset-2 hover:underline"
              >
                이용약관
              </button>{" "}
              및{" "}
              <button
                type="button"
                className="font-medium text-[#6f6bff] underline-offset-2 hover:underline"
              >
                개인정보처리방침
              </button>
              에 동의한 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}