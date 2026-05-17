import { useState, useEffect } from 'react';
import {
  Plus, X, Mail, Send, Clock, BarChart3, Eye, MousePointer,
  Users, Calendar,
} from 'lucide-react';
import { campaignsApi } from '../../lib/api';
import type { EmailCampaign } from '../../types/crm';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-red-100 text-red-700',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await campaignsApi.list();
      setCampaigns(res.data);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this campaign now?')) return;
    await campaignsApi.send(id);
    fetchCampaigns();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C47FF] to-[#4C2FBF] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#6C47FF]/25">
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Mail, label: 'Total Campaigns', value: campaigns.length, color: 'bg-[#6C47FF]/10 text-[#6C47FF]' },
          { icon: Send, label: 'Sent', value: campaigns.filter(c => c.status === 'sent').length, color: 'bg-emerald-50 text-emerald-600' },
          { icon: Clock, label: 'Scheduled', value: campaigns.filter(c => c.status === 'scheduled').length, color: 'bg-blue-50 text-blue-600' },
          { icon: BarChart3, label: 'Avg Open Rate', value: campaigns.filter(c => c.recipient_count > 0).length > 0 ? Math.round(campaigns.filter(c => c.recipient_count > 0).reduce((s, c) => s + (c.opened_count / c.recipient_count) * 100, 0) / campaigns.filter(c => c.recipient_count > 0).length) + '%' : '—', color: 'bg-amber-50 text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500">{stat.label}</div>
              <div className="text-lg font-bold text-gray-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Campaign</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Recipients</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Open Rate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Click Rate</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading campaigns...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                <Mail size={40} className="mx-auto mb-2 text-gray-300" />
                No campaigns yet. Create your first email campaign.
              </td></tr>
            ) : campaigns.map(campaign => {
              const openRate = campaign.recipient_count > 0 ? ((campaign.opened_count / campaign.recipient_count) * 100).toFixed(1) : '0';
              const clickRate = campaign.recipient_count > 0 ? ((campaign.clicked_count / campaign.recipient_count) * 100).toFixed(1) : '0';
              return (
                <tr key={campaign.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCampaign(campaign)}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-xs text-gray-500">{campaign.subject}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users size={14} /> {campaign.recipient_count}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Eye size={14} /> {openRate}%
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MousePointer size={14} /> {clickRate}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {campaign.status === 'draft' && (
                      <button onClick={() => handleSend(campaign.id)} className="px-3 py-1.5 bg-[#6C47FF] text-white text-xs font-medium rounded-lg">
                        <Send size={12} className="inline mr-1" /> Send
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showBuilder && (
        <CampaignBuilder
          onClose={() => setShowBuilder(false)}
          onSave={() => { setShowBuilder(false); fetchCampaigns(); }}
        />
      )}

      {selectedCampaign && !showBuilder && (
        <CampaignStatsModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
      )}
    </div>
  );
}

function CampaignBuilder({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', subject: '', from_name: '', from_email: '',
    reply_to: '', html_content: '', plain_text_content: '',
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await campaignsApi.create(form);
      onSave();
    } catch { alert('Failed to create campaign'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Create Campaign</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-[#6C47FF]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Campaign Details</h3>
            <div>
              <label className="text-sm font-medium text-gray-700">Campaign Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="Monthly Newsletter" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Subject Line *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="Your weekly update is here!" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">From Name *</label>
                <input value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="ADgorhythms" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">From Email *</label>
                <input type="email" value={form.from_email} onChange={e => setForm({ ...form, from_email: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="hello@adgorhythms.com" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reply-To Email</label>
              <input type="email" value={form.reply_to} onChange={e => setForm({ ...form, reply_to: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Email Content</h3>
            <div>
              <label className="text-sm font-medium text-gray-700">HTML Content</label>
              <textarea value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })} rows={10} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="<h1>Hello {{first_name}}!</h1><p>Your update...</p>" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Plain Text Content</label>
              <textarea value={form.plain_text_content} onChange={e => setForm({ ...form, plain_text_content: e.target.value })} rows={5} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="Hello! Your update..." />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Review & Create</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Campaign:</span><span className="text-sm font-medium">{form.name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Subject:</span><span className="text-sm font-medium">{form.subject}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">From:</span><span className="text-sm font-medium">{form.from_name} &lt;{form.from_email}&gt;</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Content:</span><span className="text-sm font-medium">{form.html_content ? 'HTML + Plain Text' : 'Plain Text Only'}</span></div>
            </div>
            <p className="text-xs text-gray-500">Campaign will be saved as draft. You can send or schedule it later.</p>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg">Next</button>
          ) : (
            <button onClick={handleCreate} disabled={saving} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignStatsModal({ campaign, onClose }: { campaign: EmailCampaign; onClose: () => void }) {
  const openRate = campaign.recipient_count > 0 ? ((campaign.opened_count / campaign.recipient_count) * 100).toFixed(1) : '0';
  const clickRate = campaign.recipient_count > 0 ? ((campaign.clicked_count / campaign.recipient_count) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{campaign.name}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[campaign.status]}`}>{campaign.status}</span>
            <span className="text-sm text-gray-500">{campaign.subject}</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Users size={20} className="mx-auto text-gray-400 mb-1" />
              <div className="text-xl font-bold text-gray-900">{campaign.recipient_count}</div>
              <div className="text-xs text-gray-500">Recipients</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Eye size={20} className="mx-auto text-[#6C47FF] mb-1" />
              <div className="text-xl font-bold text-[#6C47FF]">{openRate}%</div>
              <div className="text-xs text-gray-500">Open Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <MousePointer size={20} className="mx-auto text-emerald-500 mb-1" />
              <div className="text-xl font-bold text-emerald-600">{clickRate}%</div>
              <div className="text-xs text-gray-500">Click Rate</div>
            </div>
          </div>

          {campaign.sent_at && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} /> Sent on {new Date(campaign.sent_at).toLocaleString()}
            </div>
          )}
          {campaign.send_at && campaign.status === 'scheduled' && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Clock size={14} /> Scheduled for {new Date(campaign.send_at).toLocaleString()}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <div>From: {campaign.from_name} &lt;{campaign.from_email}&gt;</div>
            <div>Created: {new Date(campaign.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
