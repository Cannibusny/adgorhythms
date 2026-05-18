import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { reviewMonitorApi } from '../../lib/reviewsApi';
import type { ReviewMonitor } from '../../types/reviews';

const PLATFORMS = [
  { value: 'google', label: 'Google', color: 'bg-blue-500' },
  { value: 'yelp', label: 'Yelp', color: 'bg-red-500' },
  { value: 'facebook', label: 'Facebook', color: 'bg-indigo-500' },
  { value: 'trustpilot', label: 'Trustpilot', color: 'bg-green-500' },
  { value: 'bbb', label: 'BBB', color: 'bg-yellow-500' },
  { value: 'g2', label: 'G2', color: 'bg-orange-500' },
  { value: 'capterra', label: 'Capterra', color: 'bg-teal-500' },
  { value: 'tripadvisor', label: 'TripAdvisor', color: 'bg-lime-500' },
  { value: 'weedmaps', label: 'Weedmaps', color: 'bg-emerald-500' },
];

export default function ReviewSetupPage() {
  const [monitors, setMonitors] = useState<ReviewMonitor[]>([]);
  const [platform, setPlatform] = useState('google');
  const [url, setUrl] = useState('');
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try { const res = await reviewMonitorApi.list(); setMonitors(res.data || []); } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!url) return;
    await reviewMonitorApi.add(platform, url);
    setUrl('');
    load();
  };

  const remove = async (id: string) => {
    await reviewMonitorApi.remove(id);
    load();
  };

  const sync = async () => {
    setSyncing(true);
    try { await reviewMonitorApi.sync(); } catch { /* ignore */ }
    setSyncing(false);
    load();
  };

  const getPlatformInfo = (val: string) => PLATFORMS.find((p) => p.value === val) || { label: val, color: 'bg-gray-500' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Monitoring Setup</h1>
          <p className="text-gray-400 text-sm mt-1">Add your business URLs to monitor reviews across platforms</p>
        </div>
        <button onClick={sync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Reviews'}
        </button>
      </div>

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold mb-4">Add Platform to Monitor</h2>
        <div className="flex gap-3">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm">
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Business URL (e.g. https://g.page/yourbusiness)" className="flex-1 px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" />
          <button onClick={add} className="flex items-center gap-2 px-4 py-2 bg-[#00C896] text-white rounded-xl text-sm font-medium hover:bg-[#00b085]">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold mb-4">Monitored Platforms ({monitors.length})</h2>
        {monitors.length === 0 ? (
          <p className="text-gray-400 text-sm">No platforms being monitored yet. Add one above to get started.</p>
        ) : (
          <div className="space-y-3">
            {monitors.map((m) => {
              const info = getPlatformInfo(m.platform);
              return (
                <div key={m.id} className="flex items-center gap-4 p-4 bg-[#12121F] rounded-xl">
                  <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {info.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{info.label}</div>
                    <div className="text-gray-400 text-xs truncate">{m.business_url}</div>
                  </div>
                  <div className="text-gray-500 text-xs">Last checked: {new Date(m.last_checked).toLocaleDateString()}</div>
                  <div className={`px-2 py-1 rounded-full text-xs ${m.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {m.active ? 'Active' : 'Inactive'}
                  </div>
                  <button onClick={() => remove(m.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
