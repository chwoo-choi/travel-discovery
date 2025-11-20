import Link from "next/link";
import { TopNavAuth } from "@/components/TopNavAuth"; // ✅ 1. 새 네비게이션 불러오기

// 🗑️ [삭제됨] 기존 function TopNav() {...} 코드는 이제 필요 없어서 지웠습니다.

export default function BookmarkPage() {
  return (
    <div className="flex min-h-screen flex-col">
      
      {/* 👇👇👇 [수정된 부분] 기존 <TopNav /> 대신 이걸로 교체! 👇👇👇 */}
      <TopNavAuth />
      {/* 👆👆👆 이제 로그인 상태(OOO님)가 여기서도 유지됩니다 */}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-8 md:pt-10">
        {/* 헤더 */}
        <header className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-500">
            내 북마크
          </p>
          <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
            마음에 드는 여행지를 한 곳에서 모아보세요.
          </h1>
          <p className="mt-2 text-xs text-gray-500 md:text-sm">
            홈 화면과 결과 페이지에서 저장한 여행지가 이곳에 모입니다. 나중에
            다시 비교하거나 플랜을 이어갈 수 있어요.
          </p>
        </header>

        {/* 빈 상태 안내 + 액션 */}
        <section className="mb-8 rounded-3xl bg-white/90 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.16)] backdrop-blur md:p-5">
          <div className="flex flex-col items-start gap-3 text-left md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 md:text-base">
                아직 저장된 북마크가 많지 않아요.
              </h2>
              <p className="mt-1 text-xs text-gray-500 md:text-sm">
                관심 있는 도시를 발견했다면 북마크해 두고, 나중에 날짜와 예산을
                바꿔 보면서 다시 비교해 보세요.
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                ※ 현재는 UI 테스트용 더미 데이터가 표시되며, 나중에 실제 DB
                연동으로 교체될 예정입니다.
              </p>
            </div>
            <Link
              href="/"
              className="mt-2 inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-gray-800 md:mt-0"
            >
              ✨ 여행지 탐색하러 가기
            </Link>
          </div>
        </section>

        {/* 북마크 리스트 (더미 카드) */}
        <section className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 md:text-base">
              북마크한 여행지
            </h2>
            <span className="text-xs text-gray-400">
              예시로 3개의 북마크 카드가 표시됩니다.
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* 카드 1 */}
            <article className="flex h-full flex-col rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.14)]">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    오사카
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    일본 · 먹거리 & 유니버설 스튜디오
                  </p>
                </div>
                <span className="rounded-full bg-yellow-50 px-2 py-1 text-[11px] font-semibold text-yellow-600">
                  주말 여행 후보
                </span>
              </div>
              <p className="mb-3 text-[11px] text-gray-500">
                도톤보리, 유니버설 스튜디오, 교토 당일치기까지 한 번에
                즐기기 좋아요.
              </p>
              <dl className="mb-3 space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <dt className="text-gray-500">선호 테마</dt>
                  <dd>맛집, 액티비티</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">예산 등급</dt>
                  <dd>스탠다드</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">최근 저장</dt>
                  <dd>3일 전</dd>
                </div>
              </dl>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                    #가까운여행
                  </span>
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                    #유니버설
                  </span>
                </div>
                <button className="text-[10px] font-medium text-gray-400 hover:text-red-400">
                  북마크 해제
                </button>
              </div>
            </article>

            {/* 카드 2 */}
            <article className="flex h-full flex-col rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.14)]">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    다낭
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    베트남 · 휴양 & 호이안
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                  여름 휴가 후보
                </span>
              </div>
              <p className="mb-3 text-[11px] text-gray-500">
                리조트 중심 일정과 호이안 야간 투어를 함께 넣기 좋은
                구성입니다.
              </p>
              <dl className="mb-3 space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <dt className="text-gray-500">선호 테마</dt>
                  <dd>휴양, 가족여행</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">예산 등급</dt>
                  <dd>실속형 ~ 스탠다드</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">최근 저장</dt>
                  <dd>1주 전</dd>
                </div>
              </dl>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                    #리조트
                  </span>
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                    #호이안
                  </span>
                </div>
                <button className="text-[10px] font-medium text-gray-400 hover:text-red-400">
                  북마크 해제
                </button>
              </div>
            </article>

            {/* 카드 3 */}
            <article className="flex h-full flex-col rounded-3xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(123,104,238,0.14)]">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    바르셀로나
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    스페인 · 건축 & 바다
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-600">
                  장기 여행 후보
                </span>
              </div>
              <p className="mb-3 text-[11px] text-gray-500">
                가우디 건축과 해변 산책을 함께 즐기기 좋아, 허니문이나 장기
                여행으로 인기 있는 도시예요.
              </p>
              <dl className="mb-3 space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <dt className="text-gray-500">선호 테마</dt>
                  <dd>문화, 야경</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">예산 등급</dt>
                  <dd>스탠다드 ~ 프리미엄</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">최근 저장</dt>
                  <dd>2주 전</dd>
                </div>
              </dl>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                    #건축
                  </span>
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                    #해변
                  </span>
                </div>
                <button className="text-[10px] font-medium text-gray-400 hover:text-red-400">
                  북마크 해제
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
