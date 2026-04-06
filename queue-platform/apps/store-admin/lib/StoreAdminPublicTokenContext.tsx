import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const StoreAdminPublicTokenContext = createContext<string>("");

export function StoreAdminPublicTokenProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const q = router.query.__pt;
  const fromQuery = typeof q === "string" && q.length >= 32 ? q : "";

  const [fromStorage, setFromStorage] = useState("");

  useEffect(() => {
    if (fromQuery) {
      try {
        sessionStorage.setItem("sa__pt", fromQuery);
      } catch {
        /* ignore */
      }
      setFromStorage(fromQuery);
    } else if (typeof window !== "undefined") {
      try {
        setFromStorage(sessionStorage.getItem("sa__pt") || "");
      } catch {
        setFromStorage("");
      }
    }
  }, [fromQuery]);

  const value = useMemo(() => fromQuery || fromStorage, [fromQuery, fromStorage]);

  return (
    <StoreAdminPublicTokenContext.Provider value={value}>{children}</StoreAdminPublicTokenContext.Provider>
  );
}

export function useStoreAdminPublicToken(): string {
  return useContext(StoreAdminPublicTokenContext);
}
