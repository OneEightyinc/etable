import type { Restaurant } from "../data/restaurants";
import type { StorePortalProfile } from "@queue-platform/api/src/server";
import { RESTAURANT_IMAGE_PLACEHOLDER } from "./placeholders";
import type { FavoriteItem } from "./storage";

export function portalProfileToRestaurant(p: StorePortalProfile): Restaurant {
  return {
    id: p.storeId,
    name: p.name,
    category: p.category,
    imageUrl: p.imageUrl,
    rating: p.rating,
    priceRange: p.priceRange,
    distance: p.distance,
    waitingGroups: p.waitingGroups,
    shortestWaitMinutes: p.shortestWaitMinutes,
    approxWaitText: p.approxWaitText,
    tags: p.tags,
    description: p.description,
    address: p.address,
    hours: p.hours,
    menu: p.menu.length > 0 ? p.menu : [{ name: "メニューは店舗にお問い合わせください", price: "—" }],
    reviews:
      p.reviews.length > 0
        ? p.reviews
        : [{ author: "店舗", rating: 5, comment: "順番待ちはアプリからお取りください。" }],
  };
}

export async function fetchPortalRestaurant(storeId: string): Promise<Restaurant | null> {
  const res = await fetch(`/api/store/public?storeId=${encodeURIComponent(storeId)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { profile: StorePortalProfile };
  if (!data.profile) return null;
  return portalProfileToRestaurant(data.profile);
}

/** お気用入り表示: API が取れないときは名前のみのプレースホルダ */
export function restaurantFromFavorite(fav: FavoriteItem, detail: Restaurant | null): Restaurant {
  if (detail) return detail;
  return {
    id: fav.restaurantId,
    name: fav.restaurantName,
    category: "—",
    imageUrl: RESTAURANT_IMAGE_PLACEHOLDER,
    rating: 0,
    priceRange: "—",
    distance: "—",
    waitingGroups: 0,
    shortestWaitMinutes: 0,
    approxWaitText: "—",
    tags: [],
    description: "",
    address: "",
    hours: "",
    menu: [],
    reviews: [],
  };
}
