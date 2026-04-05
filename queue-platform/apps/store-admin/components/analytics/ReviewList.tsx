import React from 'react';

interface Review {
  etableReview: string;
  visitedAt: string;
}

interface ReviewListProps {
  recentReviews: Review[];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  } catch {
    return dateStr;
  }
}

export default function ReviewList({ recentReviews }: ReviewListProps) {
  const reviews = recentReviews.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
      <h3 className="text-sm font-medium text-[#082752] mb-4">最近のレビュー</h3>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">まだレビューはありません</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, index) => (
            <div key={index} className="border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-[#082752] leading-relaxed">{review.etableReview}</p>
              <p className="text-xs text-gray-400 mt-2">{formatDate(review.visitedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
