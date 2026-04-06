import React from "react";
import { useRouter } from "next/router";
import StoreLoginScreen from "../components/StoreLoginScreen";

export default function Login() {
  const router = useRouter();
  const raw = router.query.storeId;
  const storeIdHint = typeof raw === "string" && raw.trim() ? raw.trim() : "";

  const handleLoginSuccess = () => {
    let dest = "/";
    try {
      const t = sessionStorage.getItem("sa__pt");
      if (t && t.length >= 32) dest = `/a/${t}`;
    } catch {
      /* ignore */
    }
    void router.replace(dest);
  };

  return <StoreLoginScreen onLoginSuccess={handleLoginSuccess} storeIdHint={storeIdHint} />;
}
