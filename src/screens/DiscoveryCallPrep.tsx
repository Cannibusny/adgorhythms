import { useState, useEffect } from 'react';
import {
  Phone, Calendar, Copy, Sparkles, Loader2, AlertCircle,
  Plus, X, Clock,
} from 'lucide-react';
import { storage, generateId } from '../lib/storage';
import { claudeGenerate } from '../lib/claude';
import { useToast } from '../hooks/useToast';
import type { Client, Call, CallOutcome, PackageTier } from '../types';

const CALENDLY_URL = 'https://calendly.com/mrsjw136/free-discovery-call-adgorhythms-meeting';

const OUTCOMES: CallOutcome[] = ['Interested', 'Not now', 'Closed', 'No show'];
const PACKAGES: PackageTier[] = ['starter', 'growth', 'scale', 'enterprise'];

const CALL_SCRIPT = [
  { time: '0-2 min', label: 'Opening', desc: 'Build rapport. Ask how business is going. Compliment something specific about their business.', color: 'bg-blue-50 border-blue-200' },
  { time: '2-10 min', label: 'Discovery', desc: 'Understand their pain. Ask what marketing they\'re doing now. What\'s working? What\'s not? What would change their business?', color: 'bg-amber-50 border-amber-200' },
  { time: '10-13 min', label: 'Solution', desc: 'Show how ADgorhythms solves their specific pain. Connect their answers to your offer. No jargon.', color: 'bg-emerald-50 border-emerald-200' },
  { time: '13-15 min', label: 'Proposal', desc: 'Recommend a specific package. Give them one option with a clear price. Don\'t overwhelm.', color: 'bg-[#6C47FF]/5 border-[#6C47FF]/20' },
  { time: '15-17 min', label: 'Close', desc: 'Ask: "Does this feel like the right next step for you?" Book follow-up or get verbal yes right now.', color: 'bg-[#FF6B35]/5 border-[#FF6B35]/20' },
];

async function generateCallPrep(client: Client): Promise<string> {
  const prompt = `You are preparing Sheridan Williams for a discovery call with a potential ADgorhythms client.

Sheridan is a 65-year-old Black entrepreneur running an AI marketing agency in Hudson Valley NY. He is warm, direct, experienced, and authentic. He does not use tech jargon. He speaks plainly.

Prospect: ${client.ownerName}
Business: ${client.businessName}
Type: ${client.businessType}
Website: ${client.website || 'None found'}
Pain points noted: ${client.painPoints || 'Not yet known'}
Estimated budget: $${client.budget}/month

Generate a discovery call prep brief including:
1. 3 opening questions to build rapport
2. 5 key discovery questions about their marketing challenges
3. 2-3 likely objections and how to handle them
4. The best package to recommend based on their profile and why
5. The exact closing ask to end the call
6. One thing that makes ADgorhythms perfect for this specific business

Keep it conversational. Sheridan reads this right before the call. Make it scannable. Use clear section headers. Write in plain English, no bullet symbols needed.`;

  return claudeGenerate([{ role: 'user', content: prompt }], 1500);
}

interface AddCallModalProps {
  clients: Client[];
  onClose: () => void;
  onSave: (call: Call) => void;
}

