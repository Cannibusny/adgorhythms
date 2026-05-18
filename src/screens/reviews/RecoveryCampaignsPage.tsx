import { useState, useEffect } from 'react';
import { AlertCircle, Send, Gift } from 'lucide-react';
import { reviewsApi } from '../../lib/reviewsApi';
import type { Review } from '../../types/reviews';

export default function RecoveryCampaignsPage() {
  const [negativeReviews, setNegativeReviews] = useState<Review[]>([]);
  const [recoveryStats, setRecoveryStats] = useState({ total_campaigns: 0, recovered: 0, recovery_rate: 0 });
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    reviewsApi.list({ sentiment: 'negative' }).then((r) => setNegativeReviews(r.data || [])).catch(() => {});
    reviewsApi.recoveryStats().then(setRecoveryStats).catch(() => {});
  }, []);

  const sendRecovery = async (reviewId: string) => {
    const email = emails[reviewId];
    if (!email) return;
    setSending(reviewId);
    try {
      await reviewsApi.recover(reviewId, email, offers[reviewId]);
      setSent((s) => new Set(s).add(reviewId));
    } catch { /* ignore */ }
    setSending(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Recovery Campaigns</h1>
        <p className="text-gray-400 text-sm mt-1">Win back customers who left negative reviews</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <div className="text-2xl font-bold text-white">{recoveryStats.total_campaigns}</div>
          <div className="text-gray-400 text-xs mt-1">Total Campaigns Sent</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <div className="text-2xl font-bold text-green-400">{recoveryStats.recovered}</div>
          <div className="text-gray-400 text-xs mt-1">Successfully Recovered</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <div className="text-2xl font-bold text-[#6C47FF]">{recoveryStats.recovery_rate}%</div>
          <div className="text-gray-400 text-xs mt-1">Recovery Rate</div>
        </div>
      </div>

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold mb-4">Negative Reviews ({negativeReviews.length})</h2>
        {negativeReviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No negative reviews found. Great job!</p>
        ) : (
          <div className="space-y-4">
            {negativeReviews.map((r) => (
              <div key={r.id} className="p-4 bg-[#12121F] rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{r.reviewer_name || 'Anonymous'}</span>
                      <span className="text-red-400 text-xs">{r.rating} star{r.rating !== 1 ? 's' : ''}</span>
                      <span className="text-gray-500 text-xs capitalize">{r.platform}</span>
                      <span className="text-gray-500 text-xs">{r.review_date}</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{r.review_text}</p>

                    {sent.has(r.id) ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Gift size={16} /> Recovery email sent!
                      </div>
                    ) : (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-gray-500 text-xs mb-1 block">Customer Email</label>
                          <input
                            value={emails[r.id] || ''}
                            onChange={(e) => setEmails((em) => ({ ...em, [r.id]: e.target.value }))}
                            placeholder="customer@email.com"
                            className="w-full px-3 py-2 bg-[#1E1E36] border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-gray-500 text-xs mb-1 block">Custom Offer (optional)</label>
                          <input
                            value={offers[r.id] || ''}
                            onChange={(e) => setOffers((o) => ({ ...o, [r.id]: e.target.value }))}
                            placeholder="e.g. 20% off next visit"
                            className="w-full px-3 py-2 bg-[#1E1E36] border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                        <button
                          onClick={() => sendRecovery(r.id)}
                          disabled={!emails[r.id] || sending === r.id}
                          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-lg text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50 whitespace-nowrap"
                        >
                          <Send size={14} /> {sending === r.id ? 'Sending...' : 'Send Recovery'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
