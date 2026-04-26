/** 会員 ID 表示（参照 UI の「0029 0001」形式） */
export function formatMemberDisplayId(profileId: string | undefined): string {
  if (!profileId) return "0000 0000";
  const h = profileId.replace(/-/g, "");
  let n = 0;
  for (let i = 0; i < h.length; i++) n = (n * 31 + h.charCodeAt(i)) >>> 0;
  const base = 100000000 + (n % 900000000);
  const s = String(base).padStart(9, "0").slice(0, 8);
  return `${s.slice(0, 4)} ${s.slice(4, 8)}`;
}

export function memberAvatarInitial(displayName: string): string {
  const t = displayName.trim();
  if (!t) return "?";
  return t[0]!.toUpperCase();
}

/** 参照サイトのようなラテン風大文字表記（日本語はそのまま先頭1文字でアバター用） */
export function formatMemberNameLine(displayName: string): string {
  const t = displayName.trim();
  if (!t) return "ゲスト";
  if (/[a-zA-Z]/.test(t)) {
    return t
      .split(/\s+/)
      .map((w) => w.toUpperCase())
      .join(" ");
  }
  return t;
}

export type MemberTier = "BRONZE" | "SILVER" | "GOLD";

/** ランク判定（サーバーのcalculateTierと同じロジック） */
export function tierFromPoints(totalPoints: number): MemberTier {
  if (totalPoints >= 1500) return "GOLD";
  if (totalPoints >= 500) return "SILVER";
  return "BRONZE";
}

/** 後方互換: 月間来店数からのランク判定 */
export function tierFromMonthlyVisits(visits: number): MemberTier {
  if (visits >= 10) return "GOLD";
  if (visits >= 4) return "SILVER";
  return "BRONZE";
}

export function tierLabel(tier: MemberTier): string {
  switch (tier) {
    case "GOLD":
      return "GOLD MEMBER";
    case "SILVER":
      return "SILVER MEMBER";
    default:
      return "BRONZE MEMBER";
  }
}

export function tierBenefit(tier: MemberTier): string {
  switch (tier) {
    case "GOLD":
      return "ファストパス月2回＋1ドリンク無料";
    case "SILVER":
      return "ファストパス1回券";
    default:
      return "";
  }
}

export function tierBenefitList(tier: MemberTier): string[] {
  switch (tier) {
    case "GOLD":
      return ["ファストパス月2回", "1ドリンク無料"];
    case "SILVER":
      return ["ファストパス1回券"];
    default:
      return [];
  }
}

export function nextTierLabel(tier: MemberTier): string {
  if (tier === "GOLD") return "";
  if (tier === "SILVER") return "ゴールド";
  return "シルバー";
}

export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
} as const;

export function pointsProgress(
  totalPoints: number,
  tier: MemberTier
): { nextLabel: string; remaining: number; percent: number; nextThreshold: number } {
  if (tier === "GOLD") {
    return { nextLabel: "", remaining: 0, percent: 100, nextThreshold: 1500 };
  }
  const nextThreshold = tier === "SILVER" ? 1500 : 500;
  const nextLabel = tier === "SILVER" ? "ゴールド" : "シルバー";
  const currentBase = TIER_THRESHOLDS[tier];
  const range = nextThreshold - currentBase;
  const progress = totalPoints - currentBase;
  const remaining = Math.max(0, nextThreshold - totalPoints);
  const percent = Math.min(100, Math.round((progress / range) * 100));
  return { nextLabel, remaining, percent, nextThreshold };
}

/** ポイントアクションの日本語ラベル */
export function pointActionLabel(action: string): string {
  const labels: Record<string, string> = {
    FIRST_VISIT: "初回会員登録",
    VISIT: "来店ポイント",
    SURVEY: "レビュー回答",
    GOOGLE_REVIEW: "クチコミ投稿で300pt",
    REFERRAL_SENT: "友達招待",
    REFERRAL_RECEIVED: "招待特典",
    IDLE_TIME_BONUS: "アイドルタイムボーナス",
    STAMP_RALLY: "スタンプラリー",
    MANUAL: "調整",
  };
  return labels[action] ?? action;
}

export function countVisitsThisMonth(isoDates: string[]): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return isoDates.filter((iso) => {
    const d = new Date(iso);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
}
