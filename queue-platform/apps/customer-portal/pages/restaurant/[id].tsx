import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import BottomNavigation from "../../components/common/BottomNavigation";
import { getFavorites, addFavorite, removeFavorite } from "../../lib/storage";
import { useRestaurantById } from "../../lib/useRestaurantById";
import { useUserLocation, computeDistance } from "../../lib/geo";

/* ---------- Inline SVG Icons ---------- */
const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#ff6b00" : "none"} stroke={filled ? "#ff6b00" : "white"} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const StarIcon = ({ size = 14, filled = true }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFB800" : "#ddd"}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const ClockSmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2">
    <circle cx="9" cy="8" r="3.5" /><path d="M2 21a7 7 0 0 1 14 0" />
    <circle cx="18" cy="9" r="2.5" /><path d="M22 21a5 5 0 0 0-6-4.8" />
  </svg>
);
const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const SectionHeader: React.FC<{ title: string; actionLabel?: string; onAction?: () => void }> = ({ title, actionLabel, onAction }) => (
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-[15px] font-bold text-[#222]">{title}</h3>
    {actionLabel && (
      <button type="button" onClick={onAction} className="text-[13px] font-medium text-[#ff6b00]">
        {actionLabel}
      </button>
    )}
  </div>
);

const RestaurantDetail: React.FC = () => {
  const router = useRouter();
  const userLoc = useUserLocation();
  const id = router.query.id;
  const idStr = typeof id === "string" ? id : undefined;
  const { restaurant: rawRestaurant, loading } = useRestaurantById(idStr);
  const restaurant = rawRestaurant
    ? { ...rawRestaurant, distance: computeDistance(rawRestaurant.lat, rawRestaurant.lng, userLoc, rawRestaurant.distance) }
    : null;

  const [isFavorited, setIsFavorited] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (idStr) {
      setIsFavorited(getFavorites().some((f) => f.restaurantId === idStr));
    }
  }, [idStr]);

  if (!router.isReady || (idStr && loading)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[393px] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff6b00] border-t-transparent" />
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[393px] items-center justify-center bg-white px-4">
        <p className="text-center text-[14px] text-[#999]">店舗が見つかりません</p>
      </main>
    );
  }

  const handleFavoriteToggle = () => {
    if (isFavorited) {
      removeFavorite(restaurant.id);
    } else {
      addFavorite({ id: `fav_${restaurant.id}`, restaurantId: restaurant.id, restaurantName: restaurant.name });
    }
    setIsFavorited(!isFavorited);
  };

  const hasImage = restaurant.imageUrl && !restaurant.imageUrl.includes("picsum.photos");
  const menuToShow = showAllMenu ? restaurant.menu : restaurant.menu.slice(0, 3);
  const reviewsToShow = showAllReviews ? restaurant.reviews : restaurant.reviews.slice(0, 2);

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-[#fafafa] pb-[160px]">
        {/* ── Hero Image ── */}
        <div className="relative h-[300px] w-full bg-[#e5e5e5]">
          {hasImage ? (
            <img src={restaurant.imageUrl} alt={restaurant.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f0f0f0]">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
                <rect x="6" y="12" width="36" height="24" rx="4" stroke="#ccc" strokeWidth="2" />
                <circle cx="18" cy="22" r="3" fill="#ddd" />
                <path d="M6 32l10-8 6 5 8-10 12 13" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[12px] font-bold text-[#bbb]">No Image</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-black/50"
          >
            <ChevronLeftIcon />
          </button>

          {/* Share & Favorite */}
          <div className="absolute right-4 top-4 flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-black/50">
              <ShareIcon />
            </button>
            {isClient && (
              <button
                onClick={handleFavoriteToggle}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-black/50"
              >
                <HeartIcon filled={isFavorited} />
              </button>
            )}
          </div>
        </div>

        {/* ── Store Info Card (overlaps hero) ── */}
        <div className="relative z-10 -mt-14 mx-4 rounded-2xl bg-white px-5 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          {/* Category */}
          <p className="mb-1 text-[12px] font-medium text-[#999]">{restaurant.category}</p>
          {/* Name */}
          <h1 className="mb-3 text-[20px] font-bold leading-tight text-[#111]">{restaurant.name}</h1>

          {/* Rating */}
          <div className="mb-3 flex items-center gap-1.5">
            <StarIcon size={16} />
            <span className="text-[15px] font-bold text-[#222]">{restaurant.rating.toFixed(1)}</span>
            {restaurant.reviews.length > 0 && (
              <span className="text-[12px] text-[#999]">({restaurant.reviews.length}件)</span>
            )}
            <span className="mx-1 text-[12px] text-[#ddd]">|</span>
            <span className="text-[13px] text-[#666]">{restaurant.priceRange}</span>
            <span className="mx-1 text-[12px] text-[#ddd]">|</span>
            <span className="text-[13px] text-[#666]">{restaurant.distance}</span>
          </div>

          {/* Tags */}
          {restaurant.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {restaurant.tags.map((tag, i) => (
                <span key={i} className="rounded-full bg-[#fff5ef] px-2.5 py-1 text-[11px] font-semibold text-[#ff6b00]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Congestion Status ── */}
        <section className="mx-4 mt-4">
          <div className="rounded-2xl border border-[#FFE4D6] bg-[#fff8f4] px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <UsersIcon />
              <h3 className="text-[14px] font-bold text-[#222]">現在の混雑状況</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[13px] text-[#666]">待ち組数</p>
                <p className="text-[28px] font-bold leading-tight text-[#ff6b00]">
                  {restaurant.waitingGroups}<span className="text-[16px]">組待ち</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-[#666]">待ち時間</p>
                <p className="text-[22px] font-bold leading-tight text-[#222]">{restaurant.approxWaitText}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── おすすめメニュー ── */}
        {restaurant.menu.length > 0 && (
          <section className="mx-4 mt-6">
            <SectionHeader
              title="おすすめメニュー"
              actionLabel={restaurant.menu.length > 3 ? (showAllMenu ? "閉じる" : "全て見る") : undefined}
              onAction={() => setShowAllMenu((v) => !v)}
            />
            <div className="space-y-2">
              {menuToShow.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <span className="text-[14px] text-[#222]">{item.name}</span>
                  <span className="text-[14px] font-bold text-[#222]">{item.price}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 最近の口コミ ── */}
        {restaurant.reviews.length > 0 && (
          <section className="mx-4 mt-6">
            <SectionHeader
              title={`最近の口コミ (${restaurant.reviews.length}件)`}
              actionLabel={restaurant.reviews.length > 2 ? (showAllReviews ? "閉じる" : "全て見る") : undefined}
              onAction={() => setShowAllReviews((v) => !v)}
            />
            <div className="space-y-3">
              {reviewsToShow.map((review, i) => (
                <div key={i} className="rounded-xl bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5f5f5] text-[11px] font-bold text-[#999]">
                      {review.author.charAt(0)}
                    </div>
                    <span className="text-[12px] font-medium text-[#666]">{review.author}</span>
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(5)].map((_, si) => (
                        <StarIcon key={si} size={12} filled={si < review.rating} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#444]">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── お店のこだわり ── */}
        {restaurant.description && (
          <section className="mx-4 mt-6">
            <SectionHeader title="お店のこだわり" />
            <div className="rounded-xl bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[13px] leading-[1.8] text-[#555]">{restaurant.description}</p>
            </div>
          </section>
        )}

        {/* ── 基本情報 ── */}
        <section className="mx-4 mt-6 mb-6">
          <SectionHeader title="基本情報" />
          <div className="space-y-3 rounded-xl bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            {restaurant.address && (
              <div className="flex items-start gap-3">
                <MapPinIcon />
                <div className="flex-1">
                  <p className="mb-0.5 text-[11px] font-medium text-[#999]">住所</p>
                  <p className="text-[13px] text-[#222]">{restaurant.address}</p>
                </div>
              </div>
            )}
            {restaurant.hours && (
              <div className="flex items-start gap-3">
                <ClockSmIcon />
                <div className="flex-1">
                  <p className="mb-0.5 text-[11px] font-medium text-[#999]">営業時間</p>
                  <p className="text-[13px] text-[#222]">{restaurant.hours}</p>
                </div>
              </div>
            )}
            {restaurant.address && (
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(restaurant.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[#ff6b00]"
              >
                <MapPinIcon />
                Googleマップで開く
                <ExternalLinkIcon />
              </a>
            )}
          </div>
        </section>
      </main>

      {/* ── Sticky Reservation Button ── */}
      <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-3 pt-3">
        <div className="mx-auto w-full max-w-[393px]">
          <Link
            href={`/restaurant/${restaurant.id}/reserve`}
            className="block w-full rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ff8a33] py-4 text-center text-[16px] font-bold text-white shadow-[0_4px_16px_rgba(255,107,0,0.35)] transition hover:opacity-95"
          >
            並ばずに順番待ち
          </Link>
        </div>
      </div>

      <BottomNavigation />
    </>
  );
};

export default RestaurantDetail;
