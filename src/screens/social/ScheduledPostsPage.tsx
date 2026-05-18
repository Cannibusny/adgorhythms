import { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Edit2, Calendar } from 'lucide-react';
import type { SocialPost, SocialPlatform } from '../../types/social';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../../types/social';
import { socialPostsApi } from '../../lib/socialApi';
import { useNavigate } from 'react-router-dom';

export default function ScheduledPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, [statusFilter, platformFilter]);

  async function loadPosts() {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (platformFilter) params.platform = platformFilter;
      const res = await socialPostsApi.list(params);
      setPosts(res.data);
    } catch {
      console.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await socialPostsApi.publish(id);
      loadPosts();
    } catch {
      console.error('Failed to publish');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    try {
      await socialPostsApi.delete(id);
      loadPosts();
    } catch {
      console.error('Failed to delete');
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} posts?`)) return;
    try {
      for (const id of selected) {
        await socialPostsApi.delete(id);
      }
      setSelected(new Set());
      loadPosts();
    } catch {
      console.error('Failed to bulk delete');
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map(p => p.id)));
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'published': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduled Posts</h1>
          <p className="text-gray-500 mt-1">Manage your scheduled and draft posts</p>
        </div>
        <button
          onClick={() => navigate('/social/compose')}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF]"
        >
          <Plus size={18} /> Create Post
        </button>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
            </select>
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Platforms</option>
              {(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'] as SocialPlatform[]).map(p => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{selected.size} selected</span>
              <button onClick={handleBulkDelete} className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete Selected</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
            <p className="text-gray-500 mt-1">Create your first social media post</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 w-10">
                  <input type="checkbox" checked={selected.size === posts.length && posts.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Content</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Scheduled For</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)} className="rounded" />
                  </td>
                  <td className="p-3">
                    <p className="text-sm text-gray-900 max-w-sm truncate">{post.content}</p>
                    {post.media_urls && post.media_urls.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{post.media_urls.length} media attached</p>
                    )}
                  </td>
                  <td className="p-3">
                    {post.social_accounts?.platform && (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[post.social_accounts.platform as SocialPlatform] }} />
                        <span className="text-sm">{PLATFORM_LABELS[post.social_accounts.platform as SocialPlatform]}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {post.scheduled_for ? new Date(post.scheduled_for).toLocaleString() : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(post.status)}`}>{post.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {post.status !== 'published' && (
                        <>
                          <button onClick={() => navigate('/social/compose')} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handlePublish(post.id)} className="p-1.5 text-green-400 hover:text-green-600 rounded" title="Publish Now">
                            <Send size={14} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(post.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded" title="Delete">
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
  );
}
