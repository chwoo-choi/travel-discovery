"use client";

import { useEffect } from "react";
import Link from "next/link"; // ✅ Link 컴포넌트 임포트

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 🚨 에러 내용을 콘솔에 출력 (F12를 눌러 확인 가능)
    console.error("Results Page Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white text-center px-4">
      <div className="rounded-3xl bg-red-50 p-8 shadow-lg">
        <span className="text-4xl">😵</span>
        <h2 className="mt-4 text-xl font-bold text-gray-900">오류가 발생했습니다</h2>
        <p className="mt-2 text-sm text-gray-600">
          죄송합니다. 페이지를 불러오는 도중 문제가 생겼습니다.<br/>
          잠시 후 다시 시도해 주세요.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {/* 🚨 [수정됨] <a> 태그를 <Link> 컴포넌트로 교체 */}
          <Link 
            href="/" 
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50"
          >
            홈으로 가기
          </Link>
          
          <button
            onClick={() => reset()}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
        <p className="mt-6 text-[10px] text-gray-400 font-mono max-w-md break-words">
          Error: {error.message || "Unknown Error"}
        </p>
      </div>
    </div>
  );
}