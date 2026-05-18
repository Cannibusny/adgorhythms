import { useState, useEffect } from 'react';
import { List, Plus, Trash2, Edit2, Upload, Users } from 'lucide-react';
import { emailListsApi } from '../../lib/emailAnalyticsApi';
import type { EmailList } from '../../types/emailAnalytics';

export default function EmailListsPage() {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingList, setEditingList] = useState<EmailList | null>(null);
  const [showImport, setShowImport] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [importEmails, setImportEmails] = useState('');

  const loadLists = async () => {
    try {
      const res = await emailListsApi.list();
      setLists(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLists(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await emailListsApi.create(form);
      setForm({ name: '', description: '' });
      setShowCreate(false);
      loadLists();
    } catch {
      // ignore
    }
  };

  const handleUpdate = async () => {
    if (!editingList || !form.name) return;
    try {
      await emailListsApi.update(editingList.id, form);
      setForm({ name: '', description: '' });
      setEditingList(null);
      loadLists();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this list and all subscribers?')) return;
    try {
      await emailListsApi.delete(id);
      loadLists();
    } catch {
      // ignore
    }
  };

  const handleImport = async () => {
    if (!showImport || !importEmails.trim()) return;
    const emails = importEmails.split('\n').map((e) => e.trim()).filter(Boolean);
    try {
      await emailListsApi.import(showImport, emails);
      setImportEmails('');
      setShowImport(null);
      loadLists();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <List size={24} /> Email Lists
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your subscriber lists for email campaigns</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setForm({ name: '', description: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
        >
          <Plus size={16} /> Create List
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : lists.length === 0 ? (
        <div className="text-center py-16 bg-[#1E1E36] rounded-2xl border border-white/5">
          <Users size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Email Lists Yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create your first list to start collecting subscribers</p>
          <button
            onClick={() => { setShowCreate(true); setForm({ name: '', description: '' }); }}
            className="px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
          >
            Create List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div key={list.id} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{list.name}</h3>
                  {list.description && (
                    <p className="text-gray-400 text-sm mt-1">{list.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingList(list); setForm({ name: list.name, description: list.description || '' }); }}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Users size={14} />
                  <span>{list.subscriber_count} subscribers</span>
                </div>
                <button
                  onClick={() => setShowImport(list.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#00C896] bg-[#00C896]/10 hover:bg-[#00C896]/20 rounded-lg"
                >
                  <Upload size={12} /> Import
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Created {new Date(list.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || editingList) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingList ? 'Edit List' : 'Create Email List'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">List Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
                  placeholder="e.g. Newsletter Subscribers"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm h-20 resize-none"
                  placeholder="What is this list for?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingList ? handleUpdate : handleCreate}
                  className="flex-1 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
                >
                  {editingList ? 'Save Changes' : 'Create List'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setEditingList(null); }}
                  className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Import Subscribers</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Addresses (one per line)</label>
                <textarea
                  value={importEmails}
                  onChange={(e) => setImportEmails(e.target.value)}
                  className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm h-40 resize-none font-mono"
                  placeholder={"john@example.com\njane@example.com\n..."}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  className="flex-1 py-2 bg-[#00C896] text-white rounded-xl text-sm font-medium hover:bg-[#00b085]"
                >
                  Import
                </button>
                <button
                  onClick={() => { setShowImport(null); setImportEmails(''); }}
                  className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
