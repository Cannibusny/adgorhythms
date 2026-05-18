import { useState, useEffect } from 'react';
import { BarChart3, Mail, MousePointerClick, AlertTriangle, UserMinus, Send } from 'lucide-react';
import { emailTrackingApi } from '../../lib/emailAnalyticsApi';
import type { CampaignAnalytics } from '../../types/emailAnalytics';

export default function EmailAnalyticsPage() {
  const [campaignId, setCampaignId] = useState('');
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    if (!campaignId.trim()) return;
    setLoading(true);
    try {
      const data = await emailTrackingApi.getCampaignAnalytics(campaignId);
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) loadAnalytics();
  }, [campaignId]);

  const stats = analytics
    ? [
        { label: 'Total Sent', value: analytics.total_sent, icon: Send, color: '#6C47FF' },
        { label: 'Delivered', value: analytics.delivered, sub: `${analytics.delivery_rate}%`, icon: Mail, color: '#10B981' },
        { label: 'Opened', value: analytics.opened, sub: `${analytics.open_rate}%`, icon: Mail, color: '#1DA1F2' },
        { label: 'Clicked', value: analytics.clicked, sub: `${analytics.click_rate}%`, icon: MousePointerClick, color: '#F59E0B' },
        { label: 'Bounced', value: analytics.bounced, sub: `${analytics.bounce_rate}%`, icon: AlertTriangle, color: '#EF4444' },
        { label: 'Unsubscribed', value: analytics.unsubscribed, sub: `${analytics.unsubscribe_rate}%`, icon: UserMinus, color: '#8B5CF6' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={24} /> Email Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">Track email campaign performance</p>
      </div>

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <label className="block text-sm text-gray-400 mb-2">Campaign ID</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter campaign ID to view analytics"
          />
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
          >
            Load Analytics
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading analytics...</div>}

      {analytics && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                {s.sub && <div className="text-xs font-medium mt-0.5" style={{ color: s.color }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Visual funnel */}
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
            <h3 className="text-white font-semibold mb-4">Email Funnel</h3>
            <div className="space-y-3">
              {[
                { label: 'Sent', value: analytics.total_sent, color: '#6C47FF' },
                { label: 'Delivered', value: analytics.delivered, color: '#10B981' },
                { label: 'Opened', value: analytics.opened, color: '#1DA1F2' },
                { label: 'Clicked', value: analytics.clicked, color: '#F59E0B' },
              ].map((step) => {
                const pct = analytics.total_sent > 0 ? (step.value / analytics.total_sent) * 100 : 0;
                return (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="w-20 text-right text-sm text-gray-400">{step.label}</div>
                    <div className="flex-1 bg-white/5 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center px-3"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.color }}
                      >
                        <span className="text-xs font-medium text-white whitespace-nowrap">
                          {step.value.toLocaleString()} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!analytics && !loading && !campaignId && (
        <div className="text-center py-16 bg-[#1E1E36] rounded-2xl border border-white/5">
          <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Email Campaign Analytics</h3>
          <p className="text-gray-400 text-sm">Enter a campaign ID above to view detailed analytics</p>
        </div>
      )}
    </div>
  );
}
