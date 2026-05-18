import { useState, useEffect } from 'react';
import { Star, Send, Sparkles, Filter } from 'lucide-react';
import { reviewsApi } from '../../lib/reviewsApi';
import type { Review } from '../../types/reviews';

const PLATFORM_COLORS: Record<string, string> = {
  google: 'bg-blue-500', yelp: 'bg-red-500', facebook: 'bg-indigo-500', trustpilot: 'bg-green-500',
  bbb: 'bg-yellow-500', g2: 'bg-orange-500', capterra: 'bg-teal-500', tripadvisor: 'bg-lime-500', weedmaps: 'bg-emerald-500',
};

export default function ReviewInboxPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<'all' | 'new' | 'responded' | 'negative' | 'positive'>('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState('');

  const load = async () => {
    try {
      const filters: Record<string, string> = {};
      if (platformFilter) filters.platform = platformFilter;
      if (tab === 'new') filters.responded = 'false';
      if (tab === 'responded') filters.responded = 'true';
      if (tab === 'negative') filters.sentiment = 'negative';
      if (tab === 'positive') filters.sentiment = 'positive';
      const res = await reviewsApi.list(filters);
      setReviews(res.data || []);
    } catch { setReviews([]); }
  };

  useEffect(() => { load(); }, [tab, platformFilter]);

  const generateResponse = async (reviewId: string) => {
    setGenerating(reviewId);
    try {
      const res = await reviewsApi.generateResponse(reviewId);
      if (res.ai_draft) setDrafts((d) => ({ ...d, [reviewId]: res.ai_draft }));
    } catch { /* ignore */ }
    setGenerating(null);
  };

  const postResponse = async (reviewId: string) => {
    const text = drafts[reviewId];
    if (!text) return;
    try {
      await reviewsApi.postResponse(reviewId, text);
      setDrafts((d) => { const n = { ...d }; delete n[reviewId]; return n; });
      load();
    } catch { /* ignore */ }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'responded', label: 'Responded' },
    { key: 'negative', label: 'Negative' },
    { key: 'positive', label: 'Positive' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Inbox</h1>
          <p className="text-gray-400 text-sm mt-1">Respond to reviews across all platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="px-3 py-2 bg-[#1E1E36] border border-white/10 rounded-xl text-white text-sm">
            <option value="">All Platforms</option>
            {['google', 'yelp', 'facebook', 'trustpilot', 'bbb', 'g2', 'capterra', 'tripadvisor', 'weedmaps'].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-[#6C47FF] text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-8 text-center">
          <p className="text-gray-400 text-sm">No reviews found. Sync reviews from the Setup page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${PLATFORM_COLORS[r.platform] || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {r.platform.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{r.reviewer_name || 'Anonymous'}</span>
                    <span className="text-gray-500 text-xs capitalize">{r.platform}</span>
                    <span className="text-gray-500 text-xs">{r.review_date}</span>
                    {r.responded && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Responded</span>}
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm">{r.review_text}</p>

                  {r.responded && r.response_text && (
                    <div className="mt-3 pl-4 border-l-2 border-[#6C47FF]/30">
                      <p className="text-gray-400 text-xs font-medium mb-1">Your Response:</p>
                      <p className="text-gray-300 text-sm">{r.response_text}</p>
                    </div>
                  )}

                  {!r.responded && (
                    <div className="mt-3 space-y-2">
                      {drafts[r.id] ? (
                        <>
                          <textarea
                            value={drafts[r.id]}
                            onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => postResponse(r.id)} className="flex items-center gap-2 px-4 py-2 bg-[#00C896] text-white rounded-xl text-xs font-medium hover:bg-[#00b085]">
                              <Send size={14} /> Post Response
                            </button>
                            <button onClick={() => setDrafts((d) => { const n = { ...d }; delete n[r.id]; return n; })} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs hover:text-white">
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => generateResponse(r.id)}
                          disabled={generating === r.id}
                          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF]/20 text-[#6C47FF] rounded-xl text-xs font-medium hover:bg-[#6C47FF]/30 disabled:opacity-50"
                        >
                          <Sparkles size={14} /> {generating === r.id ? 'Generating...' : 'Generate AI Response'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
