import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const budgetLabels: Record<string, string> = {
  '500': '~500円',
  '1000': '~1,000円',
  '1500': '~1,500円',
  '2000': '~2,000円',
  '3000': '~3,000円',
  '5000': '~5,000円',
  '5001': '5,000円~',
};

const budgetOrder = ['500', '1000', '1500', '2000', '3000', '5000', '5001'];

interface BudgetChartProps {
  byBudget: Record<string, number>;
}

export default function BudgetChart({ byBudget }: BudgetChartProps) {
  const chartData = budgetOrder
    .filter((key) => byBudget[key] !== undefined)
    .map((key) => ({
      name: budgetLabels[key] || key,
      count: byBudget[key],
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
      <h3 className="text-sm font-medium text-[#082752] mb-4">予算帯分布</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#082752', fontSize: 11 }}
            axisLine={{ stroke: '#E5E7EB' }}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fill: '#082752', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip
            formatter={(value) => [`${value}件`, '回答数']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="count" fill="#082752" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
