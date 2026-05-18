import { useState, useEffect } from 'react';
import { Link2, Search, ExternalLink } from 'lucide-react';
import { seoBacklinksApi } from '../../lib/seoCalendarApi';
import type { SeoBacklink } from '../../types/seoCalendar';

type Tab = 'all' | 'new' | 'lost';

export default function BacklinkAnalysisPage() {
  const [backlinks, setBacklinks] = useState<SeoBacklink[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const loadBacklinks = async (t: Tab) => {
    setLoading(true);
    try {
      let res;
      if (t === 'lost') res = await seoBacklinksApi.lost();
      else if (t === 'new') res = await seoBacklinksApi.recent();
      else res = await seoBacklinksApi.list();
      setBacklinks(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadBacklinks(tab); }, [tab]);

  const discoverBacklinks = async () => {
    if (!domain.trim()) return;
    setDiscovering(true);
    try {
      await seoBacklinksApi.discover(domain);
      loadBacklinks(tab);
    } catch { /* ignore */ }
    setDiscovering(false);
  };

  const daColor = (da: number | null) => {
    if (!da) return 'text-gray-400';
    if (da >= 60) return 'text-green-400';
    if (da >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Link2 size={24} /> Backlink Analysis
        </h1>
        <p className="text-gray-400 text-sm mt-1">Discover and monitor your backlink profile</p>
      </div>

      {/* Discover */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex gap-3">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && discoverBacklinks()}
            className="flex-1 px-4 py-2.5 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter domain to discover backlinks (e.g. example.com)"
          />
          <button onClick={discoverBacklinks} disabled={discovering} className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Search size={16} /> {discovering ? 'Discovering...' : 'Discover'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'new', 'lost'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${
              tab === t ? 'bg-[#6C47FF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {t === 'new' ? 'New (30 days)' : t}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">{backlinks.length}</div>
          <div className="text-xs text-gray-400 mt-1">Total Backlinks</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{backlinks.filter(b => b.status === 'active').length}</div>
          <div className="text-xs text-gray-400 mt-1">Active</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{backlinks.filter(b => b.status === 'lost').length}</div>
          <div className="text-xs text-gray-400 mt-1">Lost</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading backlinks...</div>
        ) : backlinks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No backlinks found. Enter a domain above to discover backlinks.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Source URL</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium">Anchor Text</th>
                  <th className="pb-3 font-medium text-right">DA</th>
                  <th className="pb-3 font-medium text-right">PA</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-right">Discovered</th>
                </tr>
              </thead>
              <tbody>
                {backlinks.map((bl) => (
                  <tr key={bl.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-sm text-[#1DA1F2] max-w-[200px] truncate">
                      <span className="flex items-center gap-1">
                        <ExternalLink size={12} /> {bl.source_url}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400 max-w-[150px] truncate">{bl.target_url}</td>
                    <td className="py-3 text-sm text-gray-300">{bl.anchor_text || '-'}</td>
                    <td className={`py-3 text-sm text-right font-medium ${daColor(bl.domain_authority)}`}>
                      {bl.domain_authority || '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-400 text-right">{bl.page_authority || '-'}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        bl.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {bl.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400 text-right">{new Date(bl.discovered_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