function AddCallModal({ clients, onClose, onSave }: AddCallModalProps) {
  const [form, setForm] = useState({
    clientId: '',
    businessName: '',
    ownerName: '',
    scheduledDate: '',
    notes: '',
  });

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setForm((p) => ({
      ...p,
      clientId,
      businessName: client?.businessName ?? '',
      ownerName: client?.ownerName ?? '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: generateId(),
      ...form,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-black text-[#1A1A2E]">Schedule Discovery Call</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">From Pipeline</label>
            <select
              value={form.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 bg-white"
            >
              <option value="">Select from pipeline (optional)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Business Name *</label>
              <input
                required
                value={form.businessName}
                onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Owner Name</label>
              <input
                value={form.ownerName}
                onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Date & Time *</label>
            <input
              required
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Notes from Outreach</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] resize-none"
              placeholder="What do you know about them so far?"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-[#6C47FF] text-white text-sm font-bold hover:bg-[#4C2FBF]">Schedule Call</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PostCallModalProps {
  call: Call;
  onClose: () => void;
  onSave: (updates: Partial<Call>) => void;
}

function PostCallModal({ call, onClose, onSave }: PostCallModalProps) {
  const [form, setForm] = useState({
    outcome: '' as CallOutcome | '',
    packageDiscussed: '' as PackageTier | '',
    objections: '',
    nextStep: '',
    followUpDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      outcome: form.outcome as CallOutcome,
      packageDiscussed: form.packageDiscussed as PackageTier,
      objections: form.objections,
      nextStep: form.nextStep,
      followUpDate: form.followUpDate,
      notes: form.notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-black text-[#1A1A2E]">Log Call: {call.businessName}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Outcome *</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, outcome: o }))}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.outcome === o
                      ? o === 'Closed' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : o === 'Interested' ? 'border-[#6C47FF] bg-[#6C47FF]/10 text-[#6C47FF]'
                        : o === 'Not now' ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-red-300 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Package Discussed</label>
            <select
              value={form.packageDiscussed}
              onChange={(e) => setForm((p) => ({ ...p, packageDiscussed: e.target.value as PackageTier }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 bg-white"
            >
              <option value="">Not discussed</option>
              {PACKAGES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Objections</label>
            <input
              value={form.objections}
              onChange={(e) => setForm((p) => ({ ...p, objections: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30"
              placeholder="What concerns did they raise?"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Next Step Agreed</label>
            <input
              value={form.nextStep}
              onChange={(e) => setForm((p) => ({ ...p, nextStep: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30"
              placeholder="e.g. Send proposal by Friday"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Follow-up Date</label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm((p) => ({ ...p, followUpDate: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-[#6C47FF] text-white text-sm font-bold hover:bg-[#4C2FBF]">Save Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DiscoveryCallPrep() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCallId, setSelectedCallId] = useState('');
  const [prepBrief, setPrepBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [logCallId, setLogCallId] = useState<string | null>(null);

  useEffect(() => {
    setClients(storage.getClients());
    setCalls(storage.getCalls());
  }, []);

  const selectedCall = calls.find((c) => c.id === selectedCallId);
  const selectedClient = selectedCall?.clientId
    ? clients.find((c) => c.id === selectedCall.clientId)
    : null;

  const copyCalendly = () => {
    navigator.clipboard.writeText(CALENDLY_URL);
    addToast('Calendly link copied!', 'success');
  };

  const handleGenerate = async () => {
    if (!selectedClient && !selectedCall) {
      addToast('Select a call first', 'warning');
      return;
    }

    const client = selectedClient ?? {
      id: '',
      businessName: selectedCall?.businessName ?? '',
      businessType: 'Other' as const,
      ownerName: selectedCall?.ownerName ?? '',
      phone: '',
      email: '',
      website: '',
      source: 'Other' as const,
      budget: 0,
      painPoints: selectedCall?.notes ?? '',
      stage: 'discovery_call' as const,
      packageTier: null,
      monthlyValue: 0,
      startDate: '',
      status: 'active' as const,
      notes: '',
      callHistory: [],
      proposals: [],
      createdAt: '',
    };

    setLoading(true);
    setError('');
    setPrepBrief('');
    try {
      const text = await generateCallPrep(client);
      setPrepBrief(text);
      if (selectedCallId) {
        storage.updateCall(selectedCallId, { prepBrief: text });
        setCalls(storage.getCalls());
      }
      addToast('Call prep brief generated!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      addToast(`Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCall = (call: Call) => {
    storage.addCall(call);
    setCalls(storage.getCalls());
    setShowAddModal(false);
    addToast('Discovery call scheduled!', 'success');
  };

  const handleLogCall = (updates: Partial<Call>) => {
    if (!logCallId) return;
    storage.updateCall(logCallId, updates);
    storage.addActivity({
      id: generateId(),
      action: 'Discovery Call',
      description: `${updates.outcome} — ${calls.find((c) => c.id === logCallId)?.businessName}`,
      timestamp: new Date().toISOString(),
    });
    setCalls(storage.getCalls());
    setLogCallId(null);
    addToast('Call logged!', 'success');
  };

  const upcomingCalls = calls.filter((c) => !c.outcome);
  const completedCalls = calls.filter((c) => c.outcome);

  const outcomeColors: Record<CallOutcome, string> = {
    Closed: 'bg-emerald-100 text-emerald-700',
    Interested: 'bg-blue-100 text-blue-700',
    'Not now': 'bg-amber-100 text-amber-700',
    'No show': 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Discovery Call Prep</h1>
          <p className="text-gray-500 mt-1 font-medium">Walk into every call ready to close</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl font-bold text-sm hover:bg-[#4C2FBF] transition-colors shadow-brand"
        >
          <Plus size={16} />
          Schedule Call
        </button>
      </div>

      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #6C47FF 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-full opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-[#00C896] blur-2xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Your Discovery Call Link</div>
              <div className="text-sm text-white/80 font-mono mb-4 break-all">
                calendly.com/mrsjw136/free-discovery-call-adgorhythms-meeting
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyCalendly}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00C896] text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors"
                >
                  <Copy size={14} />
                  Copy Link
                </button>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                >
                  <Calendar size={14} />
                  Open Calendly
                </a>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Phone size={28} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-[#1A1A2E]">Upcoming Calls</h2>
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full">
                {upcomingCalls.length} scheduled
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingCalls.map((call) => (
                <div
                  key={call.id}
                  className={`px-6 py-4 cursor-pointer transition-colors ${
                    selectedCallId === call.id ? 'bg-[#6C47FF]/5 border-l-2 border-[#6C47FF]' : 'hover:bg-gray-50/50'
                  }`}
                  onClick={() => {
                    setSelectedCallId(call.id);
                    setPrepBrief(call.prepBrief ?? '');
                  }}
                >
                  <div className="font-bold text-[#1A1A2E] text-sm">{call.businessName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{call.ownerName}</div>
                  {call.scheduledDate && (
                    <div className="flex items-center gap-1 text-xs text-[#6C47FF] mt-1 font-semibold">
                      <Clock size={11} />
                      {new Date(call.scheduledDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  )}
                  {call.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{call.notes}</p>}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setLogCallId(call.id); }}
                      className="text-xs text-gray-500 hover:text-[#6C47FF] font-semibold"
                    >
                      Log Outcome →
                    </button>
                  </div>
                </div>
              ))}
              {upcomingCalls.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <Phone size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No calls scheduled</p>
                </div>
              )}
            </div>
          </div>

          {completedCalls.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-black text-[#1A1A2E]">Past Calls</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {completedCalls.slice(0, 5).map((call) => (
                  <div key={call.id} className="px-6 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#1A1A2E] text-sm">{call.businessName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{call.ownerName}</div>
                      </div>
                      {call.outcome && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${outcomeColors[call.outcome]}`}>
                          {call.outcome}
                        </span>
                      )}
                    </div>
                    {call.nextStep && (
                      <div className="text-xs text-gray-500 mt-1">Next: {call.nextStep}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#6C47FF]" />
                <h2 className="font-black text-[#1A1A2E]">Call Prep Brief</h2>
              </div>
              {selectedCall && (
                <div className="text-xs text-gray-400">{selectedCall.businessName}</div>
              )}
            </div>

            <div className="p-6">
              {!selectedCallId && (
                <div className="text-center py-8">
                  <Phone size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Select a call from the list to generate prep</p>
                </div>
              )}

              {selectedCallId && (
                <>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-[#6C47FF] to-[#4C2FBF] text-white rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-brand mb-5"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating Prep Brief...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Call Prep Brief
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-red-700">Failed</div>
                        <div className="text-xs text-red-600 mt-0.5">{error}</div>
                        <button onClick={handleGenerate} className="text-xs text-red-600 underline mt-2">Retry</button>
                      </div>
                    </div>
                  )}

                  {prepBrief && (
                    <div className="bg-[#F8F7FF] rounded-xl p-5">
                      <div className="text-sm text-[#1A1A2E] leading-relaxed whitespace-pre-line">{prepBrief}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-black text-[#1A1A2E]">15-Minute Call Script</h2>
              <p className="text-xs text-gray-400 mt-0.5">Follow this structure every time</p>
            </div>
            <div className="p-6 space-y-3">
              {CALL_SCRIPT.map((step) => (
                <div key={step.label} className={`rounded-xl border p-4 ${step.color}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-gray-400 w-14 flex-shrink-0">{step.time}</span>
                    <span className="text-sm font-black text-[#1A1A2E]">{step.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-[68px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddCallModal clients={clients} onClose={() => setShowAddModal(false)} onSave={handleSaveCall} />
      )}
      {logCallId && (
        <PostCallModal
          call={calls.find((c) => c.id === logCallId)!}
          onClose={() => setLogCallId(null)}
          onSave={handleLogCall}
        />
      )}
    </div>
  );
}
