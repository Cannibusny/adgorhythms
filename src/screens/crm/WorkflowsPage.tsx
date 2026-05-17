import { useState, useEffect } from 'react';
import {
  Plus, X, Zap, Play, Pause, Trash2, ChevronRight,
  Tag, UserPlus, Mail, CheckSquare, ArrowRight, Settings,
} from 'lucide-react';
import { workflowsApi } from '../../lib/api';
import type { Workflow, WorkflowAction, WorkflowTrigger, WorkflowExecution } from '../../types/crm';

const TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  contact_created: 'Contact Created',
  contact_updated: 'Contact Updated',
  deal_stage_changed: 'Deal Stage Changed',
  email_opened: 'Email Opened',
  email_clicked: 'Email Clicked',
  form_submitted: 'Form Submitted',
};

const ACTION_ICONS: Record<string, typeof Tag> = {
  add_tag: Tag,
  update_field: Settings,
  enroll_in_sequence: Mail,
  create_activity: CheckSquare,
  update_lifecycle: UserPlus,
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);

  useEffect(() => { fetchWorkflows(); }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await workflowsApi.list();
      setWorkflows(res.data);
    } catch { setWorkflows([]); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id: string) => {
    await workflowsApi.toggle(id);
    fetchWorkflows();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    await workflowsApi.delete(id);
    if (selectedId === id) setSelectedId(null);
    fetchWorkflows();
  };

  const viewExecutions = async (id: string) => {
    setSelectedId(id);
    try {
      const res = await workflowsApi.executions(id);
      setExecutions(res.data);
    } catch { setExecutions([]); }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-500 mt-1">Automate your marketing with if-then rules</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C47FF] to-[#4C2FBF] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#6C47FF]/25">
          <Plus size={16} /> Create Workflow
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Workflow</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trigger</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Executions</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading workflows...</td></tr>
            ) : workflows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                <Zap size={40} className="mx-auto mb-2 text-gray-300" />
                No workflows yet. Create your first automation.
              </td></tr>
            ) : workflows.map(wf => (
              <tr key={wf.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{wf.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Zap size={14} className="text-amber-500" />
                    {TRIGGER_LABELS[wf.trigger_type] || wf.trigger_type}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {(wf.actions || []).slice(0, 3).map((action, i) => {
                      const Icon = ACTION_ICONS[action.type] || Settings;
                      return <div key={i} className="w-6 h-6 rounded-full bg-[#6C47FF]/10 flex items-center justify-center" title={action.type}>
                        <Icon size={12} className="text-[#6C47FF]" />
                      </div>;
                    })}
                    {(wf.actions || []).length > 3 && <span className="text-xs text-gray-400 self-center">+{(wf.actions || []).length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${wf.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                    {wf.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => viewExecutions(wf.id)} className="text-sm text-[#6C47FF] hover:underline flex items-center gap-1">
                    {wf.execution_count || 0} runs <ChevronRight size={12} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleToggle(wf.id)} className="p-1.5 text-gray-400 hover:text-[#6C47FF]" title={wf.status === 'active' ? 'Pause' : 'Activate'}>
                      {wf.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => handleDelete(wf.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Execution History</h3>
            <button onClick={() => setSelectedId(null)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
          {executions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No executions yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Contact</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Date</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {executions.map(exec => (
                  <tr key={exec.id}>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {exec.contacts ? [exec.contacts.first_name, exec.contacts.last_name].filter(Boolean).join(' ') || exec.contacts.email : '—'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">{new Date(exec.executed_at).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exec.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : exec.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {exec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && (
        <CreateWorkflowModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); fetchWorkflows(); }} />
      )}
    </div>
  );
}

function CreateWorkflowModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: '',
    trigger_type: 'contact_created' as WorkflowTrigger,
    actions: [] as WorkflowAction[],
  });
  const [saving, setSaving] = useState(false);

  const addAction = (type: WorkflowAction['type']) => {
    const newAction: WorkflowAction = { type };
    if (type === 'add_tag') newAction.tag = '';
    if (type === 'update_lifecycle') newAction.lifecycle_stage = 'mql';
    if (type === 'create_activity') { newAction.activity_type = 'task'; newAction.subject = ''; newAction.due_days = 2; }
    setForm({ ...form, actions: [...form.actions, newAction] });
  };

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const actions = [...form.actions];
    actions[index] = { ...actions[index], ...updates };
    setForm({ ...form, actions });
  };

  const removeAction = (index: number) => {
    setForm({ ...form, actions: form.actions.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await workflowsApi.create({
        name: form.name,
        trigger_type: form.trigger_type,
        actions: form.actions,
        trigger_config: { conditions: [] },
      });
      onSave();
    } catch { alert('Failed to create workflow'); }
    finally { setSaving(false); }
  };

  const TRIGGERS = Object.entries(TRIGGER_LABELS) as [WorkflowTrigger, string][];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl my-8 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Create Workflow</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Workflow Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="New Contact Welcome Flow" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">When this happens (Trigger)</label>
            <select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value as WorkflowTrigger })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20">
              {TRIGGERS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Then do this (Actions)</label>
            </div>

            <div className="space-y-2 mb-3">
              {form.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <ArrowRight size={14} className="text-[#6C47FF] mt-1 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase">{action.type.replace(/_/g, ' ')}</span>
                      <button type="button" onClick={() => removeAction(i)} className="p-0.5 text-gray-400 hover:text-red-500"><X size={12} /></button>
                    </div>
                    {action.type === 'add_tag' && (
                      <input value={action.tag || ''} onChange={e => updateAction(i, { tag: e.target.value })} placeholder="Tag name" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" />
                    )}
                    {action.type === 'update_lifecycle' && (
                      <select value={action.lifecycle_stage || ''} onChange={e => updateAction(i, { lifecycle_stage: e.target.value as WorkflowAction['lifecycle_stage'] })} className="w-full px-2 py-1 border border-gray-200 rounded text-sm">
                        {['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                    {action.type === 'create_activity' && (
                      <div className="space-y-1">
                        <input value={action.subject || ''} onChange={e => updateAction(i, { subject: e.target.value })} placeholder="Task subject" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" />
                        <input type="number" value={action.due_days || 2} onChange={e => updateAction(i, { due_days: parseInt(e.target.value) })} className="w-24 px-2 py-1 border border-gray-200 rounded text-sm" /> <span className="text-xs text-gray-500">days</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(['add_tag', 'update_lifecycle', 'enroll_in_sequence', 'create_activity'] as const).map(type => (
                <button key={type} type="button" onClick={() => addAction(type)} className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs hover:border-[#6C47FF] hover:text-[#6C47FF] transition-colors">
                  <Plus size={10} /> {type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !form.name} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
