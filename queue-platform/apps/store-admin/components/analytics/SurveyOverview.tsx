import React from 'react';

interface SurveyOverviewProps {
  totalResponses: number;
  avgSatisfaction: number;
  revisitIntentionYes: number;
  waitTimeToleranceRate: number;
}

export default function SurveyOverview({
  totalResponses,
  avgSatisfaction,
  revisitIntentionYes,
  waitTimeToleranceRate,
}: SurveyOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* 総回答数 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#FD780F]">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span className="text-xs text-gray-500">総回答数</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-[#FD780F]">{totalResponses}</span>
          <span className="text-sm text-gray-500 ml-1">件</span>
        </div>
      </div>

      {/* 満足度平均 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg viewBox="0 0 24 24" fill="#FD780F" className="w-4 h-4">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs text-gray-500">満足度平均</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-[#082752]">{avgSatisfaction.toFixed(1)}</span>
          <span className="text-sm text-gray-500 ml-1">/ 5.0</span>
        </div>
      </div>

      {/* 再来店意向 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" className="w-4 h-4">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <span className="text-xs text-gray-500">再来店意向</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-[#10B981]">{revisitIntentionYes.toFixed(1)}</span>
          <span className="text-sm text-gray-500 ml-1">%</span>
        </div>
      </div>

      {/* 待ち許容率 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#082752]">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-xs text-gray-500">待ち許容率</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-[#082752]">{(waitTimeToleranceRate * 100).toFixed(1)}</span>
          <span className="text-sm text-gray-500 ml-1">%</span>
        </div>
      </div>
    </div>
  );
}
