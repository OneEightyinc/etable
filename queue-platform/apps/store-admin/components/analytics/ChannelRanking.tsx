import React from 'react';

const channelLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x_twitter: 'X(Twitter)',
  google_maps: 'Googleマップ',
  walk_in: '通りすがり',
  referral: '友人の紹介',
  web_media: 'Webメディア',
};

interface ChannelRankingProps {
  byAcquisitionChannel: Record<string, number>;
}

export default function ChannelRanking({ byAcquisitionChannel }: ChannelRankingProps) {
  const sorted = Object.entries(byAcquisitionChannel)
    .map(([key, value]) => ({ key, label: channelLabels[key] || key, count: value }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return null;
  }

  const maxCount = sorted[0].count;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
      <h3 className="text-sm font-medium text-[#082752] mb-4">流入チャネル</h3>
      <div className="space-y-3">
        {sorted.map((item, index) => (
          <div key={item.key} className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#082752] w-5 text-right">{index + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#082752]">{item.label}</span>
                <span className="text-sm font-medium text-[#082752]">{item.count}件</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                    backgroundColor: index === 0 ? '#FD780F' : '#082752',
                    opacity: 1 - index * 0.1 > 0.4 ? 1 - index * 0.1 : 0.4,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
