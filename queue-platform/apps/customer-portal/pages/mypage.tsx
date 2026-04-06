import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  UserIcon,
  BellIcon,
  CreditCardIcon,
  TicketIcon,
  BoltIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import {
  fetchCustomerMe,
  saveCustomerProfileToServer,
  deleteCustomerProfileFromServer,
  tryMigrateLegacyProfile,
  clearLegacyProfileStorage,
  type CustomerProfile,
} from "../lib/customerProfile";
import { getReservations, getTransportPreference, setTransportPreference, type TransportPreference, type ReservationItem } from "../lib/storage";
import { fetchPortalRestaurant } from "../lib/portalRestaurant";
import { RESTAURANT_IMAGE_PLACEHOLDER } from "../lib/placeholders";
import {
  formatMemberDisplayId,
  memberAvatarInitial,
  formatMemberNameLine,
  tierFromMonthlyVisits,
  tierLabel,
  tierBenefit,
  displayPointsFromVisits,
  pointsProgress,
  countVisitsThisMonth,
} from "../lib/memberDisplay";

function loadWaitingReservations(): ReservationItem[] {
  if (typeof window === "undefined") return [];
  const waiting = getReservations().filter((r) => r.status === "waiting");
  const seen = new Set<string>();
  return waiting.filter((r) => {
    if (seen.has(r.restaurantId)) return false;
    seen.add(r.restaurantId);
    return true;
  });
}

