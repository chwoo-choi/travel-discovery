// app/reset-password/[token]/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// 이 파일 안에서만 쓰는 TopNav (기존 톤과 최대한 동일하게 유지)
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

// 회원가입/서버와 동일한 비밀번호 규칙 (8자 이상 + 영문 + 숫자 + 특수문자)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

// API 응답 타입 (message만 사용)
type ResetPasswordConfirmResponse = {
  message?: string;
};

export default function ResetPasswordTokenPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const tokenParam = params?.token;
  const token = typeof tokenParam === "string" ? tokenParam : "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenMissing = !token;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (tokenMissing) {
      setMessage(
        "유효하지 않은 비밀번호 재설정 링크입니다. 다시 요청해주세요."
      );
      setMessageType("error");
      return;
    }

    if (!password || !passwordConfirm) {
      setMessage("새 비밀번호와 비밀번호 확인을 모두 입력해주세요.");
      setMessageType("error");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      setMessageType("error");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setMessage(
        "비밀번호 규칙을 다시 확인해주세요. (8자 이상, 영문, 숫자, 특수문자 포함)"
      );
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      let data: ResetPasswordConfirmResponse | null = null;
      try {
        data = (await res.json()) as ResetPasswordConfirmResponse;
      } catch {
        data = null;
      }

      if (res.ok) {
        setMessage(
          data && typeof data.message === "string"
            ? data.message
            : "비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요."
        );
        setMessageType("success");
        setPassword("");
        setPasswordConfirm("");

        // 잠깐 안내 문구를 보여준 뒤 로그인 페이지로 이동
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setMessage(
          data && typeof data.message === "string"
            ? data.message
            : "비밀번호 재설정 처리 중 오류가 발생했습니다. 다시 시도해주세요."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error("Reset password confirm error:", error);
      setMessage(
        "비밀번호 재설정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
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
              새 비밀번호 설정
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              새로운 비밀번호를 입력하고, 한 번 더 확인해주세요.
              <br className="hidden md:block" />
              보안을 위해 이전에 사용하지 않은 비밀번호를 추천드려요.
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 p-6 shadow-lg shadow-indigo-100/60 backdrop-blur-sm md:p-7">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {tokenMissing && (
                <div className="mb-2 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-600">
                  유효하지 않은 비밀번호 재설정 링크입니다. 다시 요청해주세요.
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  새 비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-transparent focus:ring-2 focus:ring-indigo-400/80"
                  placeholder="새 비밀번호를 입력해주세요"
                  disabled={tokenMissing || isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-400">
                  최소 8자, 영문/숫자/특수문자를 모두 포함해야 합니다.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium text-gray-700"
                >
                  새 비밀번호 확인
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white/80 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-transparent focus:ring-2 focus:ring-indigo-400/80"
                  placeholder="다시 한 번 입력해주세요"
                  disabled={tokenMissing || isSubmitting}
                />
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
                disabled={tokenMissing || isSubmitting}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6f6bff] to-[#ba7bff] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7a6bff33] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "변경 중..." : "비밀번호 변경하기"}
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
                href="/reset-password"
                className="font-medium text-gray-500 hover:text-gray-700"
              >
                링크를 다시 받고 싶으신가요?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
