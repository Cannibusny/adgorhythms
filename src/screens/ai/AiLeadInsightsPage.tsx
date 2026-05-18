import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Calendar, Zap } from 'lucide-react';
import { aiLeadScorerApi } from '../../lib/aiEnhancementsApi';
import type { AiLeadInsight } from '../../types/aiEnhancements';

export default function AiLeadInsightsPage() {
  const [leads, setLeads] = useState<AiLeadInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AiLeadInsight | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await aiLeadScorerApi.highValueLeads();
      setLeads(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain size={24} /> AI Lead Insights
        </h1>
        <p className="text-gray-400 text-sm mt-1">AI-scored leads with conversion predictions and suggested actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">{leads.length}</div>
          <div className="text-xs text-gray-400">Scored Leads</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{leads.filter(l => l.score >= 80).length}</div>
          <div className="text-xs text-gray-400">Hot Leads</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{leads.filter(l => l.score >= 60 && l.score < 80).length}</div>
          <div className="text-xs text-gray-400">Warm Leads</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {leads.length > 0 ? `${Math.round(leads.reduce((s, l) => s + l.predicted_conversion_probability, 0) / leads.length)}%` : '0%'}
          </div>
          <div className="text-xs text-gray-400">Avg Conversion Prob</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="lg:col-span-2 bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4">Top Leads by AI Score</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading AI insights...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Brain size={48} className="mx-auto text-gray-600 mb-4" />
              <p>No scored leads yet. Score contacts to see AI insights here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelected(lead)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors text-left ${
                    selected?.id === lead.id ? 'bg-white/10' : 'bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-sm text-white font-medium">
                      {lead.contacts ? `${lead.contacts.first_name || ''} ${lead.contacts.last_name || ''}`.trim() || lead.contacts.email : lead.contact_id}
                    </div>
                    <div className="text-xs text-gray-400">{lead.contacts?.company || 'No company'} • {lead.contacts?.lifecycle_stage || 'unknown'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{lead.predicted_conversion_probability}% conv.</div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${scoreBg(lead.score)} flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${scoreColor(lead.score)}`}>{lead.score}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-2xl ${scoreBg(selected.score)} flex items-center justify-center mx-auto mb-2`}>
                  <span className={`text-3xl font-bold ${scoreColor(selected.score)}`}>{selected.score}</span>
                </div>
                <div className="text-white font-semibold">AI Lead Score</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mb-1"><TrendingUp size={12} /> Conversion Probability</div>
                <div className="text-white font-medium">{selected.predicted_conversion_probability}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12} /> Predicted Close Date</div>
                <div className="text-white font-medium">{new Date(selected.predicted_close_date).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Target size={12} /> Explanation</div>
                <div className="text-sm text-gray-300">{selected.score_explanation}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mb-2"><Zap size={12} /> Suggested Actions</div>
                <div className="space-y-1.5">
                  {(selected.suggested_actions || []).map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6C47FF] mt-1.5 flex-shrink-0" />
                      <span className="text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Target size={32} className="mx-auto mb-2 text-gray-600" />
              <p className="text-sm">Select a lead to view AI insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
