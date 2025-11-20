// components/TopNavAuth.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// 🔹 타입 정의 유지
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

  // 🔹 상태 변수 유지
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // -----------------------
  //  [수정됨] 로그인 상태 확인 (캐시 방지 코드 추가)
  // -----------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchMe() {
      try {
        // 🚨 핵심 수정: URL 뒤에 시간을 붙여서 매번 새로운 요청으로 인식하게 함
        const res = await fetch(`/api/auth/me?_t=${Date.now()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
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
  }, [pathname]); // 페이지 이동할 때마다 체크

  // -----------------------
  //  [수정됨] 로그아웃 처리 (강력 새로고침)
  // -----------------------
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      // 로그아웃 API 호출
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // 🚨 핵심 수정: 화면을 강제로 새로고침하여 캐시된 로그인 정보를 싹 날림
      window.location.href = "/"; 
    } catch (error) {
      console.error("로그아웃 실패", error);
      // 에러가 나더라도 일단 홈으로 튕겨냄
      window.location.href = "/";
    }
  };

  // -----------------------
  //  UI 및 스타일 (기존 코드 100% 유지)
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

  const displayName =
    user?.name && user.name.trim().length > 0
      ? user.name.trim()
      : user?.email?.split("@")[0] ?? "사용자";

  const nameInitial = displayName.charAt(0);

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
            className={isActive("/") ? activeNavItemClasses : inactiveNavItemClasses}
          >
            <span>🏠</span>
            <span>홈</span>
          </Link>
          <Link
            href="/bookmark"
            className={isActive("/bookmark") ? activeNavItemClasses : inactiveNavItemClasses}
          >
            <span>🔖</span>
            <span>북마크</span>
          </Link>
          <Link
            href="/settings"
            className={isActive("/settings") ? activeNavItemClasses : inactiveNavItemClasses}
          >
            <span>⚙️</span>
            <span>설정</span>
          </Link>
        </div>

        {/* 우측 영역 */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
          {status === "loading" && (
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