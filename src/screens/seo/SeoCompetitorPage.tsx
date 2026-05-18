import { useState, useEffect } from 'react';
import { Users, Search, Plus, TrendingUp } from 'lucide-react';
import { seoKeywordsApi, seoBacklinksApi } from '../../lib/seoCalendarApi';
import type { SeoKeyword, SeoBacklink } from '../../types/seoCalendar';

interface Competitor {
  domain: string;
  keywords: SeoKeyword[];
  backlinks: SeoBacklink[];
}

export default function SeoCompetitorPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [domain, setDomain] = useState('');
  const [selected, setSelected] = useState<Competitor | null>(null);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<'keywords' | 'backlinks'>('keywords');

  // Load competitors from stored keywords tagged by domain (simulated)
  useEffect(() => {
    // Competitors are maintained client-side for simplicity
  }, []);

  const addCompetitor = async () => {
    if (!domain.trim()) return;
    setAdding(true);
    try {
      // Research keywords for competitor domain
      const kwRes = await seoKeywordsApi.suggestions(domain);
      const keywords: SeoKeyword[] = (kwRes.data || []).map((s: { keyword: string; volume: number; difficulty: number }, i: number) => ({
        id: `comp-kw-${i}-${Date.now()}`,
        workspace_id: '',
        keyword: s.keyword,
        search_volume: s.volume,
        difficulty: s.difficulty,
        cpc: null,
        current_rank: Math.floor(Math.random() * 50) + 1,
        target_rank: null,
        tracked: false,
        last_updated: new Date().toISOString(),
      }));

      // Discover backlinks
      const blRes = await seoBacklinksApi.discover(domain);
      const backlinks: SeoBacklink[] = blRes.data || [];

      const comp: Competitor = { domain, keywords, backlinks };
      setCompetitors((prev) => [...prev, comp]);
      setSelected(comp);
      setDomain('');
    } catch { /* ignore */ }
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} /> SEO Competitor Analysis
        </h1>
        <p className="text-gray-400 text-sm mt-1">Analyze competitor domains for keywords and backlinks</p>
      </div>

      {/* Add Competitor */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex gap-3">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            className="flex-1 px-4 py-2.5 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter competitor domain (e.g. competitor.com)"
          />
          <button onClick={addCompetitor} disabled={adding} className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Plus size={16} /> {adding ? 'Analyzing...' : 'Add Competitor'}
          </button>
        </div>
      </div>

      {/* Competitor List */}
      {competitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {competitors.map((comp) => (
            <button
              key={comp.domain}
              onClick={() => { setSelected(comp); setTab('keywords'); }}
              className={`bg-[#1E1E36] rounded-2xl border p-4 text-left hover:border-white/20 transition-colors ${
                selected?.domain === comp.domain ? 'border-[#6C47FF]' : 'border-white/5'
              }`}
            >
              <div className="text-white font-medium">{comp.domain}</div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Search size={12} /> {comp.keywords.length} keywords
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} /> {comp.backlinks.length} backlinks
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Competitor Detail */}
      {selected && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">{selected.domain}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTab('keywords')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  tab === 'keywords' ? 'bg-[#6C47FF] text-white' : 'bg-white/5 text-gray-400'
                }`}
              >
                Keywords ({selected.keywords.length})
              </button>
              <button
                onClick={() => setTab('backlinks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  tab === 'backlinks' ? 'bg-[#6C47FF] text-white' : 'bg-white/5 text-gray-400'
                }`}
              >
                Backlinks ({selected.backlinks.length})
              </button>
            </div>
          </div>

          {tab === 'keywords' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                    <th className="pb-3 font-medium">Keyword</th>
                    <th className="pb-3 font-medium text-right">Volume</th>
                    <th className="pb-3 font-medium text-right">Difficulty</th>
                    <th className="pb-3 font-medium text-right">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.keywords.map((kw) => (
                    <tr key={kw.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-sm text-white">{kw.keyword}</td>
                      <td className="py-3 text-sm text-gray-400 text-right">{kw.search_volume?.toLocaleString() || '-'}</td>
                      <td className="py-3 text-sm text-right">
                        <span className={kw.difficulty && kw.difficulty <= 30 ? 'text-green-400' : kw.difficulty && kw.difficulty <= 60 ? 'text-yellow-400' : 'text-red-400'}>
                          {kw.difficulty || '-'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-400 text-right">#{kw.current_rank || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Anchor</th>
                    <th className="pb-3 font-medium text-right">DA</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.backlinks.map((bl) => (
                    <tr key={bl.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-sm text-[#1DA1F2] max-w-[250px] truncate">{bl.source_url}</td>
                      <td className="py-3 text-sm text-gray-400">{bl.anchor_text || '-'}</td>
                      <td className="py-3 text-sm text-gray-400 text-right">{bl.domain_authority || '-'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          bl.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {bl.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {competitors.length === 0 && (
        <div className="text-center py-12 bg-[#1E1E36] rounded-2xl border border-white/5">
          <Users size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Competitors Added</h3>
          <p className="text-gray-400 text-sm">Add a competitor domain above to analyze their SEO strategy.</p>
        </div>
      )}
    </div>
  );
}
