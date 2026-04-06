import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import SectionHeader from "../components/common/SectionHeader";
import RestaurantCard from "../components/home/RestaurantCard";
import SearchToggleTabs from "../components/home/SearchToggleTabs";
import CategoryFilter from "../components/home/CategoryFilter";
import { portalProfileToRestaurant } from "../lib/portalRestaurant";
import type { Restaurant } from "../data/restaurants";
import type { StorePortalProfile } from "@queue-platform/api/src/server";
import {
  filterRestaurantsByExploreCategory,
  sortRestaurantsByDistance,
  type ExploreCategoryId,
} from "../lib/exploreCategories";
import { useUserLocation, computeDistance } from "../lib/geo";

function toCardRestaurant(r: Restaurant) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    imageUrl: r.imageUrl,
    rating: r.rating,
    distance: r.distance,
    waitingGroups: r.waitingGroups,
    estimatedWaitMinutes: Math.max(1, r.shortestWaitMinutes || 1),
  };
}

const Home: React.FC = () => {
  const router = useRouter();
  const storeId = router.isReady ? (router.query.storeId as string | undefined) : undefined;

  const userLoc = useUserLocation();
  const [portalRestaurant, setPortalRestaurant] = useState<Restaurant | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [categoryId, setCategoryId] = useState<ExploreCategoryId>("all");

  useEffect(() => {
    if (!router.isReady) return;
    setPortalLoading(true);
    setPortalError("");

    if (storeId) {
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
    } else {
      fetch("/api/store/public")
        .then(async (res) => {
          if (!res.ok) throw new Error("failed");
          const data = (await res.json()) as { profiles: StorePortalProfile[] };
          return (data.profiles || []).map(portalProfileToRestaurant);
        })
        .then(setAllRestaurants)
        .catch(() => {
          setAllRestaurants([]);
          setPortalError("店舗一覧を読み込めませんでした。");
        })
        .finally(() => setPortalLoading(false));
    }
  }, [router.isReady, storeId]);

  const listToShow: Restaurant[] =
    storeId && portalRestaurant ? [portalRestaurant] : allRestaurants;

  const filteredSorted = useMemo(() => {
    const f = filterRestaurantsByExploreCategory(listToShow, categoryId);
    const withDist = f.map((r) => ({
      ...r,
      distance: computeDistance(r.lat, r.lng, userLoc, r.distance),
    }));
    return sortRestaurantsByDistance(withDist);
  }, [listToShow, categoryId, userLoc]);

  const showExploreChrome = !storeId;

  return (
    <>
      <AppHeader />
      <main className="min-h-screen flex-grow bg-white pb-24 pt-16">
        <div className="mx-auto w-full max-w-[393px] bg-white">
          {showExploreChrome ? (
            <>
              <CategoryFilter value={categoryId} onChange={setCategoryId} />
              <SearchToggleTabs />
              <SectionHeader title="近くの店舗" highlight={`${filteredSorted.length}件`} sortOption="距離順" />
            </>
          ) : (
            <div className="px-[23.991px] pt-[11.99px] pb-[15.99px]">
              <h2 className="text-[18px] font-bold leading-[28px] text-[#0a0a0a]">店舗情報</h2>
            </div>
          )}

          <div className="pb-[96px]">
            {portalLoading && (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff6b00] border-t-transparent" />
              </div>
            )}
            {portalError && !portalLoading && (
              <p className="px-6 py-8 text-center text-sm text-red-500">{portalError}</p>
            )}
            {!portalLoading && !portalError && filteredSorted.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-[#666]">
                {showExploreChrome
                  ? "この条件に合う店舗がありません。カテゴリを変えてお試しください。"
                  : "現在表示できる店舗がありません"}
              </p>
            )}
            {!portalLoading &&
              !portalError &&
              filteredSorted.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={toCardRestaurant(restaurant)}
                />
              ))}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
};

export default Home;
