import { useState, useEffect } from 'react';
import {
  FileText, Sparkles, Copy, Download, CheckCircle,
  Loader2, ChevronDown, AlertCircle,
} from 'lucide-react';
import { storage, generateId } from '../lib/storage';
import { useToast } from '../hooks/useToast';
import { PACKAGES } from '../data/sampleData';
import type { Client, PackageTier, PackageConfig } from '../types';

async function generateProposal(
  client: Client,
  pkg: PackageConfig,
  apiKey: string
): Promise<string> {
  const prompt = `You are writing a professional marketing proposal for ADgorhythms, an AI-powered marketing agency owned by Sheridan Williams in Hudson Valley, New York.

ADgorhythms philosophy: Replace expensive software subscriptions with agent-built AI systems. "We don't sell marketing. We install marketing machines."

Client: ${client.ownerName}
Business: ${client.businessName}
Business type: ${client.businessType}
Their pain points: ${client.painPoints || 'Not specified'}
Recommended package: ${pkg.name} at $${pkg.price}/${pkg.period}
Package includes: ${pkg.includes.join(', ')}

Write a compelling, professional proposal that:
1. Opens by addressing their specific pain points
2. Explains the ADgorhythms approach clearly
3. Details exactly what they get
4. Shows ROI potential with realistic numbers
5. Includes a clear call to action
6. Feels personalized not templated

Tone: Confident, results-focused, human. Never corporate or salesy.
Make them feel like this is the obvious choice.

Return the complete proposal text formatted with clear sections. Use plain text, no markdown asterisks.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || 'API request failed');
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  return data.content[0]?.text ?? '';
}

function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: PackageConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  const tierColors: Record<string, string> = {
    starter: 'border-blue-200 bg-blue-50',
    growth: 'border-[#6C47FF]/30 bg-[#6C47FF]/5',
    scale: 'border-emerald-200 bg-emerald-50',
    enterprise: 'border-amber-200 bg-amber-50',
    retainer: 'border-gray-200 bg-gray-50',
  };

  const badgeColors: Record<string, string> = {
    starter: 'bg-blue-100 text-blue-700',
    growth: 'bg-[#6C47FF]/10 text-[#6C47FF]',
    scale: 'bg-emerald-100 text-emerald-700',
    enterprise: 'bg-amber-100 text-amber-700',
    retainer: 'bg-gray-100 text-gray-700',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-150 ${
        selected
          ? 'border-[#6C47FF] bg-[#6C47FF]/5 shadow-brand'
          : `${tierColors[pkg.id]} hover:border-[#6C47FF]/50`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeColors[pkg.id]}`}>
            {pkg.name}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-[#1A1A2E]">${pkg.price.toLocaleString()}</div>
          <div className="text-xs text-gray-500">/{pkg.period}</div>
        </div>
      </div>
      <ul className="space-y-1.5 mb-3">
        {pkg.includes.slice(0, 3).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
            <CheckCircle size={12} className="text-[#00C896] flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
        {pkg.includes.length > 3 && (
          <li className="text-xs text-gray-400 pl-5">+{pkg.includes.length - 3} more</li>
        )}
      </ul>
      <div className="text-xs text-gray-500 italic">Best for: {pkg.bestFor}</div>
    </button>
  );
}

export default function ProposalBuilder() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTier, setSelectedTier] = useState<PackageTier>('growth');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedPackage = PACKAGES.find((p) => p.id === selectedTier)!;
  const agency = storage.getAgency();

  const handleGenerate = async () => {
    if (!selectedClient) {
      addToast('Please select a client first', 'warning');
      return;
    }
    const apiKey = agency?.apiKey;
    if (!apiKey) {
      addToast('Add your Claude API key in Settings first', 'error');
      return;
    }
    setLoading(true);
    setError('');
    setProposal('');
    try {
      const text = await generateProposal(selectedClient, selectedPackage, apiKey);
      setProposal(text);
      addToast('Proposal generated!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      addToast(`Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyProposal = () => {
    if (!proposal) return;
    navigator.clipboard.writeText(proposal);
    addToast('Proposal copied to clipboard!', 'success');
  };

  const downloadProposal = () => {
    if (!proposal) return;
    const blob = new Blob([proposal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ADgorhythms-Proposal-${selectedClient?.businessName ?? 'Client'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Proposal downloaded!', 'success');
  };

  const markSent = () => {
    if (!selectedClient || !proposal) return;
    const prop = {
      id: generateId(),
      clientId: selectedClient.id,
      packageTier: selectedTier,
      content: proposal,
      status: 'sent' as const,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };
    const updatedProposals = [...(selectedClient.proposals ?? []), prop];
    storage.updateClient(selectedClient.id, {
      proposals: updatedProposals,
      stage: 'proposal_sent',
    });
    storage.addActivity({
      id: generateId(),
      action: 'Proposal Sent',
      description: `${selectedPackage.name} proposal sent to ${selectedClient.businessName}`,
      timestamp: new Date().toISOString(),
    });
    addToast(`Proposal logged as sent to ${selectedClient.businessName}!`, 'success');
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Proposal Builder</h1>
        <p className="text-gray-500 mt-1 font-medium">AI-generated proposals that close deals</p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-black text-[#1A1A2E]">Select Client</h2>
            <div className="relative">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors bg-white appearance-none cursor-pointer"
              >
                <option value="">— Choose a client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.businessType})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {selectedClient && (
              <div className="bg-[#F8F7FF] rounded-xl p-4 space-y-2">
                <div className="text-sm font-bold text-[#1A1A2E]">{selectedClient.businessName}</div>
                <div className="text-xs text-gray-500">{selectedClient.ownerName} • {selectedClient.businessType}</div>
                {selectedClient.painPoints && (
                  <div className="text-xs text-gray-600 leading-relaxed pt-1 border-t border-gray-100">
                    <span className="font-semibold">Pain points:</span> {selectedClient.painPoints}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-black text-[#1A1A2E]">Select Package</h2>
            <div className="space-y-3">
              {PACKAGES.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedTier === pkg.id}
                  onSelect={() => setSelectedTier(pkg.id as PackageTier)}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedClientId}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-[#6C47FF] to-[#4C2FBF] text-white rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-brand"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating Proposal...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Custom Proposal
              </>
            )}
          </button>
        </div>

        <div className="col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#6C47FF]" />
                <h2 className="font-black text-[#1A1A2E]">Proposal Preview</h2>
              </div>
              {proposal && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyProposal}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Copy size={13} />
                    Copy
                  </button>
                  <button
                    onClick={downloadProposal}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Download size={13} />
                    Download
                  </button>
                  <button
                    onClick={markSent}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#00C896] hover:bg-emerald-600 rounded-xl transition-colors"
                  >
                    <CheckCircle size={13} />
                    Mark Sent
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto min-h-[500px]">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-red-700">Generation Failed</div>
                    <div className="text-xs text-red-600 mt-0.5">{error}</div>
                    <button
                      onClick={handleGenerate}
                      className="text-xs text-red-600 underline mt-2 hover:text-red-800"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#6C47FF]/10 flex items-center justify-center">
                    <Loader2 size={24} className="text-[#6C47FF] animate-spin" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-[#1A1A2E]">Crafting your proposal...</div>
                    <div className="text-xs text-gray-400 mt-1">This usually takes 10-15 seconds</div>
                  </div>
                </div>
              )}

              {!proposal && !loading && !error && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#6C47FF]/10 flex items-center justify-center">
                    <Sparkles size={28} className="text-[#6C47FF]" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#1A1A2E]">Ready to generate</div>
                    <div className="text-sm text-gray-400 mt-1 max-w-xs">
                      Select a client and package, then hit Generate to create a personalized proposal
                    </div>
                  </div>

                  <div className="bg-[#F8F7FF] rounded-xl p-5 text-left max-w-sm w-full space-y-3 mt-2">
                    <div className="text-xs font-bold text-[#6C47FF] uppercase tracking-widest">Proposal Preview Format</div>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs font-bold text-[#1A1A2E]">ADgorhythms</div>
                        <div className="text-xs text-gray-400">Proposal for [Client Name]</div>
                      </div>
                      {['Opening — Their Problem', 'Our Approach', 'What You Get', 'Investment & ROI', 'Next Steps'].map((s) => (
                        <div key={s} className="h-2 bg-gray-200 rounded-full shimmer" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {proposal && !loading && (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-6">
                    <div
                      className="text-2xl font-black mb-1"
                      style={{
                        background: 'linear-gradient(135deg, #6C47FF 0%, #00C896 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      ADgorhythms
                    </div>
                    <div className="text-sm text-gray-500">AI-Powered Marketing Automation</div>
                    <div className="text-sm text-gray-500">Hudson Valley, NY</div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-base font-bold text-[#1A1A2E]">
                        Proposal for {selectedClient?.businessName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedPackage.name} Package — ${selectedPackage.price.toLocaleString()}/{selectedPackage.period}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Prepared by Sheridan Williams • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-[#1A1A2E] leading-relaxed whitespace-pre-line">
                    {proposal}
                  </div>
                  <div className="border-t border-gray-100 pt-6">
                    <div className="text-sm font-bold text-[#1A1A2E]">Sheridan Williams</div>
                    <div className="text-xs text-gray-500">Founder, ADgorhythms</div>
                    <div className="text-xs text-gray-500">AI-Powered Marketing Automation</div>
                    <div className="text-xs text-[#6C47FF] mt-1">
                      calendly.com/mrsjw136/free-discovery-call-adgorhythms-meeting
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
