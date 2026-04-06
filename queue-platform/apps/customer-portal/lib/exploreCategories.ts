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
  { id: "cafe", label: "カフェ", icon: "/category-cafe.svg", match: (c: string) => /カフェ|喫茶|コーヒー/.test(c) },
  {
    id: "italian",
    label: "イタリアン",
    icon: "/category-italian.svg",
    match: (c: string) => /イタリア|パスタ|ピザ|トラットリア/.test(c),
  },
  { id: "chinese", label: "中華", icon: "/category-chanese.svg", match: (c: string) => /中華|四川|広東|餃子/.test(c) },
  {
    id: "izakaya",
    label: "居酒屋",
    icon: "/category-izakaya.svg",
    match: (c: string) => /居酒屋|串|酒場/.test(c),
  },
  {
    id: "sweets",
    label: "スイーツ",
    icon: "/category-sweets.svg",
    match: (c: string) => /スイーツ|パティスリー|ケーキ|デザート/.test(c),
  },
] as const;

export type ExploreCategoryId = (typeof EXPLORE_CATEGORIES)[number]["id"];

export function filterRestaurantsByExploreCategory<T extends { category: string }>(
  list: T[],
  categoryId: ExploreCategoryId
): T[] {
  const def = EXPLORE_CATEGORIES.find((c) => c.id === categoryId);
  if (!def || def.id === "all") return list;
  return list.filter((r) => def.match(r.category || ""));
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
