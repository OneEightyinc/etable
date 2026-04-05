import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#FD780F', '#082752', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const genderLabels: Record<string, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
  no_answer: '未回答',
};

const ageGroupLabels: Record<string, string> = {
  teens: '10代',
  '20s_early': '20代前半',
  '20s_late': '20代後半',
  '30s_early': '30代前半',
  '30s_late': '30代後半',
  '40s': '40代',
  '50s_plus': '50代以上',
};

const groupTypeLabels: Record<string, string> = {
  solo: 'ひとり',
  friends: '友人',
  couple: 'カップル',
  family: '家族',
  business: 'ビジネス',
};

interface DonutChartProps {
  title: string;
  data: Record<string, number>;
  labelMap: Record<string, string>;
}

function DonutChart({ title, data, labelMap }: DonutChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: labelMap[key] || key,
    value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex-1 min-w-[280px]">
        <h3 className="text-sm font-medium text-[#082752] mb-4">{title}</h3>
        <p className="text-sm text-gray-400 text-center py-8">データなし</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex-1 min-w-[280px]">
      <h3 className="text-sm font-medium text-[#082752] mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value}件`, '']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span style={{ color: '#082752', fontSize: '12px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AttributeChartsProps {
  byGender: Record<string, number>;
  byAgeGroup: Record<string, number>;
  byGroupType: Record<string, number>;
}

export default function AttributeCharts({ byGender, byAgeGroup, byGroupType }: AttributeChartsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 overflow-x-auto">
      <DonutChart title="性別分布" data={byGender} labelMap={genderLabels} />
      <DonutChart title="年代分布" data={byAgeGroup} labelMap={ageGroupLabels} />
      <DonutChart title="利用形態" data={byGroupType} labelMap={groupTypeLabels} />
    </div>
  );
}
