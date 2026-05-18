import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, Eye, Copy } from 'lucide-react';
import { emailTemplatesApi } from '../../lib/emailAnalyticsApi';
import type { EmailTemplate } from '../../types/emailAnalytics';

const CATEGORY_COLORS: Record<string, string> = {
  welcome: '#10B981',
  promotional: '#F59E0B',
  newsletter: '#1DA1F2',
  transactional: '#8B5CF6',
  announcement: '#EF4444',
  default: '#6B7280',
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({
    name: '',
    subject_template: '',
    html_template: '',
    category: '',
  });

  const loadTemplates = async () => {
    try {
      const res = await emailTemplatesApi.list();
      setTemplates(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await emailTemplatesApi.create(form);
      setForm({ name: '', subject_template: '', html_template: '', category: '' });
      setShowCreate(false);
      loadTemplates();
    } catch {
      // ignore
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !form.name) return;
    try {
      await emailTemplatesApi.update(editingTemplate.id, form);
      setForm({ name: '', subject_template: '', html_template: '', category: '' });
      setEditingTemplate(null);
      loadTemplates();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await emailTemplatesApi.delete(id);
      loadTemplates();
    } catch {
      // ignore
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      await emailTemplatesApi.create({
        name: `${template.name} (Copy)`,
        subject_template: template.subject_template,
        html_template: template.html_template,
        category: template.category,
      });
      loadTemplates();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={24} /> Email Templates
          </h1>
          <p className="text-gray-400 text-sm mt-1">Reusable email templates for your campaigns</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setForm({ name: '', subject_template: '', html_template: '', category: '' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
        >
          <Plus size={16} /> Create Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-[#1E1E36] rounded-2xl border border-white/5">
          <FileText size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Email Templates</h3>
          <p className="text-gray-400 text-sm mb-4">Create templates to speed up your email campaigns</p>
          <button
            onClick={() => {
              setShowCreate(true);
              setForm({ name: '', subject_template: '', html_template: '', category: '' });
            }}
            className="px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{t.name}</h3>
                  {t.subject_template && (
                    <p className="text-gray-400 text-sm mt-1 truncate max-w-[200px]">
                      Subject: {t.subject_template}
                    </p>
                  )}
                </div>
                {t.category && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.default}20`,
                      color: CATEGORY_COLORS[t.category] || CATEGORY_COLORS.default,
                    }}
                  >
                    {t.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-4">
                <button
                  onClick={() => setPreviewTemplate(t)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  title="Preview"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditingTemplate(t);
                    setForm({
                      name: t.name,
                      subject_template: t.subject_template || '',
                      html_template: t.html_template || '',
                      category: t.category || '',
                    });
                  }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDuplicate(t)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Created {new Date(t.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || editingTemplate) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingTemplate ? 'Edit Template' : 'Create Email Template'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Template Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
                  placeholder="e.g. Welcome Email"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subject Line Template</label>
                <input
                  type="text"
                  value={form.subject_template}
                  onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
                  placeholder="e.g. Welcome to {{company_name}}"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
                >
                  <option value="">Select category</option>
                  <option value="welcome">Welcome</option>
                  <option value="promotional">Promotional</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="transactional">Transactional</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">HTML Content</label>
                <textarea
                  value={form.html_template}
                  onChange={(e) => setForm({ ...form, html_template: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm h-48 resize-none font-mono"
                  placeholder="<html>..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingTemplate ? handleUpdate : handleCreate}
                  className="flex-1 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setEditingTemplate(null); }}
                  className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{previewTemplate.name}</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
            {previewTemplate.subject_template && (
              <div className="mb-3">
                <span className="text-xs text-gray-500">Subject:</span>
                <p className="text-white text-sm">{previewTemplate.subject_template}</p>
              </div>
            )}
            <div className="bg-white rounded-xl p-4 min-h-[200px]">
              {previewTemplate.html_template ? (
                <div
                  className="text-gray-800 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.html_template }}
                />
              ) : (
                <p className="text-gray-400 text-sm italic">No HTML content</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
