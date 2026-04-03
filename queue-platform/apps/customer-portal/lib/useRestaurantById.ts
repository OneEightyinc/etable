import { useEffect, useState } from "react";
import type { Restaurant } from "../data/restaurants";
import { portalProfileToRestaurant } from "./portalRestaurant";

/**
 * 店舗 ID（マスタの storeId）で公開 API からのみ取得。デモ用静的リストは使わない。
 */
export function useRestaurantById(id: string | undefined): {
  restaurant: Restaurant | null;
  loading: boolean;
} {
  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRestaurant(undefined);
      return;
    }
    let cancelled = false;
    setRestaurant(undefined);
    fetch(`/api/store/public?storeId=${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return portalProfileToRestaurant(data.profile);
      })
      .then((r) => {
        if (!cancelled) setRestaurant(r);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return { restaurant: null, loading: false };
  }
  if (restaurant === undefined) {
    return { restaurant: null, loading: true };
  }
  return { restaurant, loading: false };
}
