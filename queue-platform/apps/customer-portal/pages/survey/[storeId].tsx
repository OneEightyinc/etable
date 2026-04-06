import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

/* ─── Option maps ─── */
const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "no_answer", label: "回答しない" },
];

const AGE_OPTIONS = [
  { value: "10s", label: "10代" },
  { value: "20s", label: "20代" },
  { value: "30s", label: "30代" },
  { value: "40s", label: "40代" },
  { value: "50s", label: "50代" },
  { value: "60plus", label: "60代以上" },
];

const PARTY_TYPE_OPTIONS = [
  { value: "alone", label: "ひとり" },
  { value: "friends", label: "友人" },
  { value: "couple", label: "カップル" },
  { value: "family", label: "家族" },
  { value: "business", label: "ビジネス" },
];

const PURPOSE_OPTIONS = [
  { value: "lunch", label: "ランチ" },
  { value: "dinner", label: "ディナー" },
  { value: "drinking", label: "飲み会" },
  { value: "date", label: "デート" },
  { value: "work_cafe", label: "作業カフェ" },
  { value: "other", label: "その他" },
];

const STAY_DURATION_OPTIONS = [
  { value: "under_30", label: "30分未満" },
  { value: "30_to_60", label: "30分〜1時間" },
  { value: "60_to_120", label: "1〜2時間" },
  { value: "over_120", label: "2時間以上" },
];

const VISIT_COUNT_OPTIONS = [
  { value: "first", label: "初めて" },
  { value: "2_3", label: "2〜3回目" },
  { value: "regular", label: "常連" },
];

const BUDGET_OPTIONS = [
  { value: 500, label: "~500円" },
  { value: 1000, label: "~1,000円" },
  { value: 1500, label: "~1,500円" },
  { value: 2000, label: "~2,000円" },
  { value: 3000, label: "~3,000円" },
  { value: 5000, label: "~5,000円" },
  { value: 5001, label: "5,000円以上" },
];

const DISCOVERY_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X(Twitter)" },
  { value: "google_maps", label: "Googleマップ" },
  { value: "passerby", label: "通りすがり" },
  { value: "friend_referral", label: "友人の紹介" },
  { value: "web_media", label: "Webメディア" },
];

const REVISIT_OPTIONS = [
  { value: "yes", label: "はい" },
  { value: "no", label: "いいえ" },
  { value: "considering", label: "検討中" },
];

const OCCUPATION_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "office_worker", label: "会社員" },
  { value: "self_employed", label: "自営業" },
  { value: "part_time", label: "パート・アルバイト" },
  { value: "student", label: "学生" },
  { value: "homemaker", label: "主婦・主夫" },
  { value: "freelance", label: "フリーランス" },
  { value: "retired", label: "退職済み" },
  { value: "other", label: "その他" },
];

const TOTAL_STEPS = 13;

/* ─── Reusable components ─── */

function SelectionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors ${
        selected
          ? "bg-[#ff6b00] text-white shadow-sm"
          : "bg-white border border-gray-200 text-[#333] hover:border-[#ff6b00]/40"
      }`}
    >
      {children}
    </button>
  );
}

function ProgressBar({ step }: { step: number }) {
  const pct = (step / TOTAL_STEPS) * 100;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-[#666]">
          {step} / {TOTAL_STEPS}
        </span>
        <span className="text-[12px] text-[#666]">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#ff6b00] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-[40px] transition-transform active:scale-110"
          aria-label={`${star}つ星`}
        >
          {star <= value ? (
            <span className="text-[#ff6b00]">★</span>
          ) : (
            <span className="text-gray-300">☆</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Form data shape ─── */
interface FormData {
  gender: string;
  age: string;
  partyType: string;
  purpose: string;
  stayDuration: string;
  visitCount: string;
  budget: number | null;
  discovery: string[];
  menuRequest: string;
  satisfaction: number;
  wouldWaitAgain: string;
  wouldRevisit: string;
  area: string;
  workplace: string;
  occupation: string;
  comment: string;
}

const initialFormData: FormData = {
  gender: "",
  age: "",
  partyType: "",
  purpose: "",
  stayDuration: "",
  visitCount: "",
  budget: null,
  discovery: [],
  menuRequest: "",
  satisfaction: 0,
  wouldWaitAgain: "",
  wouldRevisit: "",
  area: "",
  workplace: "",
  occupation: "",
  comment: "",
};

/** フォーム状態 → POST /api/survey/submit が期待するボディ（survey-schema 準拠） */
function buildSurveySubmitBody(storeId: string, d: FormData) {
  const ageGroupMap: Record<string, string> = {
    "10s": "teens",
    "20s": "20s_early",
    "30s": "30s_early",
    "40s": "40s",
    "50s": "50s_plus",
    "60plus": "50s_plus",
  };
  const groupTypeMap: Record<string, string> = {
    alone: "solo",
    friends: "friends",
    couple: "couple",
    family: "family",
    business: "business",
  };
  const stayMap: Record<string, string> = {
    under_30: "under_30min",
    "30_to_60": "30to60min",
    "60_to_120": "1to2hours",
    over_120: "over_2hours",
  };
  const visitCountMap: Record<string, string> = {
    first: "first",
    "2_3": "second_third",
    regular: "regular",
  };
  const channelMap: Record<string, string> = {
    instagram: "instagram",
    tiktok: "tiktok",
    twitter: "x_twitter",
    google_maps: "google_maps",
    passerby: "walk_in",
    friend_referral: "referral",
    web_media: "web_media",
  };
  const occupationMap: Record<string, string> = {
    office_worker: "employee",
    self_employed: "self_employed",
    part_time: "employee",
    student: "student",
    homemaker: "homemaker",
    freelance: "freelance",
    retired: "retired",
    other: "other",
  };

  const acquisitionChannels = d.discovery.map((v) => channelMap[v] ?? v);
  const occ = d.occupation && occupationMap[d.occupation];
  const favoriteMenu = d.menuRequest.trim() ? d.menuRequest.trim().slice(0, 100) : null;
  const etableReview = d.comment.trim() ? d.comment.trim().slice(0, 200) : null;
  const residenceArea = d.area.trim() ? d.area.trim().slice(0, 50) : null;
  const workArea = d.workplace.trim() ? d.workplace.trim().slice(0, 50) : null;

  return {
    storeId,
    gender: d.gender,
    ageGroup: ageGroupMap[d.age] ?? d.age,
    groupType: groupTypeMap[d.partyType] ?? d.partyType,
    visitPurpose: d.purpose,
    stayDuration: stayMap[d.stayDuration] ?? d.stayDuration,
    visitCount: visitCountMap[d.visitCount] ?? d.visitCount,
    budgetPerPerson: d.budget ?? 0,
    acquisitionChannels,
    favoriteMenu,
    etableReview,
    satisfactionScore: d.satisfaction,
    waitTimeTolerance: d.wouldWaitAgain === "yes",
    revisitIntention:
      d.wouldRevisit === "yes"
        ? "yes"
        : d.wouldRevisit === "no"
          ? "no"
          : d.wouldRevisit === "considering"
            ? "maybe"
            : d.wouldRevisit,
    residenceArea,
    workArea,
    occupation: occ ?? null,
  };
}

/** そのステップで次へ進めないときのメッセージ（null なら OK） */
function getStepBlockerMessage(step: number, d: FormData): string | null {
  switch (step) {
    case 1:
      if (d.gender === "") return "性別を選択してください";
      if (d.age === "") return "年代を選択してください";
      return null;
    case 2:
      if (d.partyType === "") return "ご利用の形態を選択してください";
      return null;
    case 3:
      if (d.purpose === "") return "ご利用目的を選択してください";
      return null;
    case 4:
      if (d.stayDuration === "") return "滞在予定時間を選択してください";
      return null;
    case 5:
      if (d.visitCount === "") return "来店回数を選択してください";
      return null;
    case 6:
      if (d.budget === null) return "予算感を選択してください";
      return null;
    case 7:
      if (d.discovery.length === 0) return "認知経路を1つ以上選択してください";
      return null;
    case 8:
      return null;
    case 9:
      if (d.satisfaction <= 0) return "総合満足度を選択してください";
      return null;
    case 10:
      if (d.wouldWaitAgain === "") return "「また待ちたいか」を選択してください";
      return null;
    case 11:
      if (d.wouldRevisit === "") return "「また来たいか」を選択してください";
      return null;
    case 12:
    case 13:
      return null;
    default:
      return null;
  }
}

/* ─── Main page ─── */

export default function SurveyPage() {
  const router = useRouter();
  const storeId = router.query.storeId as string;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Duplicate submission guard
  const sessionKey = `survey_submitted_${storeId}`;
  useEffect(() => {
    if (router.isReady && storeId) {
      try {
        if (sessionStorage.getItem(sessionKey)) {
          router.replace(`/survey/${storeId}/thanks`);
        }
      } catch {
        // sessionStorage unavailable
      }
    }
  }, [router.isReady, storeId, sessionKey, router]);

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleDiscovery = useCallback((val: string) => {
    setFormData((prev) => {
      const set = new Set(prev.discovery);
      if (set.has(val)) set.delete(val);
      else set.add(val);
      return { ...prev, discovery: Array.from(set) };
    });
  }, []);

  const handleNext = () => {
    const msg = getStepBlockerMessage(step, formData);
    if (msg) {
      alert(msg);
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!storeId) {
      alert("店舗情報を読み込み中です。しばらく待ってから再度お試しください。");
      return;
    }
    for (let s = 1; s <= 11; s++) {
      const msg = getStepBlockerMessage(s, formData);
      if (msg) {
        alert(msg);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError("");

    const prefix = process.env.NEXT_PUBLIC_API_PREFIX ?? "";
    const payload = buildSurveySubmitBody(storeId, formData);
    try {
      const res = await fetch(`${prefix}/api/survey/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "送信に失敗しました");
      }
      try {
        sessionStorage.setItem(sessionKey, "1");
      } catch {
        // ignore
      }
      router.push(`/survey/${storeId}/thanks`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Step renderers ─── */

  const renderStep = () => {
    switch (step) {
      /* 1 ─ 性別・年代 */
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-[14px] font-bold text-[#082752] mb-3">性別</h3>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((o) => (
                  <SelectionButton
                    key={o.value}
                    selected={formData.gender === o.value}
                    onClick={() => update("gender", o.value)}
                  >
                    {o.label}
                  </SelectionButton>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#082752] mb-3">年代</h3>
              <div className="grid grid-cols-3 gap-2">
                {AGE_OPTIONS.map((o) => (
                  <SelectionButton
                    key={o.value}
                    selected={formData.age === o.value}
                    onClick={() => update("age", o.value)}
                  >
                    {o.label}
                  </SelectionButton>
                ))}
              </div>
            </div>
          </div>
        );

      /* 2 ─ 利用形態 */
      case 2:
        return (
          <div className="space-y-2">
            {PARTY_TYPE_OPTIONS.map((o) => (
              <SelectionButton
                key={o.value}
                selected={formData.partyType === o.value}
                onClick={() => update("partyType", o.value)}
              >
                {o.label}
              </SelectionButton>
            ))}
          </div>
        );

      /* 3 ─ 利用目的 */
      case 3:
        return (
          <div className="grid grid-cols-2 gap-2">
            {PURPOSE_OPTIONS.map((o) => (
              <SelectionButton
                key={o.value}
                selected={formData.purpose === o.value}
                onClick={() => update("purpose", o.value)}
              >
                {o.label}
              </SelectionButton>
            ))}
          </div>
        );

      /* 4 ─ 滞在予定時間 */
      case 4:
        return (
          <div className="space-y-2">
            {STAY_DURATION_OPTIONS.map((o) => (
              <SelectionButton
                key={o.value}
                selected={formData.stayDuration === o.value}
                onClick={() => update("stayDuration", o.value)}
              >
                {o.label}
              </SelectionButton>
            ))}
          </div>
        );

      /* 5 ─ 来店回数 */
      case 5:
        return (
          <div className="space-y-2">
            {VISIT_COUNT_OPTIONS.map((o) => (
              <SelectionButton
                key={o.value}
                selected={formData.visitCount === o.value}
                onClick={() => update("visitCount", o.value)}
              >
                {o.label}
              </SelectionButton>
            ))}
          </div>
        );

      /* 6 ─ 予算感 */
      case 6:
        return (
          <div className="grid grid-cols-2 gap-2">
            {BUDGET_OPTIONS.map((o) => (
              <SelectionButton
                key={o.value}
                selected={formData.budget === o.value}
                onClick={() => update("budget", o.value)}
              >
                {o.label}
              </SelectionButton>
            ))}
          </div>
        );

      /* 7 ─ 認知経路 (multi) */
      case 7:
        return (
          <div className="space-y-2">
            <p className="text-[13px] text-[#666] mb-2">複数選択できます</p>
            {DISCOVERY_OPTIONS.map((o) => (
              <SelectionButton
                key={o.value}
                selected={formData.discovery.includes(o.value)}
                onClick={() => toggleDiscovery(o.value)}
              >
                {o.label}
              </SelectionButton>
            ))}
          </div>
        );

      /* 8 ─ 食べたいメニュー */
      case 8:
        return (
          <div>
            <input
              type="text"
              value={formData.menuRequest}
              onChange={(e) => update("menuRequest", e.target.value)}
              placeholder="例: チーズバーガー、抹茶ラテ"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[15px] text-[#333] placeholder-gray-400 focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
            />
            <p className="mt-2 text-[12px] text-[#999]">任意項目です</p>
          </div>
        );

      /* 9 ─ 総合満足度 */
      case 9:
        return (
          <div className="flex flex-col items-center py-4">
            <StarRating
              value={formData.satisfaction}
              onChange={(v) => update("satisfaction", v)}
            />
            {formData.satisfaction > 0 && (
              <p className="mt-4 text-[14px] font-medium text-[#ff6b00]">
                {formData.satisfaction} / 5
              </p>
            )}
          </div>
        );

      /* 10 ─ また待ちたいか */
      case 10:
        return (
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "yes", label: "はい" },
              { value: "no", label: "いいえ" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => update("wouldWaitAgain", o.value)}
                className={`rounded-2xl py-8 text-[18px] font-bold transition-colors ${
                  formData.wouldWaitAgain === o.value
                    ? "bg-[#ff6b00] text-white shadow-md"
                    : "bg-white border-2 border-gray-200 text-[#333] hover:border-[#ff6b00]/40"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        );

      /* 11 ─ また来たいか */
      case 11:
        return (
          <div className="space-y-3">
            {REVISIT_OPTIONS.map((o) => (
              <SelectionButton
                key={o.value}
                selected={formData.wouldRevisit === o.value}
                onClick={() => update("wouldRevisit", o.value)}
              >
                {o.label}
              </SelectionButton>
            ))}
          </div>
        );

      /* 12 ─ エリア・勤務地・職業 */
      case 12:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#082752] mb-1.5">
                お住まいのエリア
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="例: 渋谷区、横浜市"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-[#333] placeholder-gray-400 focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#082752] mb-1.5">
                勤務地
              </label>
              <input
                type="text"
                value={formData.workplace}
                onChange={(e) => update("workplace", e.target.value)}
                placeholder="例: 新宿区、品川区"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-[#333] placeholder-gray-400 focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#082752] mb-1.5">
                ご職業
              </label>
              <select
                value={formData.occupation}
                onChange={(e) => update("occupation", e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-[#333] focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
              >
                {OCCUPATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[12px] text-[#999]">すべて任意項目です</p>
          </div>
        );

      /* 13 ─ ETABLEへひとこと */
      case 13:
        return (
          <div>
            <p className="text-[14px] text-[#555] leading-relaxed mb-4">
              ETABLEをもっと多くの方に知っていただきたいと思っています。よかったら一言コメントを残してください
              🙏
            </p>
            <textarea
              value={formData.comment}
              onChange={(e) => update("comment", e.target.value)}
              rows={4}
              placeholder="ご自由にどうぞ..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-[#333] placeholder-gray-400 resize-none focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
            />
            <p className="mt-2 text-[12px] text-[#999]">任意項目です</p>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles: Record<number, string> = {
    1: "性別・年代",
    2: "ご利用の形態",
    3: "ご利用目的",
    4: "滞在予定時間",
    5: "来店回数",
    6: "今日の予算感（1人あたり）",
    7: "何で知りましたか？",
    8: "食べたいメニューは？",
    9: "総合満足度",
    10: "また待ちたいと思えますか？",
    11: "また来たいと思いますか？",
    12: "お住まいのエリア・勤務地・職業",
    13: "ETABLEへひとこと",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-[393px] min-h-screen bg-white shadow-sm">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-3">
          <ProgressBar step={step} />
        </div>

        {/* Body */}
        <div className="px-5 py-6">
          <h2 className="text-[18px] font-bold text-[#082752] mb-5">
            {stepTitles[step]}
          </h2>

          {renderStep()}
        </div>

        {/* Footer nav */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
          {submitError && (
            <p className="text-[13px] text-red-500 text-center mb-3">
              {submitError}
            </p>
          )}

          {step < TOTAL_STEPS ? (
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-[14px] font-medium text-[#666] px-4 py-3"
                >
                  戻る
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-xl py-3.5 text-[15px] font-bold text-white transition-colors bg-[#ff6b00] active:bg-[#cf4a22]"
              >
                次へ
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="text-[14px] font-medium text-[#666] px-4 py-3"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`flex-1 rounded-xl py-3.5 text-[15px] font-bold text-white transition-colors ${
                  submitting
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#082752] active:bg-[#061d3d]"
                }`}
              >
                {submitting ? "送信中..." : "送信する"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
