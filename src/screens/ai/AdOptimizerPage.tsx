import { useState, useEffect } from 'react';
import { Zap, Plus, X, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { aiAdOptimizerApi } from '../../lib/aiEnhancementsApi';
import type { AdExperiment, AdRecommendation } from '../../types/aiEnhancements';

export default function AdOptimizerPage() {
  const [experiments, setExperiments] = useState<AdExperiment[]>([]);
  const [recommendations, setRecommendations] = useState<AdRecommendation[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ platform: 'facebook', campaign_name: '', budget_allocated: 1000, variations: [{ headline: '', body: '' }, { headline: '', body: '' }] });

  const loadData = async () => {
    try {
      const [exp, rec] = await Promise.all([aiAdOptimizerApi.listExperiments(), aiAdOptimizerApi.getRecommendations()]);
      setExperiments(exp.data || []);
      setRecommendations(rec.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadData(); }, []);

  const createExperiment = async () => {
    if (!form.campaign_name) return;
    await aiAdOptimizerApi.createExperiment(form);
    setShowCreate(false);
    setForm({ platform: 'facebook', campaign_name: '', budget_allocated: 1000, variations: [{ headline: '', body: '' }, { headline: '', body: '' }] });
    loadData();
  };

  const reallocate = async (id: string) => {
    await aiAdOptimizerApi.reallocateBudget(id);
    loadData();
  };

  const statusColor = (s: string) => {
    if (s === 'running') return 'bg-green-500/10 text-green-400';
    if (s === 'paused') return 'bg-yellow-500/10 text-yellow-400';
    return 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap size={24} /> AI Ad Optimizer
          </h1>
          <p className="text-gray-400 text-sm mt-1">A/B test ads and let AI optimize budget allocation</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]">
          <Plus size={16} /> New Experiment
        </button>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-[#6C47FF]/10 to-[#00C896]/10 rounded-2xl border border-[#6C47FF]/20 p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-[#00C896]" /> AI Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((r) => (
              <div key={r.experiment_id} className="bg-[#12121F]/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{r.campaign_name}</span>
                  <span className="text-xs text-gray-500">{r.platform}</span>
                </div>
                <div className="text-xs text-gray-300">{r.recommendation}</div>
                {r.projected_savings > 0 && (
                  <div className="text-xs text-[#00C896] mt-1">Projected savings: ${r.projected_savings}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experiments */}
      {experiments.length === 0 ? (
        <div className="text-center py-12 bg-[#1E1E36] rounded-2xl border border-white/5">
          <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Experiments Yet</h3>
          <p className="text-gray-400 text-sm">Create an A/B test to start optimizing your ad performance.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => (
            <div key={exp.id} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white font-semibold">{exp.campaign_name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="capitalize">{exp.platform}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><DollarSign size={10} />${exp.budget_allocated}</span>
                    <span>•</span>
                    <span>CPA: ${exp.cpa}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(exp.status)}`}>{exp.status}</span>
                  {exp.status === 'running' && (
                    <button onClick={() => reallocate(exp.id)} className="px-3 py-1.5 text-xs font-medium bg-[#00C896]/10 text-[#00C896] rounded-lg hover:bg-[#00C896]/20">
                      AI Reallocate
                    </button>
                  )}
                </div>
              </div>

              {/* Variations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(exp.variations || []).map((v, i) => {
                  const isWinner = exp.current_winner && v.id === exp.current_winner.id;
                  return (
                    <div key={i} className={`bg-[#12121F] rounded-xl p-3 border ${isWinner ? 'border-[#00C896]/30' : 'border-transparent'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white">{v.headline || v.id}</span>
                        {isWinner && <span className="text-xs text-[#00C896]">Winner</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><div className="text-xs text-gray-500">Impressions</div><div className="text-sm text-white font-medium">{v.impressions?.toLocaleString()}</div></div>
                        <div><div className="text-xs text-gray-500">Clicks</div><div className="text-sm text-white font-medium">{v.clicks}</div></div>
                        <div><div className="text-xs text-gray-500">Conv.</div><div className="text-sm text-white font-medium">{v.conversions}</div></div>
                      </div>
                      {v.budget_percentage !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>Budget: {v.budget_percentage}%</span>
                            <span>${v.new_budget}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full">
                            <div className="h-full bg-[#6C47FF] rounded-full" style={{ width: `${v.budget_percentage}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Create A/B Experiment</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.campaign_name} onChange={(e) => setForm({ ...form, campaign_name: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Campaign name" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm">
                  <option value="facebook">Facebook</option>
                  <option value="google">Google</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                </select>
                <input type="number" value={form.budget_allocated} onChange={(e) => setForm({ ...form, budget_allocated: Number(e.target.value) })} className="px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Budget ($)" />
              </div>
              <div className="text-xs text-gray-400 mt-2">Variations</div>
              {form.variations.map((v, i) => (
                <div key={i} className="bg-[#12121F] rounded-xl p-3 space-y-2">
                  <div className="text-xs text-gray-500">Variation {i + 1}</div>
                  <input value={v.headline} onChange={(e) => { const nv = [...form.variations]; nv[i] = { ...nv[i], headline: e.target.value }; setForm({ ...form, variations: nv }); }} className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Headline" />
                  <input value={v.body} onChange={(e) => { const nv = [...form.variations]; nv[i] = { ...nv[i], body: e.target.value }; setForm({ ...form, variations: nv }); }} className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Body text" />
                </div>
              ))}
              <button onClick={() => setForm({ ...form, variations: [...form.variations, { headline: '', body: '' }] })} className="text-xs text-[#6C47FF]">+ Add Variation</button>
              <button onClick={createExperiment} className="w-full py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]">Create Experiment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
