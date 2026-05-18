import { useState, useEffect } from 'react';
import { Phone, Upload, Star, AlertTriangle, TrendingUp } from 'lucide-react';
import { aiCallAnalyzerApi } from '../../lib/aiEnhancementsApi';
import type { SalesCallAnalysis } from '../../types/aiEnhancements';

export default function SalesCallAnalyzerPage() {
  const [analyses, setAnalyses] = useState<SalesCallAnalysis[]>([]);
  const [transcript, setTranscript] = useState('');
  const [dealId, setDealId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SalesCallAnalysis | null>(null);

  const loadAnalyses = async () => {
    try {
      const res = await aiCallAnalyzerApi.topPerformers();
      setAnalyses(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadAnalyses(); }, []);

  const analyzeCall = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const res = await aiCallAnalyzerApi.analyze(transcript, dealId || undefined);
      setSelected(res);
      loadAnalyses();
      setTranscript('');
    } catch { /* ignore */ }
    setLoading(false);
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const qualityColor = (q: string) => {
    if (q === 'excellent') return 'text-green-400 bg-green-500/10';
    if (q === 'good') return 'text-blue-400 bg-blue-500/10';
    return 'text-yellow-400 bg-yellow-500/10';
  };

  const strengthColor = (s: string) => {
    if (s === 'strong') return 'text-green-400';
    if (s === 'medium') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Phone size={24} /> Sales Call Analyzer
        </h1>
        <p className="text-gray-400 text-sm mt-1">AI analyzes call transcripts for objections, buying signals, and coaching</p>
      </div>

      {/* Upload */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <h3 className="text-white font-semibold mb-3">Analyze a Call</h3>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mb-3"
          placeholder="Paste call transcript here..."
        />
        <div className="flex gap-3">
          <input value={dealId} onChange={(e) => setDealId(e.target.value)} className="flex-1 px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Deal ID (optional)" />
          <button onClick={analyzeCall} disabled={loading || !transcript.trim()} className="flex items-center gap-2 px-5 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Upload size={16} /> {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Analysis Result */}
      {selected && (
        <div className="space-y-4">
          {/* Score Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5 text-center">
              <div className={`text-4xl font-bold ${scoreColor(selected.call_score)}`}>{selected.call_score}</div>
              <div className="text-xs text-gray-400 mt-1">Call Score</div>
            </div>
            <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5 text-center">
              <div className="text-4xl font-bold text-white">{selected.talk_ratio}%</div>
              <div className="text-xs text-gray-400 mt-1">Your Talk Ratio</div>
            </div>
            <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5 text-center">
              <div className="text-4xl font-bold text-[#6C47FF]">{selected.buying_signals.length}</div>
              <div className="text-xs text-gray-400 mt-1">Buying Signals</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Objections */}
            <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-400" /> Objections ({selected.objections_identified.length})
              </h3>
              <div className="space-y-3">
                {selected.objections_identified.map((obj, i) => (
                  <div key={i} className="bg-[#12121F] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium">&quot;{obj.objection}&quot;</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${qualityColor(obj.response_quality)}`}>{obj.response_quality}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">at {obj.timestamp}</div>
                    <div className="text-xs text-gray-300">{obj.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buying Signals */}
            <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" /> Buying Signals ({selected.buying_signals.length})
              </h3>
              <div className="space-y-2">
                {selected.buying_signals.map((sig, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#12121F] rounded-xl p-3">
                    <div>
                      <div className="text-sm text-white">{sig.signal}</div>
                      <div className="text-xs text-gray-500">at {sig.timestamp}</div>
                    </div>
                    <span className={`text-xs font-medium capitalize ${strengthColor(sig.strength)}`}>{sig.strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coaching */}
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Star size={16} className="text-[#00C896]" /> Coaching Suggestions
            </h3>
            <div className="space-y-2">
              {selected.coaching_suggestions.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-6 h-6 rounded-lg bg-[#6C47FF]/10 flex items-center justify-center flex-shrink-0 text-xs text-[#6C47FF] font-bold">{i + 1}</div>
                  <span className="text-gray-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Past Analyses */}
      {analyses.length > 0 && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4">Top Call Analyses</h3>
          <div className="space-y-2">
            {analyses.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors ${selected?.id === a.id ? 'bg-white/10' : 'bg-white/5'}`}
              >
                <div className="text-left">
                  <div className="text-sm text-white">Call on {new Date(a.analyzed_at).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400">Talk ratio: {a.talk_ratio}% • {a.objections_identified.length} objections • {a.buying_signals.length} signals</div>
                </div>
                <div className={`text-lg font-bold ${scoreColor(a.call_score)}`}>{a.call_score}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
