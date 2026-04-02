import React from "react";
import Link from "next/link";
import BottomNavigation from "../components/common/BottomNavigation";

/* Inline SVG Icons */
const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChatIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
const EnvelopeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);
const WarningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

const ContactPage: React.FC = () => {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
      <header className="sticky top-0 z-20 border-b border-[#f2f2f2] bg-white">
        <div className="relative flex h-[56px] items-center justify-center px-4">
          <Link href="/mypage" className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]">
            <ChevronLeftIcon />
          </Link>
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-bold text-[#999]">ETABLE</span>
            <h1 className="text-[16px] font-bold text-[#111]">お問い合わせ</h1>
          </div>
        </div>
      </header>

      <div className="px-4 pt-6">
        <div className="space-y-4">
          <div className="rounded-[16px] border border-[#eee] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex gap-4">
              <div className="shrink-0"><ChatIcon /></div>
              <div>
                <h3 className="font-bold text-[#111]">チャットで相談</h3>
                <p className="mt-1 text-[14px] text-[#666]">リアルタイムでスタッフがお答えします</p>
                <p className="mt-2 flex items-center gap-1 text-[13px] text-[#999]">
                  <ClockIcon />
                  平均応答時間: 5分
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#eee] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex gap-4">
              <div className="shrink-0"><EnvelopeIcon /></div>
              <div>
                <h3 className="font-bold text-[#111]">メールでお問い合わせ</h3>
                <p className="mt-1 text-[14px] text-[#666]">24時間受付中。営業時間内に順次ご返信いたします</p>
                <p className="mt-2 text-[13px] text-[#999]">24時間受付</p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#eee] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex gap-4">
              <div className="shrink-0"><WarningIcon /></div>
              <div>
                <h3 className="font-bold text-[#111]">お急ぎの方</h3>
                <p className="mt-1 text-[14px] text-[#666]">緊急のご用件や当日の予約変更は、店舗に直接お電話ください。</p>
                <button type="button" className="mt-3 flex items-center gap-2 rounded-full bg-[#ff6b00] px-4 py-2 text-[14px] font-bold text-white">
                  <PhoneIcon />
                  店舗一覧の電話番号を見る
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-[16px] border border-[#eee] bg-[#fafafa] p-4">
          <p className="text-[14px] text-[#666]">多くのお悩みは、FAQページで解決できます。</p>
          <Link href="/faq" className="mt-2 inline-block text-[14px] font-bold text-[#ff6b00]">
            よくある質問を見る →
          </Link>
        </section>

        <section className="mt-6">
          <h3 className="text-[14px] font-bold text-[#111]">カスタマーサポート営業時間</h3>
          <p className="mt-2 text-[14px] text-[#666]">平日 10:00~18:00</p>
          <p className="text-[14px] text-[#666]">土日祝 ※年末年始を除く</p>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
};

export default ContactPage;
