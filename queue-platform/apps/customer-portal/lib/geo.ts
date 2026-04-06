import { useState, useEffect } from "react";

/** Haversine formula: 2点間の距離をkmで返す */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export type UserLocation = { lat: number; lng: number } | null;

export function useUserLocation(): UserLocation {
  const [loc, setLoc] = useState<UserLocation>(null);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);
  return loc;
}

/** 店舗のlat/lngとユーザー位置から距離文字列を返す。位置情報がない場合はfallbackを返す */
export function computeDistance(
  storeLat: number | null,
  storeLng: number | null,
  userLoc: UserLocation,
  fallback: string
): string {
  if (storeLat == null || storeLng == null || !userLoc) return fallback;
  const km = haversineKm(userLoc.lat, userLoc.lng, storeLat, storeLng);
  return formatDistanceKm(km);
}
