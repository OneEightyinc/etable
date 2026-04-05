import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SatisfactionChartProps {
  satisfactionDistribution: Record<string, number>;
}

export default function SatisfactionChart({ satisfactionDistribution }: SatisfactionChartProps) {
  const chartData = [1, 2, 3, 4, 5].map((star) => ({
    name: `★${star}`,
    count: satisfactionDistribution[String(star)] || 0,
    star,
  }));

  const colors = ['#FEB273', '#FD9A47', '#FD780F', '#E56A0D', '#CC5E0B'];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
      <h3 className="text-sm font-medium text-[#082752] mb-4">満足度分布</h3>
      <ResponsiveContainer width="100%" height={220}>
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
