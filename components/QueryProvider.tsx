// QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
  // QueryClient를 useState로 관리하여 초기화 방지
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 탭 전환시 자동 재요청 방지 (데이터 유지 목적)
            refetchOnWindowFocus: false,
            // 데이터가 한 번 로드되면 30분 동안은 다시 요청하지 않음 (뒤로가기 시 유지됨)
            staleTime: 1000 * 60 * 30, 
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}