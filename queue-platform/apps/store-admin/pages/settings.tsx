import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface BusinessHour {
  id: string;
  days: string;
  hours: string;
}

interface ClosedDay {
  id: string;
  day: string;
}

interface StoreSettings {
  storeId: string;
  businessHours: BusinessHour[];
  closedDays: ClosedDay[];
  isReceptionOpen: boolean;
  isTodayException: boolean;
  callMessage: string;
  autoCancelMinutes: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const storeId = (router.query.storeId as string) || 'shibuya-001';

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [isReceptionOpen, setIsReceptionOpen] = useState(true);
  const [isTodayException, setIsTodayException] = useState(false);
  const [message, setMessage] = useState('番号 {number} のお客様、ご来店をお願いいたします。');
  const [autoCancelMinutes, setAutoCancelMinutes] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Add business hour modal
  const [showAddHour, setShowAddHour] = useState(false);
  const [newHourDays, setNewHourDays] = useState('');
  const [newHourStart, setNewHourStart] = useState('10:00');
  const [newHourEnd, setNewHourEnd] = useState('20:00');

  // Add closed day modal
  const [showAddClosed, setShowAddClosed] = useState(false);
  const [newClosedDay, setNewClosedDay] = useState('');

  useEffect(() => {
    fetch(`/api/settings?storeId=${storeId}`)
      .then(res => res.json())
      .then(data => {
        const s = data.settings;
        setBusinessHours(s.businessHours || []);
        setClosedDays(s.closedDays || []);
        setIsReceptionOpen(s.isReceptionOpen ?? true);
        setIsTodayException(s.isTodayException ?? false);
        setMessage(s.callMessage || '番号 {number} のお客様、ご来店をお願いいたします。');
        setAutoCancelMinutes(s.autoCancelMinutes || 10);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [storeId]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          businessHours,
          closedDays,
          isReceptionOpen,
          isTodayException,
          callMessage: message,
          autoCancelMinutes,
        }),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
      setSaveMessage('保存しました');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err: any) {
      setSaveMessage(err.message || 'エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBusinessHour = (id: string) => {
    setBusinessHours(businessHours.filter(bh => bh.id !== id));
  };

  const handleDeleteClosedDay = (id: string) => {
    setClosedDays(closedDays.filter(cd => cd.id !== id));
  };

  const handleAddBusinessHour = () => {
    if (!newHourDays) return;
    const newItem: BusinessHour = {
      id: Date.now().toString(),
      days: newHourDays,
      hours: `${newHourStart}〜${newHourEnd}`,
    };
    setBusinessHours([...businessHours, newItem]);
    setShowAddHour(false);
    setNewHourDays('');
    setNewHourStart('10:00');
    setNewHourEnd('20:00');
  };

  const handleAddClosedDay = () => {
    if (!newClosedDay) return;
    const newItem: ClosedDay = {
      id: Date.now().toString(),
      day: newClosedDay,
    };
    setClosedDays([...closedDays, newItem]);
    setShowAddClosed(false);
    setNewClosedDay('');
  };

  const previewMessage = message.replace('{number}', '12');

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
        <div className="w-8" />
        <h1 className="text-base font-bold text-[#082752]">設定</h1>
        <Link
          href={`/?storeId=${storeId}`}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Link>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-32 space-y-6 max-w-md mx-auto">
        {/* 営業情報 Section */}
        <div>
          <h2 className="text-sm font-bold text-[#082752]">営業情報</h2>
          <div className="space-y-4 mt-4">
            {businessHours.map(bh => (
              <div key={bh.id} className="bg-white rounded-[32px] p-5 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{bh.days}</p>
                  <p className="text-base font-semibold text-[#082752]">{bh.hours}</p>
                </div>
                <button
                  onClick={() => handleDeleteBusinessHour(bh.id)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 hover:text-gray-500">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 16H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAddHour(true)}
            className="w-full py-4 border border-dashed border-gray-300 rounded-[32px] text-sm text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors mt-4"
          >
            <span>＋</span>
            <span>営業時間追加</span>
          </button>
        </div>

        {/* Add Business Hour Modal */}
        {showAddHour && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-base font-bold text-[#082752] mb-4">営業時間を追加</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">曜日</label>
                  <input
                    type="text"
                    value={newHourDays}
                    onChange={e => setNewHourDays(e.target.value)}
                    placeholder="例: 月・火・水・木・金"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FD780F]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">開始</label>
                    <input
                      type="time"
                      value={newHourStart}
                      onChange={e => setNewHourStart(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FD780F]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">終了</label>
                    <input
                      type="time"
                      value={newHourEnd}
                      onChange={e => setNewHourEnd(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FD780F]"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddHour(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-[#082752]">
                  キャンセル
                </button>
                <button onClick={handleAddBusinessHour} className="flex-1 py-3 rounded-2xl bg-[#082752] text-sm font-medium text-white">
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 定休日 Section */}
        <div>
          <h2 className="text-sm font-semibold text-[#082752]">定休日</h2>
          <div className="space-y-4 mt-4">
            {closedDays.map(cd => (
              <div key={cd.id} className="bg-white rounded-[32px] p-5 border border-gray-100 flex items-center justify-between">
                <p className="text-sm text-[#082752]">{cd.day}</p>
                <button
                  onClick={() => handleDeleteClosedDay(cd.id)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 hover:text-gray-500">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 16H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAddClosed(true)}
            className="w-full py-4 border border-dashed border-gray-300 rounded-[32px] text-sm text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors mt-4"
          >
            <span>＋</span>
            <span>定休日を追加</span>
          </button>
        </div>

        {/* Add Closed Day Modal */}
        {showAddClosed && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-base font-bold text-[#082752] mb-4">定休日を追加</h3>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">定休日</label>
                <input
                  type="text"
                  value={newClosedDay}
                  onChange={e => setNewClosedDay(e.target.value)}
                  placeholder="例: 毎週月曜日, 第3水曜日"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FD780F]"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddClosed(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-[#082752]">
                  キャンセル
                </button>
                <button onClick={handleAddClosedDay} className="flex-1 py-3 rounded-2xl bg-[#082752] text-sm font-medium text-white">
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 受付設定 Section */}
        <div>
          <h2 className="text-sm font-semibold text-[#082752]">受付設定</h2>
          <div className="bg-white rounded-[32px] p-5 border border-gray-100 space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-[#082752]">順番待ち受付</p>
                <p className="text-xs text-gray-500">新規の順番待ち受付を停止します</p>
              </div>
              <button
                onClick={() => setIsReceptionOpen(!isReceptionOpen)}
                className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                  isReceptionOpen ? 'bg-[#082752]' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={isReceptionOpen}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isReceptionOpen ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-[#082752]">本日の受付停止（例外）</p>
                <p className="text-xs text-gray-500">OFFにすると、本日の受付を例外的に停止します</p>
              </div>
              <button
                onClick={() => setIsTodayException(!isTodayException)}
                className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                  isTodayException ? 'bg-[#082752]' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={isTodayException}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isTodayException ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* メッセージ設定 Section */}
        <div>
          <h2 className="text-sm font-semibold text-[#082752]">メッセージ設定</h2>
          <div className="bg-white rounded-[32px] p-5 border border-gray-100 space-y-4 mt-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">呼び出しメッセージ</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 text-sm text-gray-700 outline-none resize-none leading-relaxed w-full"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#FD780F]">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>プレビュー</span>
              </div>
              <div className="bg-[#082752] rounded-[32px] px-6 py-5 text-white text-sm leading-relaxed shadow-sm">
                <p className="font-medium mb-1">{previewMessage}</p>
                <p className="text-xs text-white/70">スタッフまでお声がけください。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 自動ルール設定 Section */}
        <div>
          <h2 className="text-sm font-semibold text-[#082752]">自動ルール設定</h2>
          <div className="bg-white rounded-[32px] p-5 border border-gray-100 mt-4">
            <label className="text-xs text-gray-500 mb-2 block">自動キャンセルに移行する時間（分）</label>
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="number"
                value={autoCancelMinutes}
                onChange={(e) => setAutoCancelMinutes(parseInt(e.target.value) || 0)}
                className="flex-1 text-sm text-[#082752] bg-transparent outline-none text-center"
                min="1"
                max="120"
              />
              <span className="text-xs text-gray-400">分</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        <div className="max-w-md mx-auto">
          {saveMessage && (
            <div className={`text-center text-sm font-medium mb-2 ${saveMessage === '保存しました' ? 'text-green-600' : 'text-red-500'}`}>
              {saveMessage}
            </div>
          )}
          <div className="flex gap-3">
            <Link
              href={`/?storeId=${storeId}`}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-[#082752] bg-white text-center hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-2xl bg-[#082752] text-sm font-medium text-white hover:bg-[#0a3366] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
