import { useState, useEffect } from 'react';
import { Search, Hash, Trash2, TrendingUp } from 'lucide-react';
import type { HashtagResearch } from '../../types/social';
import { hashtagsApi } from '../../lib/socialApi';

export default function HashtagResearchPage() {
  const [hashtags, setHashtags] = useState<HashtagResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [researching, setResearching] = useState(false);

  useEffect(() => {
    loadHashtags();
  }, []);

  async function loadHashtags() {
    try {
      setLoading(true);
      const res = await hashtagsApi.list();
      setHashtags(res.data);
    } catch {
      console.error('Failed to load hashtags');
    } finally {
      setLoading(false);
    }
  }

  async function handleResearch() {
    if (!searchInput.trim()) return;
    setResearching(true);
    try {
      await hashtagsApi.research(searchInput.trim());
      setSearchInput('');
      loadHashtags();
    } catch {
      console.error('Failed to research hashtag');
    } finally {
      setResearching(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await hashtagsApi.delete(id);
      loadHashtags();
    } catch {
      console.error('Failed to delete hashtag');
    }
  }

  function getDifficultyColor(score: number | null) {
    if (!score) return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Unknown' };
    if (score <= 3) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Easy' };
    if (score <= 7) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' };
    return { bg: 'bg-red-100', text: 'text-red-700', label: 'Hard' };
  }

  function formatCount(count: number | null) {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hashtag Research</h1>
        <p className="text-gray-500 mt-1">Research hashtags to boost your social media reach</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleResearch()}
              placeholder="Enter hashtag to research (e.g., marketing)"
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={handleResearch}
            disabled={researching || !searchInput.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF] disabled:opacity-50"
          >
            <Search size={18} /> {researching ? 'Researching...' : 'Research'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Saved Hashtags</h3>
          <span className="text-sm text-gray-500">{hashtags.length} hashtags</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading hashtags...</div>
        ) : hashtags.length === 0 ? (
          <div className="text-center py-16">
            <Hash size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hashtags researched yet</h3>
            <p className="text-gray-500 mt-1">Search for a hashtag to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Hashtag</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Post Count</th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Engagement Rate</th>
                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hashtags.map(ht => {
                const difficulty = getDifficultyColor(ht.difficulty_score);
                return (
                  <tr key={ht.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <span className="text-sm font-medium text-[#6C47FF]">{ht.hashtag}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{ht.platform || 'All'}</td>
                    <td className="p-3 text-sm text-right font-medium">{formatCount(ht.post_count)}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <TrendingUp size={14} className="text-green-500" />
                        {ht.engagement_rate?.toFixed(2) || '0.00'}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${difficulty.bg} ${difficulty.text}`}>
                        {ht.difficulty_score}/10 &middot; {difficulty.label}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(ht.last_updated).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(ht.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
