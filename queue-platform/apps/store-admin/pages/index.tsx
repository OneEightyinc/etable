import type { NextPage } from "next";
import { useEffect, useState } from "react";
import StoreView from "../components/StoreView";
import StoreLoginScreen from "../components/StoreLoginScreen";
import ReceptionStartScreen from "../components/ReceptionStartScreen";
import {
  isStoreAdminLoggedIn,
  isStoreReceptionStarted,
  markStoreAdminLoggedIn,
  markStoreReceptionStarted,
  clearStoreAdminSession,
} from "../lib/storeAdminSession";

type Phase = "hydrate" | "login" | "closed" | "app";

const StoreAdminPage: NextPage = () => {
  const [phase, setPhase] = useState<Phase>("hydrate");

  useEffect(() => {
    if (!isStoreAdminLoggedIn()) setPhase("login");
    else if (!isStoreReceptionStarted()) setPhase("closed");
    else setPhase("app");
  }, []);

  const handleLogin = () => {
    markStoreAdminLoggedIn();
    setPhase("closed");
  };

  const handleReceptionStart = () => {
    markStoreReceptionStarted();
    setPhase("app");
  };

  const handleLogout = () => {
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
    return <StoreLoginScreen onLogin={handleLogin} />;
  }

  if (phase === "closed") {
    return <ReceptionStartScreen onStarted={handleReceptionStart} />;
  }

  return <StoreView onLogout={handleLogout} />;
};

export default StoreAdminPage;
