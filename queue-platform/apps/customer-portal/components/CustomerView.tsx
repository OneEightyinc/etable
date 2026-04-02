
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { subscribeToQueue, type QueueEntryData } from '@queue-platform/api';

interface CustomerViewProps {
  storeId?: string;
  entryId?: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({ storeId = 'shibuya-001', entryId }) => {
  const [isCalled, setIsCalled] = useState(false);
  const [myEntry, setMyEntry] = useState<QueueEntryData | null>(null);
  const [position, setPosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToQueue(
      storeId,
      (data) => {
        if (data.queue) {
          updateMyPosition(data.queue);
        }
        // Check if my entry was called
        if (entryId && data.entry && data.entry.id === entryId && data.entry.status === 'CALLED') {
          setIsCalled(true);
        }
      },
      (data) => {
        if (data.queue) {
          updateMyPosition(data.queue);
          setIsLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [storeId, entryId]);

  const updateMyPosition = (queue: QueueEntryData[]) => {
    if (entryId) {
      const myIdx = queue.findIndex((q) => q.id === entryId);
      if (myIdx !== -1) {
        setMyEntry(queue[myIdx]);
        setPosition(myIdx);
        setEstimatedWait(myIdx * 5);
        if (queue[myIdx].status === 'CALLED') {
          setIsCalled(true);
        }
      }
    } else {
      // Demo mode: show queue stats
      const waitingCount = queue.filter((q) => q.status === 'WAITING').length;
      setPosition(waitingCount);
      setEstimatedWait(waitingCount * 5);
      setIsLoading(false);
    }
  };

  // Fallback: if no entryId, fetch initial data
  useEffect(() => {
    if (!entryId) {
      fetch(`/api/queue?storeId=${storeId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.queue) {
            const waitingCount = data.queue.filter((q: QueueEntryData) => q.status === 'WAITING').length;
            setPosition(waitingCount);
            setEstimatedWait(waitingCount * 5);
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [storeId, entryId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3F4F6] to-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#082752] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isCalled) {
    return (
      <div className="min-h-screen bg-[#082752] flex flex-col items-center justify-center p-8 text-white overflow-hidden animate-pulse">
        <div className="relative">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-[100px] animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center text-center space-y-12">
            <div className="bg-white/5 px-10 py-8 rounded-[2.5rem] border border-white/10 flex flex-col items-center">
              <Image src="/circlx_white.svg" alt="CIRCLX" width={150} height={50} />
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-black italic tracking-tighter">CALLING</h1>
              <p className="text-2xl font-bold opacity-90">お客様の番です！</p>
            </div>
            <p className="text-xl font-medium max-w-xs bg-white/10 p-6 rounded-3xl border border-white/20">スタッフがご案内いたします。<br />店頭までお越しください。</p>
            <button onClick={() => setIsCalled(false)} className="bg-white text-[#082752] px-12 py-5 rounded-full font-black text-xl shadow-2xl active:scale-95 transition">確認しました</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F4F6] to-white relative flex flex-col items-center justify-center p-6 text-gray-900 font-sans overflow-y-auto pb-[100px]">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#082752]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#fd780f]/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center flex flex-col items-center">
          <div className="bg-white px-8 py-8 rounded-3xl inline-block shadow-2xl shadow-blue-900/5 flex flex-col items-center">
            <Image src="/circlx_white.svg" alt="CIRCLX" width={150} height={50} />
          </div>
          <h2 className="text-lg font-black tracking-tight text-slate-800 mt-2">CIRCLX CAFE</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">Waitlist Portal</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-white text-center space-y-8 relative overflow-hidden">
          {myEntry && (
            <div className="absolute top-0 right-0 p-6">
              <span className="text-xs font-inter font-black text-gray-200">#{myEntry.ticketNumber}</span>
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">現在の待ち組数</p>
            <div className="flex items-center justify-center space-x-4">
              <span className="text-8xl font-black text-[#082752] tracking-tighter">{position}</span>
              <span className="text-2xl font-black text-gray-900 mt-8">組</span>
            </div>
          </div>
          <div className="flex justify-center space-x-6 pt-4 border-t border-gray-50">
            <div className="text-center">
              <span className="text-[10px] font-black text-gray-300 block mb-1 uppercase tracking-widest">目安時間</span>
              <span className="text-xl font-black text-gray-700 font-inter tracking-tight">約{estimatedWait}分</span>
            </div>
            {myEntry && (
              <>
                <div className="w-px bg-gray-100"></div>
                <div className="text-center">
                  <span className="text-[10px] font-black text-gray-300 block mb-1 uppercase tracking-widest">人数</span>
                  <span className="text-xl font-black text-gray-700">大人{myEntry.adults}名</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-[#082752] rounded-3xl p-6 text-white shadow-xl flex items-center space-x-4">
          <div className="bg-white/10 p-3 rounded-2xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black opacity-60 mb-0.5 uppercase tracking-widest">リアルタイム更新</p>
            <p className="font-bold text-sm">順番が変わると自動で更新されます</p>
          </div>
        </div>

        <button className="w-full py-4 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-[#fd780f] transition-colors flex items-center justify-center space-x-2">
          <span>←</span>
          <span>受付をキャンセルする</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerView;
