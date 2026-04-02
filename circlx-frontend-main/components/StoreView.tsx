
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import GlassModal from './GlassModal';
import {
  getQueue,
  updateQueueStatusApi,
  deleteQueueEntryApi,
  addToQueueApi,
  subscribeToQueue,
  type QueueEntryData,
} from '../lib/api-client';

interface StoreViewProps {
  storeId?: string;
}

const StoreView: React.FC<StoreViewProps> = ({ storeId = 'shibuya-001' }) => {
  const [customers, setCustomers] = useState<QueueEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetId: string | null;
    type: 'CANCEL' | 'HOLD';
  }>({ isOpen: false, targetId: null, type: 'CANCEL' });

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ adults: 2, children: 0, seatType: 'TABLE' as 'TABLE' | 'COUNTER' | 'EITHER' });
  const [isAdding, setIsAdding] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Initial fetch
  useEffect(() => {
    getQueue(storeId)
      .then((queue) => {
        setCustomers(queue);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [storeId]);

  // SSE subscription for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToQueue(
      storeId,
      (data) => {
        // On queue update, replace the full queue
        if (data.queue) {
          setCustomers(data.queue);
        }
      },
      (data) => {
        // On init, set the queue
        if (data.queue) {
          setCustomers(data.queue);
          setIsLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [storeId]);

  const getWaitTime = (arrival: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(arrival).getTime()) / (1000 * 60));
    return `${diff}分`;
  };

  const handleCall = async (id: string) => {
    try {
      const entry = customers.find((c) => c.id === id);
      const newStatus = entry?.status === 'CALLED' ? 'CALLED' : 'CALLED';
      await updateQueueStatusApi(id, newStatus);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleHold = (id: string) => {
    setConfirmModal({ isOpen: true, targetId: id, type: 'HOLD' });
  };

  const handleCancelRequest = (id: string) => {
    setConfirmModal({ isOpen: true, targetId: id, type: 'CANCEL' });
  };

  const confirmAction = async () => {
    try {
      if (confirmModal.type === 'CANCEL') {
        await deleteQueueEntryApi(confirmModal.targetId!);
      } else {
        await updateQueueStatusApi(confirmModal.targetId!, 'HOLD');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setConfirmModal({ isOpen: false, targetId: null, type: 'CANCEL' });
  };

  const handleAddToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addToQueueApi({
        storeId,
        adults: addForm.adults,
        children: addForm.children,
        seatType: addForm.seatType,
      });
      setShowAddForm(false);
      setAddForm({ adults: 2, children: 0, seatType: 'TABLE' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDone = async (id: string) => {
    try {
      await updateQueueStatusApi(id, 'DONE');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#082752] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans overflow-y-auto pb-[100px]">
      <header className="bg-[#082752] text-white p-6 lg:px-10 flex justify-between items-center shadow-2xl mb-6">
        <div className="flex items-center space-x-6">
          <div className="flex flex-col">
            <div className="select-none">
              <Image src="/circlx_white.svg" alt="CIRCLX" width={150} height={50} />
            </div>
          </div>
          <div className="border-l border-white/10 pl-6 hidden sm:block">
            <h1 className="text-xl font-black leading-none uppercase tracking-tighter">Waiting List</h1>
            <p className="mt-1 text-[10px] text-white/40 font-bold uppercase tracking-widest">STORE: {storeId}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <div className="bg-white/5 rounded-2xl px-6 py-2 border border-white/5 hidden sm:flex items-center space-x-6">
            <div className="text-center border-r border-white/5 pr-6">
              <span className="text-[10px] font-black text-white/40 block uppercase tracking-wider">待機中</span>
              <span className="text-xl font-bold text-white">{customers.filter((c) => c.status === 'WAITING').length}組</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black text-white/40 block uppercase tracking-wider">予測時間</span>
              <span className="text-xl font-bold text-white/80">約{customers.filter((c) => c.status === 'WAITING').length * 5}分</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#fd780f] hover:bg-[#e46a0a] text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm hidden sm:inline">受付追加</span>
          </button>
          <button className="bg-white/5 w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 lg:mx-10 mb-4 bg-red-50 text-red-600 text-sm font-bold px-5 py-3 rounded-2xl border border-red-100">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <p className="text-gray-400 font-bold">現在の待ち客はいません</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 lg:p-10">
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-[#082752]/20 border border-white relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${c.status === 'CALLED' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
              <button onClick={() => handleCancelRequest(c.id)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10" title="キャンセル">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex h-full flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-5xl font-black text-gray-900 tracking-tighter">#{c.ticketNumber}</span>
                      {c.status === 'CALLED' && <span className="bg-green-100 text-green-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">呼出中</span>}
                      {c.status === 'HOLD' && <span className="bg-orange-100 text-[#fd780f] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">保留中</span>}
                    </div>
                    <div className="flex items-center space-x-3 mt-4">
                      <div className="flex items-center space-x-1 bg-gray-100 px-4 py-2 rounded-2xl">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span className="font-bold text-gray-700">大人 {c.adults} / 子供 {c.children}</span>
                      </div>
                      <div className="bg-slate-50 text-slate-900 font-bold px-4 py-2 rounded-2xl">{c.seatType === 'TABLE' ? 'テーブル席' : c.seatType === 'COUNTER' ? 'カウンター席' : 'どちらでも可'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-400 block uppercase mb-1 tracking-widest">経過</span>
                    <span className={`text-2xl font-black tabular-nums ${parseInt(getWaitTime(c.arrivalTime)) > 15 ? 'text-red-500' : 'text-gray-900'}`}>{getWaitTime(c.arrivalTime)}</span>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-4 gap-4">
                  {c.status === 'CALLED' ? (
                    <>
                      <button onClick={() => handleDone(c.id)} className="col-span-3 py-8 rounded-[1.8rem] flex flex-col items-center justify-center space-y-2 transition-all active:scale-95 shadow-lg bg-green-500 shadow-green-200 text-white">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span className="text-2xl font-black uppercase tracking-widest">DONE</span>
                      </button>
                      <button onClick={() => handleCall(c.id)} className="col-span-1 bg-white border-2 border-green-200 rounded-[1.8rem] flex items-center justify-center text-green-500 hover:bg-green-50 transition-all active:scale-95">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                          <span className="text-[10px] font-black uppercase">Re-Call</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleCall(c.id)} className="col-span-3 py-8 rounded-[1.8rem] flex flex-col items-center justify-center space-y-2 transition-all active:scale-95 shadow-lg bg-[#082752] shadow-blue-900/10 text-white hover:bg-[#061d3e]">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        <span className="text-2xl font-black uppercase tracking-widest">CALL</span>
                      </button>
                      <button onClick={() => handleHold(c.id)} className="col-span-1 bg-white border-2 border-gray-100 rounded-[1.8rem] flex items-center justify-center text-gray-400 hover:text-[#fd780f] hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-95">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-[10px] font-black uppercase">Hold</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to queue modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setShowAddForm(false)}></div>
          <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="bg-[#082752] p-6 text-white">
              <h3 className="text-lg font-bold">新規受付</h3>
              <p className="text-white/60 text-xs">お客様情報を入力してください</p>
            </div>
            <form onSubmit={handleAddToQueue} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">大人</label>
                  <input type="number" min="0" max="20" value={addForm.adults} onChange={(e) => setAddForm({ ...addForm, adults: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#fd780f] outline-none text-center text-2xl font-black text-gray-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">子供</label>
                  <input type="number" min="0" max="20" value={addForm.children} onChange={(e) => setAddForm({ ...addForm, children: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#fd780f] outline-none text-center text-2xl font-black text-gray-900" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">席の種類</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TABLE', 'COUNTER', 'EITHER'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setAddForm({ ...addForm, seatType: type })} className={`py-3 rounded-xl font-bold text-sm transition-all ${addForm.seatType === type ? 'bg-[#082752] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      {type === 'TABLE' ? 'テーブル' : type === 'COUNTER' ? 'カウンター' : 'どちらでも'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  閉じる
                </button>
                <button type="submit" disabled={isAdding} className="flex-1 py-4 rounded-2xl font-black bg-[#fd780f] text-white shadow-xl hover:bg-[#e46a0a] transition-all active:scale-95 disabled:opacity-70">
                  {isAdding ? '追加中...' : '受付する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <GlassModal
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmAction}
          title={confirmModal.type === 'CANCEL' ? '受付をキャンセルしますか？' : '保留にしますか？'}
          message={confirmModal.type === 'CANCEL' ? 'この操作は取り消せません。お客様の順番が完全に削除されます。' : 'お客様を一時的に待機リストの最後に移動させます。'}
          confirmText={confirmModal.type === 'CANCEL' ? 'キャンセルを確定' : '保留にする'}
          isDangerous={confirmModal.type === 'CANCEL'}
        />
      )}
    </div>
  );
};

export default StoreView;
