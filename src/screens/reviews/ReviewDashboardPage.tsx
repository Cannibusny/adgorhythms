import { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { reviewsApi } from '../../lib/reviewsApi';
import type { ReviewStats, ReviewTrend } from '../../types/reviews';

export default function ReviewDashboardPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [trends, setTrends] = useState<ReviewTrend[]>([]);

  useEffect(() => {
    reviewsApi.stats().then(setStats).catch(() => {});
    reviewsApi.trends().then((r) => setTrends(r.trends || [])).catch(() => {});
  }, []);

  const statCards = stats ? [
    { label: 'Avg Rating', value: stats.avg_rating.toFixed(1), icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Total Reviews', value: stats.total_reviews, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Response Rate', value: `${stats.response_rate}%`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Positive', value: `${stats.sentiment.positive}`, icon: ThumbsUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ] : [];

  const maxCount = Math.max(...trends.map((t) => t.review_count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">LuxeFlow — Universal Review Intelligence</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon size={20} className={c.color} />
            </div>
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className="text-gray-400 text-xs mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
            <h2 className="text-white font-semibold mb-4">Sentiment Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Positive', count: stats.sentiment.positive, icon: ThumbsUp, color: 'bg-green-500', textColor: 'text-green-400' },
                { label: 'Neutral', count: stats.sentiment.neutral, icon: Minus, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
                { label: 'Negative', count: stats.sentiment.negative, icon: ThumbsDown, color: 'bg-red-500', textColor: 'text-red-400' },
              ].map((s) => {
                const pct = stats.total_reviews > 0 ? Math.round((s.count / stats.total_reviews) * 100) : 0;
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <s.icon size={16} className={s.textColor} />
                    <span className="text-gray-300 text-sm w-16">{s.label}</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-400 text-xs w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
            <h2 className="text-white font-semibold mb-4">Reviews by Platform</h2>
            <div className="space-y-3">
              {Object.entries(stats.by_platform).sort(([, a], [, b]) => b - a).map(([platform, count]) => {
                const pct = stats.total_reviews > 0 ? Math.round((count / stats.total_reviews) * 100) : 0;
                return (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm w-24 capitalize">{platform}</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6C47FF] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-400 text-xs w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold mb-4">Rating Trends (12 Months)</h2>
        <div className="flex items-end gap-2 h-40">
          {trends.map((t) => (
            <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">{t.avg_rating}</span>
              <div className="w-full bg-[#6C47FF]/60 rounded-t" style={{ height: `${(t.review_count / maxCount) * 100}%`, minHeight: '4px' }} />
              <span className="text-[10px] text-gray-500 truncate w-full text-center">{t.month.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
