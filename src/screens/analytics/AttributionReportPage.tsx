import { useState } from 'react';
import { GitBranch, Search, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../../lib/emailAnalyticsApi';
import type { AttributionTouchpoint, ROIChannel } from '../../types/emailAnalytics';

export default function AttributionReportPage() {
  const [dealId, setDealId] = useState('');
  const [touchpoints, setTouchpoints] = useState<AttributionTouchpoint[]>([]);
  const [roi, setROI] = useState<ROIChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [roiLoading, setRoiLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const loadAttribution = async () => {
    if (!dealId.trim()) return;
    setLoading(true);
    try {
      const res = await analyticsApi.getAttribution(dealId);
      setTouchpoints(res.data);
    } catch {
      setTouchpoints([]);
    } finally {
      setLoading(false);
    }
  };

  const loadROI = async () => {
    setRoiLoading(true);
    try {
      const res = await analyticsApi.getROI();
      setROI(res.data);
    } catch {
      // ignore
    } finally {
      setRoiLoading(false);
    }
  };

  const calculateAttribution = async () => {
    setCalculating(true);
    try {
      const res = await analyticsApi.calculateAttribution();
      alert(`Calculated attribution for ${res.deals} deals (${res.calculated} touchpoints)`);
    } catch {
      // ignore
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitBranch size={24} /> Attribution Report
          </h1>
          <p className="text-gray-400 text-sm mt-1">Understand which channels drive revenue</p>
        </div>
        <button
          onClick={calculateAttribution}
          disabled={calculating}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50"
        >
          <RefreshCw size={16} className={calculating ? 'animate-spin' : ''} />
          {calculating ? 'Calculating...' : 'Recalculate Attribution'}
        </button>
      </div>

      {/* Deal Attribution Lookup */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <h3 className="text-white font-semibold mb-3">Deal Attribution</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter deal ID to view attribution touchpoints"
          />
          <button
            onClick={loadAttribution}
            className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
          >
            <Search size={16} /> Lookup
          </button>
        </div>

        {loading && <div className="text-center py-6 text-gray-400">Loading...</div>}

        {touchpoints.length > 0 && !loading && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                    <th className="pb-3 font-medium">Touchpoint</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Medium</th>
                    <th className="pb-3 font-medium">Campaign</th>
                    <th className="pb-3 font-medium text-right">Weight</th>
                    <th className="pb-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {touchpoints.map((tp) => (
                    <tr key={tp.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-sm text-white">{tp.touchpoint_type || 'Unknown'}</td>
                      <td className="py-3 text-sm text-gray-400">{tp.source || '-'}</td>
                      <td className="py-3 text-sm text-gray-400">{tp.medium || '-'}</td>
                      <td className="py-3 text-sm text-gray-400">{tp.campaign || '-'}</td>
                      <td className="py-3 text-sm text-white text-right">
                        {tp.attribution_weight ? `${(Number(tp.attribution_weight) * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-400 text-right">
                        {new Date(tp.occurred_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visual timeline */}
            <div className="mt-6">
              <h4 className="text-sm text-gray-400 mb-3">Attribution Timeline</h4>
              <div className="flex items-center gap-1">
                {touchpoints.map((tp, i) => {
                  const weight = Number(tp.attribution_weight) || 0;
                  const colors = ['#6C47FF', '#1DA1F2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                  return (
                    <div
                      key={tp.id}
                      className="h-10 rounded-lg flex items-center justify-center text-[10px] font-medium text-white"
                      style={{
                        flex: Math.max(weight, 0.05),
                        backgroundColor: colors[i % colors.length],
                        minWidth: '40px',
                      }}
                    >
                      {tp.source || '?'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {dealId && touchpoints.length === 0 && !loading && (
          <p className="text-gray-400 text-sm mt-4">No touchpoints found for this deal.</p>
        )}
      </div>

      {/* ROI by Channel */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">ROI by Channel</h3>
          <button
            onClick={loadROI}
            disabled={roiLoading}
            className="px-3 py-1.5 text-xs font-medium text-[#6C47FF] bg-[#6C47FF]/10 hover:bg-[#6C47FF]/20 rounded-lg"
          >
            {roiLoading ? 'Loading...' : 'Load ROI Data'}
          </button>
        </div>

        {roi.length > 0 ? (
          <div className="space-y-3">
            {roi.map((ch, i) => {
              const maxRev = roi[0]?.attributed_revenue || 1;
              const pct = maxRev > 0 ? (ch.attributed_revenue / maxRev) * 100 : 0;
              const colors = ['#10B981', '#1DA1F2', '#F59E0B', '#6C47FF', '#EF4444'];
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-300 truncate">{ch.source}/{ch.medium}</div>
                  <div className="flex-1 bg-white/5 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center px-3"
                      style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: colors[i % colors.length] }}
                    >
                      <span className="text-xs font-medium text-white whitespace-nowrap">
                        ${ch.attributed_revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Click &quot;Load ROI Data&quot; to see revenue attribution by channel.</p>
        )}
      </div>
    </div>
  );
}
