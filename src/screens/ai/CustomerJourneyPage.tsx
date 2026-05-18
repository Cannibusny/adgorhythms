import { useState, useEffect } from 'react';
import { Map, ArrowRight, AlertTriangle, Lightbulb } from 'lucide-react';
import { aiJourneyApi } from '../../lib/aiEnhancementsApi';
import type { DropOffPoint } from '../../types/aiEnhancements';

export default function CustomerJourneyPage() {
  const [contactId, setContactId] = useState('');
  const [journey, setJourney] = useState<{ journey_map: { stage: string; channel: string; action: string; date: string; engagement: string }[]; drop_off_points: DropOffPoint[]; suggested_improvements: string[] } | null>(null);
  const [dropOffs, setDropOffs] = useState<DropOffPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDropOffs = async () => {
    try {
      const res = await aiJourneyApi.dropOffAnalysis();
      setDropOffs(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadDropOffs(); }, []);

  const mapJourney = async () => {
    if (!contactId.trim()) return;
    setLoading(true);
    try {
      const res = await aiJourneyApi.mapJourney(contactId);
      setJourney(res);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const engagementColor = (e: string) => {
    if (e === 'high') return 'bg-green-500/20 text-green-400';
    if (e === 'medium') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const stageColors: Record<string, string> = {
    Awareness: 'border-blue-500 bg-blue-500/10',
    Interest: 'border-purple-500 bg-purple-500/10',
    Consideration: 'border-yellow-500 bg-yellow-500/10',
    Decision: 'border-green-500 bg-green-500/10',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Map size={24} /> Customer Journey Mapper
        </h1>
        <p className="text-gray-400 text-sm mt-1">AI-powered journey mapping with drop-off analysis</p>
      </div>

      {/* Map Journey */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex gap-3">
          <input
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter Contact ID to map their journey..."
          />
          <button onClick={mapJourney} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Map size={16} /> {loading ? 'Mapping...' : 'Map Journey'}
          </button>
        </div>
      </div>

      {/* Journey Flowchart */}
      {journey && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-6">Journey Timeline</h3>
          <div className="relative">
            {journey.journey_map.map((step, i) => (
              <div key={i} className="flex items-start gap-4 mb-6 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-bold ${stageColors[step.stage] || 'border-gray-500 bg-gray-500/10'}`}>
                    {i + 1}
                  </div>
                  {i < journey.journey_map.length - 1 && (
                    <div className="w-0.5 h-8 bg-white/10 mt-1" />
                  )}
                </div>
                <div className="flex-1 bg-[#12121F] rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#6C47FF]">{step.stage}</span>
                      <ArrowRight size={12} className="text-gray-600" />
                      <span className="text-sm text-white">{step.action}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${engagementColor(step.engagement)}`}>
                      {step.engagement}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.channel} • {new Date(step.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop-off Points */}
      {journey && journey.drop_off_points.length > 0 && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-400" /> Drop-off Points
          </h3>
          <div className="space-y-3">
            {journey.drop_off_points.map((dp, i) => (
              <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{dp.stage}</span>
                  <span className="text-red-400 font-bold">{dp.percentage}% drop-off</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">{dp.reason}</div>
                <div className="flex items-start gap-1 text-xs text-green-400">
                  <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{dp.suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {journey && journey.suggested_improvements.length > 0 && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-[#00C896]" /> Suggested Improvements
          </h3>
          <div className="space-y-2">
            {journey.suggested_improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className="w-6 h-6 rounded-lg bg-[#00C896]/10 flex items-center justify-center flex-shrink-0 text-xs text-[#00C896] font-bold">{i + 1}</div>
                <span className="text-gray-300">{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Drop-off Analysis */}
      {dropOffs.length > 0 && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4">Global Drop-off Analysis</h3>
          <div className="space-y-3">
            {dropOffs.map((dp, i) => (
              <div key={i} className="bg-[#12121F] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{dp.stage}</span>
                  <span className="text-yellow-400 font-medium">{dp.avgPercentage || dp.percentage}% avg drop-off</span>
                </div>
                {dp.reasons && dp.reasons.map((r, j) => (
                  <div key={j} className="text-xs text-gray-400 mt-1">• {r}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
