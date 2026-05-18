import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Target, Briefcase } from 'lucide-react';
import { analyticsApi } from '../../lib/emailAnalyticsApi';
import type { RevenueData } from '../../types/emailAnalytics';

export default function RevenueAnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analyticsApi.getRevenue();
        setRevenue(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading revenue data...</div>;

  const stats = revenue
    ? [
        {
          label: 'Total Revenue',
          value: `$${revenue.total_revenue.toLocaleString()}`,
          icon: DollarSign,
          color: '#10B981',
          description: 'From closed-won deals',
        },
        {
          label: 'Deals Closed',
          value: revenue.deals_closed.toString(),
          icon: Target,
          color: '#6C47FF',
          description: 'Won deals',
        },
        {
          label: 'Avg Deal Size',
          value: `$${revenue.avg_deal_size.toLocaleString()}`,
          icon: TrendingUp,
          color: '#1DA1F2',
          description: 'Average closed deal value',
        },
        {
          label: 'Pipeline Value',
          value: `$${revenue.pipeline_value.toLocaleString()}`,
          icon: Briefcase,
          color: '#F59E0B',
          description: 'Active deals in pipeline',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign size={24} /> Revenue Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">Track your revenue performance and pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
          </div>
        ))}
      </div>

      {/* Revenue vs Pipeline */}
      {revenue && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">Revenue vs Pipeline</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Closed Revenue</span>
                <span className="text-sm font-medium text-white">${revenue.total_revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full"
                  style={{
                    width: `${Math.min(
                      revenue.total_revenue > 0 || revenue.pipeline_value > 0
                        ? (revenue.total_revenue / (revenue.total_revenue + revenue.pipeline_value)) * 100
                        : 0,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Active Pipeline</span>
                <span className="text-sm font-medium text-white">${revenue.pipeline_value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] rounded-full"
                  style={{
                    width: `${Math.min(
                      revenue.total_revenue > 0 || revenue.pipeline_value > 0
                        ? (revenue.pipeline_value / (revenue.total_revenue + revenue.pipeline_value)) * 100
                        : 0,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {revenue && revenue.deals_closed > 0 && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                ${revenue.avg_deal_size.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Avg Deal Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {revenue.deals_closed}
              </div>
              <div className="text-xs text-gray-400 mt-1">Deals Won</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                ${Math.round(revenue.total_revenue / 12).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Monthly Avg (est)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                ${(revenue.total_revenue + revenue.pipeline_value).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Potential</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {revenue && revenue.deals_closed === 0 && (
        <div className="text-center py-12 bg-[#1E1E36] rounded-2xl border border-white/5">
          <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Closed Deals Yet</h3>
          <p className="text-gray-400 text-sm">
            Close deals in your pipeline to see revenue analytics here.
          </p>
        </div>
      )}
    </div>
  );
}
