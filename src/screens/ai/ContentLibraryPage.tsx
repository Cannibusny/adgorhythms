import { useState, useEffect } from 'react';
import { Grid, List, Search, Check, Archive, Trash2, Download, Eye, Pencil, X } from 'lucide-react';
import type { ContentLibraryItem, ContentType, ContentStatus } from '../../types/ai';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '../../types/ai';
import { contentLibraryApi } from '../../lib/aiApi';

const statusColors: Record<ContentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-yellow-100 text-yellow-700',
};

const contentTypes: ContentType[] = ['social_post', 'email', 'blog', 'landing_page', 'ad_copy', 'video_script'];
const statuses: ContentStatus[] = ['draft', 'approved', 'published', 'archived'];

export default function ContentLibraryPage() {
  const [items, setItems] = useState<ContentLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<ContentLibraryItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [detailItem, setDetailItem] = useState<ContentLibraryItem | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.content_type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (filterPlatform) params.platform = filterPlatform;
      const res = await contentLibraryApi.list(params);
      let filtered = res.data;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((i) =>
          (i.title || '').toLowerCase().includes(q) || i.content.toLowerCase().includes(q)
        );
      }
      setItems(filtered);
      setTotal(res.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [filterType, filterStatus, filterPlatform]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    await contentLibraryApi.bulkApprove([...selected]);
    setSelected(new Set());
    loadItems();
  };

  const handleBulkArchive = async () => {
    if (selected.size === 0) return;
    await contentLibraryApi.bulkArchive([...selected]);
    setSelected(new Set());
    loadItems();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    await contentLibraryApi.bulkDelete([...selected]);
    setSelected(new Set());
    loadItems();
  };

  const handleApprove = async (id: string) => {
    await contentLibraryApi.approve(id);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    await contentLibraryApi.delete(id);
    loadItems();
  };

  const openEdit = (item: ContentLibraryItem) => {
    setEditItem(item);
    setEditContent(item.content);
    setEditTitle(item.title || '');
  };

  const saveEdit = async () => {
    if (!editItem) return;
    await contentLibraryApi.update(editItem.id, { title: editTitle, content: editContent });
    setEditItem(null);
    loadItems();
  };

  const preview = (text: string, maxLen = 100) =>
    text.length > maxLen ? text.substring(0, maxLen) + '...' : text;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-500 text-sm mt-1">{total} items total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Grid size={18} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><List size={18} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadItems()}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            placeholder="Search content..."
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          {contentTypes.map((t) => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Platforms</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitter">Twitter</option>
          <option value="google">Google</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-700">{selected.size} selected</span>
          <button onClick={handleBulkApprove} className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800"><Check size={14} /> Approve</button>
          <button onClick={handleBulkArchive} className="flex items-center gap-1 text-sm text-yellow-700 hover:text-yellow-800"><Archive size={14} /> Archive</button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 text-sm text-red-700 hover:text-red-800"><Trash2 size={14} /> Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No content found. Generate some content first!</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${selected.has(item.id) ? 'ring-2 ring-blue-400' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" />
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CONTENT_TYPE_COLORS[item.content_type] }}>
                    {CONTENT_TYPE_LABELS[item.content_type]}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                  {item.status}
                </span>
              </div>
              {item.title && <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{item.title}</h3>}
              <p className="text-xs text-gray-600 mb-3 line-clamp-3">{preview(item.content, 150)}</p>
              {item.platform && <span className="text-xs text-gray-400 capitalize">{item.platform}</span>}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                <button onClick={() => setDetailItem(item)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Eye size={14} /></button>
                <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil size={14} /></button>
                <button onClick={() => handleApprove(item.id)} className="p-1.5 text-gray-400 hover:text-green-600 rounded"><Check size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 w-8"><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Title / Preview</th>
                <th className="text-left p-3">Platform</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" /></td>
                  <td className="p-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CONTENT_TYPE_COLORS[item.content_type] }}>
                      {CONTENT_TYPE_LABELS[item.content_type]}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate">{item.title || preview(item.content, 60)}</td>
                  <td className="p-3 capitalize text-gray-500">{item.platform || '-'}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>{item.status}</span></td>
                  <td className="p-3 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailItem(item)} className="p-1 text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
                      <button onClick={() => openEdit(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                      <button onClick={() => handleApprove(item.id)} className="p-1 text-gray-400 hover:text-green-600"><Check size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CONTENT_TYPE_COLORS[detailItem.content_type] }}>
                  {CONTENT_TYPE_LABELS[detailItem.content_type]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[detailItem.status]}`}>{detailItem.status}</span>
              </div>
              <button onClick={() => setDetailItem(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {detailItem.title && <h2 className="text-lg font-bold text-gray-900 mb-3">{detailItem.title}</h2>}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 whitespace-pre-wrap text-sm text-gray-700">{detailItem.content}</div>
            {detailItem.hashtags && detailItem.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {detailItem.hashtags.map((h) => <span key={h} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">#{h}</span>)}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { openEdit(detailItem); setDetailItem(null); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
              <button onClick={() => { handleApprove(detailItem.id); setDetailItem(null); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
              <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1"><Download size={14} /> Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Content</h2>
              <button onClick={() => setEditItem(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={12} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditItem(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={saveEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
