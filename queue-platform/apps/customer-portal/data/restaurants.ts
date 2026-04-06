/** 店舗カード・詳細で使う型（実データは API / 店舗設定から取得） */
export type Restaurant = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  priceRange: string;
  distance: string;
  lat: number | null;
  lng: number | null;
  waitingGroups: number;
  shortestWaitMinutes: number;
  approxWaitText: string;
  tags: string[];
  description: string;
  address: string;
  hours: string;
  menu: { name: string; price: string }[];
  reviews: { author: string; rating: number; comment: string }[];
};

/** デモ用リストは廃止（ホームは storeId 指定または空状態） */
export const restaurants: Restaurant[] = [];
