"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

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

// API 응답 타입 (message만 신경 쓰면 되므로 최소한으로 정의)
type ResetPasswordRequestResponse = {
  message?: string;
};

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("이메일을 입력해주세요.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      let data: ResetPasswordRequestResponse | null = null;
      try {
        data = (await res.json()) as ResetPasswordRequestResponse;
      } catch {
        data = null;
      }

      if (res.ok) {
        setMessage(
          data && typeof data.message === "string"
            ? data.message
            : "비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해주세요."
        );
        setMessageType("success");
      } else {
        setMessage(
          data && typeof data.message === "string"
            ? data.message
            : "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error("Reset password request error:", error);
      setMessage(
        "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />

      <main className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              비밀번호 재설정
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              가입하신 이메일 주소를 입력하시면,
              <br className="hidden md:block" />
              비밀번호를 재설정할 수 있는 링크를 보내드릴게요.
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 p-6 shadow-lg shadow-indigo-100/60 backdrop-blur-sm md:p-7">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  이메일 주소
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-transparent focus:ring-2 focus:ring-indigo-400/80"
                  placeholder="example@email.com"
                />
                <p className="mt-1 text-xs text-gray-400">
                  스팸함/프로모션함으로 메일이 전송될 수 있어요.
                </p>
              </div>

              {message && (
                <div
                  className={`rounded-2xl px-3 py-2 text-xs ${
                    messageType === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7a6bff33] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "전송 중..." : "비밀번호 재설정 메일 보내기"}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <Link
                href="/login"
                className="font-medium text-indigo-500 hover:text-indigo-600"
              >
                로그인 페이지로 돌아가기
              </Link>
              <Link
                href="/signup"
                className="font-medium text-gray-500 hover:text-gray-700"
              >
                아직 계정이 없으신가요?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

