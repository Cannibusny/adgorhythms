import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Sparkles, X } from 'lucide-react';
import type { ContentTemplate } from '../../types/ai';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '../../types/ai';
import type { ContentType } from '../../types/ai';
import { contentTemplatesApi } from '../../lib/aiApi';

const contentTypes: ContentType[] = ['social_post', 'email', 'blog', 'landing_page', 'ad_copy', 'video_script'];

export default function ContentTemplatesPage() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ContentTemplate | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ContentType>('social_post');
  const [formDescription, setFormDescription] = useState('');
  const [formSections, setFormSections] = useState('');
  const [formFormat, setFormFormat] = useState('');

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await contentTemplatesApi.list();
      setTemplates(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const resetForm = () => {
    setFormName('');
    setFormType('social_post');
    setFormDescription('');
    setFormSections('');
    setFormFormat('');
    setEditTemplate(null);
  };

  const openCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEdit = (t: ContentTemplate) => {
    setEditTemplate(t);
    setFormName(t.template_name);
    setFormType(t.content_type as ContentType);
    const structure = t.template_structure as Record<string, unknown> | null;
    setFormDescription((structure?.description as string) || '');
    setFormSections(Array.isArray(structure?.sections) ? (structure.sections as string[]).join(', ') : '');
    setFormFormat((structure?.format as string) || '');
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    const payload = {
      template_name: formName,
      content_type: formType,
      template_structure: {
        description: formDescription,
        sections: formSections.split(',').map((s) => s.trim()).filter(Boolean),
        format: formFormat,
      },
    };

    if (editTemplate && !editTemplate.id.startsWith('default-')) {
      await contentTemplatesApi.update(editTemplate.id, payload);
    } else {
      await contentTemplatesApi.create(payload);
    }

    setShowCreateModal(false);
    resetForm();
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('default-')) return;
    await contentTemplatesApi.delete(id);
    loadTemplates();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Reusable templates for content generation</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus size={16} /> Create Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No templates found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const structure = t.template_structure as Record<string, unknown> | null;
            const sections = Array.isArray(structure?.sections) ? (structure.sections as string[]) : [];
            return (
              <div key={t.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CONTENT_TYPE_COLORS[t.content_type as ContentType] || '#6B7280' }}>
                    {CONTENT_TYPE_LABELS[t.content_type as ContentType] || t.content_type}
                  </span>
                  {t.is_default && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Default</span>}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t.template_name}</h3>
                {structure?.description && (
                  <p className="text-xs text-gray-500 mb-3">{structure.description as string}</p>
                )}
                {sections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sections.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
                {structure?.format && (
                  <p className="text-xs text-gray-400 mb-3">Format: {structure.format as string}</p>
                )}
                <div className="flex items-center gap-1 pt-3 border-t">
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">
                    <Sparkles size={12} /> Generate
                  </button>
                  {!t.is_default && (
                    <>
                      <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editTemplate ? 'Edit Template' : 'Create Template'}</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Product Launch Social Series" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value as ContentType)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {contentTypes.map((ct) => <option key={ct} value={ct}>{CONTENT_TYPE_LABELS[ct]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="What this template generates..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sections (comma-separated)</label>
                <input value={formSections} onChange={(e) => setFormSections(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Hook, Body, CTA, Hashtags" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <input value={formFormat} onChange={(e) => setFormFormat(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., [Hook] [Body] [CTA] [Hashtags]" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
