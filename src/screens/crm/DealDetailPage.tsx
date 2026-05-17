import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Percent, Calendar, Trash2, Edit3,
  Plus, X, User, FileText, Mail, Phone as PhoneIcon,
  CheckSquare, MessageSquare,
} from 'lucide-react';
import { dealsApi, activitiesApi } from '../../lib/api';
import type { Deal, CRMActivity, DealStage, ActivityType } from '../../types/crm';

const STAGES: { key: DealStage; label: string }[] = [
  { key: 'prospecting', label: 'Prospecting' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'closed_won', label: 'Closed Won' },
  { key: 'closed_lost', label: 'Closed Lost' },
];

const ACTIVITY_ICONS: Record<string, typeof Mail> = {
  email: Mail, call: PhoneIcon, meeting: Calendar, note: FileText, task: CheckSquare,
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Deal>>({});
  const [showLogActivity, setShowLogActivity] = useState(false);

  useEffect(() => { if (id) fetchDeal(); }, [id]);

  const fetchDeal = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await dealsApi.get(id);
      setDeal(data);
      setEditForm(data);
    } catch { navigate('/deals'); }
    finally { setLoading(false); }
  };

  const handleStageChange = async (stage: DealStage) => {
    if (!id) return;
    await dealsApi.updateStage(id, stage);
    fetchDeal();
  };

  const handleSave = async () => {
    if (!id) return;
    await dealsApi.update(id, {
      name: editForm.name,
      amount: editForm.amount,
      probability: editForm.probability,
      expected_close_date: editForm.expected_close_date,
      notes: editForm.notes,
    });
    setEditing(false);
    fetchDeal();
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this deal?')) return;
    await dealsApi.delete(id);
    navigate('/deals');
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Loading deal...</div>;
  if (!deal) return <div className="p-6 text-center text-gray-400">Deal not found</div>;

  const stageIndex = STAGES.findIndex(s => s.key === deal.stage);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <button onClick={() => navigate('/deals')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Pipeline
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{deal.name}</h1>
            {deal.contacts && (
              <button onClick={() => navigate(`/contacts/${deal.contacts?.id}`)} className="text-sm text-[#6C47FF] hover:underline mt-1 flex items-center gap-1">
                <User size={14} /> {[deal.contacts.first_name, deal.contacts.last_name].filter(Boolean).join(' ') || deal.contacts.email}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(!editing)} className="p-2 text-gray-400 hover:text-[#6C47FF]"><Edit3 size={16} /></button>
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="flex gap-6 mt-6">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Amount</div>
              <div className="text-lg font-bold text-gray-900">${Number(deal.amount || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Percent size={16} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Probability</div>
              <div className="text-lg font-bold text-gray-900">{deal.probability}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Expected Close</div>
              <div className="text-lg font-bold text-gray-900">{deal.expected_close_date || '—'}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs text-gray-500 mb-2">Pipeline Stage</div>
          <div className="flex gap-1">
            {STAGES.map((s, i) => (
              <button
                key={s.key}
                onClick={() => handleStageChange(s.key)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  i <= stageIndex
                    ? s.key === 'closed_won' ? 'bg-emerald-500 text-white'
                    : s.key === 'closed_lost' ? 'bg-red-500 text-white'
                    : 'bg-[#6C47FF] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Edit Deal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Deal Name</label>
              <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Amount</label>
              <input type="number" step="0.01" value={editForm.amount ?? ''} onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Probability (%)</label>
              <input type="number" min="0" max="100" value={editForm.probability ?? ''} onChange={e => setEditForm({ ...editForm, probability: parseInt(e.target.value) || 0 })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Expected Close Date</label>
              <input type="date" value={editForm.expected_close_date || ''} onChange={e => setEditForm({ ...editForm, expected_close_date: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Notes</label>
            <textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-[#6C47FF] text-white text-sm font-medium rounded-lg">Save Changes</button>
          </div>
        </div>
      )}

      {deal.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{deal.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">Activity Timeline</h3>
        <button onClick={() => setShowLogActivity(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[#6C47FF] text-white text-xs font-medium rounded-lg">
          <Plus size={12} /> Add Activity
        </button>
      </div>

      <div className="space-y-3">
        {(deal.activities || []).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No activities yet.</div>
        ) : (deal.activities || []).map((activity: CRMActivity) => {
          const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
          return (
            <div key={activity.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6C47FF]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-[#6C47FF]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{activity.subject || activity.activity_type}</div>
                {activity.description && <p className="text-sm text-gray-600 mt-1">{activity.description}</p>}
                <div className="text-xs text-gray-400 mt-1">{new Date(activity.created_at).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {showLogActivity && id && (
        <DealActivityModal dealId={id} onClose={() => setShowLogActivity(false)} onSave={() => { setShowLogActivity(false); fetchDeal(); }} />
      )}
    </div>
  );
}

function DealActivityModal({ dealId, onClose, onSave }: { dealId: string; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ activity_type: 'note' as ActivityType, subject: '', description: '' });
  const [saving, setSaving] = useState(false);
  const ACTIVITY_TYPES: ActivityType[] = ['email', 'call', 'meeting', 'note', 'task'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await activitiesApi.create({ ...form, deal_id: dealId });
      onSave();
    } catch { alert('Failed to log activity'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Log Activity</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value as ActivityType })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20">
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Log Activity'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
