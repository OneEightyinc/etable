import React, { useState } from "react";
import Link from "next/link";
import BottomNavigation from "../components/common/BottomNavigation";

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6" /></svg>
);
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const ChevronDownIcon = ({ rotated }: { rotated: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 transition-transform ${rotated ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
);
const EnvelopeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);

const CATEGORIES = ["すべて", "予約", "お支払い", "アカウント"] as const;

const FAQ_ITEMS = [
  { q: "順番待ちをキャンセルしたい", a: "予約詳細画面から「順番待ちをキャンセルする」をタップし、確認後にキャンセルできます。", category: 1 },
  { q: "クレジットカードの変更方法は？", a: "マイページ → お支払い方法の管理から、登録カードの変更・追加ができます。", category: 2 },
  { q: "呼び出しから何分で持ってもらえますか？", a: "店舗により異なります。目安は通知に記載の時間をご確認ください。", category: 1 },
  { q: "予約手数料はかかりますか？", a: "順番待ちのご利用は無料です。一部店舗で事前決済を利用する場合は別途表示されます。", category: 1 },
  { q: "会員情報を変更したい", a: "マイページ → 会員情報・プロフィールの編集から変更できます。", category: 3 },
  { q: "支払いエラーが出る", a: "カードの有効期限・残高をご確認のうえ、再度お試しください。", category: 2 },
];

const FaqPage: React.FC = () => {
  const [category, setCategory] = useState(0);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchCategory = category === 0 || item.category === category;
    const matchSearch = !search || item.q.includes(search) || item.a.includes(search);
    return matchCategory && matchSearch;
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
      <header className="sticky top-0 z-20 border-b border-[#f2f2f2] bg-white">
        <div className="relative flex h-[56px] items-center justify-center px-4">
          <Link href="/mypage" className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-[18px] font-bold text-[#111]">よくある質問</h1>
        </div>
      </header>

      <div className="px-4 pt-6">
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2"><SearchIcon /></div>
          <input
            type="search"
            placeholder="キーワードで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[12px] border border-[#e5e5e5] py-3 pl-12 pr-4 text-[15px]"
          />
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setCategory(i)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-bold ${
                category === i ? "bg-[#ff6b00] text-white" : "bg-[#f5f5f5] text-[#666]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div key={item.q} className="overflow-hidden rounded-[16px] border border-[#eee] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-4 text-left"
                onClick={() => setOpenKey(openKey === item.q ? null : item.q)}
              >
                <span className="text-[15px] font-medium text-[#111]">{item.q}</span>
                <ChevronDownIcon rotated={openKey === item.q} />
              </button>
              {openKey === item.q && (
                <div className="border-t border-[#f0f0f0] px-4 pb-4 pt-2">
                  <p className="text-[14px] leading-relaxed text-[#666]">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-[16px] border border-[#eee] bg-[#fafafa] p-6 text-center">
          <p className="text-[15px] font-medium text-[#111]">解決しない場合は？</p>
          <p className="mt-2 text-[14px] text-[#666]">お気軽にお問い合わせください。</p>
          <Link href="/contact" className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6b00] px-6 py-3 text-[15px] font-bold text-white">
            <EnvelopeIcon />
            お問い合わせ
          </Link>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
};

export default FaqPage;
