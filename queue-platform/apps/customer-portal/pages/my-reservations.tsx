import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import { getReservations, type ReservationItem } from "../lib/storage";
import { restaurants } from "../data/restaurants";

const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const resvs = getReservations().filter((r) => r.status === "waiting");
    setReservations(resvs);
  }, []);

  const getRestaurantImage = (restaurantId: string): string => {
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    return restaurant?.imageUrl || "https://via.placeholder.com/96x120";
  };

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
          <h1 className="text-[18px] font-bold text-[#222] mb-6">マイ予約</h1>

          {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <p className="text-[14px] text-[#999]">まだ予約はありません</p>
              <Link href="/">
                <button className="bg-[#FD780F] hover:bg-[#ff6b00] text-white font-bold py-2 px-6 rounded-lg transition-colors text-[14px]">
                  お店を探す
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex gap-3 p-4 bg-white border border-gray-200 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-20 h-24 flex-shrink-0">
                    <Image
                      src={getRestaurantImage(reservation.restaurantId)}
                      alt={reservation.restaurantName}
                      width={80}
                      height={96}
                      className="w-20 h-24 object-cover rounded"
                    />
                    <div className="absolute top-2 right-2 bg-[#FD780F] text-white text-[10px] font-bold px-2 py-1 rounded">
                      順番待ち
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold text-[#222] line-clamp-2 mb-2">
                        {reservation.restaurantName}
                      </h3>
                      <p className="text-[12px] text-[#666] mb-1">
                        チケット番号: <span className="font-bold text-[#222]">#{reservation.ticketNumber}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[12px] text-[#999]">
                        {reservation.waitingGroups}組待ち中
                      </p>
                      <p className="text-[12px] font-bold text-[#FD780F]">
                        約{reservation.waitMinutes}分
                      </p>
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
