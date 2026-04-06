import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { storeScopedPath } from '../lib/storePaths';
import { useStoreAdminPublicToken } from '../lib/StoreAdminPublicTokenContext';

interface HistoryItem {
  id: string;
  ticketNumber: number;
  adults: number;
  children: number;
  seatType: 'TABLE' | 'COUNTER' | 'EITHER';
  status: 'DONE' | 'CANCELLED';
  arrivalTime: string;
  calledAt?: string;
  updatedAt: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function seatLabel(type: string): string {
  switch (type) {
    case 'TABLE': return 'テーブル';
    case 'COUNTER': return 'カウンター';
    case 'EITHER': return 'どちらでも';
    default: return type;
  }
}

function calcWaitMinutes(arrival: string, done: string): number {
  const ms = new Date(done).getTime() - new Date(arrival).getTime();
  return Math.round(ms / 60000);
}

export default function History() {
  const router = useRouter();
  const publicToken = useStoreAdminPublicToken();
  const storeId = (router.query.storeId as string) || 'shibuya-001';

  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue/history?storeId=${encodeURIComponent(storeId)}`, {
        credentials: "include",
      });
      const data = await res.json();
      setHistory(
        (data.history || []).map((h: any) => ({
          ...h,
          status: h.status === 'DONE' ? 'DONE' : 'CANCELLED',
        }))
      );
    } catch {
      // fallback empty
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRestore = async (id: string) => {
    try {
      await fetch(`/api/queue/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'WAITING' }),
      });
      // Remove from history list
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch {
      // ignore
    }
  };

  const completedCount = history.filter((item) => item.status === 'DONE').length;
  const cancelledCount = history.filter((item) => item.status === 'CANCELLED').length;
  const totalCount = history.length;

  const filteredData = history.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return item.status === 'DONE';
    if (activeTab === 'cancelled') return item.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-[#EEF2F7] px-6 py-5 z-10">
        <div className="grid grid-cols-[56px_1fr_56px] items-center">
          <Link href={storeScopedPath(publicToken, '/', storeId)} className="w-10 h-10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#0F274D]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-[22px] font-bold text-[#0F274D] text-center">案内・キャンセル履歴</h1>
          <div className="w-10 h-10" />
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-0 bg-white border-b border-[#EEF2F7]">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 h-[60px] py-0 text-[14px] font-semibold transition-colors relative flex items-center justify-center gap-2 ${
            activeTab === 'all' ? 'text-[#FD780F]' : 'text-[#98A2B3]'
          }`}
        >
          <span>すべて</span>
          <span
            className={`inline-flex items-center justify-center min-w-[30px] h-7 px-2 rounded-full text-[13px] font-bold leading-none ${
              activeTab === 'all' ? 'bg-[#FFF1E7] text-[#FD780F]' : 'bg-[#F3F4F6] text-[#98A2B3]'
            }`}
          >
            {totalCount}
          </span>
          {activeTab === 'all' && <div className="absolute bottom-1 left-1/4 right-1/4 h-1 bg-[#FD780F] rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 h-[60px] py-0 text-[14px] font-semibold transition-colors relative flex items-center justify-center gap-2 ${
            activeTab === 'completed' ? 'text-[#FD780F]' : 'text-[#98A2B3]'
          }`}
        >
          <span>案内済</span>
          <span
            className={`inline-flex items-center justify-center min-w-[30px] h-7 px-2 rounded-full text-[13px] font-bold leading-none ${
              activeTab === 'completed' ? 'bg-[#FFF1E7] text-[#FD780F]' : 'bg-[#F3F4F6] text-[#98A2B3]'
            }`}
          >
            {completedCount}
          </span>
          {activeTab === 'completed' && <div className="absolute bottom-1 left-1/4 right-1/4 h-1 bg-[#FD780F] rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex-1 h-[60px] py-0 text-[14px] font-semibold transition-colors relative flex items-center justify-center gap-2 ${
            activeTab === 'cancelled' ? 'text-[#FD780F]' : 'text-[#98A2B3]'
          }`}
        >
          <span>キャンセル</span>
          <span
            className={`inline-flex items-center justify-center min-w-[30px] h-7 px-2 rounded-full text-[13px] font-bold leading-none ${
              activeTab === 'cancelled' ? 'bg-[#FFF1E7] text-[#FD780F]' : 'bg-[#F3F4F6] text-[#98A2B3]'
            }`}
          >
            {cancelledCount}
          </span>
          {activeTab === 'cancelled' && <div className="absolute bottom-1 left-1/4 right-1/4 h-1 bg-[#FD780F] rounded-full" />}
        </button>
      </div>

      {/* History Cards */}
      <div className="space-y-3 px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#082752] border-t-transparent rounded-full" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-12 h-12 text-[#D1D5DB] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <p className="text-[#98A2B3] text-sm">履歴がありません</p>
            <p className="text-[#D1D5DB] text-xs mt-1">案内やキャンセルされたお客様がここに表示されます</p>
          </div>
        ) : (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-4xl font-bold text-[#0F274D]">#{item.ticketNumber.toString().padStart(2, '0')}</p>
                  <p className="text-xs text-[#98A2B3]">{formatTime(item.updatedAt)}</p>
                </div>
                {item.status === 'DONE' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#059669]">案内済</span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#DC2626]">キャンセル</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-[#667085]">
                <span>{item.adults + (item.children || 0)}名</span>
                <span>・</span>
                <span>{seatLabel(item.seatType)}</span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div>
                  {item.status === 'DONE' && (
                    <p className="text-xs text-[#98A2B3]">
                      待ち時間: {calcWaitMinutes(item.arrivalTime, item.calledAt || item.updatedAt)}分
                    </p>
                  )}
                  {item.status === 'CANCELLED' && (
                    <p className="text-xs text-[#DC2626]">キャンセル</p>
                  )}
                </div>
                <button
                  onClick={() => handleRestore(item.id)}
                  className="flex items-center gap-1 text-xs text-[#FD780F] font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  復元
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
