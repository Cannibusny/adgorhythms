import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, TrendingUp, Target } from 'lucide-react';
import { seoKeywordsApi } from '../../lib/seoCalendarApi';
import type { SeoKeyword, KeywordResearchResult, KeywordSuggestion } from '../../types/seoCalendar';

export default function KeywordResearchPage() {
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [query, setQuery] = useState('');
  const [research, setResearch] = useState<KeywordResearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const loadKeywords = async () => {
    try {
      const res = await seoKeywordsApi.list(true);
      setKeywords(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadKeywords(); }, []);

  const doResearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const [res, sug] = await Promise.all([
        seoKeywordsApi.research(query),
        seoKeywordsApi.suggestions(query),
      ]);
      setResearch(res);
      setSuggestions(sug.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const trackKeyword = async (kw: string, volume?: number, diff?: number, cpc?: number) => {
    await seoKeywordsApi.create({ keyword: kw, search_volume: volume, difficulty: diff, cpc });
    loadKeywords();
  };

  const removeKeyword = async (id: string) => {
    await seoKeywordsApi.delete(id);
    loadKeywords();
  };

  const diffColor = (d: number) => {
    if (d <= 30) return 'text-green-400';
    if (d <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search size={24} /> Keyword Research
        </h1>
        <p className="text-gray-400 text-sm mt-1">Research keywords, track rankings, and find opportunities</p>
      </div>

      {/* Search */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doResearch()}
            className="flex-1 px-4 py-2.5 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter keyword to research..."
          />
          <button onClick={doResearch} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Search size={16} /> {loading ? 'Researching...' : 'Research'}
          </button>
        </div>
      </div>

      {/* Research Results */}
      {research && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Results for &quot;{research.keyword}&quot;</h3>
            <button
              onClick={() => trackKeyword(research.keyword, research.search_volume, research.difficulty, research.cpc)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#6C47FF] bg-[#6C47FF]/10 hover:bg-[#6C47FF]/20 rounded-lg"
            >
              <Plus size={14} /> Track Keyword
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#12121F] rounded-xl p-3">
              <div className="text-xs text-gray-400">Search Volume</div>
              <div className="text-xl font-bold text-white mt-1">{research.search_volume.toLocaleString()}</div>
            </div>
            <div className="bg-[#12121F] rounded-xl p-3">
              <div className="text-xs text-gray-400">Difficulty</div>
              <div className={`text-xl font-bold mt-1 ${diffColor(research.difficulty)}`}>{research.difficulty}/100</div>
            </div>
            <div className="bg-[#12121F] rounded-xl p-3">
              <div className="text-xs text-gray-400">CPC</div>
              <div className="text-xl font-bold text-white mt-1">${research.cpc}</div>
            </div>
            <div className="bg-[#12121F] rounded-xl p-3">
              <div className="text-xs text-gray-400">Trend</div>
              <div className="text-xl font-bold text-white mt-1 capitalize">{research.trend}</div>
            </div>
          </div>

          {research.related_keywords.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-gray-400 mb-2">Related Keywords</div>
              <div className="flex flex-wrap gap-2">
                {research.related_keywords.map((rk) => (
                  <button
                    key={rk}
                    onClick={() => { setQuery(rk); }}
                    className="px-3 py-1 text-xs bg-white/5 text-gray-300 rounded-lg hover:bg-white/10"
                  >
                    {rk}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4">Keyword Suggestions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Keyword</th>
                  <th className="pb-3 font-medium text-right">Volume</th>
                  <th className="pb-3 font-medium text-right">Difficulty</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.keyword} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-sm text-white">{s.keyword}</td>
                    <td className="py-3 text-sm text-gray-400 text-right">{s.volume.toLocaleString()}</td>
                    <td className={`py-3 text-sm text-right ${diffColor(s.difficulty)}`}>{s.difficulty}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => trackKeyword(s.keyword, s.volume, s.difficulty)} className="text-[#6C47FF] hover:text-[#5a3ad4]">
                        <Plus size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracked Keywords */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Target size={18} /> Tracked Keywords ({keywords.length})
        </h3>
        {keywords.length === 0 ? (
          <p className="text-gray-400 text-sm">No tracked keywords yet. Research and add keywords to start tracking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Keyword</th>
                  <th className="pb-3 font-medium text-right">Volume</th>
                  <th className="pb-3 font-medium text-right">Difficulty</th>
                  <th className="pb-3 font-medium text-right">CPC</th>
                  <th className="pb-3 font-medium text-right">Current Rank</th>
                  <th className="pb-3 font-medium text-right">Target</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => (
                  <tr key={kw.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-sm text-white">{kw.keyword}</td>
                    <td className="py-3 text-sm text-gray-400 text-right">{kw.search_volume?.toLocaleString() || '-'}</td>
                    <td className={`py-3 text-sm text-right ${kw.difficulty ? diffColor(kw.difficulty) : 'text-gray-400'}`}>
                      {kw.difficulty || '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-400 text-right">{kw.cpc ? `$${kw.cpc}` : '-'}</td>
                    <td className="py-3 text-sm text-right">
                      {kw.current_rank ? (
                        <span className="flex items-center justify-end gap-1">
                          <TrendingUp size={14} className="text-green-400" /> #{kw.current_rank}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-400 text-right">{kw.target_rank ? `#${kw.target_rank}` : '-'}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => removeKeyword(kw.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </td>
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
