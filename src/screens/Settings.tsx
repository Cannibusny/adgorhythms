import { useState, useEffect } from 'react';
import {
  User, Mail, Copy, Package, Target,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { useToast } from '../hooks/useToast';
import { PACKAGES } from '../data/sampleData';
import type { AgencySettings, PackageConfig } from '../types';

const DEFAULT_AGENCY: AgencySettings = {
  name: 'ADgorhythms',
  owner: 'Sheridan Williams',
  location: 'Hudson Valley, NY',
  calendlyLink: 'calendly.com/mrsjw136/free-discovery-call-adgorhythms-meeting',
  email: 'sheridan@adgorhythms.com',
  phone: '(845) 555-0142',
  website: 'adgorhythms.com',
  monthlyGoal: 10000,
  dailyOutreachGoal: 5,
  weeklyCallGoal: 2,
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
          <Icon size={15} className="text-[#6C47FF]" />
        </div>
        <h2 className="font-black text-[#1A1A2E]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] transition-colors"
    />
  );
}

export default function Settings() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<AgencySettings>(DEFAULT_AGENCY);
  const [packages, setPackages] = useState<PackageConfig[]>(PACKAGES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = storage.getAgency();
    if (stored) setSettings(stored);
  }, []);

  const set = (field: keyof AgencySettings, value: string | number) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    storage.setAgency(settings);
    setSaved(true);
    addToast('Settings saved!', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const updatePackage = (id: string, field: keyof PackageConfig, value: string | number) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const updatePackageInclude = (id: string, index: number, value: string) => {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const includes = [...p.includes];
        includes[index] = value;
        return { ...p, includes };
      })
    );
  };

  const generateSignature = () => {
    const sig = `${settings.owner}
Founder, ${settings.name}
AI-Powered Marketing Automation
${settings.phone}
${settings.email}
https://${settings.calendlyLink}`;
    navigator.clipboard.writeText(sig);
    addToast('Email signature copied!', 'success');
  };

  const copyCalendly = () => {
    navigator.clipboard.writeText(`https://${settings.calendlyLink}`);
    addToast('Calendly link copied!', 'success');
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Settings</h1>
          <p className="text-gray-500 mt-1 font-medium">Configure your agency workspace</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            saved
              ? 'bg-[#00C896] text-white'
              : 'bg-[#6C47FF] text-white hover:bg-[#4C2FBF] shadow-brand'
          }`}
        >
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <Section title="Agency Information" icon={User}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Agency Name">
            <InputField value={settings.name} onChange={(v) => set('name', v)} />
          </Field>
          <Field label="Owner Name">
            <InputField value={settings.owner} onChange={(v) => set('owner', v)} />
          </Field>
          <Field label="Location">
            <InputField value={settings.location} onChange={(v) => set('location', v)} placeholder="Hudson Valley, NY" />
          </Field>
          <Field label="Email">
            <InputField type="email" value={settings.email} onChange={(v) => set('email', v)} placeholder="sheridan@adgorhythms.com" />
          </Field>
          <Field label="Phone">
            <InputField value={settings.phone} onChange={(v) => set('phone', v)} placeholder="(845) 555-0000" />
          </Field>
          <Field label="Website">
            <InputField value={settings.website} onChange={(v) => set('website', v)} placeholder="adgorhythms.com" />
          </Field>
          <div className="col-span-2">
            <Field label="Calendly Link">
              <div className="flex gap-2">
                <InputField
                  value={settings.calendlyLink}
                  onChange={(v) => set('calendlyLink', v)}
                  placeholder="calendly.com/..."
                />
                <button
                  onClick={copyCalendly}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[#6C47FF]/10 text-[#6C47FF] rounded-xl text-sm font-bold hover:bg-[#6C47FF]/20 transition-colors"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Revenue Goals" icon={Target}>
        <div className="grid grid-cols-3 gap-5">
          <Field label="Monthly MRR Goal ($)">
            <InputField
              type="number"
              value={String(settings.monthlyGoal)}
              onChange={(v) => set('monthlyGoal', parseInt(v) || 0)}
              placeholder="10000"
            />
          </Field>
          <Field label="Daily Outreach Goal">
            <InputField
              type="number"
              value={String(settings.dailyOutreachGoal)}
              onChange={(v) => set('dailyOutreachGoal', parseInt(v) || 0)}
              placeholder="5"
            />
          </Field>
          <Field label="Weekly Discovery Call Goal">
            <InputField
              type="number"
              value={String(settings.weeklyCallGoal)}
              onChange={(v) => set('weeklyCallGoal', parseInt(v) || 0)}
              placeholder="2"
            />
          </Field>
        </div>
      </Section>

      <Section title="Service Packages" icon={Package}>
        <div className="space-y-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="border border-gray-100 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#6C47FF] uppercase tracking-widest mb-2">{pkg.id}</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">Name</label>
                      <input
                        value={pkg.name}
                        onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => updatePackage(pkg.id, 'price', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">Best For</label>
                      <input
                        value={pkg.bestFor}
                        onChange={(e) => updatePackage(pkg.id, 'bestFor', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Includes</label>
                <div className="grid grid-cols-2 gap-2">
                  {pkg.includes.map((item, i) => (
                    <input
                      key={i}
                      value={item}
                      onChange={(e) => updatePackageInclude(pkg.id, i, e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 text-gray-600"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Email Signature" icon={Mail}>
        <div className="space-y-4">
          <div className="bg-[#F8F7FF] rounded-xl p-5 font-mono text-sm text-gray-700 leading-relaxed whitespace-pre">
            {settings.owner}
            {'\n'}Founder, {settings.name}
            {'\n'}AI-Powered Marketing Automation
            {'\n'}{settings.phone}
            {'\n'}{settings.email}
            {'\n'}https://{settings.calendlyLink}
          </div>
          <button
            onClick={generateSignature}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl font-bold text-sm hover:bg-[#4C2FBF] transition-colors"
          >
            <Copy size={14} />
            Copy Email Signature
          </button>
        </div>
      </Section>

      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${
            saved
              ? 'bg-[#00C896] text-white'
              : 'bg-[#6C47FF] text-white hover:bg-[#4C2FBF] shadow-brand'
          }`}
        >
          {saved ? 'All Saved!' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}
