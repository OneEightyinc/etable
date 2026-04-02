import Link from 'next/link';

interface Review {
  rating: number;
  title: string;
  content: string;
}

const reviews: Review[] = [
  {
    rating: 5,
    title: '案内がとてもスムーズでした',
    content: '到着してからの案内が早く、スタッフの方も丁寧でした。',
  },
  {
    rating: 4,
    title: '待ち時間の見積もりが正確',
    content: 'アプリの表示と実際の待ち時間にズレがなく安心できました。',
  },
  {
    rating: 3,
    title: 'ピークタイムは少し待ちました',
    content: '混雑時はやや待ちましたが、状況が分かるのはよかったです。',
  },
  {
    rating: 2,
    title: '通知が少し遅れました',
    content: '呼び出し通知が体感で数分遅く感じました。改善に期待しています。',
  },
  {
    rating: 5,
    title: '店内の案内までスムーズ',
    content: '席までスムーズに案内してもらえ、トータルで満足度が高いです。',
  },
];

const StarIcon = ({ filled, size = 'md' }: { filled: boolean; size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';
  const color = filled ? 'text-[#FD780F] fill-[#FD780F]' : 'text-gray-300';

  return (
    <svg
      className={`${sizeClass} ${color}`}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};

const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.round(rating));

  return (
    <div className={`flex gap-1 ${size === 'sm' ? 'gap-0.5' : ''}`}>
      {stars.map((filled, i) => (
        <StarIcon key={i} filled={filled} size={size} />
      ))}
    </div>
  );
};

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center z-10">
        <Link href="/" className="w-8 h-8 flex items-center justify-center text-[#082752] hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" strokeWidth={2} />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#082752] ml-2">レビュー分析</h1>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* 1. 総合スコアカード */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-gray-500 mb-2">総合スコア</div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <div className="text-4xl font-bold text-[#082752]">3.8</div>
              <div className="text-sm text-gray-400">/5.0</div>
            </div>
            <div className="flex gap-1 ml-auto">
              <StarRating rating={4} />
            </div>
          </div>
        </div>

        {/* 2. AI要約分析カード */}
        <div className="bg-gradient-to-r from-[#082752] to-[#0a3060] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-[#FD780F] rounded-full flex items-center justify-center">
              <span className="text-xs text-white">AI</span>
            </div>
            <span className="text-sm text-white/70">AI要約分析</span>
          </div>
          <div className="text-white text-sm leading-relaxed">
            直近のレビューから、受付体験に対する満足度は高い水準を維持しています。一方で、ピークタイムの待ち時間や通知タイミングに関する改善要望も確認されています。
          </div>
        </div>

        {/* 3. ポジティブな意見 / 改善点 */}
        <div className="grid grid-cols-1 gap-4">
          {/* ポジティブな意見 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#082752] mb-2">ポジティブな意見</h3>
            <ul className="space-y-2">
              {[
                '案内がスムーズで、待ち時間のストレスが少ない。',
                '待ち時間の予測が概ね正確で、来店タイミングを調整しやすい。',
                'スタッフの対応が丁寧で安心感がある。',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[#FD780F] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 改善点 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#082752] mb-2">改善点</h3>
            <ul className="space-y-2">
              {[
                'ピークタイムの待ち時間をもう少し短縮したいという声がある。',
                '通知タイミングが遅く感じられるケースが一部で見られる。',
                '初回利用時の操作説明を、もう少し分かりやすくしてほしいという要望がある。',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[#082752] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. 直近のレビュー一覧 */}
        <div>
          <div className="text-xs text-gray-500 mb-3">直近のレビュー一覧：5件</div>
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-[#082752] flex-shrink-0">
                    {review.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-[#082752] text-sm">{review.title}</h4>
                      <span className="text-xs text-gray-400">直近</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
