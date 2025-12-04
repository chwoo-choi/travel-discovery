// app/bookmark/page.tsx
"use client";

// 🚨 [필수] 빌드 에러 방지: 동적 페이지 강제 설정
export const dynamic = "force-dynamic";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNavAuth } from '@/components/TopNavAuth';
// ✅ [추가] React Query 관련 훅 불러오기
import { useQuery, useQueryClient } from "@tanstack/react-query";

// DB 데이터 타입 정의
interface BookmarkItem {
  id: string;
  cityName: string;
  country: string;
  description: string;
  price: string;
  tags: string[];
  emoji: string;
  createdAt: string;
}

// ✅ 내부 컴포넌트 분리
function BookmarkContent() {
  const router = useRouter();
  const queryClient = useQueryClient(); // 캐시 수동 조작을 위해 사용

  // --------------------------------------------------------------------------
  // 1. 데이터 로드 (React Query 사용으로 캐시 문제 완벽 해결)
  // --------------------------------------------------------------------------
  const { data: bookmarks = [], isLoading: loading } = useQuery<BookmarkItem[]>({
    queryKey: ["myBookmarks"], // 이 키를 기준으로 데이터를 관리함
    queryFn: async () => {
      const res = await fetch("/api/bookmark", {
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 쿠키 전송
        cache: "no-store",      // 캐시 방지
      });

      // 401(비로그인) 처리
      if (res.status === 401) {
        // 로그인 페이지로 보내기 전에 알림이 필요하면 주석 해제
        // alert('로그인이 필요한 페이지입니다.');
        router.push("/login");
        return []; // 빈 배열 반환
      }

      if (!res.ok) throw new Error("데이터를 불러오는데 실패했습니다.");

      const responseData = await res.json();
      return (responseData.data as BookmarkItem[]) || [];
    },
    // 🚨 [핵심 설정] 항상 최신 데이터를 가져오도록 설정
    staleTime: 0, 
    gcTime: 0, 
    refetchOnMount: true, // 컴포넌트가 마운트될 때마다 다시 가져옴
    refetchOnWindowFocus: true, // 탭을 다녀오면 다시 가져옴
  });

  // --------------------------------------------------------------------------
  // 2. 삭제 핸들러 (React Query 캐시 즉시 업데이트)
  // --------------------------------------------------------------------------
  const handleRemove = async (cityName: string, id: string) => {
    if (!confirm(`'${cityName}'을(를) 목록에서 삭제하시겠습니까?`)) return;

    // 1) 낙관적 업데이트: 서버 응답 기다리지 않고 UI 먼저 갱신
    // "myBookmarks"라는 키를 가진 데이터를 찾아서, 삭제하려는 id를 뺀 목록으로 갈아끼움
    queryClient.setQueryData(["myBookmarks"], (oldData: BookmarkItem[] | undefined) => {
      if (!oldData) return [];
      return oldData.filter((item) => item.id !== id);
    });

    try {
      const res = await fetch("/api/bookmark", {
        method: "POST", // 토글 로직 활용 (이미 있으므로 삭제됨)
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cityName,
          country: "",
          description: "",
          price: "",
          tags: [],
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const result = await res.json();

      if (result.action !== "removed") {
        // 실패 시 데이터 다시 불러와서 롤백
        alert("삭제에 실패했습니다.");
        queryClient.invalidateQueries({ queryKey: ["myBookmarks"] });
      }
    } catch (error) {
      console.error("삭제 요청 실패:", error);
      alert("서버 오류로 삭제하지 못했습니다.");
      // 실패 시 데이터 원상복구
      queryClient.invalidateQueries({ queryKey: ["myBookmarks"] });
    }
  };

  // 로딩 스켈레톤 UI
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-8 md:pt-10">
      {/* 헤더 섹션 */}
      <header className="mb-8 md:mb-12">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
          My Wishlist
        </p>
        <h1 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
          나만의 <br className="md:hidden" />
          <span className="text-indigo-600">여행 컬렉션</span>
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          마음에 드는 여행지를 저장하고 비교해보세요.
        </p>
      </header>

      {/* 컨텐츠 섹션 */}
      {bookmarks.length === 0 ? (
        // Empty State
        <section className="flex flex-col items-center justify-center rounded-3xl bg-white px-6 py-20 text-center shadow-sm border border-gray-100">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-4xl shadow-inner">
            ✈️
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            아직 저장된 여행지가 없네요!
          </h2>
          <p className="mb-8 text-sm text-gray-500 max-w-md leading-relaxed">
            어디로 떠날지 고민이신가요? <br />
            AI에게 취향을 알려주고 딱 맞는 여행지를 추천받아보세요.
          </p>
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30"
          >
            <span className="mr-2">✨</span> 여행지 탐색하러 가기
          </Link>
        </section>
      ) : (
        // Bookmark List
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100 border border-gray-100"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl shadow-inner">
                      {item.emoji || '🌍'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-none mb-1">
                        {item.cityName}
                      </h3>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {item.country}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-gray-600 line-clamp-3">
                  {item.description}
                </p>

                <div className="mb-6 flex flex-wrap gap-2">
                  {Array.isArray(item.tags) && item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {item.price}
                </span>
                
                <div className="flex gap-2">
                  <Link
                    href={`/city/${item.id}?cityName=${encodeURIComponent(item.cityName)}&country=${encodeURIComponent(item.country)}&tripNights=3`}
                    className="rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-700"
                  >
                    상세 보기
                  </Link>
                  
                  <button
                    onClick={() => handleRemove(item.cityName, item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    title="북마크 삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ 메인 페이지 컴포넌트 (Suspense 적용)
export default function BookmarkPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <TopNavAuth />
      {/* 데이터 로딩 중 보여줄 Fallback UI */}
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
        </div>
      }>
        <BookmarkContent />
      </Suspense>
    </div>
  );
}