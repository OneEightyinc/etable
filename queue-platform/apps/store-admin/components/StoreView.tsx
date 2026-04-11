
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/router';
import GlassModal from './GlassModal';
import {
  getQueue,
  updateQueueStatusApi,
  deleteQueueEntryApi,
  addToQueueApi,
  type QueueEntryData,
} from '@queue-platform/api';
import { storeScopedPath } from '../lib/storePaths';
import { useStoreAdminPublicToken } from '../lib/StoreAdminPublicTokenContext';
import { clearStoreAdminSession } from '../lib/storeAdminSession';

/* ─── helpers ─── */
type FilterTab = 'all' | 'hold-postpone' | 'table' | 'counter';

/** 後回し管理: guestId → 何組後に復帰するか（残りカウント） */
type PostponeMap = Record<string, number>;

function getSeatLabel(s: string) {
  if (s === 'TABLE') return 'テーブル';
  if (s === 'COUNTER') return 'カウンター';
  return 'どちらでも';
}

function elapsed(arrivalTime: string, now: Date) {
  const ms = now.getTime() - new Date(arrivalTime).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}

function fmtTimer(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `${m}:00`;
}

function formatElapsedSince(iso: string | undefined, t: Date) {
  if (!iso) return "0:00";
  const sec = Math.max(0, Math.floor((t.getTime() - new Date(iso).getTime()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ─── component ─── */
const StoreView: React.FC<{ storeId?: string; onLogout?: () => void }> = ({
  storeId: storeIdProp,
  onLogout,
}) => {
  const router = useRouter();
  const publicToken = useStoreAdminPublicToken();
  const rawStoreId = router.query.storeId;
  const storeIdFromQuery =
    router.isReady && rawStoreId
      ? (Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId)
      : undefined;
  const [sessionStoreId, setSessionStoreId] = useState<string | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const q = storeIdFromQuery?.trim();
    if (q || storeIdProp?.trim()) {
      setSessionStoreId(null);
      setSessionResolved(true);
      return;
    }
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { storeId?: string } } | null) => {
        if (cancelled) return;
        if (data?.user?.storeId) setSessionStoreId(data.user.storeId);
        setSessionResolved(true);
      })
      .catch(() => {
        if (!cancelled) setSessionResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, storeIdFromQuery, storeIdProp]);

  const storeId =
    (storeIdFromQuery && storeIdFromQuery.trim()) ||
    (storeIdProp && storeIdProp.trim()) ||
    sessionStoreId ||
    "";
  const [customers, setCustomers] = useState<QueueEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  /* UI state */
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isReceptionPaused, setIsReceptionPaused] = useState(false);
  const [waitTimeOffset, setWaitTimeOffset] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  /* modals */

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; targetId: string | null; type: 'CANCEL' | 'HOLD';
  }>({ isOpen: false, targetId: null, type: 'CANCEL' });

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ adults: 2, children: 0, seatType: 'TABLE' as 'TABLE' | 'COUNTER' | 'EITHER' });
  const [isAdding, setIsAdding] = useState(false);
  const [guidingSinceById, setGuidingSinceById] = useState<Record<string, string>>({});
  const [postponeMap, setPostponeMap] = useState<PostponeMap>({});

  /* timer（呼び出し・案内の経過表示用に1秒） */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setGuidingSinceById((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const g = customers.find((c) => c.id === id);
        if (!g || g.status !== "CALLED") {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [customers]);

  /* data fetch */
  useEffect(() => {
    if (!storeId) return;
    getQueue(storeId).then(q => { setCustomers(q); setIsLoading(false); }).catch(e => { setError(e.message); setIsLoading(false); });
  }, [storeId]);

  /* polling */
  useEffect(() => {
    if (!storeId) return;
    const i = setInterval(() => { getQueue(storeId).then(setCustomers).catch(() => {}); }, 5000);
    return () => clearInterval(i);
  }, [storeId]);

  /* derived */
  const activeGuests = customers.filter(c => !['DONE', 'CANCELLED'].includes(c.status));
  const waitingGuests = activeGuests.filter(c => c.status === 'WAITING');
  const callingGuests = activeGuests.filter(c => c.status === 'CALLED');
  const holdGuests = activeGuests.filter(c => c.status === 'HOLD');
  const nonHoldGuests = activeGuests.filter(c => c.status !== 'HOLD');

  const filteredGuests = (() => {
    if (filterTab === 'hold-postpone') return holdGuests;
    return nonHoldGuests.filter(c => {
      if (filterTab === 'table') return c.seatType === 'TABLE';
      if (filterTab === 'counter') return c.seatType === 'COUNTER';
      return true;
    });
  })();

  const estWait = (waitingGuests.length * 5) + waitTimeOffset;

  /* actions */
  const handleCall = async (id: string) => {
    try { await updateQueueStatusApi(id, 'CALLED'); } catch (e: any) { setError(e.message); }
  };
  const handleDone = async (id: string) => {
    try {
      await updateQueueStatusApi(id, "DONE");
      setGuidingSinceById((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
      // 後回しカウンタをデクリメント。0になったら自動で待機に戻す
      setPostponeMap((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const gid of Object.keys(next)) {
          next[gid] = next[gid] - 1;
          changed = true;
          if (next[gid] <= 0) {
            updateQueueStatusApi(gid, 'WAITING').catch(() => {});
            delete next[gid];
          }
        }
        return changed ? next : prev;
      });
    } catch (e: any) {
      setError(e.message);
    }
  };
  const handleHold = async (id: string) => {
    try { await updateQueueStatusApi(id, 'HOLD'); } catch (e: any) { setError(e.message); }
  };
  const handleBackToWaiting = async (id: string) => {
    try {
      await updateQueueStatusApi(id, 'WAITING');
      setPostponeMap((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch (e: any) { setError(e.message); }
  };

  /** 後回し: HOLDにして3組案内後に自動復帰 */
  const handlePostpone = async (id: string) => {
    try {
      await updateQueueStatusApi(id, 'HOLD');
      setPostponeMap((prev) => ({ ...prev, [id]: 3 }));
    } catch (e: any) { setError(e.message); }
  };
  const handleCancel = async (id: string) => {
    try { await deleteQueueEntryApi(id); } catch (e: any) { setError(e.message); }
  };

  const handleCallNext = async () => {
    const next = waitingGuests[0];
    if (next) await handleUnifiedCall(next);
  };

  const handleAddToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addToQueueApi({ storeId, adults: addForm.adults, children: addForm.children, seatType: addForm.seatType });
      setShowAddForm(false);
      setAddForm({ adults: 2, children: 0, seatType: 'TABLE' });
    } catch (e: any) { setError(e.message); }
    finally { setIsAdding(false); }
  };

  /* card menu actions */
  const handleMenuAction = async (action: string, id: string, guest?: QueueEntryData) => {
    setOpenMenuId(null);
    if (action === 'hold') await handleHold(id);
    if (action === 'postpone') await handlePostpone(id);
    if (action === 'cancel') await handleCancel(id);
    if (action === 'extend') { /* future */ }
    if (action === 'phone' && guest?.phone) {
      window.location.href = `tel:${guest.phone}`;
    }
  };

  if (!router.isReady || !sessionResolved) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#FD780F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center gap-4 px-6 text-center text-[#082752]">
        <p className="font-bold">店舗を特定できません</p>
        <p className="text-sm text-gray-600">発行された店舗用URLから開き直すか、ログインし直してください。</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#FD780F] border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ─── status helpers ─── */
  const statusBadge = (guest: QueueEntryData) => {
    if (guest.status === "CALLED") {
      if (guidingSinceById[guest.id]) {
        return (
          <span className="rounded bg-[#22C55E] px-2 py-0.5 text-[10px] font-bold text-white">案内中</span>
        );
      }
      return (
        <span className="rounded bg-[#FD780F] px-2 py-0.5 text-[10px] font-bold text-white">案内待ち</span>
      );
    }
    if (guest.status === "HOLD") {
      return <span className="rounded bg-[#FD780F] px-2 py-0.5 text-[10px] font-bold text-white">保留</span>;
    }
    return null;
  };

  const statusCardClass = (guest: QueueEntryData) => {
    if (guest.status === "CALLED" && guidingSinceById[guest.id]) {
      return "border-l-[6px] border-l-[#22C55E] bg-[#F0FDF4]";
    }
    if (guest.status === "CALLED") {
      return "border-l-[6px] border-l-[#FD780F] bg-[#FFF7ED]";
    }
    return "border-l-[6px] border-l-[#082752] bg-white";
  };

  /** 統合呼び出し: LINE/メールはシステムが自動判別 */
  const handleUnifiedCall = async (guest: QueueEntryData) => {
    try { await handleCall(guest.id); } catch {}
  };

  const actionButton = (guest: QueueEntryData) => {
    if (guest.status === "HOLD") {
      return (
        <button
          type="button"
          onClick={() => handleBackToWaiting(guest.id)}
          className="flex h-full w-[120px] flex-col items-center justify-center rounded-r-2xl bg-[#082752] text-white transition-colors hover:bg-[#0a3060]"
        >
          <svg className="mb-1 h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.49-5" />
          </svg>
          <span className="text-[11px] font-medium">待機に戻す</span>
        </button>
      );
    }
    if (guest.status === "CALLED") {
      if (!guidingSinceById[guest.id]) {
        return (
          <button
            type="button"
            onClick={() =>
              setGuidingSinceById((s) => ({ ...s, [guest.id]: new Date().toISOString() }))
            }
            className="flex h-full w-[120px] flex-col items-center justify-center rounded-r-2xl bg-[#082752] text-white transition-colors hover:bg-[#0a3060]"
          >
            <svg className="mb-1 h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
            <span className="text-[11px] font-medium">案内する</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          onClick={() => void handleDone(guest.id)}
          className="flex h-full w-[120px] flex-col items-center justify-center rounded-r-2xl bg-[#22C55E] text-white transition-colors hover:bg-[#16A34A]"
        >
          <svg className="mb-1 h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="text-xs font-bold">案内完了</span>
        </button>
      );
    }
    // WAITING: 統合呼び出しボタン（LINE/メール自動判別）
    return (
      <button onClick={() => handleUnifiedCall(guest)}
        className="h-full w-[120px] flex flex-col items-center justify-center rounded-r-2xl bg-[#082752] text-white transition-colors hover:bg-[#0a3060]">
        <svg className="w-7 h-7 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <span className="text-xs font-bold">呼び出し</span>
      </button>
    );
  };

  const menuItems = (guest: QueueEntryData) => {
    const items: { icon: string; label: string; action: string; danger?: boolean }[] = [];
    // 電話番号を3点リーダーに表示
    if (guest.phone) {
      items.push({ icon: 'phone', label: guest.phone, action: 'phone' });
    }
    if (guest.status === 'WAITING') {
      items.push({ icon: 'postpone', label: '後回しにする', action: 'postpone' });
      items.push({ icon: 'x', label: 'キャンセル', action: 'cancel', danger: true });
    }
    if (guest.status === 'CALLED') {
      items.push({ icon: 'timer', label: 'タイマーを延長する', action: 'extend' });
      items.push({ icon: 'x', label: 'キャンセル', action: 'cancel', danger: true });
    }
    if (guest.status === 'HOLD') {
      items.push({ icon: 'x', label: 'キャンセル', action: 'cancel', danger: true });
    }
    return items;
  };

  /* ─── render ─── */
  return (
    <div className="max-w-md mx-auto bg-[#F5F5F7] min-h-screen flex flex-col relative shadow-2xl">
      {/* ─── HEADER ─── */}
      <header className="bg-[#FD780F] text-white px-4 pt-4 pb-6 rounded-b-[34px] overflow-hidden relative z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/etable-logo-white.svg`} alt="ETABLE" width={120} height={24} className="h-6 w-auto" />
          <Link
            href={storeScopedPath(publicToken, "/history", storeId)}
            className="inline-flex h-10 w-[88px] items-center justify-center rounded-full bg-white text-[12px] font-semibold text-[#FD780F]"
          >
            履歴
          </Link>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-[#FFF7ED]">{waitingGuests.length}</span>
              <span className="text-lg">組待ち</span>
            </div>
            <p className="text-sm opacity-90 mt-1">予想待ち時間：約 <span className="font-semibold">{estWait}</span> 分</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center justify-center gap-2 h-[30px] px-4 bg-[#E56A0A] text-white rounded-full text-[9px] font-semibold border border-white/25">
              <span className="leading-none">呼び出し中</span>
              <span className="leading-none font-bold">{callingGuests.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── FILTER TABS ─── */}
      <div className="bg-white border-b border-gray-100 pt-2 pb-0 sticky top-0 z-[5]">
        <div className="flex">
          {([['all','すべて'],['hold-postpone','保留・後回し'],['table','テーブル'],['counter','カウンター']] as [FilterTab,string][]).map(([key, label]) => (
            <button key={key} onClick={() => setFilterTab(key)} className={`flex-1 pt-3 pb-4 text-sm font-medium transition-colors relative ${filterTab === key ? 'text-[#FD780F]' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
              {filterTab === key && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-[#FD780F] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ERROR ─── */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 text-red-600 text-sm font-bold px-5 py-3 rounded-2xl border border-red-100 flex justify-between items-center">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* ─── GUEST LIST ─── */}
      <div className="flex-1 px-4 py-4 pb-32 space-y-3 overflow-auto">
        {filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="font-bold">現在の待ち客はいません</p>
          </div>
        ) : (
          filteredGuests.map(guest => {
            const mins = elapsed(guest.arrivalTime, now);
            return (
              <div key={guest.id} className={`relative flex overflow-hidden rounded-2xl shadow-lg ${statusCardClass(guest)}`}>
                {/* left content */}
                <div className="flex-1 py-4 pl-6 pr-2">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-[24px] font-bold text-[#082752]">No.{guest.ticketNumber}</span>
                    {statusBadge(guest)}
                    {/* 後回し残りカウント表示 */}
                    {postponeMap[guest.id] && (
                      <span className="rounded bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-bold text-[#FD780F]">
                        ↩️ あと{postponeMap[guest.id]}組
                      </span>
                    )}
                    {/* 保留ボタン（No.プレート内） */}
                    {guest.status === 'WAITING' && (
                      <button
                        onClick={() => handleHold(guest.id)}
                        className="ml-1 flex h-7 items-center gap-1 rounded-full bg-gray-100 px-2.5 text-[10px] font-medium text-gray-500 transition-colors hover:bg-gray-200"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                        保留
                      </button>
                    )}
                    {/* 3-dot menu */}
                    <div className="relative ml-auto">
                      <button onClick={() => setOpenMenuId(openMenuId === guest.id ? null : guest.id)}
                        className="p-2 rounded-full transition-colors hover:bg-gray-100">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
                          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      {openMenuId === guest.id && (
                        <>
                          <div className="fixed inset-0 z-[100]" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute top-10 right-0 z-[110] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-[200px]">
                            {menuItems(guest).map((item, i) => (
                              <button key={i} onClick={() => handleMenuAction(item.action, guest.id, guest)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${item.danger ? 'hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                                {item.icon === 'postpone' && (
                                  <span className="w-5 h-5 flex items-center justify-center text-gray-900 text-base">↩️</span>
                                )}
                                {item.icon === 'phone' && (
                                  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.11 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.81.37 1.6.72 2.34a2 2 0 01-.45 2.18L8.09 9.91a16 16 0 006 6l1.67-1.24a2 2 0 012.18-.45 11.36 11.36 0 002.34.72A2 2 0 0122 16.92Z" /></svg>
                                )}
                                {item.icon === 'timer' && (
                                  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M4 13a8 8 0 108-8" /></svg>
                                )}
                                {item.icon === 'x' && (
                                  <svg className={`w-5 h-5 ${item.danger ? 'text-[#EF4444]' : 'text-gray-900'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                                )}
                                <span className={`text-sm font-medium ${item.danger ? 'text-[#EF4444]' : 'text-gray-900'}`}>{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    <span>{guest.adults + guest.children}名</span>
                    <span className="text-gray-300">|</span>
                    <span>{getSeatLabel(guest.seatType)}</span>
                  </div>
                  {/* 待機: 到着からの経過 */}
                  {guest.status === "WAITING" && (
                    <div className="mt-3 flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span
                        className={`text-sm font-bold tabular-nums ${mins > 15 ? "text-[#EF4444]" : "text-gray-600"}`}
                      >
                        {mins}分経過
                      </span>
                    </div>
                  )}
                  {guest.status === "CALLED" && guest.calledAt && !guidingSinceById[guest.id] && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex h-[29px] min-w-[140px] items-center justify-center gap-0.5 rounded-full bg-[#FFF7ED] px-2 text-[10px] font-medium text-[#082752]">
                        <svg className="mr-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span className="whitespace-nowrap">
                          呼び出しから {formatElapsedSince(guest.calledAt, now)}
                        </span>
                      </span>
                    </div>
                  )}
                  {guest.status === "CALLED" && guidingSinceById[guest.id] && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex h-[29px] min-w-[140px] items-center justify-center gap-0.5 rounded-full bg-[#DCFCE7] px-2 text-[10px] font-medium text-[#166534]">
                        <svg className="mr-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span className="whitespace-nowrap">
                          案内から {formatElapsedSince(guidingSinceById[guest.id], now)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                {/* right action */}
                <div className="flex-shrink-0">
                  {actionButton(guest)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── HOLD SECTION (すべてタブ時のみ小さく表示) ─── */}
      {holdGuests.length > 0 && filterTab !== 'hold-postpone' && (
        <div className="px-4 py-4 bg-[#F5F5F7]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-500 whitespace-nowrap">保留・後回し：{holdGuests.length}名</span>
            <div className="flex-1 h-px bg-gray-200" />
            <button onClick={() => setFilterTab('hold-postpone')} className="text-xs text-[#FD780F] font-medium">すべて表示</button>
          </div>
        </div>
      )}

      {/* ─── FAB: 次を呼び出す ─── */}
      {waitingGuests.length > 0 && !sidebarOpen && !openMenuId && (
        <div className="fixed bottom-8 right-6 z-50 max-w-md" style={{ right: 'calc(50% - 200px + 24px)' }}>
          <button onClick={handleCallNext} className="flex flex-col items-center">
            <div className="relative mb-2 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-[4px] border-white">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FD780F] shadow-[0_0_16px_rgba(253,120,15,0.6)]">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                </div>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-[#082752] text-white text-xs rounded-full font-medium">次を呼び出す</span>
          </button>
        </div>
      )}

      {/* ─── SIDEBAR ─── */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-[#FD780F]">E</span><span className="text-[#082752]">TABLE</span>
                </h1>
                <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Operating Mode */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 tracking-widest mb-3">OPERATING MODE</p>
                <div className="space-y-2">
                  <button onClick={() => setIsReceptionPaused(false)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${!isReceptionPaused ? 'bg-[#FFF7ED] border-2 border-[#FD780F] text-[#FD780F]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    <span className="font-medium">通常営業</span>
                  </button>
                  <button onClick={() => setIsReceptionPaused(true)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${isReceptionPaused ? 'bg-gray-100 border-2 border-gray-400 text-gray-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                    <span className="font-medium">受付一時停止</span>
                  </button>
                </div>
              </div>

              {/* Analysis */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 tracking-widest mb-3">ANALYSIS &amp; REPORTS</p>
                <div className="space-y-2">
                  <Link href={storeScopedPath(publicToken, "/analytics", storeId)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#082752] text-white rounded-xl hover:bg-[#0a3060] transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 13l3-3 4 4 5-5" /></svg>
                    <span className="font-medium">分析・ダッシュボード</span>
                  </Link>
                  <Link href={storeScopedPath(publicToken, "/reviews", storeId)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border-2 border-[#082752] text-[#082752] rounded-xl hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    <span className="font-medium">レビュー分析</span>
                  </Link>
                </div>
              </div>

              {/* Menu */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 tracking-widest mb-3">MENU</p>
                <div className="space-y-2">
                  <Link href={storeScopedPath(publicToken, "/menu", storeId)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#FD780F] text-white rounded-xl hover:bg-[#e46a0a] transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
                    <span className="font-medium">メニュー管理</span>
                  </Link>
                  <Link href={storeScopedPath(publicToken, "/tables", storeId)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-purple-50 text-purple-700 border-2 border-purple-300 rounded-xl hover:bg-purple-100 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="18" width="3" height="3" /></svg>
                    <span className="font-medium">テーブル・QR管理</span>
                  </Link>
                  <Link href={storeScopedPath(publicToken, "/orders", storeId)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#FD780F]/10 text-[#FD780F] border-2 border-[#FD780F] rounded-xl hover:bg-[#FD780F]/20 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></svg>
                    <span className="font-medium">注文・会計</span>
                  </Link>
                  <Link href={storeScopedPath(publicToken, "/history", storeId)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span className="font-medium text-[#082752]">案内・キャンセル履歴</span>
                  </Link>
                  <Link href={storeScopedPath(publicToken, "/settings", storeId)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l0 0a2 2 0 11-2.83 2.83l0 0A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 1.13v0a2 2 0 01-4 0v0A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l0 0a2 2 0 11-2.83-2.83l0 0A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.13-1v0a2 2 0 010-4v0A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l0 0a2 2 0 112.83-2.83l0 0A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.13v0a2 2 0 014 0v0A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l0 0a2 2 0 112.83 2.83l0 0A1.65 1.65 0 0019.4 9a1.65 1.65 0 00.33 1.82v0a2 2 0 010 4v0z" /></svg>
                    <span className="font-medium text-[#082752]">詳細設定</span>
                  </Link>
                </div>
              </div>

              {/* Finish Day */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 tracking-widest mb-3">FINISH DAY</p>
                {showEndConfirm ? (
                  <div className="bg-[#DC2626] rounded-xl p-4">
                    <p className="text-white text-sm text-center mb-4">営業を終了し集計画面へ進みます。よろしいですか？</p>
                    <div className="flex gap-2">
                      <button onClick={() => { clearStoreAdminSession(); router.push(storeScopedPath(publicToken, "/summary", storeId)); }} className="flex-1 py-3 bg-white text-[#DC2626] rounded-xl font-medium hover:bg-gray-100 transition-colors">はい</button>
                      <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowEndConfirm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#FEE2E2] text-[#DC2626] rounded-xl hover:bg-[#FECACA] transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                    <span className="font-medium">本日の営業を終了</span>
                  </button>
                )}
              </div>

              {/* Wait Time Offset */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 tracking-widest mb-3">WAIT TIME OFFSET</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-baseline justify-center gap-2 mb-4">
                    <span className="text-5xl font-bold text-[#082752]">{waitTimeOffset}</span>
                    <span className="text-sm text-gray-400 tracking-widest">MINUTES</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setWaitTimeOffset(o => o + 10)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-medium text-[#082752] hover:bg-gray-100 transition-colors">+10</button>
                    <button onClick={() => setWaitTimeOffset(o => o + 20)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-medium text-[#082752] hover:bg-gray-100 transition-colors">+20</button>
                    <button onClick={() => setWaitTimeOffset(0)} className="flex-1 py-3 bg-gray-200 rounded-xl font-medium text-gray-500 hover:bg-gray-300 transition-colors flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.49-5" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 p-6">
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  onLogout?.();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-4 text-gray-400 transition-colors hover:bg-gray-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="font-medium tracking-widest">LOGOUT</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 通知モーダル廃止: 呼び出しボタン1つで自動判別 */}

      {/* ─── ADD FORM MODAL ─── */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#FD780F] p-6 text-white">
              <h3 className="text-lg font-bold">新規受付</h3>
              <p className="text-white/60 text-xs">お客様情報を入力してください</p>
            </div>
            <form onSubmit={handleAddToQueue} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">大人</label>
                  <input type="number" min="0" max="20" value={addForm.adults} onChange={e => setAddForm({...addForm, adults: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#FD780F] outline-none text-center text-2xl font-bold text-gray-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">子供</label>
                  <input type="number" min="0" max="20" value={addForm.children} onChange={e => setAddForm({...addForm, children: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#FD780F] outline-none text-center text-2xl font-bold text-gray-900" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">席の種類</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TABLE','COUNTER','EITHER'] as const).map(type => (
                    <button key={type} type="button" onClick={() => setAddForm({...addForm, seatType: type})}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${addForm.seatType === type ? 'bg-[#082752] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      {type === 'TABLE' ? 'テーブル' : type === 'COUNTER' ? 'カウンター' : 'どちらでも'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">閉じる</button>
                <button type="submit" disabled={isAdding} className="flex-1 py-4 rounded-2xl font-bold bg-[#FD780F] text-white shadow-xl hover:bg-[#e46a0a] transition-all active:scale-95 disabled:opacity-70">
                  {isAdding ? '追加中...' : '受付する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM MODAL ─── */}
      {confirmModal.isOpen && (
        <GlassModal
          onClose={() => setConfirmModal({...confirmModal, isOpen: false})}
          onConfirm={async () => {
            if (confirmModal.type === 'CANCEL') await handleCancel(confirmModal.targetId!);
            else await handleHold(confirmModal.targetId!);
            setConfirmModal({isOpen: false, targetId: null, type: 'CANCEL'});
          }}
          title={confirmModal.type === 'CANCEL' ? '受付をキャンセルしますか？' : '保留にしますか？'}
          message={confirmModal.type === 'CANCEL' ? 'この操作は取り消せません。' : 'お客様を一時的に保留リストに移動します。'}
          confirmText={confirmModal.type === 'CANCEL' ? 'キャンセルを確定' : '保留にする'}
          isDangerous={confirmModal.type === 'CANCEL'}
        />
      )}
    </div>
  );
};

export default StoreView;
