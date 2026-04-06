import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import BottomNavigation from "../../../components/common/BottomNavigation";
import {
  getReservations,
  updateReservationStatus,
  updateReservationWait,
  type ReservationItem,
} from "../../../lib/storage";
import { useRestaurantById } from "../../../lib/useRestaurantById";

const POSTPONE_GROUPS = 3;
const POSTPONE_MINUTES = 12;

/* ---------- Inline SVG Icons ---------- */
const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d0d5dd" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><polyline points="9 18 15 12 9 6" /></svg>
);
const BellIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" className={className}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const ShareIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" className={className}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
);
const PaperAirplaneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);
const XMarkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

/* ---------- Modal Component ---------- */
interface ModalProps {
  title: string;
  confirmText: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmColor: "red" | "orange" | "green";
  children?: React.ReactNode;
}

function Modal({ title, confirmText, onClose, onConfirm, confirmColor, children }: ModalProps) {
  const bgConfirm =
    confirmColor === "red" ? "bg-[#ff2d3d]" :
    confirmColor === "green" ? "bg-[#00b900]" :
    "bg-[#ff6b00]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 sm:items-center">
      <div className="relative w-full max-w-[360px] rounded-t-[28px] bg-white px-6 py-7 shadow-[0_20px_40px_rgba(0,0,0,0.18)] sm:rounded-[28px]">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-[#9ca3af]" aria-label="閉じる">
          <XMarkIcon />
        </button>
        <h3 className="mb-4 pr-8 text-center text-[20px] font-bold text-[#111827]">{title}</h3>
        {children}
        <div className="mt-4 flex flex-col gap-3">
          <button type="button" onClick={onConfirm} className={`w-full rounded-full py-4 text-[17px] font-bold text-white ${bgConfirm}`}>
            {confirmText}
          </button>
          <button type="button" onClick={onClose} className="w-full rounded-full bg-[#f2f4f7] py-4 text-[17px] font-bold text-[#6b7280]">
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */
const ReservationStatusPage: React.FC = () => {
  const router = useRouter();
  const rid = router.query.id;
  const restaurantId = typeof rid === "string" ? rid : undefined;
  const { restaurant } = useRestaurantById(restaurantId);

  const [reservation, setReservation] = useState<ReservationItem | null>(null);
  const [livePosition, setLivePosition] = useState<number | null>(null);
  const [liveEstimatedWait, setLiveEstimatedWait] = useState<number | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [notificationMethod, setNotificationMethod] = useState<"未設定" | "メール" | "LINE">("未設定");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    const list = getReservations().filter(
      (r) => r.restaurantId === restaurantId && r.status === "waiting"
    );
    setReservation(list.length > 0 ? list[0] : null);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId || !reservation?.queueEntryId) {
      setLivePosition(null);
      setLiveEstimatedWait(null);
      return;
    }
    const entryId = reservation.queueEntryId;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/queue/position?storeId=${encodeURIComponent(restaurantId)}&entryId=${encodeURIComponent(entryId)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as { position: number; estimatedWait: number };
        if (cancelled) return;
        setLivePosition(data.position);
        setLiveEstimatedWait(data.estimatedWait);
      } catch {
        /* ignore */
      }
    };
    void tick();
    const interval = setInterval(tick, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [restaurantId, reservation?.queueEntryId]);

  const refreshReservation = () => {
    const list = getReservations().filter(
      (r) => r.restaurantId === restaurantId && r.status === "waiting"
    );
    setReservation(list.length > 0 ? list[0] : null);
  };

  const handleCancel = async () => {
    if (!reservation) return;
    if (reservation.queueEntryId) {
      try {
        await fetch("/api/queue/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: reservation.queueEntryId }),
        });
      } catch {
        /* ローカルは必ず解除する */
      }
    }
    updateReservationStatus(reservation.id, "cancelled");
    setIsCancelModalOpen(false);
    setReservation(null);
    router.push("/my-reservations");
  };

  const handleDelay = () => {
    if (!reservation) return;
    updateReservationWait(reservation.id, POSTPONE_GROUPS, POSTPONE_MINUTES);
    refreshReservation();
    setIsDelayModalOpen(false);
  };

  const handleSaveEmail = () => {
    if (!emailInput.trim()) return;
    setNotificationMethod("メール");
    setIsEmailModalOpen(false);
  };

  const handleConnectLine = () => {
    setNotificationMethod("LINE");
    setIsLineModalOpen(false);
  };

  const handleRouteGuide = () => {
    if (!restaurant?.address?.trim()) {
      alert("住所が設定されていません");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`,
      "_blank"
    );
  };

  const handleShare = async () => {
    if (!restaurant) return;
    const shareData = {
      title: restaurant.name,
      text: `${restaurant.name}の順番待ち - ETABLE`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert("リンクをコピーしました");
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* --- Empty state --- */
  if (!reservation) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
        <header className="sticky top-0 z-20 border-b border-[#f3f3f3] bg-white">
          <div className="relative flex h-[56px] items-center justify-center px-4">
            <Link href={`/restaurant/${restaurantId}`} className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]">
              <ChevronLeftIcon />
            </Link>
            <h1 className="text-[18px] font-bold text-[#111]">順番待ち</h1>
          </div>
        </header>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-[16px] text-[#666]">現在予約はありません</p>
          <Link href="/my-reservations" className="mt-4 inline-block rounded-full bg-[#ff6b00] px-6 py-3 text-[16px] font-bold text-white">
            マイ予約へ
          </Link>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  const r = reservation;
  const baselinePos = r.baselineQueuePosition ?? r.waitingGroups;
  const baselineWait = r.baselineWaitMinutes ?? r.waitMinutes;
  const waitingGroups =
    r.queueEntryId != null && livePosition != null
      ? Math.max(0, livePosition + (r.waitingGroups - baselinePos))
      : r.waitingGroups;
  const waitMinutes =
    r.queueEntryId != null && liveEstimatedWait != null
      ? Math.max(0, liveEstimatedWait + (r.waitMinutes - baselineWait))
      : r.waitMinutes;
  const shortestMinutes = restaurant?.shortestWaitMinutes ?? waitMinutes;

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px]">
        <div className="px-4 pt-6">
          {/* YOUR TICKET */}
          <section className="mb-4 rounded-[20px] border border-[#ff6b00] bg-white p-5 shadow-[0_4px_16px_rgba(255,107,0,0.12)]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12px] font-bold tracking-wider text-[#999]">YOUR TICKET</span>
              <BellIcon className="text-[#c4c4c4]" />
            </div>
            <p className="mb-2 text-[14px] font-semibold text-[#666]">お呼出番号</p>
            <p className="text-[64px] font-bold leading-none tracking-tight text-[#ff6b00]">
              {r.ticketNumber}
            </p>
          </section>

          {/* Orange Status Block */}
          <section className="mb-4 rounded-[30px] bg-[#ff6b00] px-8 py-8 text-white shadow-[0_14px_28px_rgba(255,107,0,0.22)]">
            <div className="flex items-end justify-center gap-2">
              <span className="text-[84px] font-bold leading-none tracking-[-2px]">{waitingGroups}</span>
              <span className="pb-3 text-[24px] font-bold">組待ち</span>
            </div>
            {waitingGroups === 0 && (
              <p className="-mt-1 text-center text-[15px] font-semibold text-white/95">あなたの前にお待ちの組はありません</p>
            )}
            <div className="my-7 h-px bg-white/25" />
            <div className="grid grid-cols-2 text-center">
              <div>
                <p className="mb-2 text-[12px] font-medium text-white/85">待ち時間の目安</p>
                <p className="text-[18px] font-bold">約{waitMinutes}分</p>
              </div>
              <div className="border-l border-white/25">
                <p className="mb-2 text-[12px] font-medium text-white/85">通知設定</p>
                <p className="text-[18px] font-bold">{notificationMethod}</p>
              </div>
            </div>
          </section>

          {/* Info */}
          <section className="mb-4 rounded-[20px] border border-[#eee] bg-white p-5">
            <div className="mb-3 flex items-start gap-2 text-[#333]">
              <ClockIcon className="mt-0.5 shrink-0" />
              <p className="text-[14px] font-semibold leading-relaxed">順番が近づくと通知でお知らせします。</p>
            </div>
            <div className="ml-7 flex items-center gap-2 text-[#ff6b00]">
              <PaperAirplaneIcon />
              <span className="text-[14px] font-bold">最短{shortestMinutes}分</span>
            </div>
            <p className="ml-7 text-[14px] text-[#666]">到着後すぐにご案内可能です。</p>
          </section>

          {/* Cancel Button */}
          <section className="mb-4">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full rounded-full bg-[#ff6b00] py-4 text-[16px] font-bold text-white shadow-[0_4px_12px_rgba(255,107,0,0.3)]"
            >
              順番待ちをキャンセルする
            </button>
          </section>

          {/* Route & Share */}
          <section className="mb-4 flex gap-3">
            <button
              type="button"
              onClick={handleRouteGuide}
              className="flex flex-1 items-center justify-center gap-2 rounded-[16px] border border-[#e5e5e5] bg-white py-3.5 text-[14px] font-semibold text-[#333]"
            >
              <MapPinIcon className="text-[#666]" />
              ルート案内
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-[16px] border border-[#e5e5e5] bg-white py-3.5 text-[14px] font-semibold text-[#333]"
            >
              <ShareIcon className="text-[#666]" />
              シェア
            </button>
          </section>

          {/* Delay Section */}
          <section className="mb-4 rounded-[24px] border border-[#dbe8ff] bg-[#f8fbff] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#111]">
              <ClockIcon className="text-[#2f6ee5]" />
              到着が遅れる場合
            </h3>
            <button
              type="button"
              onClick={() => setIsDelayModalOpen(true)}
              className="w-full rounded-[24px] border-2 border-[#2f80ed] bg-white py-4 text-[18px] font-bold text-[#2f80ed]"
            >
              順番を後回しにする
            </button>
            <p className="mt-3 text-center text-[14px] font-bold text-[#69a8ff]">
              ※ボタンを押すと、順番が3組分後ろに移動します。
            </p>
          </section>

          {/* Notification Methods */}
          <section className="mb-4">
            <div className="mb-3 flex items-center gap-2">
              <BellIcon className="text-[#ff6b00]" />
              <h2 className="text-[18px] font-bold text-[#111827]">通知を受け取る</h2>
            </div>
            <div className="overflow-hidden rounded-[20px] border border-[#ececec] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <button type="button" onClick={() => setIsEmailModalOpen(true)} className="flex w-full items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f7f7f7] text-[18px]">📧</div>
                  <span className="text-[16px] font-bold text-[#374151]">メール</span>
                </div>
                {notificationMethod === "メール" ? (
                  <span className="text-[13px] font-bold text-[#ff6b00]">選択中</span>
                ) : (
                  <ChevronRightIcon />
                )}
              </button>
              <div className="h-px bg-[#f2f2f2]" />
              <button type="button" onClick={() => setIsLineModalOpen(true)} className="flex w-full items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#22c55e] text-[11px] font-bold text-white">LINE</div>
                  <span className="text-[16px] font-bold text-[#374151]">LINE</span>
                </div>
                {notificationMethod === "LINE" ? (
                  <span className="text-[13px] font-bold text-[#ff6b00]">選択中</span>
                ) : (
                  <ChevronRightIcon />
                )}
              </button>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#ececec] bg-white px-4 py-4">
            <p className="text-center text-[13px] leading-relaxed text-[#6b7280]">
              周辺のおすすめスポットは現在表示していません。
            </p>
          </section>
        </div>

        <BottomNavigation />
      </main>

      {/* Modals */}
      {isCancelModalOpen && (
        <Modal
          title="キャンセルしますか？"
          confirmText="はい、キャンセルします"
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={() => void handleCancel()}
          confirmColor="red"
        />
      )}
      {isDelayModalOpen && (
        <Modal title="順番を後回しにしますか？" confirmText="はい、後回しにします" onClose={() => setIsDelayModalOpen(false)} onConfirm={handleDelay} confirmColor="orange">
          <p className="mb-4 text-center text-[14px] text-[#666]">あと{POSTPONE_GROUPS}組・約{POSTPONE_MINUTES}分お呼び出しが遅れます。</p>
        </Modal>
      )}
      {isEmailModalOpen && (
        <Modal title="メールで通知を受け取る" confirmText="設定する" onClose={() => setIsEmailModalOpen(false)} onConfirm={handleSaveEmail} confirmColor="orange">
          <input
            type="email"
            placeholder="example@mail.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="mt-3 w-full rounded-[16px] border border-[#eee] px-4 py-3 text-[16px] placeholder:text-[#b6b6b6]"
          />
        </Modal>
      )}
      {isLineModalOpen && (
        <Modal title="LINEで通知を受け取る" confirmText="LINEで受け取る" onClose={() => setIsLineModalOpen(false)} onConfirm={handleConnectLine} confirmColor="green">
          <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-[#e8f8ec] px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#22c55e] text-[11px] font-bold text-white">LINE</div>
            <span className="text-[16px] font-bold text-[#22c55e]">LINE公式を連携する</span>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ReservationStatusPage;
