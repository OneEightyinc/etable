import React from "react";
import Link from "next/link";
import BottomNavigation from "../components/common/BottomNavigation";

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const MapPage: React.FC = () => {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[24px]">
      <header className="sticky top-0 z-20 bg-white">
        <div className="relative flex h-[58px] items-center justify-center border-b border-[#f2f2f2] px-4">
          <Link href="/" className="absolute left-4 flex h-8 w-8 items-center justify-center">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-[18px] font-bold text-[#111]">マップで探す</h1>
        </div>
      </header>

      <section className="px-5 pt-8">
        <div className="relative flex h-[320px] items-center justify-center overflow-hidden rounded-[28px] border border-[#ececec] bg-[#f6f6f6]">
          <p className="max-w-[280px] text-center text-[14px] leading-relaxed text-[#6b7280]">
            地図上の店舗一覧はありません。
            <br />
            店舗からお送りするリンク（<code className="rounded bg-white px-1 text-[12px]">?storeId=</code>
            ）から該当店舗を開いてください。
          </p>
        </div>
      </section>

      <section className="px-5 pt-6">
        <Link
          href="/mypage"
          className="block rounded-[22px] border border-[#ff6b00] bg-white py-4 text-center text-[14px] font-bold text-[#ff6b00]"
        >
          マイページ登録・確認
        </Link>
      </section>

      <BottomNavigation />
    </main>
  );
};

export default MapPage;
