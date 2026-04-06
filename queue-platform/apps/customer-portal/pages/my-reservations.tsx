import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import { getReservations, type ReservationItem } from "../lib/storage";
import { fetchPortalRestaurant } from "../lib/portalRestaurant";
import { RESTAURANT_IMAGE_PLACEHOLDER } from "../lib/placeholders";

/** 待ち状態の予約のうち、店舗ごとに最新1件のみ（新しい createdAt を優先） */
function loadWaitingReservations(): ReservationItem[] {
  if (typeof window === "undefined") return [];
  const waiting = getReservations()
    .filter((r) => r.status === "waiting")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const seen = new Set<string>();
  return waiting.filter((r) => {
    if (seen.has(r.restaurantId)) return false;
    seen.add(r.restaurantId);
    return true;
  });
}

const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setReservations(loadWaitingReservations());
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      refresh();
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "etable_reservations" || !e.key) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  useEffect(() => {
    if (reservations.length === 0) {
      setImages({});
      return;
    }
    let cancelled = false;
    (async () => {
      const m: Record<string, string> = {};
      const ids = [...new Set(reservations.map((r) => r.restaurantId))];
      await Promise.all(
        ids.map(async (id) => {
          const rest = await fetchPortalRestaurant(id);
          m[id] = rest?.imageUrl ?? RESTAURANT_IMAGE_PLACEHOLDER;
        })
      );
      if (!cancelled) setImages(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [reservations]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-[#fafafa] pb-[96px] pt-16">
        <header className="sticky top-[69.965px] z-[15] border-b border-[#f2f2f2] bg-white">
          <div className="flex h-[56px] items-center justify-center px-4">
            <h1 className="text-[18px] font-bold text-[#111]">マイ予約</h1>
          </div>
        </header>

        {!ready ? (
          <div className="px-4 py-16 text-center text-[14px] text-[#666]">読み込み中…</div>
        ) : reservations.length === 0 ? (
          <section className="px-4 pt-8">
            <div className="rounded-[24px] bg-white px-6 py-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <h2 className="mb-3 text-[20px] font-bold text-[#111]">まだ予約はありません</h2>
              <p className="mb-6 text-[14px] leading-[1.7] text-[#7b8391]">
                順番待ちをすると、ここに表示されます。
              </p>
              <Link
                href="/"
                className="inline-flex rounded-full bg-[#ff6b00] px-8 py-3.5 text-[16px] font-bold text-white shadow-[0_4px_12px_rgba(255,107,0,0.3)]"
              >
                お店を探す
              </Link>
            </div>
          </section>
        ) : (
          <section className="px-4 pt-6">
            <h2 className="mb-4 text-[16px] font-bold text-[#111]">現在の予約状況</h2>
            <div className="space-y-4">
              {reservations.map((r) => {
                const imageUrl = images[r.restaurantId] ?? RESTAURANT_IMAGE_PLACEHOLDER;
                return (
                  <div
                    key={r.id}
                    className="overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
                  >
                    <Link
                      href={`/restaurant/${encodeURIComponent(r.restaurantId)}/status`}
                      className="block"
                    >
                      <div className="relative h-[140px] w-full bg-[#f0f0f0]">
                        <Image
                          src={imageUrl}
                          alt={r.restaurantName}
                          fill
                          className="object-cover"
                          sizes="393px"
                          unoptimized
                        />
                        <span className="absolute left-4 top-4 rounded-full bg-[#ff6b00] px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
                          順番待ち
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-[12px] font-bold text-[#999]">NO.</span>
                          <span className="text-[18px] font-bold text-[#ff6b00]">{r.ticketNumber}</span>
                        </div>
                        <h3 className="mb-3 text-[17px] font-bold leading-snug text-[#111]">{r.restaurantName}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#666]">
                          <span>あと{r.waitingGroups}組</span>
                          <span>約{r.waitMinutes}分</span>
                          {r.peopleCount > 0 ? <span>{r.peopleCount}名</span> : null}
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          <span className="flex items-center gap-1 text-[14px] font-bold text-[#ff6b00]">
                            詳細を見る
                            <ChevronRightIcon className="h-5 w-5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="border-t border-[#f3f3f3] bg-[#fffaf7] px-4 py-3">
                      <Link
                        href={`/survey/${encodeURIComponent(r.restaurantId)}`}
                        className="flex w-full items-center justify-center rounded-full border border-[#ff6b00] bg-white py-3 text-[14px] font-bold text-[#ff6b00] shadow-[0_2px_8px_rgba(255,107,0,0.12)]"
                      >
                        来店アンケートに回答する
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>
      <BottomNavigation />
    </>
  );
};

export default MyReservations;
