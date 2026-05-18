import { useState, useEffect } from 'react';
import { Send, Clock, Save, Image, X } from 'lucide-react';
import type { SocialAccount } from '../../types/social';
import { PLATFORM_COLORS, PLATFORM_LABELS, PLATFORM_CHAR_LIMITS } from '../../types/social';
import { socialAccountsApi, socialPostsApi, hashtagsApi } from '../../lib/socialApi';
import { useNavigate } from 'react-router-dom';

export default function PostComposerPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<Array<{ hashtag: string; relevance: number }>>([]);

  useEffect(() => {
    socialAccountsApi.list().then(res => setAccounts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 10) {
        hashtagsApi.suggestions(content).then(res => setHashtagSuggestions(res.suggestions)).catch(() => {});
      } else {
        setHashtagSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content]);

  function toggleAccount(id: string) {
    setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }

  function addMedia() {
    if (mediaInput.trim()) {
      setMediaUrls(prev => [...prev, mediaInput.trim()]);
      setMediaInput('');
    }
  }

  function removeMedia(idx: number) {
    setMediaUrls(prev => prev.filter((_, i) => i !== idx));
  }

  function getCharLimit(): number {
    const selectedPlatforms = accounts
      .filter(a => selectedAccounts.includes(a.id))
      .map(a => a.platform);
    if (selectedPlatforms.length === 0) return 2200;
    return Math.min(...selectedPlatforms.map(p => PLATFORM_CHAR_LIMITS[p]));
  }

  function insertHashtag(tag: string) {
    setContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tag);
  }

  async function handlePost(action: 'publish' | 'schedule' | 'draft') {
    if (!content.trim() || selectedAccounts.length === 0) return;
    setLoading(true);
    try {
      for (const accountId of selectedAccounts) {
        const postData: Record<string, unknown> = {
          account_id: accountId,
          content,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        };
        if (action === 'schedule' && scheduleDate && scheduleTime) {
          postData.scheduled_for = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
          postData.status = 'scheduled';
        } else if (action === 'draft') {
          postData.status = 'draft';
        } else {
          postData.status = 'draft';
        }
        const created = await socialPostsApi.create(postData as Partial<import('../../types/social').SocialPost>);
        if (action === 'publish') {
          await socialPostsApi.publish(created.id);
        }
      }
      navigate('/social/scheduled');
    } catch {
      console.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  }

  const charLimit = getCharLimit();
  const charsRemaining = charLimit - content.length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compose Post</h1>
        <p className="text-gray-500 mt-1">Create and schedule social media content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Content */}
          <div className="bg-white rounded-xl border p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What do you want to share?"
              rows={6}
              className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${charsRemaining < 0 ? 'text-red-500 font-bold' : charsRemaining < 50 ? 'text-yellow-500' : 'text-gray-400'}`}>
                {charsRemaining} characters remaining
              </span>
            </div>

            {hashtagSuggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Suggested Hashtags</p>
                <div className="flex flex-wrap gap-2">
                  {hashtagSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => insertHashtag(s.hashtag)}
                      className="text-xs px-2 py-1 bg-purple-50 text-[#6C47FF] rounded-full hover:bg-purple-100"
                    >
                      {s.hashtag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Media */}
          <div className="bg-white rounded-xl border p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Media</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={mediaInput}
                onChange={e => setMediaInput(e.target.value)}
                placeholder="Enter image/video URL"
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                onKeyDown={e => e.key === 'Enter' && addMedia()}
              />
              <button onClick={addMedia} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                <Image size={18} />
              </button>
            </div>
            {mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    <span className="truncate max-w-32">{url}</span>
                    <button onClick={() => removeMedia(i)}><X size={14} className="text-gray-400" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-xl border p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (optional)</label>
            <div className="flex gap-3">
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Platform selector */}
          <div className="bg-white rounded-xl border p-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Post To</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500">No accounts connected. <button onClick={() => navigate('/social/accounts')} className="text-[#6C47FF] underline">Connect one</button></p>
            ) : (
              <div className="space-y-2">
                {accounts.map(account => (
                  <label
                    key={account.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedAccounts.includes(account.id) ? 'border-[#6C47FF] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => toggleAccount(account.id)}
                      className="sr-only"
                    />
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: PLATFORM_COLORS[account.platform] }}>
                      {account.platform[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{account.account_name}</p>
                      <p className="text-xs text-gray-500">{PLATFORM_LABELS[account.platform]}</p>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedAccounts.includes(account.id) ? 'border-[#6C47FF] bg-[#6C47FF]' : 'border-gray-300'}`}>
                      {selectedAccounts.includes(account.id) && <span className="text-white text-xs">&#10003;</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {content && selectedAccounts.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
              {accounts.filter(a => selectedAccounts.includes(a.id)).map(account => (
                <div key={account.id} className="mb-4 last:mb-0 p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: PLATFORM_COLORS[account.platform] }}>
                      {account.platform[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{account.account_name}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{content.slice(0, PLATFORM_CHAR_LIMITS[account.platform])}</p>
                  {content.length > PLATFORM_CHAR_LIMITS[account.platform] && (
                    <p className="text-xs text-red-500 mt-1">Content exceeds {PLATFORM_LABELS[account.platform]} limit</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => handlePost('publish')}
              disabled={loading || !content.trim() || selectedAccounts.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF] disabled:opacity-50"
            >
              <Send size={18} /> Post Now
            </button>
            <button
              onClick={() => handlePost('schedule')}
              disabled={loading || !content.trim() || selectedAccounts.length === 0 || !scheduleDate || !scheduleTime}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#6C47FF] text-[#6C47FF] rounded-lg hover:bg-purple-50 disabled:opacity-50"
            >
              <Clock size={18} /> Schedule
            </button>
            <button
              onClick={() => handlePost('draft')}
              disabled={loading || !content.trim() || selectedAccounts.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Save size={18} /> Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
