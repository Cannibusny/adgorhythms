import { useState, useEffect } from 'react';
import { Globe, Monitor, MapPin, FileText } from 'lucide-react';
import { analyticsApi } from '../../lib/emailAnalyticsApi';
import type { TrafficData, TrafficSource } from '../../types/emailAnalytics';

export default function TrafficAnalyticsPage() {
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [sources, setSources] = useState<TrafficSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, s] = await Promise.all([
          analyticsApi.getTraffic(),
          analyticsApi.getSources(),
        ]);
        setTraffic(t);
        setSources(s.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading traffic data...</div>;

  const renderTable = (title: string, icon: React.ReactNode, data: { name: string; count: number }[], total: number) => (
    <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">{icon} {title}</h3>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm">No data yet</p>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 10).map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-300 truncate">{item.name}</div>
                <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-[#6C47FF] rounded-full flex items-center px-2"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  >
                    <span className="text-[10px] font-medium text-white whitespace-nowrap">
                      {item.count}
                    </span>
                  </div>
                </div>
                <div className="w-14 text-right text-xs text-gray-400">{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe size={24} /> Traffic Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">Where your visitors are coming from</p>
      </div>

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4">
        <div className="text-3xl font-bold text-white">{traffic?.total_sessions.toLocaleString() || 0}</div>
        <div className="text-sm text-gray-400">Total Sessions</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTable('By Source', <Globe size={16} className="text-[#1DA1F2]" />, traffic?.by_source || [], traffic?.total_sessions || 0)}
        {renderTable('By Device', <Monitor size={16} className="text-[#10B981]" />, traffic?.by_device || [], traffic?.total_sessions || 0)}
        {renderTable('By Country', <MapPin size={16} className="text-[#F59E0B]" />, traffic?.by_country || [], traffic?.total_sessions || 0)}
        {renderTable('Top Pages', <FileText size={16} className="text-[#8B5CF6]" />, traffic?.top_pages || [], traffic?.total_sessions || 0)}
      </div>

      {/* Traffic Sources Detail */}
      {sources.length > 0 && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4">Traffic Source Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Medium</th>
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium text-right">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-sm text-white">{s.source}</td>
                    <td className="py-3 text-sm text-gray-400">{s.medium}</td>
                    <td className="py-3 text-sm text-gray-400">{s.campaign}</td>
                    <td className="py-3 text-sm text-white text-right">{s.sessions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
