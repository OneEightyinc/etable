import React from "react";
import AppHeader from "../../components/common/AppHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import MypageBackHeader from "../../components/mypage/MypageBackHeader";

export default function MypageMemberPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px] pt-16">
        <MypageBackHeader title="会員ステータスの詳細" />
        <p className="px-4 py-10 text-center text-[14px] leading-relaxed text-[#666]">
          会員ステータスの詳細は準備中です。
        </p>
      </main>
      <BottomNavigation />
    </>
  );
}
