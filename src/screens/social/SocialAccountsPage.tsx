import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import type { SocialAccount, SocialPlatform } from '../../types/social';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../../types/social';
import { socialAccountsApi } from '../../lib/socialApi';

const PLATFORMS: SocialPlatform[] = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'];

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [form, setForm] = useState({ platform: 'instagram' as SocialPlatform, account_name: '', account_handle: '' });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      const res = await socialAccountsApi.list();
      setAccounts(res.data);
    } catch {
      console.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!form.account_name) return;
    try {
      await socialAccountsApi.connect({
        platform: form.platform,
        account_name: form.account_name,
        account_handle: form.account_handle || null,
      });
      setShowConnect(false);
      setForm({ platform: 'instagram', account_name: '', account_handle: '' });
      loadAccounts();
    } catch {
      console.error('Failed to connect account');
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm('Disconnect this account?')) return;
    try {
      await socialAccountsApi.disconnect(id);
      loadAccounts();
    } catch {
      console.error('Failed to disconnect');
    }
  }

  async function handleRefresh(id: string) {
    try {
      await socialAccountsApi.refresh(id);
      loadAccounts();
    } catch {
      console.error('Failed to refresh token');
    }
  }

  function getStatusInfo(account: SocialAccount) {
    if (!account.is_connected) return { icon: WifiOff, color: 'text-red-500', bg: 'bg-red-50', label: 'Disconnected' };
    if (account.expires_at && new Date(account.expires_at) < new Date()) {
      return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Token Expired' };
    }
    return { icon: Wifi, color: 'text-green-500', bg: 'bg-green-50', label: 'Connected' };
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Accounts</h1>
          <p className="text-gray-500 mt-1">Connect and manage your social media accounts</p>
        </div>
        <button
          onClick={() => setShowConnect(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF]"
        >
          <Plus size={18} /> Connect Account
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Wifi size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No accounts connected</h3>
          <p className="text-gray-500 mt-1">Connect your social media accounts to start posting</p>
          <button
            onClick={() => setShowConnect(true)}
            className="mt-4 px-4 py-2 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF]"
          >
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => {
            const status = getStatusInfo(account);
            const StatusIcon = status.icon;
            return (
              <div key={account.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: PLATFORM_COLORS[account.platform] }}
                    >
                      {account.platform[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.account_name}</h3>
                      {account.account_handle && (
                        <p className="text-sm text-gray-500">@{account.account_handle}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: PLATFORM_COLORS[account.platform], backgroundColor: `${PLATFORM_COLORS[account.platform]}15` }}>
                    {PLATFORM_LABELS[account.platform]}
                  </span>
                </div>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${status.bg} mb-4`}>
                  <StatusIcon size={16} className={status.color} />
                  <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRefresh(account.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showConnect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Connect Social Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <div className="grid grid-cols-5 gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, platform: p })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${form.platform === p ? 'border-[#6C47FF] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: PLATFORM_COLORS[p] }}>
                        {p[0].toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-600">{PLATFORM_LABELS[p].slice(0, 5)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={form.account_name}
                  onChange={e => setForm({ ...form, account_name: e.target.value })}
                  placeholder="Your Business Name"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Handle (optional)</label>
                <input
                  type="text"
                  value={form.account_handle}
                  onChange={e => setForm({ ...form, account_handle: e.target.value })}
                  placeholder="@yourbusiness"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConnect(false)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleConnect} className="px-4 py-2 bg-[#6C47FF] text-white rounded-lg hover:bg-[#4C2FBF]">Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
