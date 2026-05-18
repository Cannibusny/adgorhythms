import { useState, useEffect } from 'react';
import { DollarSign, Plus, X, TrendingUp, BarChart3 } from 'lucide-react';
import { aiRoiApi } from '../../lib/aiEnhancementsApi';
import type { RoiByChannel, RoiTrend } from '../../types/aiEnhancements';

export default function RoiDashboardPage() {
  const [channels, setChannels] = useState<RoiByChannel[]>([]);
  const [trends, setTrends] = useState<RoiTrend[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ channel: '', spend: 0, revenue_attributed: 0, campaign_id: '' });

  const loadData = async () => {
    try {
      const [ch, tr] = await Promise.all([aiRoiApi.byChannel(), aiRoiApi.trends()]);
      setChannels(ch.data || []);
      setTrends(tr.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadData(); }, []);

  const addCalculation = async () => {
    if (!form.channel || !form.spend) return;
    await aiRoiApi.calculate(form);
    setShowAdd(false);
    setForm({ channel: '', spend: 0, revenue_attributed: 0, campaign_id: '' });
    loadData();
  };

  const totalSpend = channels.reduce((s, c) => s + c.total_spend, 0);
  const totalRevenue = channels.reduce((s, c) => s + c.total_revenue, 0);
  const overallRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;
  const maxRevenue = Math.max(...channels.map(c => c.total_revenue), 1);

  const roiColor = (roi: number) => {
    if (roi >= 100) return 'text-green-400';
    if (roi >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign size={24} /> ROI Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track return on investment by channel with AI insights</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]">
          <Plus size={16} /> Add ROI Data
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">${totalSpend.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Spend</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-[#00C896]">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Revenue</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className={`text-2xl font-bold ${roiColor(overallRoi)}`}>{overallRoi.toFixed(1)}%</div>
          <div className="text-xs text-gray-400">Overall ROI</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">{channels.length}</div>
          <div className="text-xs text-gray-400">Channels</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI by Channel */}
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> ROI by Channel
          </h3>
          {channels.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
              <p>No ROI data yet. Add campaign spending to see ROI analysis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((ch) => (
                <div key={ch.channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium capitalize">{ch.channel}</span>
                    <span className={`text-sm font-bold ${roiColor(ch.roi_percentage)}`}>{ch.roi_percentage}% ROI</span>
                  </div>
                  <div className="flex gap-2 h-6">
                    <div className="bg-red-500/30 rounded" style={{ width: `${(ch.total_spend / maxRevenue) * 100}%` }} title={`Spend: $${ch.total_spend}`} />
                    <div className="bg-green-500/30 rounded" style={{ width: `${(ch.total_revenue / maxRevenue) * 100}%` }} title={`Revenue: $${ch.total_revenue}`} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Spend: ${ch.total_spend.toLocaleString()}</span>
                    <span>Revenue: ${ch.total_revenue.toLocaleString()}</span>
                    <span>CAC: ${ch.cac}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROI Trends */}
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> ROI Trends
          </h3>
          {trends.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp size={48} className="mx-auto text-gray-600 mb-4" />
              <p>No trend data yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trends.map((t) => (
                <div key={t.month} className="bg-[#12121F] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium">{t.month}</span>
                    <span className={`text-sm font-bold ${roiColor(t.roi_percentage)}`}>{t.roi_percentage}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Spend: ${t.spend.toLocaleString()}</span>
                    <span>Revenue: ${t.revenue.toLocaleString()}</span>
                    <span>{t.count} campaigns</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-2">
                    <div
                      className={`h-full rounded-full ${t.roi_percentage >= 100 ? 'bg-green-500' : t.roi_percentage >= 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, t.roi_percentage / 3))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profitability Insights */}
      {channels.length > 0 && (
        <div className="bg-gradient-to-r from-[#6C47FF]/10 to-[#00C896]/10 rounded-2xl border border-[#6C47FF]/20 p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#00C896]" /> AI Profitability Insights
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            {channels.filter(c => c.roi_percentage > 100).length > 0 && (
              <p>Top performing channels: {channels.filter(c => c.roi_percentage > 100).map(c => c.channel).join(', ')} — consider increasing budget allocation.</p>
            )}
            {channels.filter(c => c.roi_percentage < 0).length > 0 && (
              <p className="text-red-400">Underperforming channels: {channels.filter(c => c.roi_percentage < 0).map(c => c.channel).join(', ')} — review targeting and creative.</p>
            )}
            {totalRevenue > totalSpend * 2 && <p className="text-green-400">Overall ROI is excellent at {overallRoi.toFixed(0)}%. Your marketing spend is generating strong returns.</p>}
            <p>Average CAC across channels: ${channels.length > 0 ? (channels.reduce((s, c) => s + c.cac, 0) / channels.length).toFixed(2) : '0'}. {channels.some(c => c.cac > 100) ? 'Some channels have high acquisition costs — consider optimizing.' : 'Acquisition costs are well-managed.'}</p>
          </div>
        </div>
      )}

      {/* Add ROI Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Add ROI Data</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm">
                <option value="">Select channel</option>
                <option value="google_ads">Google Ads</option>
                <option value="facebook_ads">Facebook Ads</option>
                <option value="linkedin_ads">LinkedIn Ads</option>
                <option value="email">Email Marketing</option>
                <option value="seo">SEO / Organic</option>
                <option value="social_organic">Social Organic</option>
                <option value="referral">Referral</option>
                <option value="direct">Direct</option>
              </select>
              <input type="number" value={form.spend || ''} onChange={(e) => setForm({ ...form, spend: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Spend ($)" />
              <input type="number" value={form.revenue_attributed || ''} onChange={(e) => setForm({ ...form, revenue_attributed: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Revenue attributed ($) — leave 0 for AI estimate" />
              <input value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Campaign ID (optional)" />
              <button onClick={addCalculation} disabled={!form.channel || !form.spend} className="w-full py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
                Calculate ROI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
