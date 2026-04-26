import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppHeader from "../../components/common/AppHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import MypageBackHeader from "../../components/mypage/MypageBackHeader";
import { getReservations } from "../../lib/storage";
import { fetchPortalRestaurant } from "../../lib/portalRestaurant";
import { RESTAURANT_IMAGE_PLACEHOLDER } from "../../lib/placeholders";

function formatMonth(iso: string) {
  const [y, m] = iso.split("-");
  return `${y}年${parseInt(m!, 10)}月`;
}

export default function MypageHistoryPage() {
  const [rows, setRows] = useState<
    { id: string; restaurantId: string; restaurantName: string; date: string; imageUrl: string | null }[]
  >([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const all = getReservations();
    const sorted = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    let cancelled = false;
    (async () => {
      const enriched = await Promise.all(
        sorted.map(async (r) => {
          const detail = await fetchPortalRestaurant(r.restaurantId);
          return {
            id: r.id,
            restaurantId: r.restaurantId,
            restaurantName: r.restaurantName,
            date: r.createdAt.slice(0, 10),
            imageUrl: detail?.imageUrl ?? null,
          };
        })
      );
      if (!cancelled) {
        setRows(enriched);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = rows.reduce<Record<string, typeof rows>>((acc, row) => {
    const m = formatMonth(row.date);
    if (!acc[m]) acc[m] = [];
    acc[m].push(row);
    return acc;
  }, {});
  const months = Object.keys(grouped).sort((a, b) => {
    const maxA = grouped[a]!.reduce((m, r) => (r.date > m ? r.date : m), grouped[a]![0]!.date);
    const maxB = grouped[b]!.reduce((m, r) => (r.date > m ? r.date : m), grouped[b]![0]!.date);
    return maxB.localeCompare(maxA);
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-[#fafafa] pb-[96px] pt-16">
        <MypageBackHeader title="来店履歴" />
        <div className="px-4 pt-6">
          {!ready ? (
            <p className="py-12 text-center text-[14px] text-[#666]">読み込み中…</p>
          ) : rows.length === 0 ? (
            <p className="rounded-[16px] bg-white px-4 py-8 text-center text-[14px] text-[#7b8391] shadow-sm">
              まだ来店履歴がありません
            </p>
          ) : (
            months.map((month) => (
              <section key={month} className="mb-6">
                <h2 className="mb-3 text-[14px] font-bold text-[#666]">{month}</h2>
                <div className="space-y-2">
                  {grouped[month]!.map((row) => {
                    const [, mo, d] = row.date.split("-");
                    const label = `${parseInt(mo!, 10)}月${parseInt(d!, 10)}日 来店`;
                    const src = row.imageUrl ?? RESTAURANT_IMAGE_PLACEHOLDER;
                    return (
                      <div
                        key={row.id}
                        className="overflow-hidden rounded-[16px] border border-[#eee] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      >
                        <Link
                          href={`/restaurant/${encodeURIComponent(row.restaurantId)}`}
                          className="flex items-center gap-3 p-3"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f0f0f0]">
                            <Image src={src} alt="" fill className="object-cover" sizes="56px" unoptimized />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-bold text-[#111]">{row.restaurantName}</p>
                            <p className="text-[12px] text-[#999]">{label}</p>
                          </div>
                        </Link>
                        <div className="border-t border-[#f5f5f5] px-3 pb-3">
                          <Link
                            href={`/survey/${encodeURIComponent(row.restaurantId)}`}
                            className="block w-full rounded-full border border-[#ff6b00] py-2.5 text-center text-[13px] font-bold text-[#ff6b00]"
                          >
                            レビューを作成する（+300pt）
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <BottomNavigation />
    </>
  );
}
