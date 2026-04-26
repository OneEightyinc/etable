import React from "react";
import AppHeader from "../../components/common/AppHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import MypageBackHeader from "../../components/mypage/MypageBackHeader";

const RANKS = [
  { tier: "BRONZE", threshold: 0, color: "#CD7F32", benefits: ["特典なし（ポイントを貯める期間）"] },
  { tier: "SILVER", threshold: 500, color: "#A0A0A0", benefits: ["次回使えるファストパス1回券"] },
  { tier: "GOLD", threshold: 1500, color: "#FFB800", benefits: ["ファストパス月2回券", "1ドリンク無料"] },
];

const POINT_TABLE = [
  { action: "初回会員登録", points: "+200pt", note: "初回のみ" },
  { action: "来店（案内完了）", points: "+100pt", note: "毎回" },
  { action: "待機中レビュー回答", points: "+50pt", note: "毎回" },
  { action: "Googleレビュー投稿", points: "+300pt", note: "毎回" },
  { action: "友達招待", points: "+150pt", note: "お互いに" },
  { action: "アイドルタイム来店", points: "+100pt", note: "ボーナス" },
];

export default function MypageMemberPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-[#fafafa] pb-[96px] pt-16">
        <MypageBackHeader title="会員ランク・ポイント詳細" />
        <div className="px-4 pt-6">
          {/* ランク一覧 */}
          <section className="mb-6">
            <h2 className="mb-3 text-[14px] font-bold text-[#333]">ランク一覧</h2>
            <div className="space-y-3">
              {RANKS.map((r) => (
                <div key={r.tier} className="rounded-2xl bg-white p-4 shadow-sm border-l-4" style={{ borderLeftColor: r.color }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[15px] font-bold" style={{ color: r.color }}>{r.tier}</span>
                    <span className="text-[12px] text-[#999]">{r.threshold}pt〜</span>
                  </div>
                  <ul className="space-y-1">
                    {r.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px] text-[#555]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ポイント獲得方法 */}
          <section className="mb-6">
            <h2 className="mb-3 text-[14px] font-bold text-[#333]">ポイント獲得方法</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {POINT_TABLE.map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-[#f5f5f5]" : ""}`}>
                  <div>
                    <p className="text-[13px] font-medium text-[#333]">{row.action}</p>
                    <p className="text-[11px] text-[#999]">{row.note}</p>
                  </div>
                  <span className="text-[14px] font-bold text-[#ff6b00]">{row.points}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 初回来店シミュレーション */}
          <section className="mb-6">
            <h2 className="mb-3 text-[14px] font-bold text-[#333]">初回来店でシルバーへ！</h2>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between"><span className="text-[#666]">初回会員登録</span><span className="font-bold text-[#ff6b00]">+200pt</span></div>
                <div className="flex justify-between"><span className="text-[#666]">来店ポイント</span><span className="font-bold text-[#ff6b00]">+100pt</span></div>
                <div className="flex justify-between"><span className="text-[#666]">レビュー回答</span><span className="font-bold text-[#ff6b00]">+50pt</span></div>
                <div className="flex justify-between"><span className="text-[#666]">Googleレビュー投稿</span><span className="font-bold text-[#ff6b00]">+300pt</span></div>
                <div className="mt-2 border-t border-[#f0f0f0] pt-2 flex justify-between">
                  <span className="font-bold text-[#333]">合計</span>
                  <span className="font-bold text-[#ff6b00]">650pt</span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-[#f0fdf4] px-3 py-2 text-center text-[13px] font-bold text-[#22c55e]">
                シルバーランクへ昇格！
              </div>
            </div>
          </section>

          {/* 注意事項 */}
          <section className="mb-6">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-[13px] font-bold text-[#333]">ご利用にあたって</h3>
              <ul className="space-y-1.5 text-[12px] text-[#666] leading-relaxed">
                <li>・シルバーランク特典（ファストパス）は付与の翌日以降から有効です。</li>
                <li>・ポイントは会員登録した店舗グループ内で共通です。</li>
                <li>・アイドルタイムボーナスは店舗設定により異なります。</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
}
