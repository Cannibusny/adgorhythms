import { useState, useEffect } from 'react';
import {
  Plus, CheckCircle, Clock, AlertTriangle, Circle,
  Star, MessageSquare, BarChart2, X, Calendar,
} from 'lucide-react';
import { storage, generateId } from '../lib/storage';
import { useToast } from '../hooks/useToast';
import { PACKAGES } from '../data/sampleData';
import JsonLd from '../components/JsonLd';
import { buildCampaignSchemas } from '../utils/schemaMarkup';
import type { Client, Campaign, Deliverable, DeliverableStatus, PackageTier } from '../types';

const STATUS_ICONS: Record<DeliverableStatus, React.ReactNode> = {
  complete: <CheckCircle size={14} className="text-[#00C896]" />,
  pending: <Circle size={14} className="text-gray-300" />,
  overdue: <AlertTriangle size={14} className="text-[#FF6B35]" />,
};

const STATUS_LABELS: Record<DeliverableStatus, string> = {
  complete: 'Complete',
  pending: 'Pending',
  overdue: 'Overdue',
};

const HEALTH_COLORS = {
  'On Track': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'Needs Attention': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  'At Risk': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} className="focus:outline-none">
          <Star
            size={16}
            className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
          />
        </button>
      ))}
    </div>
  );
}

interface AddCampaignModalProps {
  clients: Client[];
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
}

