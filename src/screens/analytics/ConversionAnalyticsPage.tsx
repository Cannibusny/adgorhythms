import { useState, useEffect } from 'react';
import { Target, TrendingUp, FileText, UserPlus, ShoppingCart } from 'lucide-react';
import { analyticsApi } from '../../lib/emailAnalyticsApi';
import type { ConversionData, FunnelStep } from '../../types/emailAnalytics';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  form_submit: { label: 'Form Submissions', color: '#1DA1F2', icon: FileText },
  signup: { label: 'Sign Ups', color: '#10B981', icon: UserPlus },
  purchase: { label: 'Purchases', color: '#F59E0B', icon: ShoppingCart },
};

export default function ConversionAnalyticsPage() {
  const [conversions, setConversions] = useState<ConversionData | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, f] = await Promise.all([
          analyticsApi.getConversions(),
          analyticsApi.getFunnel(),
        ]);
        setConversions(c);
        setFunnel(f.funnel);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading conversion data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target size={24} /> Conversion Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">Track form submissions, sign ups, and purchases</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#10B981]/20">
              <Target size={16} className="text-[#10B981]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{conversions?.total_conversions.toLocaleString() || 0}</div>
          <div className="text-xs text-gray-400 mt-1">Total Conversions</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F59E0B]/20">
              <TrendingUp size={16} className="text-[#F59E0B]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{conversions?.conversion_rate || 0}%</div>
          <div className="text-xs text-gray-400 mt-1">Conversion Rate</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-400">Breakdown</div>
            <div className="flex gap-4 mt-2">
              {Object.entries(conversions?.by_type || {}).map(([type, count]) => {
                const config = TYPE_CONFIG[type];
                if (!config) return null;
                return (
                  <div key={type} className="text-center">
                    <div className="text-lg font-bold text-white">{count}</div>
                    <div className="text-[10px] text-gray-400">{config.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* By Type */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h3 className="text-white font-semibold mb-4">Conversions by Type</h3>
        <div className="space-y-4">
          {Object.entries(conversions?.by_type || {}).map(([type, count]) => {
            const config = TYPE_CONFIG[type];
            if (!config) return null;
            const total = conversions?.total_conversions || 1;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                  <Icon size={16} className={`text-[${config.color}]`} />
                </div>
                <div className="w-32 text-sm text-gray-300">{config.label}</div>
                <div className="flex-1 bg-white/5 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-3"
                    style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: config.color }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h3 className="text-white font-semibold mb-4">Conversion Funnel</h3>
        {funnel.length === 0 ? (
          <p className="text-gray-400 text-sm">No funnel data yet. Start tracking events to see your funnel.</p>
        ) : (
          <div className="flex items-end justify-center gap-6 h-48">
            {funnel.map((step, i) => {
              const maxCount = funnel[0]?.count || 1;
              const height = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
              const colors = ['#6C47FF', '#1DA1F2', '#F59E0B', '#10B981'];
              return (
                <div key={step.step} className="flex flex-col items-center gap-2">
                  <div className="text-xs font-medium text-white">{step.count}</div>
                  <div
                    className="w-16 rounded-t-lg"
                    style={{
                      height: `${Math.max(height, 5)}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                  />
                  <div className="text-[10px] text-gray-400 capitalize text-center">
                    {step.step.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] text-gray-500">{step.conversion_rate}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
