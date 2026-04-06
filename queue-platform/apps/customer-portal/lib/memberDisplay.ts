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

export type MemberTier = "bronze" | "silver" | "gold";

export function tierFromMonthlyVisits(visits: number): MemberTier {
  if (visits >= 10) return "gold";
  if (visits >= 4) return "silver";
  return "bronze";
}

export function tierLabel(tier: MemberTier): string {
  switch (tier) {
    case "gold":
      return "GOLD MEMBER";
    case "silver":
      return "SILVER MEMBER";
    default:
      return "BRONZE MEMBER";
  }
}

export function tierBenefit(tier: MemberTier): string {
  switch (tier) {
    case "gold":
      return "優先案内・特典メニュー";
    case "silver":
      return "ドリンク無料";
    default:
      return "お会計 5% OFF";
  }
}

export function nextTierLabel(tier: MemberTier): string {
  if (tier === "gold") return "プラチナ";
  if (tier === "silver") return "ゴールド";
  return "シルバー";
}

/** 来店に連動した表示用ポイント（参照の 1280pt 相当になりやすい係数） */
export function displayPointsFromVisits(monthlyVisits: number): number {
  return Math.min(99999, 640 + monthlyVisits * 160);
}

export function pointsProgress(
  points: number,
  tier: MemberTier
): { nextLabel: string; remaining: number; percent: number } {
  const thresholds: Record<MemberTier, { next: number; name: string }> = {
    bronze: { next: 1000, name: "シルバー" },
    silver: { next: 1600, name: "ゴールド" },
    gold: { next: 2400, name: "プラチナ" },
  };
  const { next, name } = thresholds[tier];
  const remaining = Math.max(0, next - points);
  const percent = Math.min(100, Math.round((points / next) * 100));
  return { nextLabel: name, remaining, percent };
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
