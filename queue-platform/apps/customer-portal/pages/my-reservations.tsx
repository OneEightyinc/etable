import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import { getReservations, type ReservationItem } from "../lib/storage";
import { fetchPortalRestaurant } from "../lib/portalRestaurant";
import { RESTAURANT_IMAGE_PLACEHOLDER } from "../lib/placeholders";

const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);
    const resvs = getReservations().filter((r) => r.status === "waiting");
    setReservations(resvs);
    (async () => {
      const m: Record<string, string> = {};
      const ids = [...new Set(resvs.map((r) => r.restaurantId))];
      await Promise.all(
        ids.map(async (id) => {
          const rest = await fetchPortalRestaurant(id);
          m[id] = rest?.imageUrl ?? RESTAURANT_IMAGE_PLACEHOLDER;
        })
      );
      setImages(m);
    })();
  }, []);

  if (!isClient) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow pt-16 pb-24">
          <div className="mx-auto w-full max-w-[393px]" />
        </main>
        <BottomNavigation />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16 pb-24">
        <div className="mx-auto w-full max-w-[393px] bg-white px-4 py-4">
          <h1 className="mb-6 text-[18px] font-bold text-[#222]">マイ予約</h1>

          {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <p className="text-[14px] text-[#999]">まだ予約はありません</p>
              <Link href="/">
                <button
                  type="button"
                  className="rounded-lg bg-[#FD780F] px-6 py-2 text-[14px] font-bold text-white transition-colors hover:bg-[#ff6b00]"
                >
                  トップへ
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded">
                    <img
                      src={images[reservation.restaurantId] ?? RESTAURANT_IMAGE_PLACEHOLDER}
                      alt={reservation.restaurantName}
                      width={80}
                      height={96}
                      className="h-24 w-20 object-cover"
                    />
                    <div className="absolute right-2 top-2 rounded bg-[#FD780F] px-2 py-1 text-[10px] font-bold text-white">
                      順番待ち
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="mb-2 line-clamp-2 text-[13px] font-bold text-[#222]">
                        {reservation.restaurantName}
                      </h3>
                      <p className="mb-1 text-[12px] text-[#666]">
                        チケット番号:{" "}
                        <span className="font-bold text-[#222]">#{reservation.ticketNumber}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[12px] text-[#999]">{reservation.waitingGroups}組待ち中</p>
                      <p className="text-[12px] font-bold text-[#FD780F]">約{reservation.waitMinutes}分</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </>
  );
};

export default MyReservations;
