import type { Metadata } from "next";
import "react-day-picker/dist/style.css";
import "./globals.css";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import QueryProvider from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "여행의 발견 - 스마트 트래블 플래너",
  description:
    "항공, 숙소, 맛집, 날씨, 안전 정보를 한 번에 비교하는 맞춤형 여행 플랜 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className="
          min-h-screen
          bg-white
          text-gray-900
          antialiased
        "
      >
        {/* ✅ [구조 변경] 
          AuthSessionProvider 내부에 QueryProvider를 배치하여,
          로그인 정보와 데이터 캐싱 기능을 동시에 제공하도록 감쌌습니다.
        */}
        <AuthSessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}


