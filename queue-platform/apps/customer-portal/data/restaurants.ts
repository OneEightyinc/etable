export type Restaurant = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  priceRange: string;
  distance: string;
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

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "究極の極太麺 札幌ラーメン一座",
    category: "ラーメン",
    imageUrl: "https://picsum.photos/seed/ramen1/400/300",
    rating: 4.8,
    priceRange: "¥1,000〜¥2,000",
    distance: "6.9km",
    waitingGroups: 10,
    shortestWaitMinutes: 21,
    approxWaitText: "約40分",
    tags: ["人気店", "おすすめ", "事前決済優待"],
    description: "厳選した旬の食材を使用し、心を込めた料理をご提供いたします。特別な日のお祝いにもぜひご利用ください。",
    address: "東京都中央区銀座5-5-5",
    hours: "11:00〜21:00 (L.O. 20:30)",
    menu: [
      { name: "究極の極太麺 醤油", price: "¥1,100" },
      { name: "濃厚味噌チャーシュー", price: "¥1,380" },
      { name: "炙りチャーシュー丼", price: "¥680" },
    ],
    reviews: [
      { author: "食通たなか", rating: 5, comment: "期待以上の味でした。接客も素晴らしい！" },
      { author: "ラーメンOL", rating: 4, comment: "スープが濃厚で満足感高いです。" },
      { author: "家族連れ", rating: 5, comment: "子ども連れでも利用しやすかったです。" },
    ],
  },
  {
    id: "2",
    name: "自家焙煎 カフェ・ラパン",
    category: "カフェ",
    imageUrl: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    rating: 4.2,
    priceRange: "¥500〜¥1,200",
    distance: "7.1km",
    waitingGroups: 0,
    shortestWaitMinutes: 0,
    approxWaitText: "空いています",
    tags: ["人気店", "テイクアウト"],
    description: "自家焙煎の豆で淹れるコーヒーと手作りスイーツが自慢です。",
    address: "東京都渋谷区道玄坂2-3-1",
    hours: "8:00〜19:00 (L.O. 18:30)",
    menu: [
      { name: "ブレンドコーヒー", price: "¥480" },
      { name: "カフェラテ", price: "¥520" },
      { name: "本日のケーキ", price: "¥580" },
    ],
    reviews: [
      { author: "コーヒー党", rating: 4, comment: "落ち着いた雰囲気でおいしい。" },
      { author: "在宅ワーカー", rating: 5, comment: "Wi-Fiもあり長居しやすいです。" },
    ],
  },
  {
    id: "3",
    name: "江戸前 鮨 拓海",
    category: "寿司",
    imageUrl: "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    rating: 4.9,
    priceRange: "¥5,000〜¥15,000",
    distance: "1.1km",
    waitingGroups: 3,
    shortestWaitMinutes: 19,
    approxWaitText: "約25分",
    tags: ["人気店", "高評価", "予約推奨"],
    description: "築地仕入れの鮮魚で握る江戸前寿司。カウンターで職人の技をご覧ください。",
    address: "東京都中央区築地4-2-8",
    hours: "11:30〜14:00 / 17:00〜22:00",
    menu: [
      { name: "おまかせ握り 10貫", price: "¥3,300" },
      { name: "にぎり弁当", price: "¥1,650" },
      { name: "特上にぎり", price: "¥4,500" },
    ],
    reviews: [
      { author: "寿司好き", rating: 5, comment: "鮮度抜群。また来ます。" },
      { author: "カウンター派", rating: 5, comment: "職人さんとの会話も楽しい。" },
    ],
  },
  {
    id: "4",
    name: "トラットリア・エターブル",
    category: "イタリアン",
    imageUrl: "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    rating: 4.5,
    priceRange: "¥2,000〜¥4,000",
    distance: "3.2km",
    waitingGroups: 2,
    shortestWaitMinutes: 45,
    approxWaitText: "約50分",
    tags: ["デート", "おすすめ"],
    description: "窯焼きピザとパスタが自慢のイタリアン。ワインも豊富です。",
    address: "東京都港区六本木6-1-20",
    hours: "11:30〜23:00 (L.O. 22:00)",
    menu: [
      { name: "マルゲリータピザ", price: "¥1,480" },
      { name: "ボンゴレ・ビアンコ", price: "¥1,280" },
      { name: "前菜盛り合わせ", price: "¥980" },
    ],
    reviews: [
      { author: "イタリアン好き", rating: 5, comment: "ピザが最高でした。" },
      { author: "女子会利用", rating: 4, comment: "雰囲気がよく会話も弾みました。" },
    ],
  },
  {
    id: "5",
    name: "本格焼肉 黄金の牛",
    category: "焼肉",
    imageUrl: "https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    rating: 4.7,
    priceRange: "¥3,000〜¥6,000",
    distance: "2.5km",
    waitingGroups: 5,
    shortestWaitMinutes: 36,
    approxWaitText: "約45分",
    tags: ["人気店", "宴会"],
    description: "A5黒毛和牛を中心に、厳選した肉を提供。焼肉の楽しさを存分に。",
    address: "東京都新宿区歌舞伎町1-2-3",
    hours: "17:00〜翌2:00 (L.O. 1:00)",
    menu: [
      { name: "特選カルビ", price: "¥1,980" },
      { name: "ハラミ 100g", price: "¥1,480" },
      { name: "タン塩", price: "¥1,650" },
    ],
    reviews: [
      { author: "肉好き", rating: 5, comment: "肉の質が良く、また来たい。" },
      { author: "会社飲み会幹事", rating: 4, comment: "ボリュームがあり宴会向きです。" },
    ],
  },
  {
    id: "6",
    name: "天ぷら割烹 山の辺",
    category: "和食",
    imageUrl: "https://images.pexels.com/photos/6287523/pexels-photo-6287523.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    rating: 4.8,
    priceRange: "¥2,500〜¥5,000",
    distance: "3.8km",
    waitingGroups: 6,
    shortestWaitMinutes: 53,
    approxWaitText: "約60分",
    tags: ["人気店", "おすすめ", "高評価"],
    description: "旬の食材を活かした天ぷらと割烹料理。静かな空間でおくつろぎください。",
    address: "東京都千代田区丸の内2-4-1",
    hours: "11:30〜14:30 / 17:30〜21:30",
    menu: [
      { name: "天ぷら御膳", price: "¥2,200" },
      { name: "本日の煮物", price: "¥880" },
      { name: "季節の小鉢三種", price: "¥780" },
    ],
    reviews: [
      { author: "和食好き", rating: 5, comment: "衣がサクサクでおいしい。" },
      { author: "出張族", rating: 4, comment: "接待にも使える落ち着いたお店です。" },
    ],
  },
];
