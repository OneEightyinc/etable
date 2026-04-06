import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SurveyDashboard from "../components/analytics/SurveyDashboard";
import { storeScopedPath } from "../lib/storePaths";
import { useStoreAdminPublicToken } from "../lib/StoreAdminPublicTokenContext";
import {
  computeQueueAnalytics,
  buildCongestionChartPaths,
  type AnalyticsPeriod,
  type TerminalQueueEntry,
} from "../lib/queueAnalytics";

const CHART_W = 320;
const CHART_H = 160;

export default function AnalyticsPage() {
  const router = useRouter();
  const publicToken = useStoreAdminPublicToken();
  const rawSid = router.query.storeId;
  const storeIdFromQuery =
    router.isReady && rawSid ? (Array.isArray(rawSid) ? rawSid[0] : rawSid) : undefined;
  const storeId = (storeIdFromQuery && storeIdFromQuery.trim()) || "shibuya-001";

  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>("today");
  const [history, setHistory] = useState<TerminalQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiPrefix = process.env.NEXT_PUBLIC_API_PREFIX || "";

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${apiPrefix}/api/queue/history?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`履歴の取得に失敗しました (${res.status})`);
        const json = (await res.json()) as { history: TerminalQueueEntry[] };
        return json.history ?? [];
      })
      .then((h) => {
        if (!cancelled) setHistory(h);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "エラーが発生しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, storeId, apiPrefix]);

  const data = useMemo(
    () => computeQueueAnalytics(history, selectedPeriod),
    [history, selectedPeriod]
  );

  const chartPaths = useMemo(
    () => buildCongestionChartPaths(data.chartCounts, CHART_W, CHART_H),
    [data.chartCounts]
  );

  const homeHref = storeScopedPath(publicToken, "/", storeId);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
        <Link href={homeHref} className="flex h-8 w-8 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 text-[#082752]"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#082752]">営業分析</h1>
        <div className="h-8 w-8" />
      </header>

      <div className="px-4 py-6">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FD780F] border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
              {(["today", "week", "month"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    selectedPeriod === period ? "bg-[#082752] text-white" : "text-gray-500"
                  }`}
                >
                  {period === "today" && "今日"}
                  {period === "week" && "今週"}
                  {period === "month" && "今月"}
                </button>
              ))}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 text-[#FD780F]"
                  >
                    <path d="M3 3v18h18" />
                    <path d="M7 13l3-3 4 4 5-5" />
                  </svg>
                  <span className="text-xs text-gray-500">総案内数</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-[#FD780F]">{data.totalGuidedCount}</span>
                  <span className="ml-1 text-sm text-gray-500">組</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#FD780F]">
                    <path d="M10.29 3.86 1.82 12.34a1 1 0 0 0 0 1.41l8.47 8.48a1 1 0 0 0 1.71-.71V4.57a1 1 0 0 0-1.71-.71Z" />
                    <path d="M21.82 11.66 13.34 3.18A1 1 0 0 0 12 3.9V20.1a1 1 0 0 0 1.71.71l8.47-8.48a1 1 0 0 0 0-1.41Z" />
                  </svg>
                  <span className="text-xs text-gray-500">離脱率</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-[#082752]">{data.dropoutRate}</span>
                  <span className="ml-1 text-sm text-gray-500">%</span>
                </div>
                <p className="mt-1 text-[10px] text-gray-400">キャンセル ÷（案内完了＋キャンセル）</p>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#082752] p-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 text-white/70"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-sm text-white/70">平均待ち時間</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">{data.avgWaitMinutes}</span>
                  <span className="ml-2 text-lg text-white/70">min</span>
                </div>
                <p className="mt-1 text-[10px] text-white/50">案内完了まで（到着〜完了）</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FD780F]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-6 w-6 text-white"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-[#082752]">時間帯別・混雑推移</h2>
              <div className="mb-4 text-xs tracking-widest text-gray-400">
                PEAK HOUR ANALYSIS（来店登録ベース）
              </div>
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-48 w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="analyticsAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FD780F" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FD780F" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={chartPaths.area} fill="url(#analyticsAreaFill)" />
                <path
                  d={chartPaths.line}
                  stroke="#FD780F"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                className="mt-2 grid gap-1 text-center text-[10px] text-gray-500"
                style={{
                  gridTemplateColumns: `repeat(${data.chartLabels.length}, minmax(0, 1fr))`,
                }}
              >
                {data.chartLabels.map((label, i) => (
                  <span key={`lbl-${i}`} className="truncate px-0.5" title={label}>
                    {label}
                  </span>
                ))}
              </div>
              <div
                className="mt-1 grid gap-1 text-center text-xs font-semibold text-[#082752]"
                style={{
                  gridTemplateColumns: `repeat(${data.chartCounts.length}, minmax(0, 1fr))`,
                }}
              >
                {data.chartCounts.map((c, i) => (
                  <span key={i}>{c}</span>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-3 block text-xs text-gray-500">過去の案内実績（同一集計）</span>
              <div className="space-y-3">
                {data.records.map((record, index) => (
                  <div
                    key={`${record.date}-${index}`}
                    className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${record.high ? "bg-[#FD780F]" : "bg-gray-300"}`}
                      />
                      <div className="text-left">
                        <div className="text-sm font-medium text-[#082752]">{record.date}</div>
                        <div className="text-xs text-gray-500">
                          <span className={record.high ? "font-medium text-[#FD780F]" : ""}>
                            {record.count}
                          </span>
                          <span>組</span>
                        </div>
                      </div>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 text-gray-400"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="mb-6 text-lg font-bold text-[#082752]">来店者アンケート</h2>
          <SurveyDashboard storeId={storeId} />
        </div>
      </div>
    </div>
  );
}
