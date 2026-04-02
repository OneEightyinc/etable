import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import RestaurantCard from "../components/home/RestaurantCard";
import { getFavorites, addFavorite, removeFavorite } from "../lib/storage";
import { restaurants } from "../data/restaurants";

const Favorites: React.FC = () => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const favorites = getFavorites();
    setFavoriteIds(new Set(favorites.map((f) => f.restaurantId)));
  }, []);

  const handleFavoriteToggle = (id: string) => {
    if (favoriteIds.has(id)) {
      removeFavorite(id);
      const newFavorites = new Set(favoriteIds);
      newFavorites.delete(id);
      setFavoriteIds(newFavorites);
    } else {
      const restaurant = restaurants.find((r) => r.id === id);
      if (restaurant) {
        addFavorite({
          id: `fav_${id}`,
          restaurantId: id,
          restaurantName: restaurant.name,
        });
        const newFavorites = new Set(favoriteIds);
        newFavorites.add(id);
        setFavoriteIds(newFavorites);
      }
    }
  };

  const favoriteRestaurants = restaurants.filter((r) => favoriteIds.has(r.id));

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
        <div className="mx-auto w-full max-w-[393px] bg-white">
          <div className="px-4 py-4">
            <h1 className="text-[18px] font-bold text-[#222] mb-6">お気に入り</h1>

            {favoriteRestaurants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <p className="text-[14px] text-[#999]">お気に入りのお店はまだありません</p>
                <Link href="/">
                  <button className="bg-[#FD780F] hover:bg-[#ff6b00] text-white font-bold py-2 px-6 rounded-lg transition-colors text-[14px]">
                    お店を探す
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={{
                      id: restaurant.id,
                      name: restaurant.name,
                      category: restaurant.category,
                      imageUrl: restaurant.imageUrl,
                      rating: restaurant.rating,
                      distance: restaurant.distance,
                      waitingGroups: restaurant.waitingGroups,
                      shortestWaitMinutes: restaurant.shortestWaitMinutes,
                      approxWaitText: restaurant.approxWaitText,
                    }}
                    isFavorited={favoriteIds.has(restaurant.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
};

export default Favorites;
