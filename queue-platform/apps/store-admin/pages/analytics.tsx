import { useState } from 'react';
import Link from 'next/link';
import SurveyDashboard from '../components/analytics/SurveyDashboard';

type Period = 'today' | 'week' | 'month';

interface AnalyticsRecord {
  date: string;
  count: number;
  high: boolean;
}

interface PeriodData {
  totalGuidedCount: number;
  dropoutRate: number;
  avgWaitMinutes: number;
  records: AnalyticsRecord[];
}

const analyticsData: Record<Period, PeriodData> = {
  today: {
    totalGuidedCount: 96,
    dropoutRate: 4.1,
    avgWaitMinutes: 18.2,
    records: [
      { date: '今日（00-06）', count: 38, high: false },
      { date: '今日（06-12）', count: 42, high: false },
      { date: '今日（12-18）', count: 0, high: false },
      { date: '今日（18-24）', count: 58, high: true },
    ],
  },
  week: {
    totalGuidedCount: 428,
    dropoutRate: 4.2,
    avgWaitMinutes: 24.5,
    records: [
      { date: '2025/03/05', count: 142, high: true },
      { date: '2025/03/04', count: 98, high: false },
      { date: '2025/03/03', count: 0, high: false },
      { date: '2025/03/02', count: 185, high: true },
    ],
  },
  month: {
    totalGuidedCount: 1320,
    dropoutRate: 3.7,
    avgWaitMinutes: 29.8,
    records: [
      { date: '2025/02', count: 410, high: false },
      { date: '2025/02後半', count: 520, high: true },
      { date: '2025/03前半', count: 0, high: false },
      { date: '2025/03', count: 590, high: true },
    ],
  },
};

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const data = analyticsData[selectedPeriod];

  const chartPathsArea = {
    today: 'M0 150 C 40 130, 80 110, 120 115 C 160 120, 200 105, 240 95 C 280 105, 300 125, 320 135 L 320 160 L 0 160 Z',
    week: 'M0 140 C 40 110, 80 90, 120 100 C 160 120, 200 80, 240 70 C 280 90, 300 110, 320 120 L 320 160 L 0 160 Z',
    month: 'M0 135 C 40 120, 80 100, 120 105 C 160 110, 200 85, 240 75 C 280 85, 300 105, 320 115 L 320 160 L 0 160 Z',
  };

  const chartPathsLine = {
    today: 'M0 150 C 40 130, 80 110, 120 115 C 160 120, 200 105, 240 95 C 280 105, 300 125, 320 135',
    week: 'M0 140 C 40 110, 80 90, 120 100 C 160 120, 200 80, 240 70 C 280 90, 300 110, 320 120',
    month: 'M0 135 C 40 120, 80 100, 120 105 C 160 110, 200 85, 240 75 C 280 85, 300 105, 320 115',
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between z-10">
        <Link href="/" className="w-8 h-8 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5 text-[#082752]"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#082752]">営業分析</h1>
        <div className="w-8 h-8" />
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Period Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-[#082752] text-white'
                  : 'text-gray-500'
              }`}
            >
              {period === 'today' && '今日'}
              {period === 'week' && '今週'}
              {period === 'month' && '今月'}
            </button>
          ))}
        </div>

        {/* 2-Column Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 総案内数 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#FD780F]">
                <path d="M3 3v18h18" />
                <path d="M7 13l3-3 4 4 5-5" />
              </svg>
              <span className="text-xs text-gray-500">総案内数</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-[#FD780F]">{data.totalGuidedCount}</span>
              <span className="text-sm text-gray-500 ml-1">組</span>
            </div>
          </div>

          {/* 離脱率 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#FD780F]">
                <path d="M10.29 3.86 1.82 12.34a1 1 0 0 0 0 1.41l8.47 8.48a1 1 0 0 0 1.71-.71V4.57a1 1 0 0 0-1.71-.71Z" />
                <path d="M21.82 11.66 13.34 3.18A1 1 0 0 0 12 3.9V20.1a1 1 0 0 0 1.71.71l8.47-8.48a1 1 0 0 0 0-1.41Z" />
              </svg>
              <span className="text-xs text-gray-500">離脱率</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-[#082752]">{data.dropoutRate}</span>
              <span className="text-sm text-gray-500 ml-1">%</span>
            </div>
          </div>
        </div>

        {/* Navy Card - Average Wait Time */}
        <div className="bg-[#082752] rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/70">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-sm text-white/70">平均待ち時間</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">{data.avgWaitMinutes}</span>
              <span className="text-lg text-white/70 ml-2">min</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 bg-[#FD780F] rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-sm">
              📊
            </div>
            <span className="text-sm font-medium text-[#082752]">時間帯別・混雑推移</span>
          </div>
          <div className="text-xs text-gray-400 tracking-widest mb-4">PEAK HOUR ANALYSIS</div>
          <svg viewBox="0 0 320 160" className="w-full h-48">
            <defs>
              <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FD780F" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FD780F" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chartPathsArea[selectedPeriod]} fill="url(#analyticsArea)" />
            <path d={chartPathsLine[selectedPeriod]} stroke="#FD780F" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* Past Records */}
        <div>
          <span className="text-xs text-gray-500 mb-3 block">過去の案内実績</span>
          <div className="space-y-3">
            {data.records.map((record, index) => (
              <div key={index} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      record.high ? 'bg-[#FD780F]' : 'bg-gray-300'
                    }`}
                  />
                  <div className="text-left">
                    <div className="font-medium text-[#082752] text-sm">{record.date}</div>
                    <div className="text-xs text-gray-500">
                      {record.count > 0 && (
                        <>
                          <span className={record.high ? 'text-[#FD780F] font-medium' : ''}>{record.count}</span>
                          <span>組</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-400">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* 来店者アンケート Section */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg font-bold text-[#082752]">📋 来店者アンケート</span>
          </div>
          <SurveyDashboard storeId="shibuya-001" />
        </div>
      </div>
    </div>
  );
}
