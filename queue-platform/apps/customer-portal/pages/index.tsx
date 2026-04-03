import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import RestaurantCard from "../components/home/RestaurantCard";
import { getFavorites, addFavorite, removeFavorite } from "../lib/storage";
import { portalProfileToRestaurant } from "../lib/portalRestaurant";
import type { Restaurant } from "../data/restaurants";
import type { StorePortalProfile } from "@queue-platform/api/src/server";

const Home: React.FC = () => {
  const router = useRouter();
  const storeId = router.isReady ? (router.query.storeId as string | undefined) : undefined;

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);
  const [portalRestaurant, setPortalRestaurant] = useState<Restaurant | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => {
    setIsClient(true);
    const favorites = getFavorites();
    setFavoriteIds(new Set(favorites.map((f) => f.restaurantId)));
  }, []);

  useEffect(() => {
    if (!router.isReady || !storeId) {
      setPortalRestaurant(null);
      setPortalError("");
      setPortalLoading(false);
      return;
    }
    setPortalLoading(true);
    setPortalError("");
    fetch(`/api/store/public?storeId=${encodeURIComponent(storeId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not found");
        const data = (await res.json()) as { profile: StorePortalProfile };
        return portalProfileToRestaurant(data.profile);
      })
      .then(setPortalRestaurant)
      .catch(() => {
        setPortalRestaurant(null);
        setPortalError("店舗情報を読み込めませんでした。URL の店舗 ID をご確認ください。");
      })
      .finally(() => setPortalLoading(false));
  }, [router.isReady, storeId]);

  const handleFavoriteToggle = (id: string) => {
    if (favoriteIds.has(id)) {
      removeFavorite(id);
      const next = new Set(favoriteIds);
      next.delete(id);
      setFavoriteIds(next);
      return;
    }
    if (portalRestaurant?.id === id) {
      addFavorite({
        id: `fav_${id}`,
        restaurantId: id,
        restaurantName: portalRestaurant.name,
      });
      const next = new Set(favoriteIds);
      next.add(id);
      setFavoriteIds(next);
    }
  };

  const listToShow: Restaurant[] =
    storeId && portalRestaurant ? [portalRestaurant] : [];

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16 pb-24">
        <div className="mx-auto w-full max-w-[393px] bg-white">
          <div className="px-4 py-2">
            {!storeId && (
              <div className="flex flex-col items-center justify-center px-2 py-16 text-center">
                <p className="text-[15px] font-bold text-[#222] mb-2">店舗からアクセスしてください</p>
                <p className="text-[13px] text-[#666] leading-relaxed mb-6">
                  近くの店舗一覧のダミー表示はありません。
                  <br />
                  店舗がお渡しする QR・リンク（URL に{" "}
                  <code className="rounded bg-gray-100 px-1 text-[12px]">?storeId=店舗ID</code> が付いたもの）から開いてください。
                </p>
                <Link
                  href="/mypage"
                  className="rounded-full bg-[#FD780F] px-6 py-3 text-[14px] font-bold text-white shadow-md transition hover:bg-[#ff6b00]"
                >
                  マイページ登録・確認
                </Link>
              </div>
            )}

            {storeId && (
              <>
                <h2 className="mb-4 text-[14px] font-bold text-[#222]">店舗情報</h2>
                {portalLoading && (
                  <div className="flex justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FD780F] border-t-transparent" />
                  </div>
                )}
                {portalError && !portalLoading && (
                  <p className="py-8 text-center text-sm text-red-500">{portalError}</p>
                )}
                <div className="space-y-3">
                  {listToShow.map((restaurant) => (
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
                      isFavorited={isClient && favoriteIds.has(restaurant.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
};

export default Home;
