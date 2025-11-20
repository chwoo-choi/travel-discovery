"use client";

import { TopNavAuth } from "@/components/TopNavAuth";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  // 🔹 UI 상태 변수들
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🔹 이메일 인증 관련 상태
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");      
  const [isEmailSent, setIsEmailSent] = useState(false); 
  const [isVerified, setIsVerified] = useState(false);   
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);

  // 1. 인증번호 발송 핸들러
  const handleSendCode = async () => {
    if (!email.trim()) {
      setEmailError(true);
      setEmailMessage("이메일을 입력해주세요.");
      return;
    }
    
    try {
      setEmailSending(true);
      setEmailMessage("전송 중...");
      
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("전송 실패");

      setIsEmailSent(true);
      setEmailError(false);
      setEmailMessage("인증번호가 발송되었습니다. 아래에 입력해주세요.");
    } catch (err) {
      // ⚠️ [수정됨] err: any 제거
      setEmailError(true);
      setEmailMessage("메일 전송에 실패했습니다. 주소를 확인해주세요.");
    } finally {
      setEmailSending(false);
    }
  };

  // 2. 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
    if (!verifyCode.trim()) return;

    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verifyCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "인증 실패");
      }

      setIsVerified(true);   
      setIsEmailSent(false); 
      setEmailError(false);
      setEmailMessage("이메일 인증이 완료되었습니다. ✅");
    } catch (err) {
      // ⚠️ [수정됨] err: any 제거 및 타입 가드 사용
      setEmailError(true);
      if (err instanceof Error) {
        setEmailMessage(err.message);
      } else {
        setEmailMessage("인증 확인 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  // 3. 회원가입 제출 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isVerified) {
      setErrorMessage("이메일 인증을 먼저 완료해주세요.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "");
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      setIsSubmitting(false);
      return;
    }

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    if (!passwordPattern.test(password)) {
      setErrorMessage("비밀번호는 8자 이상이며, 영문자·숫자·특수문자를 모두 포함해야 합니다.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "가입 실패");
      }

      // 가입 성공 시 로그인 페이지로 이동
      router.push("/login");
    } catch (err) {
      // ⚠️ [수정됨] err: any 제거 및 타입 가드 사용
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("회원가입 처리 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <TopNavAuth />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl shadow-indigo-100">
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

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-800">
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="홍길동"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 shadow-inner outline-none focus:border-[#6f6bff] focus:ring-2 focus:ring-[#6f6bff33]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                이메일
              </label>
              <div className="flex gap-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerified || isEmailSent}
                  placeholder="you@example.com"
                  className="w-full flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 shadow-inner outline-none disabled:bg-gray-100 transition focus:border-[#6f6bff] focus:ring-2 focus:ring-[#6f6bff33]"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isVerified || isEmailSent || emailSending}
                  className="whitespace-nowrap rounded-xl bg-[#6f8bff] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#607bff] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isVerified ? "인증 완료" : emailSending ? "전송 중" : isEmailSent ? "전송됨" : "인증번호 전송"}
                </button>
              </div>

              {isEmailSent && !isVerified && (
                <div className="flex gap-2 mt-2 animate-fade-in">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="인증번호 6자리"
                    className="w-full flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-center tracking-widest shadow-inner outline-none focus:border-[#6f6bff] focus:ring-2 focus:ring-[#6f6bff33]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="whitespace-nowrap rounded-xl bg-gray-800 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-black"
                  >
                    확인
                  </button>
                </div>
              )}

              {emailMessage && (
                <p className={`mt-1 text-xs ${emailError ? "text-red-500" : "text-emerald-600"}`}>
                  {emailMessage}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="비밀번호 입력"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm shadow-inner outline-none focus:border-[#6f6bff] focus:ring-2 focus:ring-[#6f6bff33]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <span className="text-lg">{showPassword ? "🙈" : "👁️"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-800">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  required
                  placeholder="비밀번호 재입력"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm shadow-inner outline-none focus:border-[#6f6bff] focus:ring-2 focus:ring-[#6f6bff33]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <span className="text-lg">{showPasswordConfirm ? "🙈" : "👁️"}</span>
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-600 text-center">
                {errorMessage}
              </div>
            )}

             <div className="flex items-start gap-2 pt-1 text-xs text-gray-600">
              <input
                id="agreeAll"
                name="agreeAll"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#6f6bff] focus:ring-[#6f6bff]"
              />
              <label htmlFor="agreeAll" className="cursor-pointer leading-relaxed">
                이용약관 및 개인정보 처리방침에 동의합니다.
              </label>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !isVerified}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6f8bff] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#6f8bff55] transition hover:bg-[#607bff] hover:shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>처리 중...</span>
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

          <div className="mt-6 space-y-4 text-center text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] text-gray-400">또는 소셜 계정으로 가입</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="flex justify-center gap-3">
               <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-lg font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  aria-label="Google로 가입하기"
                >
                  G
                </button>
            </div>
             <div className="h-px bg-gray-100" />
             <p className="leading-relaxed">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-semibold text-[#6f6bff] hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
