import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ClockIcon } from "@heroicons/react/24/outline";
import WaitingBadge from "../common/WaitingBadge";
import FavoriteButton from "../common/FavoriteButton";
import DistanceMeta from "../common/DistanceMeta";

export interface RestaurantCardRestaurant {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  distance: string;
  waitingGroups: number;
  estimatedWaitMinutes: number;
}

interface RestaurantCardProps {
  restaurant: RestaurantCardRestaurant;
  onAfterToggle?: () => void;
}

/** デザインモック（etable-online）と同一レイアウト・タイポ・配色 */
const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onAfterToggle }) => {
  const isImmediate = restaurant.waitingGroups <= 1;

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="relative mb-[15.99px] mx-[23.991px] block"
    >
      <div className="overflow-hidden rounded-[24px] border border-[#e5e5e5] border-[0.676px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="relative h-[144.97px]">
          <div className="absolute left-[15.99px] top-[15.99px] size-[95.995px]">
            <div className="relative size-full">
              {restaurant.imageUrl && !restaurant.imageUrl.includes("picsum.photos") ? (
                <Image
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  width={96}
                  height={120}
                  className="h-[120px] w-[96px] rounded-xl object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-[120px] w-[96px] flex-col items-center justify-center gap-1.5 rounded-xl bg-[#f5f5f5]">
                  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" aria-hidden>
                    <rect x="6" y="12" width="36" height="24" rx="4" stroke="#ccc" strokeWidth="2" />
                    <circle cx="18" cy="22" r="3" fill="#ddd" />
                    <path d="M6 32l10-8 6 5 8-10 12 13" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 8c0-1.1.9-2 2-2h4a2 2 0 012 2v4h-8V8z" fill="#e5e5e5" />
                  </svg>
                  <span className="text-[10px] font-bold text-[#bbb]">No Image</span>
                </div>
              )}
              <WaitingBadge waitingGroups={restaurant.waitingGroups} className="absolute right-[-8px] top-[-8px]" />
            </div>
          </div>

          <div className="absolute left-[127.98px] top-[15.99px] w-[200.177px]">
            <div className="inline-flex h-[18.191px] items-center rounded-[4px] bg-[#f5f5f5] px-[7.997px]">
              <span className="text-[10px] font-bold uppercase leading-[15px] tracking-[0.5px] text-[#999]">
                {restaurant.category}
              </span>
            </div>

            <h3 className="mt-[4px] overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-bold leading-[20px] text-[#0a0a0a]">
              {restaurant.name}
            </h3>

            <div className="mt-[3.99px]">
              <DistanceMeta rating={restaurant.rating} distance={restaurant.distance} />
            </div>

            <div className="mt-[7.99px] flex flex-col gap-[3.993px]">
              <div className="flex items-center gap-[3.993px]">
                <ClockIcon className="size-[11.99px] text-[#ff6b00]" />
                <span className="border-b border-[#ff6b00] border-b-[0.676px] pb-[2.676px]">
                  <span className="text-[11px] font-black leading-[16.5px] text-[#ff6b00]">
                    最短{restaurant.estimatedWaitMinutes}分
                  </span>
                </span>
              </div>
              {isImmediate ? (
                <p className="text-[9px] font-bold leading-[13.5px] tracking-[-0.45px] text-[#ff6b00] opacity-70">
                  到着後すぐにご案内可能です
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <FavoriteButton
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        onAfterToggle={onAfterToggle}
      />
    </Link>
  );
};

export default RestaurantCard;
