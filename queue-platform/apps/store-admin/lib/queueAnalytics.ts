/**
 * 順番待ち履歴（DONE / CANCELLED）から分析用の系列・KPI を算出する（ブラウザのローカル日付で期間を切る）
 */

export type AnalyticsPeriod = "today" | "week" | "month";

export type TerminalQueueEntry = {
  status: string;
  arrivalTime: string;
  updatedAt: string;
};

export type AnalyticsRecord = {
  date: string;
  count: number;
  high: boolean;
};

export type QueueAnalyticsResult = {
  totalGuidedCount: number;
  dropoutRate: number;
  avgWaitMinutes: number;
  chartLabels: string[];
  chartCounts: number[];
  records: AnalyticsRecord[];
};

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function getPeriodRange(period: AnalyticsPeriod, now: Date): { start: Date; end: Date } {
  const end = endOfLocalDay(now);
  const start = startOfLocalDay(now);

  if (period === "today") {
    return { start, end };
  }
  if (period === "week") {
    const s = new Date(start);
    s.setDate(s.getDate() - 6);
    return { start: startOfLocalDay(s), end };
  }
  const s = new Date(start);
  s.setMonth(s.getMonth() - 1);
  return { start: startOfLocalDay(s), end };
}

function inPeriod(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function markHigh(counts: number[]): boolean[] {
  const max = Math.max(...counts, 0);
  if (max === 0) return counts.map(() => false);
  const threshold = Math.max(1, max * 0.65);
  return counts.map((c) => c >= threshold);
}

export function computeQueueAnalytics(
  history: TerminalQueueEntry[],
  period: AnalyticsPeriod,
  now: Date = new Date()
): QueueAnalyticsResult {
  const { start, end } = getPeriodRange(period, now);
  const inRange = history.filter((e) => inPeriod(e.updatedAt, start, end));

  const done = inRange.filter((e) => e.status === "DONE");
  const cancelled = inRange.filter((e) => e.status === "CANCELLED");
  const totalTerminal = done.length + cancelled.length;

  const avgWaitMinutes =
    done.length === 0
      ? 0
      : Math.round(
          (done.reduce((acc, e) => {
            const w =
              (new Date(e.updatedAt).getTime() - new Date(e.arrivalTime).getTime()) / 60000;
            return acc + Math.max(0, w);
          }, 0) /
            done.length) *
            10
        ) / 10;

  const dropoutRate =
    totalTerminal === 0 ? 0 : Math.round((cancelled.length / totalTerminal) * 1000) / 10;

  let chartLabels: string[] = [];
  let chartCounts: number[] = [];

  if (period === "today") {
    chartLabels = ["0–6時", "6–12時", "12–18時", "18–24時"];
    chartCounts = [0, 0, 0, 0];
    for (const e of inRange) {
      const h = new Date(e.arrivalTime).getHours();
      const b = h < 6 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3;
      chartCounts[b]++;
    }
  } else if (period === "week") {
    const dayStarts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      d.setHours(0, 0, 0, 0);
      dayStarts.push(d.getTime());
      chartLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    chartCounts = [0, 0, 0, 0, 0, 0, 0];
    const firstDay = dayStarts[0];
    const lastDay = dayStarts[6] + 86400000;
    for (const e of inRange) {
      const at = new Date(e.arrivalTime);
      at.setHours(0, 0, 0, 0);
      const t = at.getTime();
      if (t < firstDay || t >= lastDay) continue;
      const idx = Math.round((t - firstDay) / 86400000);
      if (idx >= 0 && idx < 7) chartCounts[idx]++;
    }
  } else {
    const spanMs = end.getTime() - start.getTime();
    chartCounts = [0, 0, 0, 0];
    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    if (spanMs > 0) {
      for (const e of inRange) {
        const t = new Date(e.arrivalTime).getTime() - start.getTime();
        let b = Math.floor((t / spanMs) * 4);
        b = Math.max(0, Math.min(3, b));
        chartCounts[b]++;
      }
      const q = spanMs / 4;
      chartLabels = [0, 1, 2, 3].map((i) => {
        const a = new Date(start.getTime() + q * i);
        const bEnd = new Date(Math.min(start.getTime() + q * (i + 1) - 1, end.getTime()));
        return `${fmt(a)}〜${fmt(bEnd)}`;
      });
    } else {
      chartLabels = ["—", "—", "—", "—"];
    }
  }

  const highFlags = markHigh(chartCounts);
  const records: AnalyticsRecord[] = chartLabels.map((label, i) => ({
    date: label,
    count: chartCounts[i] ?? 0,
    high: highFlags[i] ?? false,
  }));

  return {
    totalGuidedCount: done.length,
    dropoutRate,
    avgWaitMinutes,
    chartLabels,
    chartCounts,
    records,
  };
}

/** SVG viewBox width / height に合わせたエリア塗りつぶしと折れ線 */
export function buildCongestionChartPaths(
  counts: number[],
  width: number,
  height: number,
  paddingBottom = 28,
  paddingTop = 12
): { area: string; line: string } {
  const n = counts.length;
  const bottomY = height;
  if (n === 0) {
    const y = height - paddingBottom;
    return {
      area: `M0 ${bottomY} L${width} ${bottomY} L${width} ${y} L0 ${y} Z`,
      line: `M0 ${y} L${width} ${y}`,
    };
  }

  const max = Math.max(...counts, 1);
  const innerH = height - paddingBottom - paddingTop;
  const step = n === 1 ? width / 2 : width / (n - 1);
  const points = counts.map((c, i) => ({
    x: n === 1 ? width / 2 : i * step,
    y: paddingTop + innerH - (c / max) * innerH,
  }));

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const areaD =
    `M0 ${bottomY} L${first.x.toFixed(1)} ${first.y.toFixed(1)}` +
    points
      .slice(1)
      .map((p) => ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join("") +
    ` L${last.x.toFixed(1)} ${bottomY} Z`;

  return { area: areaD, line: lineD };
}
