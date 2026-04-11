import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  tierLabel,
  tierBenefit,
  tierBenefitList,
  pointsProgress,
  nextTierLabel,
  pointActionLabel,
  countVisitsThisMonth,
  type MemberTier,
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
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState<MemberTier>("BRONZE");
  const [referralCode, setReferralCode] = useState("");
  const [pointHistory, setPointHistory] = useState<{ id: string; action: string; points: number; description: string; createdAt: string }[]>([]);
  const [referralInput, setReferralInput] = useState("");
  const [referralMsg, setReferralMsg] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
          setAvatarUrl(p.avatarUrl ?? "");
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

  // ポイントデータをサーバーから取得
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/customer/points?customerId=${profile.id}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setTotalPoints(data.totalPoints ?? 0);
        setCurrentTier(data.currentTier ?? "BRONZE");
        setReferralCode(data.referralCode ?? "");
        setPointHistory(data.history ?? []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [profile, listVersion]);

  const visitDates = getReservations().map((r) => r.createdAt);
  const monthlyVisits = countVisitsThisMonth(visitDates);
  const progress = pointsProgress(totalPoints, currentTier);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);
    try {
      // 画像をリサイズしてBase64に変換（最大200x200）
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = document.createElement("img");
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            const min = Math.min(img.width, img.height);
            const sx = (img.width - min) / 2;
            const sy = (img.height - min) / 2;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const p = await saveCustomerProfileToServer({
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        avatarUrl: dataUrl,
      } as any);
      setProfile(p);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "画像の保存に失敗しました");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
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
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#fff5ef]"
                      disabled={avatarUploading}
                    >
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="56px" unoptimized />
                      ) : (
                        <span className="text-[22px] font-bold text-[#ff6b00]">
                          {memberAvatarInitial(profile.displayName)}
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                        <svg className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22c55e]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-bold text-[#111]">{formatMemberNameLine(profile.displayName)}</p>
                    <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[12px] font-bold text-white ${
                      currentTier === "GOLD" ? "bg-[#D4A017]" : currentTier === "SILVER" ? "bg-[#9CA3AF]" : "bg-[#CD7F32]"
                    }`}>
                      {tierLabel(currentTier)}
                    </span>
                    <p className="mt-1.5 text-[12px] text-[#999]">ID: {formatMemberDisplayId(profile.id)}</p>
                  </div>
                </div>
              </section>

              <section className="mb-4">
                <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#ff6b00] to-[#ff8c42] p-5 text-white shadow-[0_8px_24px_rgba(255,107,0,0.3)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider opacity-90">MEMBERSHIP CARD</p>
                      <p className="mt-1 text-[18px] font-bold">ETABLE PASS</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {tierBenefit(currentTier) && (
                        <span className="rounded-full bg-[#ff8c42] px-2.5 py-1 text-center text-[10px] font-bold leading-tight">
                          {tierBenefit(currentTier)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={openEdit}
                        className="text-[11px] font-bold text-white/90 underline"
                      >
                        編集
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] opacity-90">AVAILABLE POINTS</p>
                      <p className="text-[32px] font-bold tracking-tight">
                        {totalPoints.toLocaleString()}
                        <span className="ml-1 text-[14px] font-medium">pts</span>
                      </p>
                    </div>
                    {progress.nextLabel && (
                      <div className="text-right">
                        <p className="text-[10px] opacity-90">Next Goal</p>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#ff8c42] px-3 py-1.5 text-[12px] font-bold">
                          あと {progress.remaining}pt で{progress.nextLabel}
                          <ChevronRightIcon className="h-4 w-4" />
                        </span>
                      </div>
                    )}
                  </div>
                  {/* プログレスバー */}
                  {progress.nextLabel && (
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
                        <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>
                  )}
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

              {/* ランク特典 */}
              {tierBenefitList(currentTier).length > 0 && (
                <section className="mb-6">
                  <h2 className="mb-3 text-[16px] font-bold text-[#111]">現在の特典</h2>
                  <div className="space-y-2">
                    {tierBenefitList(currentTier).map((b, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-[16px] border border-[#eee] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff5ef]">
                          <TicketIcon className="h-5 w-5 text-[#ff6b00]" />
                        </div>
                        <span className="text-[14px] font-bold text-[#111]">{b}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 友達招待 */}
              <section className="mb-6">
                <h2 className="mb-3 text-[16px] font-bold text-[#111]">友達招待</h2>
                <div className="rounded-[16px] border border-[#eee] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <p className="mb-2 text-[12px] text-[#666]">あなたの招待コード</p>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-lg bg-[#f5f5f7] px-4 py-2 text-[18px] font-bold tracking-widest text-[#082752]">
                      {referralCode || "---"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (referralCode) {
                          navigator.clipboard?.writeText(referralCode);
                          setReferralMsg("コピーしました");
                          setTimeout(() => setReferralMsg(""), 2000);
                        }
                      }}
                      className="rounded-lg bg-[#ff6b00] px-3 py-2 text-[12px] font-bold text-white"
                    >
                      コピー
                    </button>
                  </div>
                  <p className="mb-2 text-[12px] text-[#666]">招待コードを入力</p>
                  <div className="flex gap-2">
                    <input
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[14px] uppercase tracking-widest outline-none focus:border-[#ff6b00]"
                      placeholder="招待コード"
                      maxLength={8}
                    />
                    <button
                      type="button"
                      disabled={referralInput.length < 4}
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/customer/referral", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ customerId: profile!.id, referralCode: referralInput }),
                          });
                          const data = await res.json();
                          setReferralMsg(data.message || (data.success ? "適用しました" : "エラー"));
                          if (data.success) {
                            setReferralInput("");
                            refreshLists();
                          }
                        } catch {
                          setReferralMsg("通信エラー");
                        }
                        setTimeout(() => setReferralMsg(""), 3000);
                      }}
                      className="rounded-xl bg-[#082752] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-40"
                    >
                      適用
                    </button>
                  </div>
                  {referralMsg && (
                    <p className="mt-2 text-[12px] font-bold text-[#ff6b00]">{referralMsg}</p>
                  )}
                  <p className="mt-3 text-[11px] text-[#999]">招待すると双方に150ptプレゼント！</p>
                </div>
              </section>

              {/* ポイント履歴 */}
              {pointHistory.length > 0 && (
                <section className="mb-6">
                  <h2 className="mb-3 text-[16px] font-bold text-[#111]">ポイント履歴</h2>
                  <div className="overflow-hidden rounded-[16px] border border-[#eee] bg-white">
                    {pointHistory.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3 last:border-b-0">
                        <div>
                          <p className="text-[13px] font-medium text-[#333]">{h.description}</p>
                          <p className="text-[11px] text-[#999]">
                            {new Date(h.createdAt).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                        <span className={`text-[14px] font-bold ${h.points >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {h.points >= 0 ? "+" : ""}{h.points}pt
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
                      <div
                        key={r.id}
                        className="overflow-hidden rounded-[20px] border border-[#e5e5e5] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                      >
                        <Link
                          href={`/restaurant/${encodeURIComponent(r.restaurantId)}/status`}
                          className="block"
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
                        <div className="border-t border-[#f3f3f3] px-3 pb-3">
                          <Link
                            href={`/survey/${encodeURIComponent(r.restaurantId)}`}
                            className="block w-full rounded-full border border-[#ff6b00] py-2 text-center text-[12px] font-bold text-[#ff6b00]"
                          >
                            来店アンケートに回答する
                          </Link>
                        </div>
                      </div>
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
