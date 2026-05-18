import { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointerClick, DollarSign, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../../lib/emailAnalyticsApi';
import type { AnalyticsOverview, FunnelStep } from '../../types/emailAnalytics';

export default function AnalyticsOverviewPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, fn] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getFunnel(),
        ]);
        setOverview(ov);
        setFunnel(fn.funnel);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;

  const stats = overview
    ? [
        { label: 'Total Events', value: overview.total_events.toLocaleString(), icon: Eye, color: '#6C47FF' },
        { label: 'Sessions', value: overview.total_sessions.toLocaleString(), icon: TrendingUp, color: '#1DA1F2' },
        { label: 'Conversions', value: overview.conversions.toLocaleString(), icon: MousePointerClick, color: '#10B981' },
        { label: 'Conversion Rate', value: `${overview.conversion_rate}%`, icon: TrendingUp, color: '#F59E0B' },
        { label: 'Total Revenue', value: `$${overview.total_revenue.toLocaleString()}`, icon: DollarSign, color: '#00C896' },
      ]
    : [];

  const funnelColors = ['#6C47FF', '#1DA1F2', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={24} /> Analytics Overview
        </h1>
        <p className="text-gray-400 text-sm mt-1">Your marketing performance at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h3 className="text-white font-semibold mb-4">Conversion Funnel</h3>
        {funnel.length === 0 ? (
          <p className="text-gray-400 text-sm">No funnel data available yet. Track events to see your conversion funnel.</p>
        ) : (
          <div className="space-y-3">
            {funnel.map((step, i) => {
              const maxCount = funnel[0]?.count || 1;
              const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
              return (
                <div key={step.step} className="flex items-center gap-4">
                  <div className="w-24 text-right text-sm text-gray-400 capitalize">
                    {step.step.replace('_', ' ')}
                  </div>
                  <div className="flex-1 bg-white/5 rounded-full h-10 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center px-3"
                      style={{
                        width: `${Math.max(pct, 3)}%`,
                        backgroundColor: funnelColors[i % funnelColors.length],
                      }}
                    >
                      <span className="text-xs font-medium text-white whitespace-nowrap">
                        {step.count.toLocaleString()} ({step.conversion_rate}%)
                      </span>
                    </div>
                  </div>
                  {step.drop_off > 0 && (
                    <div className="w-20 text-xs text-red-400">
                      -{step.drop_off.toLocaleString()} drop
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Traffic Analytics', href: '/analytics/traffic', color: '#1DA1F2' },
          { label: 'Conversions', href: '/analytics/conversions', color: '#10B981' },
          { label: 'Attribution', href: '/analytics/attribution', color: '#8B5CF6' },
          { label: 'Revenue', href: '/analytics/revenue', color: '#F59E0B' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 hover:border-white/20 transition-colors"
          >
            <div className="text-sm font-medium text-white">{link.label}</div>
            <div className="text-xs mt-1" style={{ color: link.color }}>View details →</div>
          </a>
        ))}
      </div>
    </div>
  );
}
