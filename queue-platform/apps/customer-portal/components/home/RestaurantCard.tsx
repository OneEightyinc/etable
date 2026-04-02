import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface RestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    rating: number;
    distance: string;
    waitingGroups: number;
    shortestWaitMinutes: number;
    approxWaitText: string;
  };
  isFavorited: boolean;
  onFavoriteToggle: (id: string) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isFavorited,
  onFavoriteToggle,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle(restaurant.id);
  };

  const StarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#FD780F" : "white"} stroke={filled ? "#FD780F" : "#999"} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const MapPinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <div className="flex gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer relative">
        {/* Image Container */}
        <div className="relative w-24 h-30 flex-shrink-0">
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            width={96}
            height={120}
            className="w-24 h-30 object-cover rounded"
          />
          {/* Waiting Groups Badge */}
          {restaurant.waitingGroups > 0 && (
            <div className="absolute top-2 right-2 bg-[#FD780F] text-white text-[10px] font-bold px-2 py-1 rounded">
              {restaurant.waitingGroups}組
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-[11px] text-[#999] mb-1">{restaurant.category}</p>
            <h3 className="text-[14px] font-bold text-[#222] line-clamp-2 mb-2">
              {restaurant.name}
            </h3>

            {/* Rating and Distance */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <StarIcon />
                <span className="text-[12px] font-bold text-[#222]">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon />
                <span className="text-[12px] text-[#999]">
                  {restaurant.distance}
                </span>
              </div>
            </div>
          </div>

          {/* Wait Time */}
          <div className="flex items-center gap-1">
            <ClockIcon />
            <span className="text-[12px] text-[#FD780F] font-medium">
              {restaurant.approxWaitText}
            </span>
          </div>
        </div>

        {/* Favorite Button */}
        {isClient && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-shadow"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <HeartIcon filled={isFavorited} />
          </button>
        )}
      </div>
    </Link>
  );
};

export default RestaurantCard;
