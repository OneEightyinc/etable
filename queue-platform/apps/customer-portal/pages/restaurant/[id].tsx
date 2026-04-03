import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppHeader from "../../components/common/AppHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import { getFavorites, addFavorite, removeFavorite } from "../../lib/storage";
import { useRestaurantById } from "../../lib/useRestaurantById";

type TabType = "detail" | "menu" | "reviews";

const RestaurantDetail: React.FC = () => {
  const router = useRouter();
  const id = router.query.id;
  const idStr = typeof id === "string" ? id : undefined;
  const { restaurant, loading } = useRestaurantById(idStr);
  const [activeTab, setActiveTab] = useState<TabType>("detail");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isClient, setIsClient] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (idStr) {
      const favorites = getFavorites();
      setIsFavorited(favorites.some((f) => f.restaurantId === idStr));
    }
  }, [idStr]);

  if (!router.isReady || (idStr && loading)) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow pt-16 pb-24">
          <div className="mx-auto flex h-96 w-full max-w-[393px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FD780F] border-t-transparent" />
          </div>
        </main>
        <BottomNavigation />
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow pt-16 pb-24">
          <div className="mx-auto flex h-96 w-full max-w-[393px] items-center justify-center px-4">
            <p className="text-center text-gray-500">店舗が見つかりません</p>
          </div>
        </main>
        <BottomNavigation />
      </>
    );
  }

  const handleFavoriteToggle = () => {
    if (isFavorited) {
      removeFavorite(restaurant.id);
    } else {
      addFavorite({
        id: `fav_${restaurant.id}`,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });
    }
    setIsFavorited(!isFavorited);
  };

  const ChevronLeftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );

  const ShareIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#FD780F" : "white"} stroke={filled ? "#FD780F" : "white"} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const StarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFB800" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  const MapPinIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FD780F" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const ExternalLinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FD780F" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16 pb-24">
        <div className="mx-auto w-full max-w-[393px] bg-white">
          {/* Hero Image */}
          <div className="relative h-[248px] w-full bg-gray-200">
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
            >
              <ChevronLeftIcon />
            </button>

            {/* Share and Favorite Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors">
                <ShareIcon />
              </button>
              {isClient && (
                <button
                  onClick={handleFavoriteToggle}
                  className="bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
                >
                  <HeartIcon filled={isFavorited} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(["detail", "menu", "reviews"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center text-[14px] font-medium transition-colors ${
                  activeTab === tab
                    ? "text-[#FD780F] border-b-2 border-[#FD780F]"
                    : "text-[#999]"
                }`}
              >
                {tab === "detail" && "詳細"}
                {tab === "menu" && "メニュー"}
                {tab === "reviews" && "口コミ"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            {activeTab === "detail" && (
              <div className="space-y-6">
                {/* Category and Title */}
                <div>
                  <p className="text-[12px] text-[#999] mb-2">{restaurant.category}</p>
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-[18px] font-bold text-[#222]">{restaurant.name}</h1>
                  </div>
                </div>

                {/* Rating and Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StarIcon />
                    <span className="text-[14px] font-bold text-[#222]">
                      {restaurant.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#666]">
                    {restaurant.priceRange} · {restaurant.distance}
                  </p>
                </div>

                {/* Tags */}
                {restaurant.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {restaurant.tags.map((tag, idx) => (
                      <span key={idx} className="bg-[#f5f5f5] text-[12px] text-[#666] px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Congestion Status Card */}
                <div className="bg-[#fff8f4] border border-[#FFE4D6] rounded-lg p-4">
                  <h3 className="text-[13px] font-bold text-[#222] mb-3">混雑状況</h3>
                  <div className="space-y-2">
                    <p className="text-[14px] text-[#222]">
                      <span className="font-bold text-[#FD780F]">{restaurant.waitingGroups}組</span>が順番待ち中
                    </p>
                    <p className="text-[14px] font-bold text-[#FD780F]">
                      {restaurant.approxWaitText}
                    </p>
                  </div>
                </div>

                {/* Recommended Menu Preview */}
                <div>
                  <h3 className="text-[13px] font-bold text-[#222] mb-3">おすすめメニュー</h3>
                  <div className="space-y-2">
                    {restaurant.menu.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[13px] text-[#222]">{item.name}</span>
                        <span className="text-[13px] font-bold text-[#222]">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Reviews Preview */}
                <div>
                  <h3 className="text-[13px] font-bold text-[#222] mb-3">最近の口コミ</h3>
                  <div className="space-y-3">
                    {restaurant.reviews.slice(0, 2).map((review, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                        <p className="text-[12px] text-[#666] mb-1">{review.author}</p>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? "text-[#FFB800]" : "text-[#ddd]"}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-[13px] text-[#222]">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restaurant Details */}
                <div>
                  <h3 className="text-[13px] font-bold text-[#222] mb-3">お店のこだわり</h3>
                  <p className="text-[13px] text-[#666] leading-relaxed">{restaurant.description}</p>
                </div>

                {/* Basic Info */}
                <div>
                  <h3 className="text-[13px] font-bold text-[#222] mb-3">基本情報</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[12px] text-[#999] mb-1">住所</p>
                      <p className="text-[13px] text-[#222]">{restaurant.address}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#999] mb-1">営業時間</p>
                      <p className="text-[13px] text-[#222]">{restaurant.hours}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(restaurant.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#FD780F] text-[13px] font-medium hover:underline mt-2"
                    >
                      <MapPinIcon />
                      Google Mapsで確認
                      <ExternalLinkIcon />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "menu" && (
              <div className="space-y-3">
                <h2 className="text-[14px] font-bold text-[#222] mb-4">メニュー</h2>
                {restaurant.menu.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-b-0">
                    <span className="text-[13px] text-[#222]">{item.name}</span>
                    <span className="text-[13px] font-bold text-[#222]">{item.price}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                <h2 className="text-[14px] font-bold text-[#222] mb-4">口コミ ({restaurant.reviews.length}件)</h2>
                {restaurant.reviews.map((review, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <p className="text-[12px] text-[#666] mb-2">{review.author}</p>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? "text-[#FFB800]" : "text-[#ddd]"}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-[13px] text-[#222]">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reservation Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-4 bg-white border-t border-gray-200">
        <div className="mx-auto w-full max-w-[393px]">
          <Link href={`/restaurant/${restaurant.id}/reserve`} className="block w-full bg-[#FD780F] hover:bg-[#ff6b00] text-white font-bold py-3 px-4 rounded-lg transition-colors text-center">
            並ばずに順番待ち
          </Link>
        </div>
      </div>

      <BottomNavigation />
    </>
  );
};

export default RestaurantDetail;
