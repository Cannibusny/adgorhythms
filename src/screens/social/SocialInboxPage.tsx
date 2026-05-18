import { useState, useEffect } from 'react';
import { Inbox, Send, CheckCheck, MessageCircle, AtSign, Mail } from 'lucide-react';
import type { SocialInboxMessage, SocialPlatform } from '../../types/social';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../../types/social';
import { socialInboxApi } from '../../lib/socialApi';

type TabFilter = '' | 'comment' | 'dm' | 'mention';

export default function SocialInboxPage() {
  const [messages, setMessages] = useState<SocialInboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [repliedFilter, setRepliedFilter] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<SocialInboxMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [tab, platformFilter, repliedFilter]);

  async function loadMessages() {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (tab) params.message_type = tab;
      if (platformFilter) params.platform = platformFilter;
      if (repliedFilter) params.replied = repliedFilter;
      const res = await socialInboxApi.list(params);
      setMessages(res.data);
    } catch {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!selectedMessage || !replyText.trim()) return;
    setReplying(true);
    try {
      await socialInboxApi.reply(selectedMessage.id, replyText);
      setReplyText('');
      setSelectedMessage(null);
      loadMessages();
    } catch {
      console.error('Failed to reply');
    } finally {
      setReplying(false);
    }
  }

  async function handleMarkReplied(id: string) {
    try {
      await socialInboxApi.markReplied(id);
      loadMessages();
    } catch {
      console.error('Failed to mark as replied');
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'comment': return MessageCircle;
      case 'dm': return Mail;
      case 'mention': return AtSign;
      default: return MessageCircle;
    }
  }

  const tabs: Array<{ label: string; value: TabFilter; icon: typeof Inbox }> = [
    { label: 'All', value: '', icon: Inbox },
    { label: 'Comments', value: 'comment', icon: MessageCircle },
    { label: 'DMs', value: 'dm', icon: Mail },
    { label: 'Mentions', value: 'mention', icon: AtSign },
  ];

  const unrepliedCount = messages.filter(m => !m.replied).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Social Inbox</h1>
        <p className="text-gray-500 mt-1">
          Manage all your social media messages in one place
          {unrepliedCount > 0 && <span className="ml-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{unrepliedCount} unreplied</span>}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Message list */}
        <div className="flex-1 bg-white rounded-xl border">
          <div className="flex items-center gap-1 p-3 border-b">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg ${tab === t.value ? 'bg-[#6C47FF] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="px-2 py-1 border rounded text-xs">
                <option value="">All</option>
                {(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'] as SocialPlatform[]).map(p => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </select>
              <select value={repliedFilter} onChange={e => setRepliedFilter(e.target.value)} className="px-2 py-1 border rounded text-xs">
                <option value="">All</option>
                <option value="false">Unreplied</option>
                <option value="true">Replied</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Inbox is empty</h3>
              <p className="text-gray-500 mt-1">No messages to show</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {messages.map(msg => {
                const TypeIcon = getTypeIcon(msg.message_type);
                return (
                  <div
                    key={msg.id}
                    onClick={() => { setSelectedMessage(msg); setReplyText(''); }}
                    className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 ${selectedMessage?.id === msg.id ? 'bg-purple-50' : ''} ${!msg.replied ? 'border-l-2 border-l-[#6C47FF]' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: PLATFORM_COLORS[msg.social_accounts?.platform as SocialPlatform] || '#999' }}>
                      {(msg.social_accounts?.platform || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{msg.from_user}</span>
                        {msg.from_user_handle && <span className="text-xs text-gray-400">@{msg.from_user_handle}</span>}
                        <TypeIcon size={12} className="text-gray-400" />
                        {msg.replied && <CheckCheck size={12} className="text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{msg.message_text}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply panel */}
        {selectedMessage && (
          <div className="w-96 bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: PLATFORM_COLORS[selectedMessage.social_accounts?.platform as SocialPlatform] || '#999' }}>
                {(selectedMessage.social_accounts?.platform || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedMessage.from_user}</p>
                <p className="text-xs text-gray-500">
                  {selectedMessage.social_accounts?.platform ? PLATFORM_LABELS[selectedMessage.social_accounts.platform as SocialPlatform] : ''} &middot; {selectedMessage.message_type}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">{selectedMessage.message_text}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(selectedMessage.created_at).toLocaleString()}</p>
            </div>

            {selectedMessage.replied ? (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-medium text-green-600 mb-1">Replied {selectedMessage.replied_at ? new Date(selectedMessage.replied_at).toLocaleString() : ''}</p>
                {selectedMessage.reply_text && <p className="text-sm text-gray-700">{selectedMessage.reply_text}</p>}
              </div>
            ) : (
              <div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg resize-none text-sm"
                />
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF] disabled:opacity-50 text-sm"
                  >
                    <Send size={14} /> Send Reply
                  </button>
                  <button
                    onClick={() => handleMarkReplied(selectedMessage.id)}
                    className="px-3 py-2 border text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                    title="Mark as replied without sending"
                  >
                    <CheckCheck size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
