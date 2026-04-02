import React from "react";
import Link from "next/link";
import BottomNavigation from "../components/common/BottomNavigation";

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6" /></svg>
);

const SECTIONS = [
  { title: "1. 個人情報の収集について", body: "当社は、サービス提供に必要な範囲で個人情報を収集します。" },
  { title: "2. 利用目的", body: "収集した個人情報は、サービスの提供・改善、お知らせの送付、お問い合わせ対応に利用します。" },
  { title: "3. 第三者への提供", body: "法令に基づく場合を除き、ご同意なく第三者に提供することはありません。" },
  { title: "4. 情報の管理", body: "個人情報は適切に管理し、漏洩・滅失・毀損の防止に努めます。" },
  { title: "5. 個人情報の開示・訂正・削除", body: "ご本人から請求があった場合、開示・訂正・削除に対応します。" },
  { title: "6. Cookieの使用", body: "当社ウェブサイトでは利便性向上のためCookieを使用することがあります。" },
  { title: "7. プライバシーポリシーの変更", body: "本ポリシーは必要に応じて改訂することがあります。" },
  { title: "8. お問い合わせ", body: "ETABLE株式会社 法務部\nprivacy@etable.co.jp\n受付時間: 平日 10:00~18:00" },
];

const PrivacyPage: React.FC = () => {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
      <header className="sticky top-0 z-20 border-b border-[#f2f2f2] bg-white">
        <div className="relative flex h-[56px] items-center justify-center px-4">
          <Link href="/mypage" className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]">
            <ChevronLeftIcon />
          </Link>
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-bold text-[#999]">ETABLE</span>
            <h1 className="text-[16px] font-bold text-[#111]">プライバシーポリシー</h1>
          </div>
        </div>
      </header>

      <div className="px-4 pt-6">
        <p className="mb-6 text-[13px] text-[#999]">改訂日: 2024年1月1日</p>
        <div className="space-y-6 pb-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-[15px] font-bold text-[#111]">{s.title}</h2>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#666]">{s.body}</p>
            </section>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
};

export default PrivacyPage;
