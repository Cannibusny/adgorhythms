import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Upload, Download, X, Filter, ChevronUp, ChevronDown,
  Tag, Trash2, Mail, Users,
} from 'lucide-react';
import { contactsApi } from '../../lib/api';
import type { Contact, LifecycleStage } from '../../types/crm';

const LIFECYCLE_STAGES: LifecycleStage[] = ['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist'];
const LIFECYCLE_COLORS: Record<string, string> = {
  subscriber: 'bg-gray-100 text-gray-700',
  lead: 'bg-blue-100 text-blue-700',
  mql: 'bg-purple-100 text-purple-700',
  sql: 'bg-indigo-100 text-indigo-700',
  opportunity: 'bg-amber-100 text-amber-700',
  customer: 'bg-emerald-100 text-emerald-700',
  evangelist: 'bg-pink-100 text-pink-700',
};

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort_by: sortBy, sort_order: sortOrder };
      if (search) params.search = search;
      if (stageFilter) params.lifecycle_stage = stageFilter;
      const res = await contactsApi.list(params);
      setContacts(res.data);
      setTotal(res.total);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === contacts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(contacts.map(c => c.id)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    await contactsApi.delete(id);
    fetchContacts();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} contacts?`)) return;
    await Promise.all(Array.from(selectedIds).map(id => contactsApi.delete(id)));
    setSelectedIds(new Set());
    fetchContacts();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await contactsApi.importCsv(file);
    fetchContacts();
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total contacts</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={16} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <a
            href={contactsApi.exportCsv()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} /> Export
          </a>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C47FF] to-[#4C2FBF] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#6C47FF]/25 hover:shadow-xl transition-all"
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, email, or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${showFilters ? 'bg-[#6C47FF] text-white border-[#6C47FF]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Lifecycle Stage</label>
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20"
            >
              <option value="">All Stages</option>
              {LIFECYCLE_STAGES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setStageFilter(''); setSearch(''); }}
            className="self-end px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="bg-[#6C47FF]/5 rounded-xl p-3 flex items-center gap-4">
          <span className="text-sm font-medium text-[#6C47FF]">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-500 hover:text-gray-700">
            Clear selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={selectedIds.size === contacts.length && contacts.length > 0} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('email')}>
                <span className="flex items-center gap-1">Email <SortIcon field="email" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('first_name')}>
                <span className="flex items-center gap-1">Name <SortIcon field="first_name" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('lead_score')}>
                <span className="flex items-center gap-1">Score <SortIcon field="lead_score" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Loading contacts...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                <Users size={40} className="mx-auto mb-2 text-gray-300" />
                No contacts found. Add your first contact to get started.
              </td></tr>
            ) : contacts.map(contact => (
              <tr
                key={contact.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/contacts/${contact.id}`)}
              >
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(contact.id)} onChange={() => toggleSelect(contact.id)} className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{contact.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{contact.company || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LIFECYCLE_COLORS[contact.lifecycle_stage] || 'bg-gray-100 text-gray-700'}`}>
                    {contact.lifecycle_stage.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6C47FF] rounded-full" style={{ width: `${contact.lead_score}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{contact.lead_score}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {(contact.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#6C47FF]/10 text-[#6C47FF] rounded-full text-xs">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                    {(contact.tags || []).length > 3 && (
                      <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDelete(contact.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); fetchContacts(); }} />}
    </div>
  );
}

function AddContactModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '', company: '', job_title: '', lead_source: '', lifecycle_stage: 'lead' as LifecycleStage });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await contactsApi.create(form);
      onSave();
    } catch {
      alert('Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Add Contact</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">First Name</label>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Company</label>
              <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Job Title</label>
              <input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Lead Source</label>
              <input value={form.lead_source} onChange={e => setForm({ ...form, lead_source: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Lifecycle Stage</label>
            <select value={form.lifecycle_stage} onChange={e => setForm({ ...form, lifecycle_stage: e.target.value as LifecycleStage })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20">
              {LIFECYCLE_STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg hover:bg-[#5835E0] disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
