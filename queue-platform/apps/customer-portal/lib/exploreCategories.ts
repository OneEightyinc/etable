/** 「探す」上部カテゴリ（店舗の category 文字列に部分一致）— アイコンはモック準拠の public SVG */
export const EXPLORE_CATEGORIES = [
  { id: "all", label: "すべて", icon: "/category-all.svg", match: () => true },
  {
    id: "washoku",
    label: "和食",
    icon: "/category-japanese.svg",
    match: (c: string) => /和食|割烹|懐石|天ぷら/.test(c),
  },
  { id: "sushi", label: "寿司", icon: "/category-sushi.svg", match: (c: string) => /寿司|鮨|すし/.test(c) },
  {
    id: "yakiniku",
    label: "焼肉",
    icon: "/category-yakiniku.svg",
    match: (c: string) => /焼肉|焼き肉|BBQ/.test(c),
  },
  { id: "ramen", label: "ラーメン", icon: "/category-ramen.svg", match: (c: string) => /ラーメン|麺/.test(c) },
] as const;

export type ExploreCategoryId = (typeof EXPLORE_CATEGORIES)[number]["id"];

/** 待ち時間フィルター */
export const WAIT_TIME_FILTERS = [
  { id: "any", label: "指定なし", maxMinutes: Infinity },
  { id: "soon", label: "すぐ案内", sublabel: "0〜10分", maxMinutes: 10 },
  { id: "within30", label: "30分以内", sublabel: "", maxMinutes: 30 },
  { id: "within60", label: "60分以内", sublabel: "", maxMinutes: 60 },
] as const;

export type WaitTimeFilterId = (typeof WAIT_TIME_FILTERS)[number]["id"];

export function filterRestaurantsByExploreCategory<T extends { category: string }>(
  list: T[],
  categoryId: ExploreCategoryId
): T[] {
  const def = EXPLORE_CATEGORIES.find((c) => c.id === categoryId);
  if (!def || def.id === "all") return list;
  return list.filter((r) => def.match(r.category || ""));
}

export function filterRestaurantsByWaitTime<T extends { shortestWaitMinutes: number }>(
  list: T[],
  waitTimeId: WaitTimeFilterId
): T[] {
  const def = WAIT_TIME_FILTERS.find((w) => w.id === waitTimeId);
  if (!def || def.id === "any") return list;
  return list.filter((r) => r.shortestWaitMinutes <= def.maxMinutes);
}

export function sortRestaurantsByDistance<T extends { distance: string }>(list: T[]): T[] {
  const parseKm = (d: string): number => {
    const m = d.match(/([\d.]+)\s*km/i);
    if (m) return parseFloat(m[1]);
    if (d === "—" || !d.trim()) return 999;
    return 500;
  };
  return [...list].sort((a, b) => parseKm(a.distance) - parseKm(b.distance));
}
