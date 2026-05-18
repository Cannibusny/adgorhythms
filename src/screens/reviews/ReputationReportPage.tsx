import { useState, useEffect } from 'react';
import { Download, Star, TrendingUp } from 'lucide-react';
import { reviewsApi } from '../../lib/reviewsApi';
import type { ReviewStats, ReviewTrend, ReviewCompetitor } from '../../types/reviews';

export default function ReputationReportPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [trends, setTrends] = useState<ReviewTrend[]>([]);
  const [competitors, setCompetitors] = useState<ReviewCompetitor[]>([]);

  useEffect(() => {
    reviewsApi.stats().then(setStats).catch(() => {});
    reviewsApi.trends().then((r) => setTrends(r.trends || [])).catch(() => {});
    reviewsApi.competitors().then((r) => setCompetitors(r.competitors || [])).catch(() => {});
  }, []);

  const maxCount = Math.max(...trends.map((t) => t.review_count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reputation Report</h1>
          <p className="text-gray-400 text-sm mt-1">Comprehensive reputation overview and competitor comparison</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]">
          <Download size={16} /> Export Report
        </button>
      </div>

      {stats && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo-small.png" alt="ADgorhythms" className="w-10 h-10 rounded-lg" />
            <div>
              <h2 className="text-white font-bold text-lg">Your Business</h2>
              <p className="text-gray-400 text-xs">Reputation Summary</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#12121F] rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold text-white">{stats.avg_rating.toFixed(1)}</span>
              </div>
              <div className="text-gray-400 text-xs">Average Rating</div>
            </div>
            <div className="text-center p-4 bg-[#12121F] rounded-xl">
              <div className="text-2xl font-bold text-white mb-1">{stats.total_reviews}</div>
              <div className="text-gray-400 text-xs">Total Reviews</div>
            </div>
            <div className="text-center p-4 bg-[#12121F] rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-1">{stats.response_rate}%</div>
              <div className="text-gray-400 text-xs">Response Rate</div>
            </div>
            <div className="text-center p-4 bg-[#12121F] rounded-xl">
              <div className="text-2xl font-bold text-emerald-400 mb-1">
                {stats.total_reviews > 0 ? Math.round((stats.sentiment.positive / stats.total_reviews) * 100) : 0}%
              </div>
              <div className="text-gray-400 text-xs">Positive Sentiment</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#6C47FF]" />
          <h2 className="text-white font-semibold">Rating Trends (12 Months)</h2>
        </div>
        <div className="flex items-end gap-2 h-40">
          {trends.map((t) => (
            <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-yellow-400 font-medium">{t.avg_rating}</span>
              <div className="w-full rounded-t relative" style={{ height: `${(t.review_count / maxCount) * 100}%`, minHeight: '4px' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#6C47FF] to-[#00D4FF] rounded-t opacity-80" />
              </div>
              <span className="text-[10px] text-gray-500">{t.review_count}</span>
              <span className="text-[10px] text-gray-500 truncate w-full text-center">{t.month.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold mb-4">Competitor Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Business</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Avg Rating</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Total Reviews</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Response Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats && (
                <tr className="border-b border-white/5 bg-[#6C47FF]/10">
                  <td className="py-3 px-4 text-white font-medium">Your Business</td>
                  <td className="py-3 px-4 text-center">
                    <span className="flex items-center justify-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> <span className="text-white">{stats.avg_rating.toFixed(1)}</span></span>
                  </td>
                  <td className="py-3 px-4 text-center text-white">{stats.total_reviews}</td>
                  <td className="py-3 px-4 text-center text-green-400">{stats.response_rate}%</td>
                </tr>
              )}
              {competitors.map((c) => (
                <tr key={c.name} className="border-b border-white/5">
                  <td className="py-3 px-4 text-gray-300">{c.name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="flex items-center justify-center gap-1"><Star size={14} className="text-yellow-400" /> <span className="text-gray-300">{c.avg_rating}</span></span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-300">{c.total_reviews}</td>
                  <td className="py-3 px-4 text-center text-gray-400">{c.response_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
