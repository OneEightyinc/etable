import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import BottomNavigation from "../../../components/common/BottomNavigation";

/* ---------- Types ---------- */
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId: string;
}

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

type Step = "menu" | "confirm" | "success";

/* ---------- Inline SVG Icons ---------- */
const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const ShoppingCartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

/* ---------- Helpers ---------- */
const formatPrice = (price: number) =>
  `¥${price.toLocaleString()}`;

/* ---------- Main Page ---------- */
const OrderPage: React.FC = () => {
  const router = useRouter();
  const rid = router.query.id;
  const restaurantId = typeof rid === "string" ? rid : undefined;

  const [step, setStep] = useState<Step>("menu");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const [tableLabel, setTableLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  /* ---------- Fetch menu ---------- */
  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/menu?storeId=${encodeURIComponent(restaurantId)}`);
        if (!res.ok) throw new Error("メニューの取得に失敗しました");
        const data = (await res.json()) as { categories: MenuCategory[]; items: MenuItem[] };
        if (cancelled) return;
        setCategories(data.categories ?? []);
        setItems(data.items ?? []);
      } catch {
        if (!cancelled) setError("メニューの読み込みに失敗しました。再度お試しください。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchMenu();
    return () => { cancelled = true; };
  }, [restaurantId]);

  /* ---------- Cart helpers ---------- */
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);

  /* ---------- Filtered items ---------- */
  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.categoryId === selectedCategory);

  /* ---------- Submit order ---------- */
  const handleSubmitOrder = async () => {
    if (!restaurantId || cartItems.length === 0 || !tableLabel.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: restaurantId,
          tableLabel: tableLabel.trim(),
          items: cartItems.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { orderNumber?: string; id?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "注文に失敗しました");
      setOrderNumber(data.orderNumber || data.id || "---");
      setStep("success");
    } catch (e) {
      console.error(e);
      alert("注文の送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Loading / Error states ---------- */
  if (!router.isReady || (restaurantId && loading)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[393px] items-center justify-center bg-white p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff6b00] border-t-transparent" />
      </main>
    );
  }

  if (error || !restaurantId) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
        <header className="sticky top-0 z-20 border-b border-[#f3f3f3] bg-white">
          <div className="relative flex h-[56px] items-center justify-center px-4">
            <Link href={`/restaurant/${restaurantId || ""}`} className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]">
              <ChevronLeftIcon />
            </Link>
            <h1 className="text-[18px] font-bold text-[#111]">メニュー注文</h1>
          </div>
        </header>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-[16px] text-[#666]">{error || "店舗情報が見つかりません"}</p>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  /* ========== SUCCESS SCREEN ========== */
  if (step === "success") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
        <header className="sticky top-0 z-20 border-b border-[#f3f3f3] bg-white">
          <div className="relative flex h-[56px] items-center justify-center px-4">
            <h1 className="text-[18px] font-bold text-[#111]">注文完了</h1>
          </div>
        </header>

        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <CheckCircleIcon />
          <h2 className="mt-6 text-[22px] font-bold text-[#111]">ご注文ありがとうございます</h2>
          <p className="mt-3 text-[14px] text-[#666]">注文を受け付けました。しばらくお待ちください。</p>

          <div className="mt-6 w-full rounded-[20px] border border-[#ff6b00] bg-white p-6 shadow-[0_4px_16px_rgba(255,107,0,0.12)]">
            <p className="text-[12px] font-bold tracking-wider text-[#999]">注文番号</p>
            <p className="mt-1 text-[48px] font-bold leading-none tracking-tight text-[#ff6b00]">
              {orderNumber}
            </p>
          </div>

          <Link
            href={`/restaurant/${restaurantId}`}
            className="mt-8 block w-full rounded-full bg-[#ff6b00] py-4 text-center text-[17px] font-bold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]"
          >
            店舗ページに戻る
          </Link>
        </div>

        <BottomNavigation />
      </main>
    );
  }

  /* ========== CONFIRM SCREEN ========== */
  if (step === "confirm") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
        <header className="sticky top-0 z-20 border-b border-[#f3f3f3] bg-white">
          <div className="relative flex h-[56px] items-center justify-center px-4">
            <button
              type="button"
              onClick={() => setStep("menu")}
              className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]"
            >
              <ChevronLeftIcon />
            </button>
            <h1 className="text-[18px] font-bold text-[#111]">注文内容の確認</h1>
          </div>
        </header>

        <div className="px-4 pt-6">
          {/* Table label input */}
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block h-[18px] w-[5px] rounded-full bg-[#ff6b00]" />
              <h2 className="text-[16px] font-bold text-[#111]">テーブル番号</h2>
            </div>
            <input
              type="text"
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
              placeholder="例：A-3、12番"
              className="w-full rounded-[16px] border border-[#eee] px-4 py-3.5 text-[16px] outline-none placeholder:text-[#ccc] focus:border-[#ff6b00]"
            />
          </section>

          {/* Order summary */}
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block h-[18px] w-[5px] rounded-full bg-[#ff6b00]" />
              <h2 className="text-[16px] font-bold text-[#111]">注文内容</h2>
            </div>
            <div className="rounded-[20px] border border-[#f0f0f0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              {cartItems.map((item, idx) => (
                <div
                  key={item.menuItemId}
                  className={`flex items-center justify-between px-5 py-4 ${
                    idx < cartItems.length - 1 ? "border-b border-[#f3f3f3]" : ""
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-[#111]">{item.name}</p>
                    <p className="mt-0.5 text-[13px] text-[#999]">
                      {formatPrice(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-[15px] font-bold text-[#111]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="border-t border-[#eee] px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-[16px] font-bold text-[#111]">合計</p>
                  <p className="text-[20px] font-bold text-[#ff6b00]">{formatPrice(totalPrice)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Confirm button */}
          <section className="pb-8">
            <button
              type="button"
              onClick={() => void handleSubmitOrder()}
              disabled={!tableLabel.trim() || submitting}
              className={`block w-full rounded-full py-4 text-center text-[17px] font-bold text-white transition shadow-[0_4px_14px_rgba(255,107,0,0.35)] ${
                tableLabel.trim() && !submitting
                  ? "bg-[#ff6b00] hover:opacity-95"
                  : "cursor-not-allowed bg-[#d4d4d8]"
              }`}
            >
              {submitting ? "送信中…" : "注文を確定する"}
            </button>
          </section>
        </div>

        <BottomNavigation />
      </main>
    );
  }

  /* ========== MENU SCREEN (default) ========== */
  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[160px]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#f3f3f3] bg-white">
        <div className="relative flex h-[56px] items-center justify-center px-4">
          <Link
            href={`/restaurant/${restaurantId}`}
            className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-[18px] font-bold text-[#111]">メニュー注文</h1>
        </div>
      </header>

      {/* Category tabs */}
      <div className="sticky top-[56px] z-10 border-b border-[#f3f3f3] bg-white">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              selectedCategory === "all"
                ? "bg-[#ff6b00] text-white"
                : "bg-[#f5f5f5] text-[#666]"
            }`}
          >
            すべて
          </button>
          {categories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[#ff6b00] text-white"
                    : "bg-[#f5f5f5] text-[#666]"
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className="px-4 pt-4">
        {filteredItems.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-[14px] text-[#999]">メニューがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const qty = cart[item.id]?.quantity ?? 0;
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[20px] border border-[#f0f0f0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="relative h-[120px] w-full bg-[#f9f9f9]">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[120px] w-full items-center justify-center bg-[#f9f9f9]">
                      <span className="text-[32px]">🍽</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-[14px] font-bold leading-tight text-[#111]">{item.name}</p>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#999]">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-2 text-[15px] font-bold text-[#ff6b00]">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="mt-2 flex items-center justify-between">
                      {qty > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#e7e7ef] bg-white text-[#9ca3af]"
                          >
                            <MinusIcon />
                          </button>
                          <span className="text-[16px] font-bold text-[#111]">{qty}</span>
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ff6b00] text-white"
                          >
                            <PlusIcon />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="flex h-[32px] w-full items-center justify-center rounded-full bg-[#ff6b00] text-[13px] font-bold text-white"
                        >
                          追加
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart summary bar (fixed bottom, slides up when items in cart) */}
      <div
        className={`fixed bottom-[76px] left-0 right-0 z-20 transition-transform duration-300 ${
          totalItems > 0 ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto w-full max-w-[393px] border-t border-[#f3f3f3] bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#666]">
              <ShoppingCartIcon />
              <span className="text-[14px] font-semibold">{totalItems}点</span>
            </div>
            <p className="text-[18px] font-bold text-[#111]">{formatPrice(totalPrice)}</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="block w-full rounded-full bg-[#ff6b00] py-3.5 text-center text-[16px] font-bold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]"
          >
            注文を確定する
          </button>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
};

export default OrderPage;
