import type { SurveyResponse } from "./db";

type SurveyInput = Omit<SurveyResponse, "id" | "visitedAt">;

const GENDERS = ["male", "female", "other", "no_answer"] as const;
const AGE_GROUPS = ["teens", "20s_early", "20s_late", "30s_early", "30s_late", "40s", "50s_plus"] as const;
const GROUP_TYPES = ["solo", "friends", "couple", "family", "business"] as const;
const VISIT_PURPOSES = ["lunch", "dinner", "drinking", "date", "work_cafe", "other"] as const;
const STAY_DURATIONS = ["under_30min", "30to60min", "1to2hours", "over_2hours"] as const;
const VISIT_COUNTS = ["first", "second_third", "regular"] as const;
const REVISIT_OPTIONS = ["yes", "no", "maybe"] as const;
const OCCUPATIONS = ["employee", "student", "freelance", "self_employed", "homemaker", "retired", "other"] as const;
const CHANNELS = ["instagram", "tiktok", "x_twitter", "google_maps", "walk_in", "referral", "web_media"] as const;

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

export function validateSurveyInput(body: unknown): { data: SurveyInput } | { error: string } {
  if (!body || typeof body !== "object") return { error: "リクエストが不正です" };
  const b = body as Record<string, unknown>;

  if (!b.storeId || typeof b.storeId !== "string") return { error: "店舗IDが必要です" };
  if (!isOneOf(b.gender, GENDERS)) return { error: "性別を選択してください" };
  if (!isOneOf(b.ageGroup, AGE_GROUPS)) return { error: "年代を選択してください" };
  if (!isOneOf(b.groupType, GROUP_TYPES)) return { error: "利用形態を選択してください" };
  if (!isOneOf(b.visitPurpose, VISIT_PURPOSES)) return { error: "利用目的を選択してください" };
  if (!isOneOf(b.stayDuration, STAY_DURATIONS)) return { error: "滞在時間を選択してください" };
  if (!isOneOf(b.visitCount, VISIT_COUNTS)) return { error: "来店回数を選択してください" };

  const budget = Number(b.budgetPerPerson);
  if (!Number.isFinite(budget) || budget < 0) return { error: "予算を選択してください" };

  if (!Array.isArray(b.acquisitionChannels) || b.acquisitionChannels.length === 0) {
    return { error: "認知経路を1つ以上選択してください" };
  }
  for (const ch of b.acquisitionChannels) {
    if (!isOneOf(ch, CHANNELS)) return { error: `無効な認知経路: ${ch}` };
  }

  const score = Number(b.satisfactionScore);
  if (!Number.isInteger(score) || score < 1 || score > 5) return { error: "満足度を選択してください" };
  if (typeof b.waitTimeTolerance !== "boolean") return { error: "待ち時間の許容を選択してください" };
  if (!isOneOf(b.revisitIntention, REVISIT_OPTIONS)) return { error: "再来店意向を選択してください" };

  const favoriteMenu = typeof b.favoriteMenu === "string" && b.favoriteMenu.trim() ? b.favoriteMenu.trim().slice(0, 100) : null;
  const etableReview = typeof b.etableReview === "string" && b.etableReview.trim() ? b.etableReview.trim().slice(0, 200) : null;
  const residenceArea = typeof b.residenceArea === "string" && b.residenceArea.trim() ? b.residenceArea.trim().slice(0, 50) : null;
  const workArea = typeof b.workArea === "string" && b.workArea.trim() ? b.workArea.trim().slice(0, 50) : null;
  const occupation = isOneOf(b.occupation, OCCUPATIONS) ? b.occupation : null;

  return {
    data: {
      storeId: b.storeId as string,
      gender: b.gender as SurveyInput["gender"],
      ageGroup: b.ageGroup as SurveyInput["ageGroup"],
      groupType: b.groupType as SurveyInput["groupType"],
      visitPurpose: b.visitPurpose as SurveyInput["visitPurpose"],
      stayDuration: b.stayDuration as SurveyInput["stayDuration"],
      visitCount: b.visitCount as SurveyInput["visitCount"],
      budgetPerPerson: budget,
      acquisitionChannels: b.acquisitionChannels as string[],
      favoriteMenu,
      etableReview,
      satisfactionScore: score,
      waitTimeTolerance: b.waitTimeTolerance as boolean,
      revisitIntention: b.revisitIntention as SurveyInput["revisitIntention"],
      residenceArea,
      workArea,
      occupation,
    },
  };
}
