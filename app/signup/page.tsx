"use client";

import { TopNavAuth } from "@/components/TopNavAuth"; // ✅ 1. 새 네비게이션 불러오기
import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 🗑️ [삭제됨] 기존 function TopNav() {...} 코드는 이제 필요 없어서 지웠습니다.

export default function SignupPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

    // 1) 비밀번호 확인 일치 검증
    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      setIsSubmitting(false);
      return;
    }

    // 2) 비밀번호 규칙 검증 (8자 이상, 영문 + 숫자 + 특수문자)
    const passwordPattern =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    if (!passwordPattern.test(password)) {
      setErrorMessage(
        "비밀번호는 8자 이상이며, 영문자·숫자·특수문자를 모두 포함해야 합니다."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        let message = "회원가입에 실패했습니다. 입력 정보를 확인해주세요.";
        try {
          const data = (await res.json()) as { message?: string };
          if (data.message) message = data.message;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        setErrorMessage(message);
        return;
      }

      // ✅ 회원가입 성공 시 바로 홈으로 이동
      router.push("/");
    } catch {
      setErrorMessage(
        "회원가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 이메일 인증 버튼 클릭 시 인증 메일 발송 API 호출
  const handleEmailVerification = async () => {
    if (emailSending) return;

    setEmailMessage(null);
    setEmailError(false);

    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setEmailError(true);
      setEmailMessage("이메일을 먼저 입력해주세요.");
      return;
    }

    try {
      setEmailSending(true);
      const res = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        let message = "인증 메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
        try {
          const data = (await res.json()) as { message?: string };
          if (data.message) message = data.message;
        } catch {
          //
        }
        setEmailError(true);
        setEmailMessage(message);
        return;
      }

      setEmailError(false);
      setEmailMessage("인증 메일을 전송했습니다. 메일함을 확인해주세요.");
    } catch {
      setEmailError(true);
      setEmailMessage(
        "인증 메일 전송 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요."
      );
    } finally {
      setEmailSending(false);
    }
  };

  // 🔹 구글로 가입(로그인) – OAuth 엔드포인트로 이동
  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-screen flex-col">
      
      {/* 👇👇👇 [수정된 부분] 기존 <TopNav />를 이것으로 교체! 👇👇👇 */}
      <TopNavAuth />
      {/* 👆👆👆 이제 로그인 상태가 연동됩니다 */}

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl shadow-indigo-100">
          {/* 상단 아이콘 & 타이틀 */}
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] text-2xl text-white shadow-md">
              <span className="mr-0.5">👤</span>
              <span className="-ml-1 text-base">+</span>
            </div>
            <h1 className="mb-1 text-center text-2xl font-semibold text-gray-900">
              계정 만들기
            </h1>
            <p className="text-center text-sm text-gray-500">
              오늘부터 완벽한 여행을 계획하세요
            </p>
          </div>

          {/* 회원가입 폼 */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* 이름 */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-800"
              >
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="홍길동"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 shadow-inner shadow-gray-100 outline-none transition focus:border-[#6f6bff] focus:bg-white focus:ring-2 focus:ring-[#6f6bff33]"
              />
            </div>

            {/* 이메일 + 이메일 인증 버튼 */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800"
              >
                이메일
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 shadow-inner shadow-gray-100 outline-none transition focus:border-[#6f6bff] focus:bg-white focus:ring-2 focus:ring-[#6f6bff33]"
                />
                <button
                  type="button"
                  onClick={handleEmailVerification}
                  disabled={emailSending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#6f8bff] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#6f8bff55] transition hover:bg-[#607bff] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {emailSending ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>전송 중…</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base" aria-hidden="true">
                        ✉️
                      </span>
                      <span>이메일 인증</span>
                    </>
                  )}
                </button>
              </div>
              {emailMessage && (
                <p
                  className={`mt-1 text-xs ${
                    emailError ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {emailMessage}
                </p>
              )}
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
                  autoComplete="new-password"
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
              <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
                <span className="mt-0.5 text-lg text-amber-400" aria-hidden>
                  💡
                </span>
                <p>
                  비밀번호는 8자 이상, 숫자, 영문자, 특수문자(@, # 등)을
                  포함해야 합니다.
                </p>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-1.5">
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-gray-800"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 shadow-inner shadow-gray-100 outline-none transition focus:border-[#6f6bff] focus:bg-white focus:ring-2 focus:ring-[#6f6bff33]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordConfirm((prev) => !prev)
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPasswordConfirm
                      ? "비밀번호 숨기기"
                      : "비밀번호 보기"
                  }
                >
                  <span className="text-lg" aria-hidden="true">
                    {showPasswordConfirm ? "🙈" : "👁️"}
                  </span>
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-600">
                {errorMessage}
              </div>
            )}

            {/* 약관 동의 */}
            <div className="flex items-start gap-2 pt-1 text-xs text-gray-600">
              <input
                id="agreeAll"
                name="agreeAll"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#6f6bff] focus:ring-[#6f6bff]"
              />
              <label
                htmlFor="agreeAll"
                className="cursor-pointer leading-relaxed"
              >
                모든{" "}
                <button
                  type="button"
                  className="font-medium text-[#6f6bff] underline-offset-2 hover:underline"
                >
                  이용약관
                </button>
                과{" "}
                <button
                  type="button"
                  className="font-medium text-[#6f6bff] underline-offset-2 hover:underline"
                >
                  개인정보 처리방침
                </button>
                에 동의합니다.
              </label>
            </div>

            {/* 계정 만들기 버튼 */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6f8bff] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#6f8bff55] transition hover:bg-[#607bff] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>계정 생성 중…</span>
                  </>
                ) : (
                  <>
                    <span>계정 만들기</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 하단 링크 & 소셜 회원가입 */}
          <div className="mt-6 space-y-4 text-center text-xs text-gray-500">
            <p>
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#6f6bff] hover:underline"
              >
                로그인
              </Link>
            </p>

            {/* 소셜 회원가입 섹션 */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[11px] text-gray-400">
                  또는 소셜 계정으로 가입하기
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="flex justify-center gap-3">
                {/* 네이버 */}
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#03c75a] text-lg font-bold text-white shadow-md shadow-[#03c75a33] transition hover:translate-y-[1px] hover:shadow-sm"
                  aria-label="네이버로 가입하기"
                >
                  N
                </button>

                {/* 구글 (실제 연동) */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-lg font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  aria-label="Google로 가입하기"
                >
                  G
                </button>

                {/* 카카오 */}
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fee500] text-xl text-gray-900 shadow-md shadow-[#facc1533] transition hover:translate-y-[1px] hover:shadow-sm"
                  aria-label="카카오로 가입하기"
                >
                  💬
                </button>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <p className="leading-relaxed">
              계정을 생성하면{" "}
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
              에 동의한 것으로 간주됩니다. 귀하의 정보를 허가 없이
              공유하지 않습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

