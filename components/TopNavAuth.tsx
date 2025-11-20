// components/TopNavAuth.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MeResponse = {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  message?: string;
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function TopNavAuth() {
  const pathname = usePathname();
  const router = useRouter();

  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // -----------------------
  //  /api/auth/me 로 로그인 상태 확인
  // -----------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (!cancelled) {
            setStatus("unauthenticated");
            setUser(null);
          }
          return;
        }

        const data = (await res.json()) as MeResponse;

        if (!cancelled) {
          if (data.authenticated && data.user) {
            setStatus("authenticated");
            setUser(data.user);
          } else {
            setStatus("unauthenticated");
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) {
          setStatus("unauthenticated");
          setUser(null);
        }
      }
    }

    fetchMe();

    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------
  //  로그아웃 처리
  // -----------------------
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // 성공/실패에 상관없이 프론트에서는 상태 초기화
      setStatus("unauthenticated");
      setUser(null);
      router.push("/");
      router.refresh();
    } catch {
      setStatus("unauthenticated");
      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // -----------------------
  //  네비게이션 활성 상태 체크
  // -----------------------
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const baseNavItemClasses =
    "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium md:text-sm";
  const inactiveNavItemClasses =
    baseNavItemClasses + " text-gray-500 hover:bg-white/70";
  const activeNavItemClasses =
    baseNavItemClasses +
    " bg-white/80 text-gray-900 shadow-sm shadow-white/40";

  // -----------------------
  //  사용자 이름/이니셜 표시
  // -----------------------
  const displayName =
    user?.name && user.name.trim().length > 0
      ? user.name.trim()
      : user?.email?.split("@")[0] ?? "사용자";

  const nameInitial = displayName.charAt(0);

  // -----------------------
  //  렌더링
  // -----------------------
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
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/"
            className={isActive("/")
              ? activeNavItemClasses
              : inactiveNavItemClasses}
          >
            <span>🏠</span>
            <span>홈</span>
          </Link>
          <Link
            href="/bookmark"
            className={isActive("/bookmark")
              ? activeNavItemClasses
              : inactiveNavItemClasses}
          >
            <span>🔖</span>
            <span>북마크</span>
          </Link>
          <Link
            href="/settings"
            className={isActive("/settings")
              ? activeNavItemClasses
              : inactiveNavItemClasses}
          >
            <span>⚙️</span>
            <span>설정</span>
          </Link>
        </div>

        {/* 우측 영역: 로그인 전/후 상태에 따라 다르게 렌더링 */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
          {status === "loading" && (
            // 로딩 중일 때는 살짝 흐린 상태로 기본 버튼 UI를 보여줌
            <>
              <div className="h-8 w-16 rounded-full bg-white/60 md:h-9" />
              <div className="h-8 w-20 rounded-full bg-gradient-to-r from-[#e0ddff] to-[#f0ddff] md:h-9" />
            </>
          )}

          {status === "unauthenticated" && (
            <>
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
            </>
          )}

          {status === "authenticated" && user && (
            <>
              <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm shadow-white/40">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6f6bff] to-[#ba7bff] text-xs font-semibold text-white md:h-8 md:w-8">
                  {nameInitial}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-800 md:text-sm">
                    {displayName}님
                  </span>
                  <span className="hidden text-[10px] text-gray-400 md:block">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full px-3 py-1.5 font-medium text-gray-700 hover:bg-white disabled:opacity-60"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
