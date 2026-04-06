"use client";

import React, { useEffect, useState } from "react";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { addFavorite, getFavorites, removeFavorite } from "../../lib/storage";

export interface FavoriteButtonProps {
  restaurantId: string;
  restaurantName: string;
  className?: string;
  iconClassName?: string;
  variant?: "default" | "white";
  onAfterToggle?: () => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  restaurantId,
  restaurantName,
  className = "",
  iconClassName = "size-[15.994px]",
  variant = "default",
  onAfterToggle,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favs = getFavorites();
    const id = setTimeout(
      () => setIsFavorited(favs.some((f) => f.restaurantId === restaurantId)),
      0
    );
    return () => clearTimeout(id);
  }, [restaurantId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorited) {
      removeFavorite(restaurantId);
      setIsFavorited(false);
    } else {
      addFavorite({
        id: Math.random().toString(36).slice(2),
        restaurantId,
        restaurantName,
      });
      setIsFavorited(true);
    }
    onAfterToggle?.();
  };

  const iconColor =
    variant === "white"
      ? "text-white"
      : isFavorited
        ? "text-[#ff4b2b]"
        : "text-[#999]";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isFavorited ? "お気に入りを解除" : "お気に入りに追加"}
      className={
        className ||
        "absolute right-[15.99px] top-[11.99px] grid size-[31.998px] place-items-center rounded-full bg-white/80 text-[#999] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)]"
      }
    >
      {isFavorited ? (
        <HeartIconSolid className={`${iconClassName} ${iconColor}`} />
      ) : (
        <HeartIconOutline className={`${iconClassName} ${iconColor}`} />
      )}
    </button>
  );
};

export default FavoriteButton;
