import { useState, useEffect } from 'react';
import { Shield, Plus, AlertCircle, Zap } from 'lucide-react';
import { aiCompetitorIntelApi } from '../../lib/aiEnhancementsApi';
import type { CompetitorIntelUpdate, CompetitorAnalysis } from '../../types/aiEnhancements';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  pricing_change: { label: 'Pricing Change', color: 'bg-red-500/10 text-red-400' },
  new_feature: { label: 'New Feature', color: 'bg-blue-500/10 text-blue-400' },
  ad_campaign: { label: 'Ad Campaign', color: 'bg-purple-500/10 text-purple-400' },
  content_published: { label: 'Content', color: 'bg-green-500/10 text-green-400' },
  social_activity: { label: 'Social', color: 'bg-yellow-500/10 text-yellow-400' },
};

export default function CompetitorIntelPage() {
  const [updates, setUpdates] = useState<CompetitorIntelUpdate[]>([]);
  const [competitor, setCompetitor] = useState('');
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUpdates = async () => {
    try {
      const res = await aiCompetitorIntelApi.getUpdates();
      setUpdates(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadUpdates(); }, []);

  const addCompetitor = async () => {
    if (!competitor.trim()) return;
    setLoading(true);
    try {
      await aiCompetitorIntelApi.monitor(competitor);
      const res = await aiCompetitorIntelApi.analyze(competitor);
      setAnalysis(res);
      loadUpdates();
      setCompetitor('');
    } catch { /* ignore */ }
    setLoading(false);
  };

  const threatColor = (level: string) => {
    if (level === 'high') return 'text-red-400 bg-red-500/10';
    if (level === 'medium') return 'text-yellow-400 bg-yellow-500/10';
    return 'text-green-400 bg-green-500/10';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={24} /> Competitor Intelligence
        </h1>
        <p className="text-gray-400 text-sm mt-1">AI-powered competitor monitoring and strategic recommendations</p>
      </div>

      {/* Add Competitor */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex gap-3">
          <input
            value={competitor}
            onChange={(e) => setCompetitor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            className="flex-1 px-4 py-2.5 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter competitor name to monitor..."
          />
          <button onClick={addCompetitor} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Plus size={16} /> {loading ? 'Analyzing...' : 'Monitor Competitor'}
          </button>
        </div>
      </div>

      {/* Analysis */}
      {analysis && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg">{analysis.competitor_name} — AI Analysis</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${threatColor(analysis.overall_threat_level)}`}>
              {analysis.overall_threat_level} threat
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-4">{analysis.market_position}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500/5 rounded-xl p-3">
              <div className="text-xs text-green-400 font-medium mb-2">Their Strengths</div>
              {analysis.strengths.map((s, i) => <div key={i} className="text-xs text-gray-300 mb-1">• {s}</div>)}
            </div>
            <div className="bg-red-500/5 rounded-xl p-3">
              <div className="text-xs text-red-400 font-medium mb-2">Their Weaknesses</div>
              {analysis.weaknesses.map((w, i) => <div key={i} className="text-xs text-gray-300 mb-1">• {w}</div>)}
            </div>
            <div className="bg-blue-500/5 rounded-xl p-3">
              <div className="text-xs text-blue-400 font-medium mb-2">Your Opportunities</div>
              {analysis.opportunities.map((o, i) => <div key={i} className="text-xs text-gray-300 mb-1">• {o}</div>)}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-[#00C896] font-medium mb-2 flex items-center gap-1"><Zap size={12} /> Recommended Actions</div>
            {analysis.recommended_actions.map((a, i) => (
              <div key={i} className="text-sm text-gray-300 mb-1 flex items-start gap-2">
                <span className="text-[#6C47FF] font-bold">{i + 1}.</span> {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intel Feed */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <h3 className="text-white font-semibold mb-4">Intelligence Feed ({updates.length})</h3>
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Shield size={48} className="mx-auto text-gray-600 mb-4" />
            <p>No intel updates yet. Add a competitor above to start monitoring.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => {
              const typeInfo = TYPE_LABELS[u.update_type] || { label: u.update_type, color: 'bg-white/5 text-gray-400' };
              return (
                <div key={u.id} className="bg-[#12121F] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white">{u.competitor_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${typeInfo.color}`}>{typeInfo.label}</span>
                    <span className="text-xs text-gray-500 ml-auto">{new Date(u.detected_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-gray-300 mb-2">{u.details}</div>
                  <div className="flex items-start gap-1 text-xs text-[#00C896] bg-[#00C896]/5 rounded-lg p-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span><strong>AI Recommendation:</strong> {u.ai_recommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