function AddCampaignModal({ clients, onClose, onSave }: AddCampaignModalProps) {
  const [form, setForm] = useState({
    clientId: '',
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    packageTier: 'growth' as PackageTier,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const campaign: Campaign = {
      id: generateId(),
      ...form,
      health: 'On Track',
      completion: 0,
      deliverables: [],
      notes: [],
      metrics: {
        postsPublished: 0,
        estimatedReach: 0,
        engagementRate: 0,
        leadsGenerated: 0,
        satisfaction: 5,
      },
    };
    onSave(campaign);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-black text-[#1A1A2E]">New Campaign</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Client *</label>
            <select
              required
              value={form.clientId}
              onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] bg-white"
            >
              <option value="">Select a client</option>
              {clients.filter((c) => c.stage === 'active_client').map((c) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Campaign Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
              placeholder="e.g. Social Media Growth Q1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Package</label>
            <select
              value={form.packageTier}
              onChange={(e) => setForm((p) => ({ ...p, packageTier: e.target.value as PackageTier }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] bg-white"
            >
              {PACKAGES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-[#6C47FF] text-white text-sm font-bold hover:bg-[#4C2FBF]">Create Campaign</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignManager() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeClientId, setActiveClientId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');

  useEffect(() => {
    const allClients = storage.getClients();
    const active = allClients.filter((c) => c.stage === 'active_client');
    setClients(allClients);
    setCampaigns(storage.getCampaigns());
    if (active.length > 0 && !activeClientId) {
      setActiveClientId(active[0].id);
    }
  }, []);

  const activeClients = clients.filter((c) => c.stage === 'active_client');
  const activeCampaign = campaigns.find((c) => c.clientId === activeClientId);
  const selectedClient = clients.find((c) => c.id === activeClientId);

  const handleSaveCampaign = (campaign: Campaign) => {
    storage.addCampaign(campaign);
    setCampaigns(storage.getCampaigns());
    setActiveClientId(campaign.clientId);
    setShowModal(false);
    addToast('Campaign created!', 'success');
  };

  const toggleDeliverable = (delivId: string) => {
    if (!activeCampaign) return;
    const updated: Campaign = {
      ...activeCampaign,
      deliverables: activeCampaign.deliverables.map((d) =>
        d.id === delivId
          ? { ...d, status: d.status === 'complete' ? 'pending' : 'complete' }
          : d
      ),
    };
    const completed = updated.deliverables.filter((d) => d.status === 'complete').length;
    updated.completion = Math.round((completed / updated.deliverables.length) * 100);
    storage.updateCampaign(activeCampaign.id, updated);
    setCampaigns(storage.getCampaigns());
    addToast('Deliverable updated!', 'success');
  };

  const addNote = () => {
    if (!activeCampaign || !newNote.trim()) return;
    const note = { id: generateId(), content: newNote.trim(), timestamp: new Date().toISOString() };
    const updated: Campaign = { ...activeCampaign, notes: [...activeCampaign.notes, note] };
    storage.updateCampaign(activeCampaign.id, updated);
    setCampaigns(storage.getCampaigns());
    setNewNote('');
    addToast('Note saved!', 'success');
  };

  const addDeliverable = () => {
    if (!activeCampaign || !newDeliverable.trim()) return;
    const d: Deliverable = {
      id: generateId(),
      description: newDeliverable.trim(),
      dueDate: '',
      status: 'pending',
      notes: '',
      week: 1,
    };
    const updated: Campaign = { ...activeCampaign, deliverables: [...activeCampaign.deliverables, d] };
    storage.updateCampaign(activeCampaign.id, updated);
    setCampaigns(storage.getCampaigns());
    setNewDeliverable('');
    addToast('Deliverable added!', 'success');
  };

  const updateMetric = (key: keyof Campaign['metrics'], value: number) => {
    if (!activeCampaign) return;
    const updated: Campaign = { ...activeCampaign, metrics: { ...activeCampaign.metrics, [key]: value } };
    storage.updateCampaign(activeCampaign.id, updated);
    setCampaigns(storage.getCampaigns());
  };

  const updateHealth = (health: Campaign['health']) => {
    if (!activeCampaign) return;
    storage.updateCampaign(activeCampaign.id, { health });
    setCampaigns(storage.getCampaigns());
    addToast('Campaign health updated!', 'success');
  };

  if (activeClients.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Campaign Manager</h1>
          <p className="text-gray-500 mt-1 font-medium">Active campaigns across all clients</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <BarChart2 size={40} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-black text-[#1A1A2E] mb-2">No Active Clients Yet</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Move a client to Active Client status in your pipeline to manage their campaign here.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-[#6C47FF] text-white rounded-xl font-bold text-sm hover:bg-[#4C2FBF] transition-colors"
          >
            Add Campaign
          </button>
        </div>
        {showModal && <AddCampaignModal clients={clients} onClose={() => setShowModal(false)} onSave={handleSaveCampaign} />}
      </div>
    );
  }

  const campaignSchemas = activeCampaign && selectedClient
    ? buildCampaignSchemas(activeCampaign, selectedClient)
    : [];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {campaignSchemas.length > 0 && <JsonLd schema={campaignSchemas} />}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Campaign Manager</h1>
          <p className="text-gray-500 mt-1 font-medium">Active campaigns across all clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl font-bold text-sm hover:bg-[#4C2FBF] transition-colors shadow-brand"
        >
          <Plus size={16} />
          Add Campaign
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {activeClients.map((client) => (
          <button
            key={client.id}
            onClick={() => setActiveClientId(client.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeClientId === client.id
                ? 'bg-[#6C47FF] text-white shadow-brand'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#6C47FF]/30'
            }`}
          >
            {client.businessName}
          </button>
        ))}
      </div>

      {!activeCampaign ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No campaign for {selectedClient?.businessName} yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl font-bold text-sm hover:bg-[#4C2FBF]"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Campaign</div>
                  <h2 className="text-xl font-black text-[#1A1A2E]">{activeCampaign.name}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    {activeCampaign.startDate && new Date(activeCampaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {activeCampaign.endDate && ` — ${new Date(activeCampaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(['On Track', 'Needs Attention', 'At Risk'] as Campaign['health'][]).map((h) => {
                    const c = HEALTH_COLORS[h];
                    return (
                      <button
                        key={h}
                        onClick={() => updateHealth(h)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          activeCampaign.health === h
                            ? `${c.bg} ${c.text} shadow-sm`
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${activeCampaign.health === h ? c.dot : 'bg-gray-300'}`} />
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">Campaign Progress</span>
                  <span className="text-xs font-black text-[#6C47FF]">{activeCampaign.completion}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${activeCampaign.completion}%`,
                      background: 'linear-gradient(90deg, #6C47FF, #00C896)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-black text-[#1A1A2E]">Deliverables</h3>
                <span className="text-xs text-gray-400">
                  {activeCampaign.deliverables.filter((d) => d.status === 'complete').length}/{activeCampaign.deliverables.length} done
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {activeCampaign.deliverables.map((d) => (
                  <div
                    key={d.id}
                    className="px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => toggleDeliverable(d.id)}
                  >
                    <div className="flex-shrink-0">{STATUS_ICONS[d.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${d.status === 'complete' ? 'line-through text-gray-300' : 'text-[#1A1A2E]'}`}>
                        {d.description}
                      </div>
                      {d.dueDate && (
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          Due {new Date(d.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                      d.status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                      d.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {STATUS_LABELS[d.status]}
                    </span>
                  </div>
                ))}
                {activeCampaign.deliverables.length === 0 && (
                  <div className="px-6 py-6 text-center text-sm text-gray-400">No deliverables yet</div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-50 flex gap-3">
                <input
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDeliverable()}
                  placeholder="Add a deliverable..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
                />
                <button
                  onClick={addDeliverable}
                  className="px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-bold hover:bg-[#4C2FBF]"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="font-black text-[#1A1A2E]">Client Notes</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {[...activeCampaign.notes].reverse().map((note) => (
                  <div key={note.id} className="px-6 py-3.5">
                    <p className="text-sm text-[#1A1A2E] leading-relaxed">{note.content}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(note.timestamp).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
                {activeCampaign.notes.length === 0 && (
                  <div className="px-6 py-6 text-center text-sm text-gray-400">No notes yet</div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-50 flex gap-3">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]"
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-bold hover:bg-[#4C2FBF]"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h3 className="font-black text-[#1A1A2E]">Performance</h3>
              <div className="space-y-4">
                {[
                  { label: 'Posts Published', key: 'postsPublished', suffix: '' },
                  { label: 'Est. Reach', key: 'estimatedReach', suffix: '' },
                  { label: 'Engagement Rate', key: 'engagementRate', suffix: '%' },
                  { label: 'Leads Generated', key: 'leadsGenerated', suffix: '' },
                ].map(({ label, key, suffix }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-medium">{label}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={activeCampaign.metrics[key as keyof Campaign['metrics']]}
                          onChange={(e) => updateMetric(key as keyof Campaign['metrics'], parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-right text-sm font-bold text-[#1A1A2E] bg-[#F8F7FF] rounded-lg border border-gray-100 focus:outline-none focus:border-[#6C47FF]"
                        />
                        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-50">
                <div className="text-xs text-gray-500 font-medium mb-2">Client Satisfaction</div>
                <StarRating
                  value={activeCampaign.metrics.satisfaction}
                  onChange={(v) => updateMetric('satisfaction', v)}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-black text-[#1A1A2E] mb-4">Client Info</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 font-medium">Business</div>
                  <div className="text-sm font-bold text-[#1A1A2E]">{selectedClient?.businessName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Owner</div>
                  <div className="text-sm text-[#1A1A2E]">{selectedClient?.ownerName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Package</div>
                  <div className="text-sm text-[#6C47FF] font-bold capitalize">{selectedClient?.packageTier}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Monthly Value</div>
                  <div className="text-sm font-black text-[#00C896]">${(selectedClient?.monthlyValue ?? 0).toLocaleString()}/mo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && <AddCampaignModal clients={clients} onClose={() => setShowModal(false)} onSave={handleSaveCampaign} />}
    </div>
  );
}
