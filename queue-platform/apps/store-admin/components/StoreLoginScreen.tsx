import React, { useState } from "react";

type Props = {
  /** ログイン API 成功後（クッキー設定済み） */
  onLoginSuccess: () => void;
  /** URL から渡された店舗ID（この店舗のアカウントであることをサーバーで検証） */
  storeIdHint?: string;
  /** 直前に URL とセッションが不一致だった場合など */
  bannerError?: string;
};

const StoreLoginScreen: React.FC<Props> = ({ onLoginSuccess, storeIdHint, bannerError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          expectedStoreId: storeIdHint || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }
      onLoginSuccess();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-6">
      <div className="flex w-full max-w-sm flex-1 flex-col items-start pt-[12.5rem]">
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/etable-logo-orange.svg`}
          alt="ETABLE"
          width={200}
          height={44}
          className="mb-3 h-[44px] w-auto"
        />
        <p
          className={`login-subtitle text-left text-[11px] font-black uppercase tracking-[0.35em] text-gray-300 ${storeIdHint ? "mb-2" : "mb-10"}`}
        >
          PREMIUM WAITLIST APP
        </p>
        {bannerError ? (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-left text-[12px] font-medium text-amber-900">{bannerError}</p>
        ) : null}
        {storeIdHint ? (
          <p className="mb-10 text-left text-[13px] font-bold text-[#082752]/80">
            店舗ID: <span className="font-mono tracking-tight">{storeIdHint}</span>
            <span className="mt-1 block text-[11px] font-medium text-gray-400">この店舗の担当アカウントでログインしてください</span>
          </p>
        ) : null}

        <div className="w-full space-y-4">
          <div className="flex h-[64px] items-center gap-3 rounded-2xl bg-gray-50 px-4">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
              <path d="M6 20c0-2.21 2.686-4 6-4s6 1.79 6 4" />
            </svg>
            <div className="relative flex-1">
              {!email && (
                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-black text-gray-300">
                  電話番号 または メールアドレス
                </span>
              )}
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent pr-2 text-sm text-gray-700 outline-none"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="flex h-[64px] items-center gap-3 rounded-2xl bg-gray-50 px-4">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="relative flex-1">
              {!password && (
                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-black text-gray-300">
                  パスワード
                </span>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent pr-2 text-sm text-gray-700 outline-none"
                autoComplete="current-password"
              />
            </div>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading}
          className="mt-6 flex h-[64px] w-full items-center justify-center gap-3 rounded-full bg-[#FD780F] font-semibold text-white transition-transform enabled:active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "ログイン中…" : "ログイン"}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 12h14" strokeWidth="2" />
            <path d="m13 18 6-6-6-6" strokeWidth="2" />
          </svg>
        </button>
      </div>
      <p className="mb-8 text-center text-xs text-gray-400">© 2025 ETABLE. All Rights Reserved.</p>
    </div>
  );
};

export default StoreLoginScreen;
