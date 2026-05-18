import { useState, useEffect } from 'react';
import { Send, Mail, BarChart3 } from 'lucide-react';
import { reviewsApi } from '../../lib/reviewsApi';
import type { RequestStats } from '../../types/reviews';

export default function ReviewRequestsPage() {
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    reviewsApi.requestStats().then(setStats).catch(() => {});
  }, []);

  const sendRequest = async () => {
    if (!email) return;
    setSending(true);
    try {
      await reviewsApi.requestReview(email, name);
      setSent(true);
      setEmail('');
      setName('');
      setTimeout(() => setSent(false), 3000);
      reviewsApi.requestStats().then(setStats).catch(() => {});
    } catch { /* ignore */ }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review Requests</h1>
        <p className="text-gray-400 text-sm mt-1">Ask happy customers to leave reviews</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-2"><Mail size={16} className="text-blue-400" /></div>
            <div className="text-2xl font-bold text-white">{stats.total_sent}</div>
            <div className="text-gray-400 text-xs mt-1">Requests Sent</div>
          </div>
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className="text-2xl font-bold text-white">{stats.opened}</div>
            <div className="text-gray-400 text-xs mt-1">Opened</div>
          </div>
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className="text-2xl font-bold text-green-400">{stats.reviews_posted}</div>
            <div className="text-gray-400 text-xs mt-1">Reviews Posted</div>
          </div>
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-2"><BarChart3 size={16} className="text-[#6C47FF]" /></div>
            <div className="text-2xl font-bold text-[#6C47FF]">{stats.conversion_rate}%</div>
            <div className="text-gray-400 text-xs mt-1">Conversion Rate</div>
          </div>
        </div>
      )}

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold mb-4">Send Review Request</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Customer Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Customer Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={sendRequest} disabled={!email || sending} className="flex items-center gap-2 px-6 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Send size={16} /> {sending ? 'Sending...' : 'Send Request'}
          </button>
          {sent && <span className="text-green-400 text-sm">Request sent successfully!</span>}
        </div>
      </div>

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold mb-4">Email Template Preview</h2>
        <div className="bg-[#12121F] rounded-xl p-6 border border-white/5">
          <div className="text-center mb-4">
            <img src="/logo-small.png" alt="ADgorhythms" className="w-12 h-12 mx-auto mb-2 rounded-lg" />
          </div>
          <h3 className="text-white font-bold text-lg text-center mb-2">How was your experience?</h3>
          <p className="text-gray-300 text-sm text-center mb-4">
            Hi {name || '{Customer Name}'},<br /><br />
            Thank you for choosing us! We&apos;d love to hear about your experience. Your feedback helps us improve and helps others discover our services.
          </p>
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center cursor-pointer hover:bg-yellow-500/40 transition-colors">
                <span className="text-yellow-400 text-lg">&#9733;</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs text-center">Click a star to leave your review</p>
        </div>
      </div>
    </div>
  );
}
