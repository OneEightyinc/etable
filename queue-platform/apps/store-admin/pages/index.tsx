import type { NextPage } from "next";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import StoreView from "../components/StoreView";
import StoreLoginScreen from "../components/StoreLoginScreen";
import ReceptionStartScreen from "../components/ReceptionStartScreen";
import { isStoreReceptionStarted, markStoreReceptionStarted, clearStoreAdminSession } from "../lib/storeAdminSession";

type Phase = "hydrate" | "login" | "closed" | "app";

const StoreAdminPage: NextPage = () => {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hydrate");
  const [bannerError, setBannerError] = useState("");

  const runAuthGate = useCallback(async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth/me`, { credentials: "include" });
      if (r.status === 401) {
        setPhase("login");
        return;
      }
      if (!r.ok) {
        setPhase("login");
        return;
      }
      const data = (await r.json()) as {
        user?: { role?: string; storeId?: string };
      };
      const u = data.user;
      if (!u || u.role !== "STORE_ADMIN" || !u.storeId) {
        setPhase("login");
        return;
      }

      const raw = router.query.storeId;
      const urlStore = typeof raw === "string" && raw.trim() ? raw.trim() : "";
      if (urlStore && urlStore !== u.storeId) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth/logout`, { method: "POST", credentials: "include" });
        setBannerError("このURLの店舗とログインできるアカウントが一致しません。発行された店舗用URLからログインしてください。");
        setPhase("login");
        return;
      }

      setBannerError("");
      if (!isStoreReceptionStarted()) setPhase("closed");
      else setPhase("app");
    } catch {
      setPhase("login");
    }
  }, [router.query.storeId]);

  useEffect(() => {
    if (!router.isReady) return;
    void runAuthGate();
  }, [router.isReady, runAuthGate]);

  const handleLoginSuccess = () => {
    void runAuthGate();
  };

  const handleReceptionStart = () => {
    markStoreReceptionStarted();
    setPhase("app");
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    clearStoreAdminSession();
    setPhase("login");
  };

  if (phase === "hydrate") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FD780F] border-t-transparent" />
      </div>
    );
  }

  if (phase === "login") {
    const raw = router.query.storeId;
    const storeIdHint = typeof raw === "string" && raw.trim() ? raw.trim() : "";
    return (
      <StoreLoginScreen
        onLoginSuccess={handleLoginSuccess}
        storeIdHint={storeIdHint}
        bannerError={bannerError}
      />
    );
  }

  if (phase === "closed") {
    return <ReceptionStartScreen onStarted={handleReceptionStart} />;
  }

  return <StoreView onLogout={handleLogout} />;
};

export default StoreAdminPage;