const MyPage: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [transport, setTransport] = useState<TransportPreference>("public");
  const [listVersion, setListVersion] = useState(0);
  const [recentVisits, setRecentVisits] = useState<{ id: string; name: string; isoDate: string }[]>([]);
  const [visitCards, setVisitCards] = useState<
    { id: string; name: string; isoDate: string; imageUrl: string }[]
  >([]);

  const refreshLists = useCallback(() => setListVersion((v) => v + 1), []);

  useEffect(() => {
    setMounted(true);
    setTransport(getTransportPreference());
  }, []);

  useEffect(() => {
    const onFocus = () => refreshLists();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "etable_reservations" || !e.key) refreshLists();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshLists]);

  useEffect(() => {
    if (!router.isReady || !mounted) return;
    if (router.query.edit === "1") {
      const t = setTimeout(() => setEditing(true), 0);
      return () => clearTimeout(t);
    }
  }, [router.isReady, router.query.edit, mounted]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        let p = await fetchCustomerMe();
        if (!cancelled && !p) {
          const legacy = tryMigrateLegacyProfile();
          if (legacy) {
            try {
              p = await saveCustomerProfileToServer({
                displayName: legacy.displayName,
                email: legacy.email,
                phone: legacy.phone,
              });
              clearLegacyProfileStorage();
            } catch {
              if (!cancelled) {
                setDisplayName(legacy.displayName);
                setEmail(legacy.email);
                setPhone(legacy.phone);
                setProfileError(
                  "以前の端末保存データをサーバーへ移行できませんでした。内容を確認のうえ「登録する」を押してください。"
                );
              }
            }
          }
        }
        if (!cancelled && p) {
          setProfile(p);
          setDisplayName(p.displayName);
          setEmail(p.email);
          setPhone(p.phone);
        }
      } catch (e) {
        if (!cancelled) {
          setProfileError(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const all = getReservations();
    const byStore = new Map<string, { name: string; at: string }>();
    for (const r of all) {
      const prev = byStore.get(r.restaurantId);
      const t = r.createdAt;
      if (!prev || t > prev.at) {
        byStore.set(r.restaurantId, { name: r.restaurantName, at: t });
      }
    }
    setRecentVisits(
      [...byStore.entries()]
        .map(([id, v]) => ({ id, name: v.name, at: v.at }))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 10)
        .map((v) => ({
          id: v.id,
          name: v.name,
          isoDate: v.at.slice(0, 10),
        }))
    );
  }, [mounted, profile, listVersion]);

  useEffect(() => {
    if (!profile || recentVisits.length === 0) {
      setVisitCards([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const rows = await Promise.all(
        recentVisits.map(async (v) => {
          const r = await fetchPortalRestaurant(v.id);
          return {
            id: v.id,
            name: v.name,
            isoDate: v.isoDate,
            imageUrl: r?.imageUrl ?? RESTAURANT_IMAGE_PLACEHOLDER,
          };
        })
      );
      if (!cancelled) setVisitCards(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, recentVisits]);

  const visitDates = getReservations().map((r) => r.createdAt);
  const monthlyVisits = countVisitsThisMonth(visitDates);
  const tier = tierFromMonthlyVisits(monthlyVisits);
  const points = displayPointsFromVisits(monthlyVisits);
  const progress = pointsProgress(points, tier);

  const waitingReservations = useMemo(() => loadWaitingReservations(), [listVersion, profile]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || saving) return;
    setProfileError(null);
    setSaving(true);
    try {
      const p = await saveCustomerProfileToServer({
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setProfile(p);
      setEditing(false);
      void router.replace("/mypage", "/mypage", { shallow: true });
      setSavedMsg("保存しました");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutProfile = async () => {
    if (!window.confirm("ログアウトし、登録情報をサーバーから削除しますか？")) return;
    setProfileError(null);
    try {
      await deleteCustomerProfileFromServer();
      clearLegacyProfileStorage();
      setProfile(null);
      setDisplayName("");
      setEmail("");
      setPhone("");
      setEditing(false);
      void router.replace("/mypage", "/mypage", { shallow: true });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const openEdit = () => {
    setEditing(true);
    void router.replace({ pathname: "/mypage", query: { edit: "1" } }, "/mypage?edit=1", { shallow: true });
  };

  const closeEdit = () => {
    setEditing(false);
    void router.replace("/mypage", "/mypage", { shallow: true });
    if (profile) {
      setDisplayName(profile.displayName);
      setEmail(profile.email);
      setPhone(profile.phone);
    }
  };

  if (!mounted) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow bg-white pb-24 pt-16" />
        <BottomNavigation />
      </>
    );
  }

  if (profileLoading) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow bg-white pb-24 pt-16">
          <div className="mx-auto flex max-w-[393px] justify-center px-4 py-16">
            <p className="text-[14px] text-[#666]">読み込み中…</p>
          </div>
        </main>
        <BottomNavigation />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[96px] pt-16">
        <div className="px-4 pt-6">
          {profileError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-center text-[12px] text-red-700">
              {profileError}
            </p>
          )}

          {!profile || editing ? (
            <div className="pb-8">
              <h1 className="mb-4 text-[18px] font-bold text-[#222]">
                {profile ? "会員情報・プロフィールの編集" : "マイページ登録"}
              </h1>
              <form
                onSubmit={handleRegister}
                className="space-y-4 rounded-[20px] border border-[#eee] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              >
                <p className="text-[12px] leading-relaxed text-[#666]">
                  お名前は必須です。登録後は下記の会員カード・ポイント表示が利用できます。
                </p>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">お名前（表示名）*</label>
                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-[#ff6b00]"
                    placeholder="山田 太郎"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">メール（任意）</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-[#ff6b00]"
                    placeholder="example@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">電話番号（任意）</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-[#ff6b00]"
                    placeholder="09012345678"
                    autoComplete="tel"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-full bg-[#ff6b00] py-3 text-[14px] font-bold text-white disabled:opacity-60"
                  >
                    {saving ? "保存中…" : profile ? "更新する" : "登録する"}
                  </button>
                  {profile && (
                    <button
                      type="button"
                      onClick={closeEdit}
                      className="rounded-full border border-gray-300 px-4 py-3 text-[14px] font-medium text-gray-600"
                    >
                      戻る
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <>
              <section className="mb-4">
                <div className="flex items-center gap-4 rounded-[20px] border border-[#eee] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5ef] text-[22px] font-bold text-[#ff6b00]">
                      {memberAvatarInitial(profile.displayName)}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22c55e]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-bold text-[#111]">{formatMemberNameLine(profile.displayName)}</p>
                    <span className="mt-1 inline-block rounded-md bg-[#e5e5e5] px-2 py-0.5 text-[12px] font-bold text-white">
                      {tierLabel(tier)}
                    </span>
                    <p className="mt-1.5 text-[12px] text-[#999]">ID: {formatMemberDisplayId(profile.id)}</p>
                  </div>
                </div>
              </section>

              <section className="mb-4">
                <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#ff6b00] to-[#ff8c42] p-5 text-white shadow-[0_8px_24px_rgba(255,107,0,0.3)]">
                  <p className="text-[10px] font-bold tracking-wider opacity-90">MEMBERSHIP CARD</p>
                  <p className="mt-1 text-[18px] font-bold">ETABLE PASS</p>
                  <span className="absolute right-4 top-4 max-w-[200px] rounded-full bg-[#ff8c42] px-2.5 py-1 text-center text-[10px] font-bold leading-tight">
                    RANK BENEFIT {tierBenefit(tier)}
                  </span>
                  <button
                    type="button"
                    onClick={openEdit}
                    className="absolute left-4 top-[52px] text-[11px] font-bold text-white/90 underline"
                  >
                    編集
                  </button>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] opacity-90">AVAILABLE POINTS</p>
                      <p className="text-[32px] font-bold tracking-tight">
                        {points.toLocaleString()}
                        <span className="ml-1 text-[14px] font-medium">pts</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] opacity-90">Next Goal</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#ff8c42] px-3 py-1.5 text-[12px] font-bold">
                        あと {progress.remaining}pt で{progress.nextLabel}
                        <ChevronRightIcon className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <div className="flex items-center justify-between rounded-[16px] border border-[#eee] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff]">
                      <ArrowPathIcon className="h-6 w-6 text-[#2563eb]" />
                    </div>
                    <div>
                      <p className="text-[13px] text-[#666]">今月の来店数</p>
                      <p className="text-[20px] font-bold text-[#111]">{monthlyVisits} 回</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-[#111]">最近訪れたお店</h2>
                  <Link href="/mypage/history" className="text-[14px] font-bold text-[#ff6b00]">
                    履歴一覧
                  </Link>
                </div>
                {visitCards.length === 0 ? (
                  <p className="rounded-[16px] bg-[#fafafa] px-4 py-6 text-center text-[14px] text-[#7b8391]">
                    まだ来店履歴がありません
                  </p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {visitCards.map((v) => (
                      <Link
                        key={`${v.id}-${v.isoDate}`}
                        href={`/restaurant/${encodeURIComponent(v.id)}`}
                        className="min-w-[160px] overflow-hidden rounded-[16px] border border-[#e5e5e5] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      >
                        <div className="relative h-24 w-full bg-[#f0f0f0]">
                          <Image
                            src={v.imageUrl}
                            alt={v.name}
                            fill
                            className="object-cover"
                            sizes="160px"
                            unoptimized
                          />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-[13px] font-bold text-[#111]">{v.name}</p>
                          <p className="mt-1 text-[11px] text-[#999]">
                            {v.isoDate.replace(/-/g, ".")} 来店
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="mb-6">
                <h2 className="mb-3 text-[16px] font-bold text-[#111]">アプリ設定</h2>
                <div className="rounded-[16px] border border-[#eee] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <p className="mb-3 text-[14px] font-bold text-[#111]">優先する移動手段</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTransport("public");
                        setTransportPreference("public");
                      }}
                      className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-[12px] border-2 py-3 text-[14px] font-bold ${
                        transport === "public"
                          ? "border-[#ff6b00] bg-[#fff5ef] text-[#ff6b00]"
                          : "border-[#e5e5e5] bg-[#f0f0f0] text-[#b0b0b0]"
                      }`}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="6" width="20" height="10" rx="1" />
                        <rect x="10" y="8" width="4" height="3" />
                        <circle cx="6" cy="18" r="1.5" />
                        <circle cx="18" cy="18" r="1.5" />
                      </svg>
                      公共交通機関
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransport("car");
                        setTransportPreference("car");
                      }}
                      className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-[12px] border-2 py-3 text-[14px] font-bold ${
                        transport === "car"
                          ? "border-[#ff6b00] bg-[#fff5ef] text-[#ff6b00]"
                          : "border-[#e5e5e5] bg-[#f0f0f0] text-[#b0b0b0]"
                      }`}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 17h14v-5H5v5z" />
                        <path d="M5 12l2-4h10l2 4" />
                        <circle cx="7.5" cy="17" r="1.5" />
                        <circle cx="16.5" cy="17" r="1.5" />
                      </svg>
                      車
                    </button>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="mb-3 text-[16px] font-bold text-[#111]">アカウント設定</h2>
                <div className="overflow-hidden rounded-[16px] border border-[#eee] bg-white">
                  <Link
                    href="/mypage/profile"
                    className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">会員情報・プロフィールの編集</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                  <Link href="/mypage/notifications" className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <BellIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">通知設定</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                  <Link href="/mypage/payment" className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">お支払い方法の管理</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                  <Link
                    href="/mypage/coupons"
                    className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <TicketIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">保有クーポン</span>
                      <span className="rounded-full bg-[#ff6b00] px-2 py-0.5 text-[11px] font-bold text-white">
                        4
                      </span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                  <Link href="/mypage/member" className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <BoltIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">会員ステータスの詳細</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="mb-3 text-[16px] font-bold text-[#111]">サポート</h2>
                <div className="overflow-hidden rounded-[16px] border border-[#eee] bg-white">
                  <Link href="/faq" className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">よくあるご質問 (FAQ)</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                  <Link href="/contact" className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">お問い合わせ</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                  <Link href="/privacy" className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <LockClosedIcon className="h-5 w-5 text-[#666]" />
                      <span className="text-[15px] font-medium text-[#333]">プライバシーポリシー</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-[#ccc]" />
                  </Link>
                </div>
              </section>

              {waitingReservations.length > 0 && (
                <section className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[16px] font-bold text-[#111]">前予約リスト</h2>
                    <Link href="/my-reservations" className="text-[14px] font-bold text-[#ff6b00]">
                      一覧
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {waitingReservations.slice(0, 2).map((r) => (
                      <Link
                        key={r.id}
                        href={`/restaurant/${encodeURIComponent(r.restaurantId)}/status`}
                        className="block overflow-hidden rounded-[20px] border border-[#e5e5e5] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                      >
                        <div className="relative h-24 w-full bg-[#f0f0f0]">
                          <ReservationThumb restaurantId={r.restaurantId} name={r.restaurantName} />
                          <span className="absolute left-3 top-3 rounded-full bg-[#ff6b00] px-2 py-1 text-[11px] font-bold text-white">
                            順番待ち
                          </span>
                        </div>
                        <div className="p-3">
                          <p className="text-[14px] font-bold text-[#111]">{r.restaurantName}</p>
                          <p className="text-[12px] text-[#666]">
                            NO.{r.ticketNumber} あと{r.waitingGroups}組
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="pb-8">
                <button
                  type="button"
                  onClick={handleLogoutProfile}
                  className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#e5e5e5] bg-white py-3.5 text-[15px] font-bold text-[#333]"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  ログアウト
                </button>
              </section>
            </>
          )}

          {savedMsg && (
            <p className="pb-4 text-center text-[13px] font-bold text-green-600">{savedMsg}</p>
          )}
        </div>
      </main>

      <BottomNavigation />
    </>
  );
};

function ReservationThumb({ restaurantId, name }: { restaurantId: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetchPortalRestaurant(restaurantId);
      if (!cancelled) setUrl(r?.imageUrl ?? RESTAURANT_IMAGE_PLACEHOLDER);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);
  if (!url) {
    return <div className="h-full w-full animate-pulse bg-[#e5e5e5]" />;
  }
  return <Image src={url} alt={name} fill className="object-cover" sizes="360px" unoptimized />;
}

export default MyPage;
