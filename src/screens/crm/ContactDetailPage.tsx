import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Building2, Globe, MapPin, Tag, Plus, X,
  Trash2, Edit3, Check, Calendar, MessageSquare, PhoneCall, FileText,
  CheckSquare, User,
} from 'lucide-react';
import { contactsApi, activitiesApi } from '../../lib/api';
import type { Contact, ActivityType } from '../../types/crm';

const LIFECYCLE_COLORS: Record<string, string> = {
  subscriber: 'bg-gray-100 text-gray-700',
  lead: 'bg-blue-100 text-blue-700',
  mql: 'bg-purple-100 text-purple-700',
  sql: 'bg-indigo-100 text-indigo-700',
  opportunity: 'bg-amber-100 text-amber-700',
  customer: 'bg-emerald-100 text-emerald-700',
  evangelist: 'bg-pink-100 text-pink-700',
};

const ACTIVITY_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  call: PhoneCall,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
};

const ACTIVITY_TYPES: ActivityType[] = ['email', 'call', 'meeting', 'note', 'task'];

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'deals' | 'notes'>('overview');
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [activityFilter, setActivityFilter] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    fetchContact();
  }, [id]);

  const fetchContact = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await contactsApi.get(id);
      setContact(data);
      setEditForm(data);
    } catch {
      navigate('/contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!id || !newTag.trim()) return;
    await contactsApi.addTag(id, newTag.trim());
    setNewTag('');
    setShowAddTag(false);
    fetchContact();
  };

  const handleRemoveTag = async (tag: string) => {
    if (!id) return;
    await contactsApi.removeTag(id, tag);
    fetchContact();
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    await contactsApi.update(id, editForm);
    setEditing(false);
    fetchContact();
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this contact permanently?')) return;
    await contactsApi.delete(id);
    navigate('/contacts');
  };

  const filteredActivities = (contact?.activities || []).filter(a =>
    !activityFilter || a.activity_type === activityFilter
  );

  if (loading) return <div className="p-6 text-center text-gray-400">Loading contact...</div>;
  if (!contact) return <div className="p-6 text-center text-gray-400">Contact not found</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <button onClick={() => navigate('/contacts')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={16} /> Back to Contacts
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6C47FF] to-[#4C2FBF] flex items-center justify-center text-white text-xl font-bold">
              {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail size={14} /> {contact.email}</span>
                {contact.phone && <span className="flex items-center gap-1"><Phone size={14} /> {contact.phone}</span>}
                {contact.company && <span className="flex items-center gap-1"><Building2 size={14} /> {contact.company}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${LIFECYCLE_COLORS[contact.lifecycle_stage] || ''}`}>
              {contact.lifecycle_stage.toUpperCase()}
            </span>
            <button onClick={() => setEditing(!editing)} className="p-2 text-gray-400 hover:text-[#6C47FF] transition-colors">
              <Edit3 size={16} />
            </button>
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-6 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#6C47FF]">{contact.lead_score}</div>
            <div className="text-xs text-gray-500">Lead Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{contact.tags?.length || 0}</div>
            <div className="text-xs text-gray-500">Tags</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{contact.deals?.length || 0}</div>
            <div className="text-xs text-gray-500">Deals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{contact.activities?.length || 0}</div>
            <div className="text-xs text-gray-500">Activities</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {(contact.tags || []).map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#6C47FF]/10 text-[#6C47FF] rounded-full text-xs font-medium">
              <Tag size={10} /> {tag}
              <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-500"><X size={10} /></button>
            </span>
          ))}
          {showAddTag ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                placeholder="Tag name"
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-24 focus:outline-none focus:ring-1 focus:ring-[#6C47FF]"
              />
              <button onClick={handleAddTag} className="p-1 text-[#6C47FF]"><Check size={12} /></button>
              <button onClick={() => setShowAddTag(false)} className="p-1 text-gray-400"><X size={12} /></button>
            </div>
          ) : (
            <button onClick={() => setShowAddTag(true)} className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-xs hover:border-[#6C47FF] hover:text-[#6C47FF] transition-colors">
              <Plus size={10} /> Add tag
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
        {(['overview', 'activity', 'deals', 'notes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-[#6C47FF] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contact Information</h3>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              {(['first_name', 'last_name', 'email', 'phone', 'company', 'job_title', 'website', 'lead_source'] as const).map(field => (
                <div key={field}>
                  <label className="text-xs font-medium text-gray-500">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                  <input
                    value={(editForm[field] as string) || ''}
                    onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20"
                  />
                </div>
              ))}
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#6C47FF] text-white text-sm font-medium rounded-lg">Save</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: User, label: 'Job Title', value: contact.job_title },
                { icon: Globe, label: 'Website', value: contact.website },
                { icon: MapPin, label: 'Location', value: [contact.address_city, contact.address_state].filter(Boolean).join(', ') },
                { icon: MessageSquare, label: 'Lead Source', value: contact.lead_source },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <item.icon size={16} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="text-sm font-medium text-gray-900">{item.value || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setActivityFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!activityFilter ? 'bg-[#6C47FF] text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
              {ACTIVITY_TYPES.map(type => (
                <button key={type} onClick={() => setActivityFilter(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${activityFilter === type ? 'bg-[#6C47FF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {type}s
                </button>
              ))}
            </div>
            <button onClick={() => setShowLogActivity(true)} className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white text-sm font-medium rounded-xl">
              <Plus size={14} /> Log Activity
            </button>
          </div>

          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                No activities yet. Log your first activity.
              </div>
            ) : filteredActivities.map(activity => {
              const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
              return (
                <div key={activity.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6C47FF]/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-[#6C47FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{activity.subject || activity.activity_type}</span>
                      {activity.completed && <Check size={12} className="text-emerald-500" />}
                    </div>
                    {activity.description && <p className="text-sm text-gray-600 mt-1">{activity.description}</p>}
                    <div className="text-xs text-gray-400 mt-1">{new Date(activity.created_at).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'deals' && (
        <div className="space-y-3">
          {(contact.deals || []).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No deals associated with this contact.
            </div>
          ) : (contact.deals || []).map(deal => (
            <div key={deal.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/deals/${deal.id}`)}>
              <div>
                <div className="text-sm font-medium text-gray-900">{deal.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{deal.stage} · {deal.probability}% probability</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">${Number(deal.amount || 0).toLocaleString()}</div>
                {deal.expected_close_date && <div className="text-xs text-gray-500">Close: {deal.expected_close_date}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-3">
          {(contact.activities || []).filter(a => a.activity_type === 'note').length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No notes yet.
            </div>
          ) : (contact.activities || []).filter(a => a.activity_type === 'note').map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-900">{note.subject}</div>
              <p className="text-sm text-gray-600 mt-1">{note.description}</p>
              <div className="text-xs text-gray-400 mt-2">{new Date(note.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {showLogActivity && id && (
        <LogActivityModal contactId={id} onClose={() => setShowLogActivity(false)} onSave={() => { setShowLogActivity(false); fetchContact(); }} />
      )}
    </div>
  );
}

function LogActivityModal({ contactId, onClose, onSave }: { contactId: string; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ activity_type: 'note' as ActivityType, subject: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await activitiesApi.create({ ...form, contact_id: contactId });
      onSave();
    } catch {
      alert('Failed to log activity');
    } finally {
      setSaving(false);
    }
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
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
