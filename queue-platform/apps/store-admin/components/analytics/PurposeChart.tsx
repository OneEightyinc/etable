import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const purposeLabels: Record<string, string> = {
  lunch: 'ランチ',
  dinner: 'ディナー',
  drinking: '飲み会',
  date: 'デート',
  work_cafe: '作業カフェ',
  other: 'その他',
};

interface PurposeChartProps {
  byVisitPurpose: Record<string, number>;
}

export default function PurposeChart({ byVisitPurpose }: PurposeChartProps) {
  const chartData = Object.entries(byVisitPurpose).map(([key, value]) => ({
    name: purposeLabels[key] || key,
    count: value,
  }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
      <h3 className="text-sm font-medium text-[#082752] mb-4">来店目的</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#082752', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fill: '#082752', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip
            formatter={(value) => [`${value}件`, '回答数']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="count" fill="#FD780F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
