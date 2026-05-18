import { useState, useEffect } from 'react';
import { UserMinus, AlertTriangle, RefreshCw, Mail, Zap } from 'lucide-react';
import { aiChurnPredictorApi } from '../../lib/aiEnhancementsApi';
import type { ChurnPrediction, WinBackCampaign } from '../../types/aiEnhancements';

export default function ChurnPredictorPage() {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [winBack, setWinBack] = useState<WinBackCampaign | null>(null);
  const [selected, setSelected] = useState<ChurnPrediction | null>(null);

  const loadAtRisk = async () => {
    setLoading(true);
    try {
      const res = await aiChurnPredictorApi.atRisk();
      setPredictions(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadAtRisk(); }, []);

  const runPrediction = async () => {
    setRunning(true);
    try {
      await aiChurnPredictorApi.predict();
      loadAtRisk();
    } catch { /* ignore */ }
    setRunning(false);
  };

  const generateWinBack = async (contactId: string) => {
    try {
      const res = await aiChurnPredictorApi.winBack(contactId);
      setWinBack(res);
    } catch { /* ignore */ }
  };

  const riskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-400';
    if (risk >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const riskBg = (risk: number) => {
    if (risk >= 70) return 'bg-red-500/10';
    if (risk >= 40) return 'bg-yellow-500/10';
    return 'bg-green-500/10';
  };

  const impactColor = (impact: string) => {
    if (impact === 'high') return 'text-red-400';
    if (impact === 'medium') return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserMinus size={24} /> Churn Predictor
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI identifies at-risk customers and generates win-back campaigns</p>
        </div>
        <button onClick={runPrediction} disabled={running} className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
          <RefreshCw size={16} className={running ? 'animate-spin' : ''} /> {running ? 'Running...' : 'Run Prediction'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{predictions.filter(p => p.churn_risk >= 70).length}</div>
          <div className="text-xs text-gray-400">High Risk</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{predictions.filter(p => p.churn_risk >= 40 && p.churn_risk < 70).length}</div>
          <div className="text-xs text-gray-400">Medium Risk</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{predictions.filter(p => p.churn_risk < 40).length}</div>
          <div className="text-xs text-gray-400">Low Risk</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-Risk List */}
        <div className="lg:col-span-2 bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4">At-Risk Customers</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <UserMinus size={48} className="mx-auto text-gray-600 mb-4" />
              <p>No predictions yet. Click &quot;Run Prediction&quot; to analyze customer churn risk.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {predictions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setWinBack(null); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors text-left ${
                    selected?.id === p.id ? 'bg-white/10' : 'bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-sm text-white font-medium">
                      {p.contacts ? `${p.contacts.first_name || ''} ${p.contacts.last_name || ''}`.trim() || p.contacts.email : p.contact_id}
                    </div>
                    <div className="text-xs text-gray-400">{p.contacts?.company || ''} • {p.risk_factors.length} risk factors</div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${riskBg(p.churn_risk)} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${riskColor(p.churn_risk)}`}>{p.churn_risk}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-2xl ${riskBg(selected.churn_risk)} flex items-center justify-center mx-auto mb-2`}>
                  <span className={`text-3xl font-bold ${riskColor(selected.churn_risk)}`}>{selected.churn_risk}%</span>
                </div>
                <div className="text-white font-semibold">Churn Risk</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mb-2"><AlertTriangle size={12} /> Risk Factors</div>
                <div className="space-y-1.5">
                  {selected.risk_factors.map((rf, i) => (
                    <div key={i} className="bg-[#12121F] rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">{rf.factor}</span>
                        <span className={`text-xs capitalize ${impactColor(rf.impact)}`}>{rf.impact}</span>
                      </div>
                      <div className="text-xs text-gray-500">{rf.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Zap size={12} /> Win-Back Strategy</div>
                <div className="text-sm text-gray-300">{selected.win_back_strategy}</div>
              </div>
              <button
                onClick={() => generateWinBack(selected.contact_id)}
                className="w-full py-2 bg-[#00C896]/10 text-[#00C896] rounded-xl text-sm font-medium hover:bg-[#00C896]/20 flex items-center justify-center gap-2"
              >
                <Mail size={16} /> Generate Win-Back Campaign
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-2 text-gray-600" />
              <p className="text-sm">Select a customer to view risk details</p>
            </div>
          )}
        </div>
      </div>

      {/* Win-Back Campaign */}
      {winBack && (
        <div className="bg-[#1E1E36] rounded-2xl border border-[#00C896]/20 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Mail size={18} className="text-[#00C896]" /> Win-Back Campaign for {winBack.contact_name}
          </h3>
          <div className="space-y-3">
            {winBack.email_sequence.map((email, i) => (
              <div key={i} className="bg-[#12121F] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#6C47FF]/10 text-[#6C47FF] rounded text-xs font-medium">Day {email.day}</span>
                  <span className="text-sm text-white font-medium">{email.subject}</span>
                </div>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap">{email.body}</pre>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#12121F] rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">SMS Message</div>
                <div className="text-sm text-gray-300">{winBack.sms_message}</div>
              </div>
              <div className="bg-[#12121F] rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">Retargeting Ad</div>
                <div className="text-sm text-white font-medium">{winBack.retargeting_ad.headline}</div>
                <div className="text-xs text-gray-300">{winBack.retargeting_ad.body}</div>
                <div className="text-xs text-[#6C47FF] mt-1">{winBack.retargeting_ad.cta}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
