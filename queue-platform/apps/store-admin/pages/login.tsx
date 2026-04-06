import React from "react";
import { useRouter } from "next/router";
import StoreLoginScreen from "../components/StoreLoginScreen";
import { markStoreAdminLoggedIn } from "../lib/storeAdminSession";

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    markStoreAdminLoggedIn();
    void router.replace("/");
  };

  return <StoreLoginScreen onLogin={handleLogin} />;
}
