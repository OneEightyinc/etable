import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import RestaurantCard from "../components/home/RestaurantCard";
import { getFavorites, type FavoriteItem } from "../lib/storage";
import { fetchPortalRestaurant, restaurantFromFavorite } from "../lib/portalRestaurant";
import type { Restaurant } from "../data/restaurants";

const Favorites: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [favItems, setFavItems] = useState<FavoriteItem[]>([]);
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshFavorites = useCallback(() => {
    setFavItems(getFavorites());
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      refreshFavorites();
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, [refreshFavorites]);

  useEffect(() => {
    const onFocus = () => refreshFavorites();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshFavorites]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "etable_favorites" || !e.key) refreshFavorites();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshFavorites]);

  useEffect(() => {
    if (!ready) return;
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
  }, [ready, favItems]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-[#fafafa] pb-[96px] pt-16">
        <header className="sticky top-[69.965px] z-[15] border-b border-[#f2f2f2] bg-white">
          <div className="flex h-[56px] items-center justify-center px-4">
            <h1 className="text-[18px] font-bold text-[#111]">お気に入り</h1>
          </div>
        </header>

        {!ready ? (
          <div className="px-4 py-16 text-center text-[14px] text-[#666]">読み込み中…</div>
        ) : loading && favItems.length > 0 ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff6b00] border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <section className="px-4 pt-8">
            <div className="rounded-[24px] bg-white px-6 py-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <h2 className="mb-3 text-[20px] font-bold text-[#111]">まだお気に入りはありません</h2>
              <p className="mb-6 text-[14px] leading-[1.7] text-[#7b8391]">
                気になるお店をハートで登録すると、ここに表示されます。
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
          <section className="pb-2 pt-4">
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
                  estimatedWaitMinutes: Math.max(1, restaurant.shortestWaitMinutes || 1),
                }}
                onAfterToggle={refreshFavorites}
              />
            ))}
          </section>
        )}
      </main>
      <BottomNavigation />
    </>
  );
};

export default Favorites;
