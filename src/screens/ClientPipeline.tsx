import { useState, useEffect } from 'react';
import {
  Plus, X, Copy, Phone, Mail, Globe,
  Clock, ArrowRight, Users, Megaphone,
} from 'lucide-react';
import { storage, generateId } from '../lib/storage';
import { useToast } from '../hooks/useToast';
import { OUTREACH_TEMPLATES } from '../data/sampleData';
import type { Client, ClientStage, BusinessType, LeadSource } from '../types';

const STAGES: { id: ClientStage; label: string; color: string; bg: string }[] = [
  { id: 'prospects', label: 'Prospects', color: 'text-gray-600', bg: 'bg-gray-100' },
  { id: 'outreach_sent', label: 'Outreach Sent', color: 'text-blue-700', bg: 'bg-blue-100' },
  { id: 'discovery_call', label: 'Discovery Call', color: 'text-amber-700', bg: 'bg-amber-100' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'text-purple-700', bg: 'bg-purple-100' },
  { id: 'active_client', label: 'Active Client', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { id: 'completed', label: 'Completed', color: 'text-gray-700', bg: 'bg-gray-200' },
];

const STAGE_ORDER: ClientStage[] = [
  'prospects', 'outreach_sent', 'discovery_call', 'proposal_sent', 'active_client', 'completed',
];

const BUSINESS_TYPES: BusinessType[] = [
  'Restaurant', 'Retail', 'Contractor', 'Home Services', 'Cannabis',
  'Professional Services', 'Trading Card Business', 'Coffee Brand', 'Other',
];

const LEAD_SOURCES: LeadSource[] = [
  'Walk-in', 'Referral', 'Social Media', 'Cold outreach', 'Card show', 'Other',
];

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

interface AddProspectModalProps {
  onClose: () => void;
  onSave: (client: Client) => void;
}

function AddProspectModal({ onClose, onSave }: AddProspectModalProps) {
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'Restaurant' as BusinessType,
    ownerName: '',
    phone: '',
    email: '',
    website: '',
    source: 'Cold outreach' as LeadSource,
    budget: '',
    painPoints: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: generateId(),
      businessName: form.businessName,
      businessType: form.businessType,
      ownerName: form.ownerName,
      phone: form.phone,
      email: form.email,
      website: form.website,
      source: form.source,
      budget: parseFloat(form.budget) || 0,
      painPoints: form.painPoints,
      stage: 'prospects',
      packageTier: null,
      monthlyValue: 0,
      startDate: '',
      status: 'active',
      notes: form.notes,
      callHistory: [],
      proposals: [],
      createdAt: new Date().toISOString(),
    };
    onSave(client);
  };

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-black text-[#1A1A2E]">Add New Prospect</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Business Name *
              </label>
              <input
                required
                value={form.businessName}
                onChange={(e) => set('businessName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors"
                placeholder="e.g. Rosa's Kitchen"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Business Type
              </label>
              <select
                value={form.businessType}
                onChange={(e) => set('businessType', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors bg-white"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                How Found
              </label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors bg-white"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Owner Name *
              </label>
              <input
                required
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors"
                placeholder="(845) 555-0000"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors"
                placeholder="owner@business.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Website
              </label>
              <input
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors"
                placeholder="website.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Est. Monthly Budget ($)
              </label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors"
                placeholder="2500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Pain Points
              </label>
              <textarea
                value={form.painPoints}
                onChange={(e) => set('painPoints', e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors resize-none"
                placeholder="What marketing problems are they facing?"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors resize-none"
                placeholder="Any other context..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#6C47FF] text-white text-sm font-bold hover:bg-[#4C2FBF] transition-colors"
            >
              Add Prospect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientCard({
  client,
  onAdvance,
}: {
  client: Client;
  onAdvance: (id: string) => void;
}) {
  const { addToast } = useToast();
  const days = daysSince(client.createdAt);
  const currentStageIndex = STAGE_ORDER.indexOf(client.stage);
  const canAdvance = currentStageIndex < STAGE_ORDER.length - 1;

  const copyEmail = () => {
    if (client.email) {
      navigator.clipboard.writeText(client.email);
      addToast('Email copied!', 'success');
    }
  };

  const copyPhone = () => {
    if (client.phone) {
      navigator.clipboard.writeText(client.phone);
      addToast('Phone number copied!', 'success');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#1A1A2E] text-sm leading-snug">{client.businessName}</div>
          <div className="text-xs text-gray-500 mt-0.5">{client.businessType}</div>
        </div>
        {client.budget > 0 && (
          <div className="text-xs font-black text-[#00C896] flex-shrink-0">
            ${client.budget.toLocaleString()}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 font-medium">{client.ownerName}</div>

      <div className="flex items-center gap-2">
        {client.phone && (
          <button
            onClick={copyPhone}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#6C47FF] transition-colors"
          >
            <Phone size={11} />
            <span className="truncate max-w-[80px]">{client.phone}</span>
          </button>
        )}
        {client.email && (
          <button
            onClick={copyEmail}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#6C47FF] transition-colors"
          >
            <Mail size={11} />
          </button>
        )}
        {client.website && (
          <a
            href={`https://${client.website.replace(/^https?:\/\//, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#6C47FF] transition-colors"
          >
            <Globe size={11} />
          </a>
        )}
      </div>

      {client.notes && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{client.notes}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          <span>{days}d here</span>
        </div>
        {canAdvance && (
          <button
            onClick={() => onAdvance(client.id)}
            className="flex items-center gap-1 text-xs font-semibold text-[#6C47FF] hover:text-[#4C2FBF] transition-colors"
          >
            <span>Advance</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ClientPipeline() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'kanban' | 'templates'>('kanban');

  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  const handleSave = (client: Client) => {
    storage.addClient(client);
    storage.addActivity({
      id: generateId(),
      action: 'Prospect Added',
      description: `${client.businessName} added to pipeline`,
      timestamp: new Date().toISOString(),
    });
    setClients(storage.getClients());
    setShowModal(false);
    addToast(`${client.businessName} added to pipeline!`, 'success');
  };

  const handleAdvance = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    const currentIndex = STAGE_ORDER.indexOf(client.stage);
    if (currentIndex >= STAGE_ORDER.length - 1) return;
    const nextStage = STAGE_ORDER[currentIndex + 1];
    storage.updateClient(id, { stage: nextStage });
    storage.addActivity({
      id: generateId(),
      action: 'Stage Advanced',
      description: `${client.businessName} moved to ${STAGES.find((s) => s.id === nextStage)?.label}`,
      timestamp: new Date().toISOString(),
    });
    setClients(storage.getClients());
    addToast(`${client.businessName} advanced to ${STAGES.find((s) => s.id === nextStage)?.label}!`, 'success');
  };

  const copyTemplate = (body: string) => {
    navigator.clipboard.writeText(body);
    addToast('Template copied!', 'success');
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Client Pipeline</h1>
          <p className="text-gray-500 mt-1 font-medium">From cold prospect to paying client</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl font-bold text-sm hover:bg-[#4C2FBF] transition-colors shadow-brand"
        >
          <Plus size={16} />
          Add Prospect
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'kanban'
              ? 'bg-[#6C47FF] text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users size={14} />
            Pipeline Board
          </span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'templates'
              ? 'bg-[#6C47FF] text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Megaphone size={14} />
            Outreach Templates
          </span>
        </button>
      </div>

      {activeTab === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageClients = clients.filter((c) => c.stage === stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${stage.bg} ${stage.color}`}>
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{stageClients.length}</span>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {stageClients.map((client) => (
                    <ClientCard key={client.id} client={client} onAdvance={handleAdvance} />
                  ))}
                  {stageClients.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <p className="text-xs text-gray-300 font-medium">No clients here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-2 gap-5">
          {OUTREACH_TEMPLATES.map((tmpl) => (
            <div key={tmpl.id} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#6C47FF] mb-1">
                    Template {tmpl.id.split('-')[1]}
                  </div>
                  <h3 className="font-black text-[#1A1A2E]">{tmpl.title}</h3>
                  {tmpl.subject && (
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-semibold">Subject:</span> {tmpl.subject}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => copyTemplate(tmpl.subject ? `Subject: ${tmpl.subject}\n\n${tmpl.body}` : tmpl.body)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6C47FF]/10 text-[#6C47FF] rounded-xl text-xs font-bold hover:bg-[#6C47FF]/20 transition-colors flex-shrink-0"
                >
                  <Copy size={13} />
                  Copy
                </button>
              </div>
              <div className="bg-[#F8F7FF] rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{tmpl.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddProspectModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
