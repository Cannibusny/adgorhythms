import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Users, TrendingUp, Eye } from 'lucide-react';
import type { CompetitorTracking, SocialPlatform } from '../../types/social';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../../types/social';
import { competitorsApi } from '../../lib/socialApi';

export default function CompetitorTrackingPage() {
  const [competitors, setCompetitors] = useState<CompetitorTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorTracking | null>(null);
  const [form, setForm] = useState({ competitor_name: '', platform: '' as string, account_handle: '' });
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadCompetitors();
  }, []);

  async function loadCompetitors() {
    try {
      setLoading(true);
      const res = await competitorsApi.list();
      setCompetitors(res.data);
    } catch {
      console.error('Failed to load competitors');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.competitor_name) return;
    try {
      await competitorsApi.create({
        competitor_name: form.competitor_name,
        platform: form.platform || null,
        account_handle: form.account_handle || null,
      });
      setShowAdd(false);
      setForm({ competitor_name: '', platform: '', account_handle: '' });
      loadCompetitors();
    } catch {
      console.error('Failed to add competitor');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Stop tracking this competitor?')) return;
    try {
      await competitorsApi.delete(id);
      if (selectedCompetitor?.id === id) setSelectedCompetitor(null);
      loadCompetitors();
    } catch {
      console.error('Failed to delete competitor');
    }
  }

  async function handleSync(id: string) {
    setSyncing(id);
    try {
      const updated = await competitorsApi.sync(id);
      setCompetitors(prev => prev.map(c => c.id === id ? updated : c));
      if (selectedCompetitor?.id === id) setSelectedCompetitor(updated);
    } catch {
      console.error('Failed to sync');
    } finally {
      setSyncing(null);
    }
  }

  function formatFollowers(count: number | null) {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Tracking</h1>
          <p className="text-gray-500 mt-1">Monitor your competitors&apos; social media performance</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF]"
        >
          <Plus size={18} /> Add Competitor
        </button>
      </div>

      <div className="flex gap-6">
        {/* Competitor list */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading competitors...</div>
            ) : competitors.length === 0 ? (
              <div className="text-center py-16">
                <Eye size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No competitors tracked</h3>
                <p className="text-gray-500 mt-1">Add a competitor to start monitoring</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Platform</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Handle</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Followers</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Avg Eng. Rate</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Last Synced</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {competitors.map(comp => (
                    <tr
                      key={comp.id}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedCompetitor?.id === comp.id ? 'bg-purple-50' : ''}`}
                      onClick={() => setSelectedCompetitor(comp)}
                    >
                      <td className="p-3">
                        <span className="text-sm font-medium text-gray-900">{comp.competitor_name}</span>
                      </td>
                      <td className="p-3">
                        {comp.platform && (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[comp.platform as SocialPlatform] || '#999' }} />
                            <span className="text-sm">{PLATFORM_LABELS[comp.platform as SocialPlatform] || comp.platform}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-500">{comp.account_handle ? `@${comp.account_handle}` : '-'}</td>
                      <td className="p-3 text-sm text-right font-medium">{formatFollowers(comp.follower_count)}</td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <TrendingUp size={14} className="text-green-500" />
                          {comp.avg_engagement_rate?.toFixed(2) || '0.00'}%
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{new Date(comp.last_synced_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleSync(comp.id)}
                            disabled={syncing === comp.id}
                            className="p-1.5 text-blue-400 hover:text-blue-600 rounded"
                            title="Sync Now"
                          >
                            <RefreshCw size={14} className={syncing === comp.id ? 'animate-spin' : ''} />
                          </button>
                          <button onClick={() => handleDelete(comp.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded" title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedCompetitor && (
          <div className="w-80 space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">{selectedCompetitor.competitor_name}</h3>
              {selectedCompetitor.account_handle && (
                <p className="text-sm text-gray-500 mb-4">@{selectedCompetitor.account_handle}</p>
              )}
              {selectedCompetitor.platform && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full mb-4" style={{ color: PLATFORM_COLORS[selectedCompetitor.platform as SocialPlatform], backgroundColor: `${PLATFORM_COLORS[selectedCompetitor.platform as SocialPlatform]}15` }}>
                  {PLATFORM_LABELS[selectedCompetitor.platform as SocialPlatform]}
                </span>
              )}

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-sm text-gray-600">Followers</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatFollowers(selectedCompetitor.follower_count)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-500" />
                    <span className="text-sm text-gray-600">Avg Engagement</span>
                  </div>
                  <span className="font-semibold text-gray-900">{selectedCompetitor.avg_engagement_rate?.toFixed(2) || '0.00'}%</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Last synced: {new Date(selectedCompetitor.last_synced_at).toLocaleString()}
              </p>

              <button
                onClick={() => handleSync(selectedCompetitor.id)}
                disabled={syncing === selectedCompetitor.id}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing === selectedCompetitor.id ? 'animate-spin' : ''} />
                {syncing === selectedCompetitor.id ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add competitor modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Competitor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Name</label>
                <input
                  type="text"
                  value={form.competitor_name}
                  onChange={e => setForm({ ...form, competitor_name: e.target.value })}
                  placeholder="e.g., Acme Marketing"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={form.platform}
                  onChange={e => setForm({ ...form, platform: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select platform</option>
                  {(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'] as SocialPlatform[]).map(p => (
                    <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Handle (optional)</label>
                <input
                  type="text"
                  value={form.account_handle}
                  onChange={e => setForm({ ...form, account_handle: e.target.value })}
                  placeholder="@competitor"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF]">Add Competitor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
