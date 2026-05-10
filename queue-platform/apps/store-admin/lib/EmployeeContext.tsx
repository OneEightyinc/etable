import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Actor = {
  employeeId: string;
  employeeName: string;
};

type Ctx = {
  actor: Actor | null;
  storeId: string;
  setStoreId: (s: string) => void;
  setActor: (a: Actor | null) => void;
  clearActor: () => void;
};

const EmployeeContext = createContext<Ctx>({
  actor: null,
  storeId: "",
  setStoreId: () => {},
  setActor: () => {},
  clearActor: () => {},
});

function storageKey(storeId: string) {
  return `sa__actor:${storeId}`;
}

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [storeId, setStoreIdState] = useState<string>("");
  const [actor, setActorState] = useState<Actor | null>(null);

  const setStoreId = useCallback((s: string) => {
    setStoreIdState((prev) => (prev === s ? prev : s));
  }, []);

  useEffect(() => {
    if (!storeId) {
      setActorState(null);
      return;
    }
    try {
      const raw = sessionStorage.getItem(storageKey(storeId));
      setActorState(raw ? (JSON.parse(raw) as Actor) : null);
    } catch {
      setActorState(null);
    }
  }, [storeId]);

  const setActor = useCallback(
    (a: Actor | null) => {
      setActorState(a);
      if (!storeId || typeof window === "undefined") return;
      try {
        if (a) sessionStorage.setItem(storageKey(storeId), JSON.stringify(a));
        else sessionStorage.removeItem(storageKey(storeId));
      } catch {
        /* ignore */
      }
    },
    [storeId]
  );

  const clearActor = useCallback(() => setActor(null), [setActor]);

  const value = useMemo<Ctx>(
    () => ({ actor, storeId, setStoreId, setActor, clearActor }),
    [actor, storeId, setStoreId, setActor, clearActor]
  );

  return <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>;
}

export function useEmployee(): Ctx {
  return useContext(EmployeeContext);
}
