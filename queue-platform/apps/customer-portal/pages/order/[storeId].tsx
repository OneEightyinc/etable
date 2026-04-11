import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

/* ─── Types ─── */
interface Category {
  id: string;
  name: string;
  order?: number;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderResponse {
  order: {
    id: string;
    storeId: string;
    tableLabel: string;
    items: CartItem[];
    totalPrice?: number;
    createdAt?: string;
  };
}

/* ─── Screens ─── */
type Screen = "menu" | "confirm" | "success";

/* ─── Component ─── */
const OrderPage: React.FC = () => {
  const router = useRouter();
  const storeId = router.query.storeId as string | undefined;
  const tableLabel = (router.query.table as string) || "";

  /* state */
  const [storeName, setStoreName] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [screen, setScreen] = useState<Screen>("menu");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [lastOrderItems, setLastOrderItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* ─── Fetch store info ─── */
  useEffect(() => {
    if (!storeId) return;
    fetch(`/api/store/public?storeId=${storeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile?.name) setStoreName(data.profile.name);
      })
      .catch(() => {});
  }, [storeId]);

  /* ─── Fetch menu ─── */
  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    fetch(`/api/menu?storeId=${storeId}`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setItems(data.items ?? []);
      })
      .catch(() => setError("メニューの読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [storeId]);

  /* ─── Cart helpers ─── */
  const cartItems = Array.from(cart.values()).filter((c) => c.quantity > 0);
  const totalCount = cartItems.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cartItems.reduce((s, c) => s + c.price * c.quantity, 0);

  function updateQuantity(item: MenuItem, delta: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      const qty = (existing?.quantity ?? 0) + delta;
      if (qty <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: qty,
        });
      }
      return next;
    });
  }

  function getQuantity(itemId: string): number {
    return cart.get(itemId)?.quantity ?? 0;
  }

  /* ─── Filtered items ─── */
  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((i) => i.categoryId === selectedCategory);

  /* ─── Submit order ─── */
  async function submitOrder() {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = orderId
        ? { orderId, items: cartItems }
        : { storeId, tableLabel, items: cartItems };
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "注文に失敗しました");
      }
      const data: OrderResponse = await res.json();
      setOrderId(data.order.id);
      setLastOrderItems([...cartItems]);
      setCart(new Map());
      setScreen("success");
    } catch (e: any) {
      setError(e.message || "注文に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  /* ─── Loading / Not ready ─── */
  if (!router.isReady || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff6b00] border-t-transparent" />
      </div>
    );
  }

  /* ─── Confirmation screen ─── */
  if (screen === "confirm") {
    return (
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white px-4 py-4">
          <button
            onClick={() => setScreen("menu")}
            className="mb-2 text-sm text-[#ff6b00]"
          >
            &larr; メニューに戻る
          </button>
          <h1 className="text-lg font-bold">注文内容の確認</h1>
          <p className="mt-1 text-sm text-gray-500">テーブル {tableLabel}</p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cartItems.map((ci) => (
            <div
              key={ci.menuItemId}
              className="mb-3 flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1">
                <p className="font-medium">{ci.name}</p>
                <p className="text-sm text-gray-500">
                  &yen;{ci.price.toLocaleString()} &times; {ci.quantity}
                </p>
              </div>
              <p className="font-bold">
                &yen;{(ci.price * ci.quantity).toLocaleString()}
              </p>
            </div>
          ))}

          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-lg font-bold">合計</span>
            <span className="text-xl font-bold text-[#ff6b00]">
              &yen;{totalPrice.toLocaleString()}
            </span>
          </div>

          {error && (
            <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Submit button */}
        <div className="sticky bottom-0 border-t bg-white p-4">
          <button
            onClick={submitOrder}
            disabled={submitting}
            className="w-full rounded-xl bg-[#ff6b00] py-4 text-lg font-bold text-white active:bg-[#e65e00] disabled:opacity-50"
          >
            {submitting ? "送信中..." : "注文を確定する"}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Success screen ─── */
  if (screen === "success") {
    return (
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center bg-white px-6 text-center">
        {/* Check icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold">ご注文ありがとうございます</h1>
        <p className="mb-6 text-gray-500">
          テーブル {tableLabel} へお届けいたします
        </p>

        {/* Order summary */}
        <div className="mb-8 w-full rounded-xl border p-4 text-left">
          {lastOrderItems.map((ci) => (
            <div
              key={ci.menuItemId}
              className="mb-2 flex justify-between text-sm"
            >
              <span>
                {ci.name} &times; {ci.quantity}
              </span>
              <span>&yen;{(ci.price * ci.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t pt-2 font-bold">
            <span>合計</span>
            <span className="text-[#ff6b00]">
              &yen;
              {lastOrderItems
                .reduce((s, c) => s + c.price * c.quantity, 0)
                .toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={() => setScreen("menu")}
          className="w-full rounded-xl border-2 border-[#ff6b00] py-4 text-lg font-bold text-[#ff6b00] active:bg-orange-50"
        >
          追加注文する
        </button>
      </div>
    );
  }

  /* ─── Menu screen (default) ─── */
  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-gray-50">
      {/* ─ Top bar ─ */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        {/* Logo + store info */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {/* ETABLE logo */}
          <div className="flex h-9 items-center">
            <span className="text-xl font-extrabold tracking-tight text-[#ff6b00]">
              ETABLE
            </span>
          </div>
        </div>

        {/* Store name + table */}
        <div className="px-4 pb-3">
          <h1 className="text-lg font-bold leading-tight">
            {storeName || storeId}
          </h1>
          <div className="mt-1 inline-block rounded-full bg-[#ff6b00] px-3 py-0.5 text-sm font-bold text-white">
            テーブル {tableLabel}
          </div>
        </div>

        {/* ─ Category tabs ─ */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-[#ff6b00] text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[#ff6b00] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─ Menu grid ─ */}
      <div className="flex-1 px-4 pt-4 pb-32">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {filteredItems.length === 0 && !error && (
          <p className="py-12 text-center text-gray-400">
            メニューがありません
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const qty = getQuantity(item.id);
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >
                {/* Image or placeholder */}
                {item.imageUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                    <span className="text-3xl font-bold text-[#ff6b00]/60">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-bold leading-tight line-clamp-2">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-1.5 text-base font-bold text-[#ff6b00]">
                    &yen;{item.price.toLocaleString()}
                  </p>

                  {/* Quantity controls */}
                  <div className="mt-2 flex items-center justify-center gap-3">
                    {qty > 0 ? (
                      <>
                        <button
                          onClick={() => updateQuantity(item, -1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#ff6b00] text-lg font-bold text-[#ff6b00] active:bg-orange-50"
                        >
                          &minus;
                        </button>
                        <span className="w-6 text-center text-lg font-bold">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item, 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6b00] text-lg font-bold text-white active:bg-[#e65e00]"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => updateQuantity(item, 1)}
                        className="flex h-9 w-full items-center justify-center rounded-full bg-[#ff6b00] text-sm font-bold text-white active:bg-[#e65e00]"
                      >
                        + 追加
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─ Cart bar (fixed bottom) ─ */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="mx-auto max-w-[430px] border-t bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            <button
              onClick={() => setScreen("confirm")}
              className="flex w-full items-center justify-between rounded-xl bg-[#ff6b00] px-5 py-4 text-white active:bg-[#e65e00]"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {totalCount}
                </span>
                <span className="text-lg font-bold">注文する</span>
              </div>
              <span className="text-lg font-bold">
                &yen;{totalPrice.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
