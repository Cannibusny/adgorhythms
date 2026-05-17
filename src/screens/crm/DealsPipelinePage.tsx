import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, DollarSign, TrendingUp, BarChart3, List, LayoutGrid,
  GripVertical, Search,
} from 'lucide-react';
import { dealsApi } from '../../lib/api';
import type { Deal, DealStage } from '../../types/crm';

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'prospecting', label: 'Prospecting', color: 'border-blue-400' },
  { key: 'qualification', label: 'Qualification', color: 'border-purple-400' },
  { key: 'proposal', label: 'Proposal', color: 'border-amber-400' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-orange-400' },
  { key: 'closed_won', label: 'Closed Won', color: 'border-emerald-400' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'border-red-400' },
];

export default function DealsPipelinePage() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await dealsApi.list(params);
      setDeals(res.data);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchDeals, 300);
    return () => clearTimeout(timer);
  }, [fetchDeals]);

  const totalPipeline = deals.filter(d => d.stage !== 'closed_lost').reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const weightedPipeline = deals.filter(d => d.stage !== 'closed_lost').reduce((s, d) => s + (Number(d.amount) || 0) * ((d.probability || 0) / 100), 0);

  const handleDragStart = (dealId: string) => setDraggedDeal(dealId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (stage: DealStage) => {
    if (!draggedDeal) return;
    const deal = deals.find(d => d.id === draggedDeal);
    if (!deal || deal.stage === stage) { setDraggedDeal(null); return; }
    setDeals(prev => prev.map(d => d.id === draggedDeal ? { ...d, stage } : d));
    setDraggedDeal(null);
    await dealsApi.updateStage(draggedDeal, stage);
    fetchDeals();
  };

  const stageCounts = STAGES.map(s => ({
    ...s,
    deals: deals.filter(d => d.stage === s.key),
    total: deals.filter(d => d.stage === s.key).reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">{deals.length} deals in pipeline</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C47FF] to-[#4C2FBF] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#6C47FF]/25 hover:shadow-xl transition-all">
          <Plus size={16} /> Add Deal
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
            <DollarSign size={20} className="text-[#6C47FF]" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Pipeline</div>
            <div className="text-lg font-bold text-gray-900">${totalPipeline.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Weighted Pipeline</div>
            <div className="text-lg font-bold text-gray-900">${weightedPipeline.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <BarChart3 size={20} className="text-amber-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Deals by Stage</div>
            <div className="flex gap-1 mt-1">
              {STAGES.slice(0, 4).map(s => (
                <div key={s.key} className="text-center">
                  <div className="text-xs font-bold text-gray-900">{deals.filter(d => d.stage === s.key).length}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search deals..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]" />
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-0.5">
          <button onClick={() => setView('kanban')} className={`p-2 rounded-lg ${view === 'kanban' ? 'bg-[#6C47FF] text-white' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setView('table')} className={`p-2 rounded-lg ${view === 'table' ? 'bg-[#6C47FF] text-white' : 'text-gray-400'}`}><List size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading deals...</div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stageCounts.map(stage => (
            <div
              key={stage.key}
              className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl border-t-2 ${stage.color}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
            >
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">{stage.label}</div>
                  <div className="text-xs text-gray-500">{stage.deals.length} deals · ${stage.total.toLocaleString()}</div>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {stage.deals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-gray-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{deal.name}</div>
                        {deal.contacts && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {[deal.contacts.first_name, deal.contacts.last_name].filter(Boolean).join(' ')} · {deal.contacts.company || deal.contacts.email}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-[#6C47FF]">${Number(deal.amount || 0).toLocaleString()}</span>
                          <span className="text-xs text-gray-400">{deal.probability}%</span>
                        </div>
                        {deal.expected_close_date && (
                          <div className="text-xs text-gray-400 mt-1">Close: {deal.expected_close_date}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Deal Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Probability</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map(deal => (
                <tr key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{deal.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {deal.contacts ? [deal.contacts.first_name, deal.contacts.last_name].filter(Boolean).join(' ') || deal.contacts.email : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">${Number(deal.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{deal.stage.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{deal.probability}%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{deal.expected_close_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && <AddDealModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); fetchDeals(); }} />}
    </div>
  );
}

function AddDealModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: '', amount: '', stage: 'prospecting' as DealStage, probability: '50', expected_close_date: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dealsApi.create({
        name: form.name,
        amount: parseFloat(form.amount) || 0,
        stage: form.stage,
        probability: parseInt(form.probability) || 50,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes,
      });
      onSave();
    } catch {
      alert('Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Add Deal</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Deal Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount ($)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Probability (%)</label>
              <input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Stage</label>
              <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as DealStage })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20">
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Expected Close Date</label>
              <input type="date" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
