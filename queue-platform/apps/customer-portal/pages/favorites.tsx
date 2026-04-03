import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import RestaurantCard from "../components/home/RestaurantCard";
import { getFavorites, addFavorite, removeFavorite, type FavoriteItem } from "../lib/storage";
import { fetchPortalRestaurant, restaurantFromFavorite } from "../lib/portalRestaurant";
import type { Restaurant } from "../data/restaurants";

const Favorites: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favItems, setFavItems] = useState<FavoriteItem[]>([]);
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const favs = getFavorites();
    setFavItems(favs);
    setFavoriteIds(new Set(favs.map((f) => f.restaurantId)));
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (favItems.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      favItems.map(async (f) => {
        const detail = await fetchPortalRestaurant(f.restaurantId);
        return restaurantFromFavorite(f, detail);
      })
    )
      .then(setRows)
      .finally(() => setLoading(false));
  }, [isClient, favItems]);

  const refreshFavorites = () => {
    const favs = getFavorites();
    setFavItems(favs);
    setFavoriteIds(new Set(favs.map((f) => f.restaurantId)));
  };

  const handleFavoriteToggle = (id: string) => {
    if (favoriteIds.has(id)) {
      removeFavorite(id);
      refreshFavorites();
    } else {
      const row = rows.find((r) => r.id === id);
      if (row) {
        addFavorite({
          id: `fav_${id}`,
          restaurantId: id,
          restaurantName: row.name,
        });
        refreshFavorites();
      }
    }
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
        <div className="mx-auto w-full max-w-[393px] bg-white">
          <div className="px-4 py-4">
            <h1 className="mb-6 text-[18px] font-bold text-[#222]">お気に入り</h1>

            {loading && favItems.length > 0 ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FD780F] border-t-transparent" />
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-16">
                <p className="text-[14px] text-[#999]">お気に入りのお店はまだありません</p>
                <p className="px-4 text-center text-[12px] text-[#aaa]">
                  店舗ページ（<code className="rounded bg-gray-100 px-1">?storeId=</code> 付きURL）でハートを押すと保存されます。
                </p>
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
              <div className="space-y-3">
                {rows.map((restaurant) => (
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
