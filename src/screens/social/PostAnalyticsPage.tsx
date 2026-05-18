import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import type { SocialPost, SocialPlatform } from '../../types/social';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../../types/social';
import { socialPostsApi } from '../../lib/socialApi';

export default function PostAnalyticsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('');
  const [sortBy, setSortBy] = useState<'engagement' | 'likes' | 'reach' | 'date'>('engagement');

  useEffect(() => {
    loadPosts();
  }, [platformFilter]);

  async function loadPosts() {
    try {
      setLoading(true);
      const params: Record<string, string> = { status: 'published' };
      if (platformFilter) params.platform = platformFilter;
      const res = await socialPostsApi.list(params);
      setPosts(res.data);
    } catch {
      console.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  function getEngagement(post: SocialPost) {
    return post.likes_count + post.comments_count + post.shares_count;
  }

  function getEngagementRate(post: SocialPost) {
    if (!post.reach || post.reach === 0) return 0;
    return ((getEngagement(post) / post.reach) * 100);
  }

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'engagement': return getEngagement(b) - getEngagement(a);
      case 'likes': return b.likes_count - a.likes_count;
      case 'reach': return b.reach - a.reach;
      case 'date': return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
      default: return 0;
    }
  });

  const totalPosts = posts.length;
  const totalEngagement = posts.reduce((sum, p) => sum + getEngagement(p), 0);
  const totalReach = posts.reduce((sum, p) => sum + p.reach, 0);
  const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach * 100).toFixed(2) : '0.00';
  const bestPost = sortedPosts[0];

  const stats = [
    { label: 'Total Posts', value: totalPosts, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Engagement', value: totalEngagement.toLocaleString(), icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Avg Engagement Rate', value: `${avgEngagementRate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Reach', value: totalReach.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post Analytics</h1>
        <p className="text-gray-500 mt-1">Track your social media performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}><Icon size={20} className={stat.color} /></div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {bestPost && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Best Performing Post</h3>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: PLATFORM_COLORS[bestPost.social_accounts?.platform as SocialPlatform] || '#999' }}>
              {(bestPost.social_accounts?.platform || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-gray-900">{bestPost.content.slice(0, 200)}{bestPost.content.length > 200 ? '...' : ''}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Heart size={14} /> {bestPost.likes_count}</span>
                <span className="flex items-center gap-1"><MessageCircle size={14} /> {bestPost.comments_count}</span>
                <span className="flex items-center gap-1"><Share2 size={14} /> {bestPost.shares_count}</span>
                <span className="flex items-center gap-1"><Eye size={14} /> {bestPost.reach}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">All Published Posts</h3>
          <div className="flex items-center gap-3">
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Platforms</option>
              {(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'] as SocialPlatform[]).map(p => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="engagement">Sort by Engagement</option>
              <option value="likes">Sort by Likes</option>
              <option value="reach">Sort by Reach</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading analytics...</div>
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No published posts yet</h3>
            <p className="text-gray-500 mt-1">Publish posts to see analytics</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Content</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Published</th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Likes</th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Comments</th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Shares</th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Reach</th>
                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Eng. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedPosts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <p className="text-sm text-gray-900 max-w-xs truncate">{post.content}</p>
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
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3 text-sm text-right">{post.likes_count}</td>
                  <td className="p-3 text-sm text-right">{post.comments_count}</td>
                  <td className="p-3 text-sm text-right">{post.shares_count}</td>
                  <td className="p-3 text-sm text-right">{post.reach.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right font-medium">{getEngagementRate(post).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
