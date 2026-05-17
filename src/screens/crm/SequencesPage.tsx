import { useState, useEffect } from 'react';
import {
  Plus, X, Mail, Clock, Users, BarChart3, Play, Pause, Trash2,
  ChevronRight, ArrowRight,
} from 'lucide-react';
import { sequencesApi } from '../../lib/api';
import type { EmailSequence } from '../../types/crm';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-700',
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSeq, setSelectedSeq] = useState<EmailSequence | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchSequences(); }, []);

  const fetchSequences = async () => {
    setLoading(true);
    try {
      const res = await sequencesApi.list();
      setSequences(res.data);
    } catch { setSequences([]); }
    finally { setLoading(false); }
  };

  const fetchSequenceDetail = async (id: string) => {
    try {
      const data = await sequencesApi.get(id);
      setSelectedSeq(data);
      setSelectedId(id);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sequence?')) return;
    await sequencesApi.delete(id);
    if (selectedId === id) { setSelectedId(null); setSelectedSeq(null); }
    fetchSequences();
  };

  const handleToggle = async (id: string) => {
    const seq = sequences.find(s => s.id === id);
    if (!seq) return;
    const newStatus = seq.status === 'active' ? 'paused' : 'active';
    await sequencesApi.update(id, { status: newStatus });
    fetchSequences();
    if (selectedId === id) fetchSequenceDetail(id);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Sequences</h1>
          <p className="text-sm text-gray-500 mt-1">Automated drip campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C47FF] to-[#4C2FBF] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#6C47FF]/25">
          <Plus size={16} /> Create Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : sequences.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <Mail size={40} className="mx-auto mb-2 text-gray-300" />
              No sequences yet.
            </div>
          ) : sequences.map(seq => (
            <div
              key={seq.id}
              onClick={() => fetchSequenceDetail(seq.id)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${selectedId === seq.id ? 'border-[#6C47FF] ring-2 ring-[#6C47FF]/20' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{seq.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[seq.status]}`}>{seq.status}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Mail size={12} /> {seq.step_count || 0} steps</span>
                <span className="flex items-center gap-1"><Users size={12} /> {seq.enrolled_count || 0} enrolled</span>
                <span className="flex items-center gap-1"><BarChart3 size={12} /> {seq.completion_rate || 0}%</span>
              </div>
              <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleToggle(seq.id)} className="p-1.5 text-gray-400 hover:text-[#6C47FF]">
                  {seq.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={() => handleDelete(seq.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedSeq ? (
            <SequenceDetail sequence={selectedSeq} onRefresh={() => fetchSequenceDetail(selectedSeq.id)} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <ChevronRight size={40} className="mx-auto mb-2 text-gray-300" />
              Select a sequence to view details
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateSequenceModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); fetchSequences(); }} />
      )}
    </div>
  );
}

function SequenceDetail({ sequence, onRefresh }: { sequence: EmailSequence; onRefresh: () => void }) {
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepForm, setStepForm] = useState({ step_number: (sequence.steps?.length || 0) + 1, delay_days: 1, subject: '', html_content: '', plain_text_content: '' });

  const handleAddStep = async () => {
    try {
      await sequencesApi.addStep(sequence.id, stepForm);
      setShowAddStep(false);
      setStepForm({ step_number: (sequence.steps?.length || 0) + 2, delay_days: 1, subject: '', html_content: '', plain_text_content: '' });
      onRefresh();
    } catch { alert('Failed to add step'); }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this step?')) return;
    await sequencesApi.deleteStep(sequence.id, stepId);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{sequence.name}</h2>
            {sequence.description && <p className="text-sm text-gray-500 mt-0.5">{sequence.description}</p>}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[sequence.status]}`}>{sequence.status}</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{sequence.steps?.length || 0}</div>
            <div className="text-xs text-gray-500">Steps</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{sequence.enrollments?.length || 0}</div>
            <div className="text-xs text-gray-500">Enrolled</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {sequence.enrollments ? Math.round((sequence.enrollments.filter(e => e.status === 'completed').length / (sequence.enrollments.length || 1)) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500">Completion</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Sequence Steps</h3>
          <button onClick={() => setShowAddStep(true)} className="flex items-center gap-1 px-3 py-1.5 bg-[#6C47FF] text-white text-xs font-medium rounded-lg">
            <Plus size={12} /> Add Step
          </button>
        </div>

        <div className="space-y-3">
          {(sequence.steps || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No steps added yet.</p>
          ) : (sequence.steps || []).map((step, i) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#6C47FF] text-white flex items-center justify-center text-sm font-bold">{step.step_number}</div>
                {i < (sequence.steps?.length || 0) - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">{step.subject}</div>
                  <button onClick={() => handleDeleteStep(step.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <Clock size={12} /> {step.delay_days === 0 ? 'Send immediately' : `Wait ${step.delay_days} day${step.delay_days > 1 ? 's' : ''}`}
                  <ArrowRight size={12} />
                  <Mail size={12} /> Send email
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddStep && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Step Number</label>
                <input type="number" min="1" value={stepForm.step_number} onChange={e => setStepForm({ ...stepForm, step_number: parseInt(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Delay (days)</label>
                <input type="number" min="0" value={stepForm.delay_days} onChange={e => setStepForm({ ...stepForm, delay_days: parseInt(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Subject *</label>
              <input value={stepForm.subject} onChange={e => setStepForm({ ...stepForm, subject: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Welcome to ADgorhythms!" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Email Content</label>
              <textarea value={stepForm.html_content || ''} onChange={e => setStepForm({ ...stepForm, html_content: e.target.value })} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="<p>Hello {{first_name}}...</p>" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddStep(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleAddStep} className="px-4 py-1.5 bg-[#6C47FF] text-white text-sm font-medium rounded-lg">Add Step</button>
            </div>
          </div>
        )}
      </div>

      {(sequence.enrollments || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Enrolled Contacts</h3>
          <div className="space-y-2">
            {(sequence.enrollments || []).map(enrollment => (
              <div key={enrollment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {enrollment.contacts ? [enrollment.contacts.first_name, enrollment.contacts.last_name].filter(Boolean).join(' ') || enrollment.contacts.email : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Step {enrollment.current_step}</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-medium ${enrollment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {enrollment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSequenceModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await sequencesApi.create(form);
      onSave();
    } catch { alert('Failed to create sequence'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Create Sequence</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Sequence Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="Welcome Series" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20" placeholder="Onboarding email sequence for new contacts..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#6C47FF] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Sequence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
