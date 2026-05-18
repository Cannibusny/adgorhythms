import { useState, useEffect } from 'react';
import { Shield, Search, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { seoAuditApi } from '../../lib/seoCalendarApi';
import type { SeoSiteAudit } from '../../types/seoCalendar';

export default function SiteAuditPage() {
  const [audits, setAudits] = useState<SeoSiteAudit[]>([]);
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<SeoSiteAudit | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('critical');

  const loadAudits = async () => {
    try {
      const res = await seoAuditApi.list();
      setAudits(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadAudits(); }, []);

  const runAudit = async () => {
    if (!url.trim()) return;
    setRunning(true);
    try {
      const result = await seoAuditApi.run(url);
      setSelected(result);
      loadAudits();
    } catch { /* ignore */ }
    setRunning(false);
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500/20 to-green-500/5';
    if (score >= 50) return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={24} /> Site Audit
        </h1>
        <p className="text-gray-400 text-sm mt-1">Audit your website for SEO issues and opportunities</p>
      </div>

      {/* Run Audit */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAudit()}
            className="flex-1 px-4 py-2.5 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter URL to audit (e.g. https://example.com)"
          />
          <button onClick={runAudit} disabled={running} className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            <Search size={16} /> {running ? 'Auditing...' : 'Run Audit'}
          </button>
        </div>
      </div>

      {/* Selected Audit Detail */}
      {selected && (
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">Audit Results</h3>
              <p className="text-gray-400 text-xs mt-0.5">{selected.url} • {new Date(selected.audited_at).toLocaleString()}</p>
            </div>
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-b ${scoreBg(selected.audit_score)} flex items-center justify-center`}>
              <div className={`text-3xl font-bold ${scoreColor(selected.audit_score)}`}>{selected.audit_score}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-500/10 rounded-xl p-3 text-center">
              <AlertCircle size={20} className="mx-auto text-red-400 mb-1" />
              <div className="text-xl font-bold text-red-400">{selected.issues_critical}</div>
              <div className="text-xs text-gray-400">Critical</div>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
              <AlertTriangle size={20} className="mx-auto text-yellow-400 mb-1" />
              <div className="text-xl font-bold text-yellow-400">{selected.issues_warnings}</div>
              <div className="text-xs text-gray-400">Warnings</div>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-3 text-center">
              <Info size={20} className="mx-auto text-blue-400 mb-1" />
              <div className="text-xl font-bold text-blue-400">{selected.issues_info}</div>
              <div className="text-xs text-gray-400">Info</div>
            </div>
          </div>

          {/* Issue sections */}
          {(['critical', 'warnings', 'info'] as const).map((section) => {
            const items = selected.issues_details?.[section] || [];
            if (items.length === 0) return null;
            const isExpanded = expandedSection === section;
            const colors = { critical: 'text-red-400', warnings: 'text-yellow-400', info: 'text-blue-400' };
            return (
              <div key={section} className="mb-3">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section)}
                  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10"
                >
                  <span className={`text-sm font-medium capitalize ${colors[section]}`}>
                    {section} ({items.length})
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {isExpanded && (
                  <div className="mt-2 space-y-2 pl-3">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          section === 'critical' ? 'bg-red-400' : section === 'warnings' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`} />
                        <div>
                          <div className="text-gray-300">{item.issue}</div>
                          {item.page && <div className="text-xs text-gray-500">{item.page}</div>}
                          {item.pages && <div className="text-xs text-gray-500">{item.pages} pages affected</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Past Audits */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <h3 className="text-white font-semibold mb-4">Audit History</h3>
        {audits.length === 0 ? (
          <p className="text-gray-400 text-sm">No audits yet. Enter a URL above to run your first audit.</p>
        ) : (
          <div className="space-y-2">
            {audits.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors ${
                  selected?.id === a.id ? 'bg-white/10' : 'bg-white/5'
                }`}
              >
                <div className="text-left">
                  <div className="text-sm text-white">{a.url}</div>
                  <div className="text-xs text-gray-400">{new Date(a.audited_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-400">{a.issues_critical} critical</span>
                    <span className="text-yellow-400">{a.issues_warnings} warn</span>
                  </div>
                  <div className={`text-lg font-bold ${scoreColor(a.audit_score)}`}>{a.audit_score}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
