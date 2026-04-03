import React, { useState, useEffect } from "react";
import Link from "next/link";
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
import { getReservations } from "../lib/storage";

const MyPage: React.FC = () => {
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

  useEffect(() => {
    setMounted(true);
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
  }, []);

  const [recentVisits, setRecentVisits] = useState<{ name: string; date: string }[]>([]);

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
      [...byStore.values()]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5)
        .map((v) => ({
          name: v.name,
          date: v.at.slice(0, 10).replace(/-/g, "/"),
        }))
    );
  }, [mounted, profile]);

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
      setSavedMsg("保存しました");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutProfile = async () => {
    if (!window.confirm("登録情報をサーバーから削除しますか？")) return;
    setProfileError(null);
    try {
      await deleteCustomerProfileFromServer();
      clearLegacyProfileStorage();
      setProfile(null);
      setDisplayName("");
      setEmail("");
      setPhone("");
      setEditing(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6m-1.78 7.78l-4.24-4.24m-5.08 0l-4.24 4.24" />
    </svg>
  );

  const HelpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4m0-4h.01" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  if (!mounted) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow pt-16 pb-24" />
        <BottomNavigation />
      </>
    );
  }

  if (profileLoading) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow pt-16 pb-24">
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
      <main className="flex-grow pt-16 pb-24">
        <div className="mx-auto w-full max-w-[393px] bg-white">
          <div className="px-4 py-4">
            <h1 className="mb-6 text-[18px] font-bold text-[#222]">マイページ</h1>

            {profileError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-center text-[12px] text-red-700">{profileError}</p>
            )}

            {!profile || editing ? (
              <form onSubmit={handleRegister} className="mb-8 space-y-4 rounded-xl border border-gray-100 bg-[#fafafa] p-5">
                <h2 className="text-[15px] font-bold text-[#222]">
                  {profile ? "登録情報の編集" : "マイページ登録"}
                </h2>
                <p className="text-[12px] leading-relaxed text-[#666]">
                  お名前は必須です。メール・電話は任意です。登録内容はサーバーに保存され、ログアウトや別端末でも同じ情報を利用できます。
                </p>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">お名前（表示名）*</label>
                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] outline-none focus:border-[#FD780F]"
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] outline-none focus:border-[#FD780F]"
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] outline-none focus:border-[#FD780F]"
                    placeholder="09012345678"
                    autoComplete="tel"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-full bg-[#FD780F] py-3 text-[14px] font-bold text-white hover:bg-[#ff6b00] disabled:opacity-60"
                  >
                    {saving ? "保存中…" : profile ? "更新する" : "登録する"}
                  </button>
                  {profile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setDisplayName(profile.displayName);
                        setEmail(profile.email);
                        setPhone(profile.phone);
                      }}
                      className="rounded-full border border-gray-300 px-4 py-3 text-[14px] font-medium text-gray-600"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mb-6 rounded-lg bg-gradient-to-r from-[#FD780F] to-[#ff6b00] p-6 text-white">
                <div className="mb-4 flex items-start justify-between">
                  <h2 className="text-[14px] font-bold">ETABLE メンバー</h2>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-[12px] font-bold text-white/90 underline"
                  >
                    編集
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-[11px] text-white/80">お名前</p>
                    <p className="text-[16px] font-bold">{profile.displayName}</p>
                  </div>
                  {(profile.email || profile.phone) && (
                    <div className="space-y-2 border-t border-white/20 pt-3 text-[13px]">
                      {profile.email ? (
                        <p>
                          <span className="text-white/80">メール: </span>
                          {profile.email}
                        </p>
                      ) : null}
                      {profile.phone ? (
                        <p>
                          <span className="text-white/80">電話: </span>
                          {profile.phone}
                        </p>
                      ) : null}
                    </div>
                  )}
                  <p className="border-t border-white/20 pt-3 text-[11px] text-white/70">
                    登録日: {profile.registeredAt.slice(0, 10)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutProfile}
                  className="mt-4 text-[12px] text-white/80 underline"
                >
                  登録情報を削除
                </button>
              </div>
            )}

            {savedMsg && <p className="mb-4 text-center text-[13px] font-bold text-green-600">{savedMsg}</p>}

            <div className="mb-6">
              <h3 className="mb-3 text-[14px] font-bold text-[#222]">最近利用したお店</h3>
              {recentVisits.length === 0 ? (
                <p className="rounded-lg bg-[#f9f9f9] p-4 text-[13px] text-[#999]">
                  順番待ちの履歴がまだありません。店舗のリンクから順番待ちをご利用ください。
                </p>
              ) : (
                <div className="space-y-2">
                  {recentVisits.map((v, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-[#f9f9f9] p-3">
                      <p className="text-[13px] text-[#222]">{v.name}</p>
                      <span className="text-[12px] text-[#999]">{v.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-[13px] font-bold text-[#999]">サポート</h3>
              <div className="space-y-2">
                <Link href="/faq">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-[#f9f9f9]"
                  >
                    <div className="flex items-center gap-3">
                      <HelpIcon />
                      <span className="text-[13px] text-[#222]">よくある質問</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>
                <Link href="/contact">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-[#f9f9f9]"
                  >
                    <div className="flex items-center gap-3">
                      <HelpIcon />
                      <span className="text-[13px] text-[#222]">お問い合わせ</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>
                <Link href="/privacy">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-[#f9f9f9]"
                  >
                    <div className="flex items-center gap-3">
                      <SettingsIcon />
                      <span className="text-[13px] text-[#222]">プライバシーポリシー</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
};

export default MyPage;
