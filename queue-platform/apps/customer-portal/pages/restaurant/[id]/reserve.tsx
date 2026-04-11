import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { addReservation } from "../../../lib/storage";
import BottomNavigation from "../../../components/common/BottomNavigation";
import { useRestaurantById } from "../../../lib/useRestaurantById";

const seatOptions = ["こだわりなし", "テーブル席", "カウンター"];

/* ---------- Inline SVG Icons ---------- */
const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const MinusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const ExclamationCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ReservePage: React.FC = () => {
  const router = useRouter();
  const rid = router.query.id;
  const restaurantId = typeof rid === "string" ? rid : undefined;
  const { restaurant, loading } = useRestaurantById(restaurantId);

  const [count, setCount] = useState(2);
  const [seatType, setSeatType] = useState("テーブル席");
  const [groupType, setGroupType] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const groupTypeOptions = [
    { key: "solo", label: "ひとり", icon: "👤" },
    { key: "friends", label: "友人", icon: "👥" },
    { key: "couple", label: "カップル", icon: "💑" },
    { key: "family", label: "家族", icon: "👨‍👩‍👧" },
    { key: "business", label: "ビジネス", icon: "💼" },
  ];

  const decrease = () => setCount((prev) => Math.max(1, prev - 1));
  const increase = () => setCount((prev) => Math.min(10, prev + 1));

  const handleConfirmReservation = async () => {
    if (!restaurant || !agreed || !restaurantId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: restaurantId,
          peopleCount: count,
          seatType,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        entry?: { id: string; ticketNumber: number };
        position?: number;
        estimatedWait?: number;
      };
      if (!res.ok || !data.entry || data.position === undefined || data.estimatedWait === undefined) {
        throw new Error(data.error || "join failed");
      }
      const item = {
        id: Math.random().toString(36).slice(2),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        peopleCount: count,
        seatType,
        ticketNumber: data.entry.ticketNumber,
        waitingGroups: data.position,
        waitMinutes: data.estimatedWait,
        baselineQueuePosition: data.position,
        baselineWaitMinutes: data.estimatedWait,
        queueEntryId: data.entry.id,
        status: "waiting" as const,
        createdAt: new Date().toISOString(),
      };
      addReservation(item);
      await router.push(`/restaurant/${restaurantId}/status`);
    } catch (e) {
      console.error(e);
      alert("順番待ちの登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (!router.isReady || (restaurantId && loading)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[393px] items-center justify-center bg-white p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff6b00] border-t-transparent" />
      </main>
    );
  }

  if (!restaurant || !restaurantId) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white p-6">
        店舗情報が見つかりません
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#f3f3f3]">
        <div className="relative flex h-[56px] items-center justify-center px-4">
          <Link
            href={`/restaurant/${restaurantId}`}
            className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-[18px] font-bold text-[#111]">予約人数の入力</h1>
        </div>
      </header>

      {/* People Count */}
      <section className="px-4 pt-6">
        <div className="rounded-[20px] border border-[#f0f0f0] bg-white px-6 py-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="mb-7 flex items-center justify-center gap-2 text-[#ff6b00]">
            <ExclamationCircleIcon />
            <p className="text-[18px] font-semibold">何名様ですか？</p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={decrease}
              className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[#e7e7ef] bg-white"
            >
              <MinusIcon />
            </button>

            <div className="flex items-end justify-center">
              <span className="text-[78px] font-bold leading-none tracking-[-2px] text-[#0f172a]">
                {count}
              </span>
              <span className="ml-1 pb-[10px] text-[24px] font-bold text-[#94a3b8]">名</span>
            </div>

            <button
              type="button"
              onClick={increase}
              className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[#e7e7ef] bg-white"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </section>

      {/* Seat Preference */}
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-[18px] w-[5px] rounded-full bg-[#ff6b00]" />
          <h2 className="text-[16px] font-bold text-[#111]">お席のご希望</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {seatOptions.map((option) => {
            const isActive = seatType === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSeatType(option)}
                className={`h-[52px] rounded-[16px] border text-[14px] font-semibold transition-colors ${
                  isActive
                    ? "border-[#ff6b00] bg-[#fff5ef] text-[#ff6b00]"
                    : "border-[#eee] bg-white text-[#666]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>

      {/* Group Type - ワンタップ選択 */}
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-[18px] w-[5px] rounded-full bg-[#ff6b00]" />
          <h2 className="text-[16px] font-bold text-[#111]">ご利用形態</h2>
        </div>
        <div className="flex gap-2">
          {groupTypeOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setGroupType(opt.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-[16px] border py-3 text-[12px] font-semibold transition-colors ${
                groupType === opt.key
                  ? "border-[#ff6b00] bg-[#fff5ef] text-[#ff6b00]"
                  : "border-[#eee] bg-white text-[#666]"
              }`}
            >
              <span className="text-[18px]">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Notices */}
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-[18px] w-[5px] rounded-full bg-[#ff6b00]" />
          <h2 className="text-[16px] font-bold text-[#111]">注意事項</h2>
        </div>
        <div className="mb-5 rounded-[16px] border border-[#eee] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <ul className="list-inside list-disc space-y-2 text-[14px] leading-[1.7] text-[#5f6672]">
            <li>順番待ち登録後、お呼び出しは店舗の混雑状況により前後する場合があります。</li>
            <li>ご登録いただいた人数・席のご希望は目安です。ご案内時に変更をお願いする場合があります。</li>
            <li>やむを得ずキャンセルされる場合は、できるだけ早くアプリから手続きをお願いします。</li>
          </ul>
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-[24px] w-[24px] shrink-0"
          />
          <span className="text-[14px] font-semibold leading-[1.7] text-[#334155]">
            上記の注意事項を確認し、同意しました
          </span>
        </label>
      </section>

      {/* Confirm Button */}
      <section className="px-4 pt-6 pb-8">
        <button
          type="button"
          onClick={() => void handleConfirmReservation()}
          disabled={!agreed || submitting}
          className={`block w-full rounded-full py-4 text-center text-[17px] font-bold text-white transition shadow-[0_4px_14px_rgba(255,107,0,0.35)] ${
            agreed && !submitting ? "bg-[#ff6b00] hover:opacity-95" : "cursor-not-allowed bg-[#d4d4d8]"
          }`}
        >
          {submitting ? "登録中…" : "順番待ちを確定する"}
        </button>
      </section>

      <BottomNavigation />
    </main>
  );
};

export default ReservePage;
