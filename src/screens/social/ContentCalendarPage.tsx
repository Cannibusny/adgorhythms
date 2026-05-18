import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List } from 'lucide-react';
import type { SocialPost, SocialPlatform } from '../../types/social';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../../types/social';
import { socialPostsApi } from '../../lib/socialApi';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'month' | 'week' | 'list';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ContentCalendarPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [platformFilter, setPlatformFilter] = useState<string>('');

  useEffect(() => {
    loadPosts();
  }, [currentDate, platformFilter]);

  async function loadPosts() {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (platformFilter) params.platform = platformFilter;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      params.date_from = new Date(year, month, 1).toISOString();
      params.date_to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const res = await socialPostsApi.list(params);
      setPosts(res.data);
    } catch {
      console.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function getPostsForDay(day: number) {
    return posts.filter(post => {
      const postDate = new Date(post.scheduled_for || post.created_at);
      return postDate.getDate() === day &&
        postDate.getMonth() === currentDate.getMonth() &&
        postDate.getFullYear() === currentDate.getFullYear();
    });
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'published': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-500 mt-1">Plan and schedule your social media content</p>
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
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-semibold min-w-48 text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-[#6C47FF] border border-[#6C47FF] rounded-lg hover:bg-purple-50"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Platforms</option>
              {(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'] as SocialPlatform[]).map(p => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`p-2 ${viewMode === 'month' ? 'bg-[#6C47FF] text-white' : 'hover:bg-gray-100'}`}
              >
                <CalendarIcon size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-[#6C47FF] text-white' : 'hover:bg-gray-100'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading calendar...</div>
        ) : viewMode === 'list' ? (
          <div className="divide-y">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No posts scheduled this month</div>
            ) : (
              posts.sort((a, b) => new Date(a.scheduled_for || a.created_at).getTime() - new Date(b.scheduled_for || b.created_at).getTime()).map(post => (
                <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[post.social_accounts?.platform as SocialPlatform] || '#999' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{post.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.social_accounts?.platform ? PLATFORM_LABELS[post.social_accounts.platform as SocialPlatform] : 'Unknown'} &middot; {post.social_accounts?.account_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{new Date(post.scheduled_for || post.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(post.scheduled_for || post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(post.status)}`}>{post.status}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 border-b">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
                return (
                  <div
                    key={idx}
                    className={`min-h-28 border-b border-r p-1 ${day ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'}`}
                    onClick={() => day && navigate('/social/compose')}
                  >
                    {day && (
                      <>
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${isToday ? 'bg-[#6C47FF] text-white font-bold' : 'text-gray-600'}`}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayPosts.slice(0, 3).map(post => (
                            <div
                              key={post.id}
                              className="text-xs p-1 rounded truncate"
                              style={{ backgroundColor: `${PLATFORM_COLORS[post.social_accounts?.platform as SocialPlatform] || '#999'}20`, color: PLATFORM_COLORS[post.social_accounts?.platform as SocialPlatform] || '#999' }}
                            >
                              {post.content.slice(0, 30)}
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <p className="text-xs text-gray-400 pl-1">+{dayPosts.length - 3} more</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
