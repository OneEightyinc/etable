import React, { useState, useEffect, useCallback } from 'react';
import SurveyOverview from './SurveyOverview';
import AttributeCharts from './AttributeCharts';
import PurposeChart from './PurposeChart';
import ChannelRanking from './ChannelRanking';
import SatisfactionChart from './SatisfactionChart';
import BudgetChart from './BudgetChart';
import ReviewList from './ReviewList';

interface SurveyData {
  totalResponses: number;
  byGender: Record<string, number>;
  byAgeGroup: Record<string, number>;
  byGroupType: Record<string, number>;
  byVisitPurpose: Record<string, number>;
  byAcquisitionChannel: Record<string, number>;
  byBudget: Record<string, number>;
  byVisitCount: Record<string, number>;
  avgSatisfaction: number;
  satisfactionDistribution: Record<string, number>;
  waitTimeToleranceRate: number;
  revisitIntentionRate: { yes: number; no: number; maybe: number };
  recentReviews: { etableReview: string; visitedAt: string }[];
  topMenuKeywords: { word: string; count: number }[];
}

type DatePreset = 'today' | 'week' | 'month' | 'custom';

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { from: to, to };
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo.toISOString().split('T')[0], to };
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { from: monthAgo.toISOString().split('T')[0], to };
    }
    default:
      return { from: to, to };
  }
}

interface SurveyDashboardProps {
  storeId: string;
}

export default function SurveyDashboard({ storeId }: SurveyDashboardProps) {
  const [preset, setPreset] = useState<DatePreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const prefix = process.env.NEXT_PUBLIC_API_PREFIX || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let from: string;
    let to: string;

    if (preset === 'custom') {
      from = customFrom;
      to = customTo;
      if (!from || !to) {
        setLoading(false);
        return;
      }
    } else {
      const range = getDateRange(preset);
      from = range.from;
      to = range.to;
    }

    try {
      const res = await fetch(
        `${prefix}/api/analytics/survey?storeId=${encodeURIComponent(storeId)}&from=${from}&to=${to}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || `通信エラー (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [prefix, storeId, preset, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      {/* Date Filter */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl mb-6">
        {([
          { key: 'today', label: '今日' },
          { key: 'week', label: '今週' },
          { key: 'month', label: '今月' },
          { key: 'custom', label: 'カスタム' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              preset === key ? 'bg-[#082752] text-white' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex gap-3 mb-6 items-center">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#082752]"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#082752]"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-[#FD780F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Dashboard Content */}
      {data && !loading && (
        <>
          <SurveyOverview
            totalResponses={data.totalResponses}
            avgSatisfaction={data.avgSatisfaction}
            revisitIntentionYes={data.revisitIntentionRate.yes}
            waitTimeToleranceRate={data.waitTimeToleranceRate}
          />

          <AttributeCharts
            byGender={data.byGender}
            byAgeGroup={data.byAgeGroup}
            byGroupType={data.byGroupType}
          />

          <PurposeChart byVisitPurpose={data.byVisitPurpose} />

          <ChannelRanking byAcquisitionChannel={data.byAcquisitionChannel} />

          <SatisfactionChart satisfactionDistribution={data.satisfactionDistribution} />

          <BudgetChart byBudget={data.byBudget} />

          <ReviewList recentReviews={data.recentReviews} />
        </>
      )}
    </div>
  );
}
