import React, { useState, useEffect, useCallback } from 'react';

interface InsightsData {
  waitingSurveyCount: number;
  waitingSurveyRate: number;
  channelRanking: { channel: string; count: number }[];
  popularMenus: { menu: string; count: number }[];
  totalReviews: number;
  reviewRate: number;
  avgSatisfaction: number;
  satisfactionDistribution: Record<number, number>;
  googleReviewCount: number;
  googleConversionRate: number;
  highRatingCount: number;
  lowRatingFeedback: { rating: number; feedback: string; createdAt: string }[];
  totalCustomers: number;
  completedCount: number;
  cancelledCount: number;
}

type DatePreset = 'today' | 'week' | 'month';

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  switch (preset) {
    case 'today': return { from: to, to };
    case 'week': { const d = new Date(today); d.setDate(d.getDate() - 7); return { from: d.toISOString().split('T')[0], to }; }
    case 'month': { const d = new Date(today); d.setMonth(d.getMonth() - 1); return { from: d.toISOString().split('T')[0], to }; }
  }
}

const CHANNEL_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', google: 'Google検索',
  referral: '友人紹介', walkin: '通りがかり', other: 'その他',
  tabelog: '食べログ', hotpepper: 'ホットペッパー', twitter: 'X (Twitter)',
};

const STAR_COLORS = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];

/* ── Sub-components ── */

const KpiCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = ({ label, value, sub, color }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm">
    <p className="text-[11px] font-medium text-gray-400 mb-1">{label}</p>
    <p className={`text-[24px] font-bold ${color || 'text-[#082752]'}`}>{value}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const BarRow: React.FC<{ label: string; count: number; max: number; rank: number }> = ({ label, count, max, rank }) => (
  <div className="flex items-center gap-3 mb-2.5">
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${rank <= 1 ? 'bg-[#FD780F]' : 'bg-[#082752]'}`}>
      {rank + 1}
    </span>
    <div className="flex-1">
      <div className="flex justify-between text-[13px] mb-1">
        <span className="font-medium text-[#333]">{CHANNEL_LABELS[label] || label}</span>
        <span className="font-bold text-[#082752]">{count}件</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-[#FD780F] transition-all" style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} />
      </div>
    </div>
  </div>
);

export default function InsightsDashboard({ storeId }: { storeId: string }) {
  const [preset, setPreset] = useState<DatePreset>('month');
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const prefix = process.env.NEXT_PUBLIC_API_PREFIX || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(preset);
    try {
      const res = await fetch(
        `${prefix}/api/analytics/insights?storeId=${encodeURIComponent(storeId)}&from=${from}&to=${to}`,
        { credentials: 'include' }
      );
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [prefix, storeId, preset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-3 border-[#FD780F] border-t-transparent" /></div>;
  }
  if (!data) return null;

  const maxChannel = data.channelRanking.length > 0 ? data.channelRanking[0].count : 1;
  const maxMenu = data.popularMenus.length > 0 ? data.popularMenus[0].count : 1;
  const totalStars = Object.values(data.satisfactionDistribution).reduce((s, v) => s + v, 0);

  return (
    <div>
      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        {([['today', '今日'], ['week', '今週'], ['month', '今月']] as [DatePreset, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setPreset(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${preset === key ? 'bg-[#082752] text-white' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard label="来店客数" value={data.totalCustomers} sub={`案内${data.completedCount} / 離脱${data.cancelledCount}`} />
        <KpiCard label="満足度" value={data.avgSatisfaction || '—'} sub={`${data.totalReviews}件の評価`} color={data.avgSatisfaction >= 4 ? 'text-[#22C55E]' : data.avgSatisfaction >= 3 ? 'text-[#EAB308]' : 'text-[#EF4444]'} />
        <KpiCard label="アンケート回答率" value={`${data.waitingSurveyRate}%`} sub={`${data.waitingSurveyCount}件回答`} />
        <KpiCard label="Googleレビュー転換" value={`${data.googleConversionRate}%`} sub={`高評価${data.highRatingCount}件中${data.googleReviewCount}件`} />
      </div>

      {/* 流入チャネルランキング */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[#082752] mb-4">流入チャネル</h3>
        {data.channelRanking.length === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-4">データなし</p>
        ) : (
          data.channelRanking.map((ch, i) => (
            <BarRow key={ch.channel} label={ch.channel} count={ch.count} max={maxChannel} rank={i} />
          ))
        )}
      </section>

      {/* 人気メニューランキング */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[#082752] mb-4">人気メニュー（お客様の声）</h3>
        {data.popularMenus.length === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-4">データなし</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.popularMenus.map((m, i) => (
              <span key={m.menu} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium ${i === 0 ? 'bg-[#FFF7ED] text-[#FD780F] border border-[#FD780F]' : 'bg-gray-50 text-[#333]'}`}>
                {m.menu}
                <span className="text-[11px] text-gray-400">{m.count}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 満足度分布 */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-[#082752] mb-4">満足度分布</h3>
        {totalStars === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-4">データなし</p>
        ) : (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const cnt = data.satisfactionDistribution[star] || 0;
              const pct = totalStars > 0 ? (cnt / totalStars) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-6 text-right text-[13px] font-bold" style={{ color: STAR_COLORS[star - 1] }}>{star}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={STAR_COLORS[star - 1]}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STAR_COLORS[star - 1] }} />
                  </div>
                  <span className="w-10 text-right text-[12px] text-gray-500">{cnt}件</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 低評価フィードバック */}
      {data.lowRatingFeedback.length > 0 && (
        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-[#082752] mb-4">改善フィードバック（星3以下）</h3>
          <div className="space-y-3">
            {data.lowRatingFeedback.map((fb, i) => (
              <div key={i} className="rounded-xl bg-red-50 px-4 py-3">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, si) => (
                    <svg key={si} width="12" height="12" viewBox="0 0 24 24" fill={si < fb.rating ? '#EF4444' : '#e5e5e5'}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="ml-auto text-[11px] text-gray-400">{fb.createdAt.slice(0, 10)}</span>
                </div>
                <p className="text-[13px] text-[#333]">{fb.feedback}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
