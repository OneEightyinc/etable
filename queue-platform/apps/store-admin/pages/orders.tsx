import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { storeScopedPath } from '../lib/storePaths';
import { useStoreAdminPublicToken } from '../lib/StoreAdminPublicTokenContext';

type OrderStatus = 'ORDERED' | 'PREPARING' | 'SERVED' | 'PAID';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  tableLabel: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount?: number;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDERED: '注文済み',
  PREPARING: '準備中',
  SERVED: '提供済み',
  PAID: '会計済み',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  ORDERED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  SERVED: 'bg-green-100 text-green-700',
  PAID: 'bg-gray-100 text-gray-500',
};

type FilterTab = 'ALL' | OrderStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'すべて' },
  { key: 'ORDERED', label: '注文済み' },
  { key: 'PREPARING', label: '準備中' },
  { key: 'SERVED', label: '提供済み' },
  { key: 'PAID', label: '会計済み' },
];

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export default function OrdersPage() {
  const router = useRouter();
  const publicToken = useStoreAdminPublicToken();
  const storeId = (router.query.storeId as string) || 'shibuya-001';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const fetchOrders = () => {
    fetch(`${basePath}/api/orders?storeId=${encodeURIComponent(storeId)}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const updateStatus = async (orderId: string, status: OrderStatus, paidAmount?: number) => {
    setIsUpdating(orderId);
    try {
      const body: Record<string, unknown> = { orderId, status };
      if (paidAmount !== undefined) {
        body.paidAmount = paidAmount;
      }
      await fetch(`${basePath}/api/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      fetchOrders();
    } catch {
      // silently fail
    } finally {
      setIsUpdating(null);
    }
  };

  const handleBillingConfirm = () => {
    if (!billingOrder) return;
    const paid = Number(paidAmountInput);
    if (isNaN(paid) || paid < billingOrder.total) return;
    updateStatus(billingOrder.id, 'PAID', paid).then(() => {
      setBillingOrder(null);
      setPaidAmountInput('');
    });
  };

  const openBillingModal = (order: Order) => {
    setBillingOrder(order);
    setPaidAmountInput(String(order.total));
  };

  const filteredOrders = activeTab === 'ALL' ? orders : orders.filter((o) => o.status === activeTab);

  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const dailySales = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const paidCount = paidOrders.length;

  const change =
    billingOrder && paidAmountInput
      ? Math.max(0, Number(paidAmountInput) - billingOrder.total)
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#082752] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between z-10">
        <Link
          href={storeScopedPath(publicToken, '/', storeId)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-[#082752]">注文・会計</h1>
        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-32 space-y-6 max-w-md mx-auto">
        {/* Daily Sales Summary */}
        <div className="bg-[#082752] rounded-[32px] p-5 text-white">
          <p className="text-xs font-medium opacity-70 mb-1">本日の売上</p>
          <p className="text-2xl font-bold">{formatYen(dailySales)}</p>
          <p className="text-xs opacity-70 mt-2">会計済み件数: {paidCount}件</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#FD780F] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Order Cards */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">注文がありません</div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-[32px] p-5 border border-gray-100 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-[#082752]">{order.tableLabel}</span>
                    <span className="text-xs text-gray-400">{formatTime(order.createdAt)}</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-gray-600">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatYen(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-400">合計（税込）</span>
                  <span className="text-base font-bold text-[#082752]">{formatYen(order.total)}</span>
                </div>

                {/* Action buttons */}
                <div>
                  {order.status === 'ORDERED' && (
                    <button
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      disabled={isUpdating === order.id}
                      className="w-full py-3 rounded-2xl bg-[#FD780F] text-white text-sm font-bold shadow-lg shadow-[#FD780F]/20 hover:bg-[#e46a0a] transition active:scale-95 disabled:opacity-50"
                    >
                      {isUpdating === order.id ? '更新中...' : '準備開始'}
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateStatus(order.id, 'SERVED')}
                      disabled={isUpdating === order.id}
                      className="w-full py-3 rounded-2xl bg-green-500 text-white text-sm font-bold shadow-lg shadow-green-500/20 hover:bg-green-600 transition active:scale-95 disabled:opacity-50"
                    >
                      {isUpdating === order.id ? '更新中...' : '提供済み'}
                    </button>
                  )}
                  {order.status === 'SERVED' && (
                    <button
                      onClick={() => openBillingModal(order)}
                      disabled={isUpdating === order.id}
                      className="w-full py-3 rounded-2xl bg-[#082752] text-white text-sm font-bold shadow-lg shadow-[#082752]/20 hover:bg-[#0a3068] transition active:scale-95 disabled:opacity-50"
                    >
                      会計
                    </button>
                  )}
                  {order.status === 'PAID' && (
                    <div className="text-center text-sm font-bold text-gray-400 py-2">会計済み ✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing Modal */}
      {billingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={() => {
              setBillingOrder(null);
              setPaidAmountInput('');
            }}
          />

          {/* Content */}
          <div className="glass w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden bg-white">
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-bold text-[#082752] text-center">会計</h3>

              {/* Order info */}
              <div className="text-sm text-gray-500">
                <p className="font-bold text-[#082752] mb-2">{billingOrder.tableLabel}</p>
                <div className="space-y-1">
                  {billingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatYen(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal / Tax / Total */}
              <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>小計</span>
                  <span>{formatYen(billingOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>消費税</span>
                  <span>{formatYen(billingOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#082752]">
                  <span>合計</span>
                  <span>{formatYen(billingOrder.total)}</span>
                </div>
              </div>

              {/* Paid amount input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">受取金額</label>
                <input
                  type="number"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-right text-lg font-bold text-[#082752] focus:outline-none focus:ring-2 focus:ring-[#FD780F] focus:border-transparent"
                  min={billingOrder.total}
                  placeholder="0"
                />
              </div>

              {/* Change */}
              <div className="flex justify-between items-center bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-sm font-bold text-gray-500">おつり</span>
                <span className="text-lg font-bold text-[#FD780F]">{formatYen(change)}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleBillingConfirm}
                  disabled={
                    isUpdating === billingOrder.id ||
                    !paidAmountInput ||
                    Number(paidAmountInput) < billingOrder.total
                  }
                  className="w-full py-4 rounded-2xl bg-[#FD780F] text-white font-bold shadow-lg shadow-[#FD780F]/20 hover:bg-[#e46a0a] transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating === billingOrder.id ? '処理中...' : '会計完了'}
                </button>
                <button
                  onClick={() => {
                    setBillingOrder(null);
                    setPaidAmountInput('');
                  }}
                  className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
