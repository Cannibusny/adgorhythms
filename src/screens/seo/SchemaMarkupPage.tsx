import { useState, useEffect } from 'react';
import { Code, Copy, Check, Trash2, Download, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { schemaMarkupApi } from '../../lib/aiEnhancementsApi';
import type { SchemaLibraryItem } from '../../types/aiEnhancements';

const SCHEMA_TYPES = ['Product', 'LocalBusiness', 'Article', 'FAQ', 'Review', 'Event'];

export default function SchemaMarkupPage() {
  const [schemaType, setSchemaType] = useState('Product');
  const [url, setUrl] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [faqQuestions, setFaqQuestions] = useState([{ question: '', answer: '' }]);
  const [generatedSchema, setGeneratedSchema] = useState<Record<string, unknown> | null>(null);
  const [scriptTag, setScriptTag] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [library, setLibrary] = useState<SchemaLibraryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState('');

  const loadLibrary = async () => {
    try {
      const res = await schemaMarkupApi.listLibrary();
      setLibrary(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadLibrary(); }, []);

  const fields: Record<string, string[]> = {
    Product: ['name', 'description', 'brand', 'price', 'currency', 'image'],
    LocalBusiness: ['name', 'description', 'phone', 'url', 'street', 'city', 'state', 'zip'],
    Article: ['headline', 'author', 'datePublished', 'description', 'image'],
    FAQ: [],
    Review: ['itemName', 'author', 'rating', 'body'],
    Event: ['name', 'startDate', 'endDate', 'location', 'address', 'description', 'organizer'],
  };

  const autoFill = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await schemaMarkupApi.autoFill(url, schemaType);
      if (res.data) {
        if (schemaType === 'FAQ' && res.data.questions) {
          setFaqQuestions(res.data.questions);
        } else {
          setFormData(res.data);
        }
      }
      if (res.schema) {
        setGeneratedSchema(res.schema);
        setScriptTag(`<script type="application/ld+json">\n${JSON.stringify(res.schema, null, 2)}\n</script>`);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const generate = async () => {
    setLoading(true);
    try {
      const data = schemaType === 'FAQ' ? { questions: faqQuestions } : formData;
      const res = await schemaMarkupApi.generate(schemaType, data);
      setGeneratedSchema(res.schema);
      setScriptTag(res.script_tag);
      const val = await schemaMarkupApi.validate(res.schema);
      setValidation(val);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSchema = async () => {
    if (!saveName || !generatedSchema) return;
    await schemaMarkupApi.saveToLibrary({ name: saveName, schema_type: schemaType, schema_data: generatedSchema, script_tag: scriptTag });
    setSaveName('');
    loadLibrary();
  };

  const deleteSchema = async (id: string) => {
    await schemaMarkupApi.deleteFromLibrary(id);
    loadLibrary();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Code size={24} /> Schema Markup Generator
        </h1>
        <p className="text-gray-400 text-sm mt-1">Generate JSON-LD structured data for Google rich snippets</p>
      </div>

      {/* Schema Type Selector */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="text-xs text-gray-400 mb-3">Select Schema Type</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {SCHEMA_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setSchemaType(t); setFormData({}); setGeneratedSchema(null); setValidation(null); }}
              className={`py-2.5 rounded-xl text-sm font-medium ${
                schemaType === t ? 'bg-[#6C47FF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Fill from URL */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm"
            placeholder="Enter URL to auto-fill schema data with AI..."
          />
          <button onClick={autoFill} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#00C896] text-white rounded-xl text-sm font-medium hover:bg-[#00b085] disabled:opacity-50">
            <Sparkles size={16} /> AI Auto-Fill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-semibold mb-4">{schemaType} Fields</h3>
          {schemaType === 'FAQ' ? (
            <div className="space-y-3">
              {faqQuestions.map((q, i) => (
                <div key={i} className="bg-[#12121F] rounded-xl p-3 space-y-2">
                  <input value={q.question} onChange={(e) => { const nq = [...faqQuestions]; nq[i] = { ...nq[i], question: e.target.value }; setFaqQuestions(nq); }} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder={`Question ${i + 1}`} />
                  <textarea value={q.answer} onChange={(e) => { const nq = [...faqQuestions]; nq[i] = { ...nq[i], answer: e.target.value }; setFaqQuestions(nq); }} rows={2} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Answer" />
                </div>
              ))}
              <button onClick={() => setFaqQuestions([...faqQuestions, { question: '', answer: '' }])} className="text-xs text-[#6C47FF] hover:text-[#5a3ad4]">+ Add Question</button>
            </div>
          ) : (
            <div className="space-y-3">
              {(fields[schemaType] || []).map((field) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    value={formData[field] || ''}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1"
                    placeholder={field}
                  />
                </div>
              ))}
            </div>
          )}
          <button onClick={generate} disabled={loading} className="w-full mt-4 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate Schema'}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {generatedSchema && (
            <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Generated JSON-LD</h3>
                <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded-lg hover:bg-white/20">
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                </button>
              </div>
              <pre className="bg-[#12121F] rounded-xl p-4 text-xs text-green-400 overflow-x-auto max-h-64 overflow-y-auto">
                {scriptTag}
              </pre>
            </div>
          )}

          {/* Validation */}
          {validation && (
            <div className={`bg-[#1E1E36] rounded-2xl border p-4 ${validation.valid ? 'border-green-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {validation.valid ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-red-400" />}
                <span className={`text-sm font-medium ${validation.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {validation.valid ? 'Schema is valid' : 'Schema has issues'}
                </span>
              </div>
              {validation.errors.map((e, i) => <div key={i} className="text-xs text-red-400 ml-6">• {e}</div>)}
              {validation.warnings.map((w, i) => <div key={i} className="text-xs text-yellow-400 ml-6">• {w}</div>)}
            </div>
          )}

          {/* Save */}
          {generatedSchema && (
            <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4">
              <div className="flex gap-2">
                <input value={saveName} onChange={(e) => setSaveName(e.target.value)} className="flex-1 px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Schema name to save..." />
                <button onClick={saveSchema} disabled={!saveName} className="px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
                  <Download size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Library */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <h3 className="text-white font-semibold mb-4">Schema Library ({library.length})</h3>
        {library.length === 0 ? (
          <p className="text-gray-400 text-sm">No saved schemas. Generate and save schemas to reuse them.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {library.map((item) => (
              <div key={item.id} className="bg-[#12121F] rounded-xl p-4 flex items-start justify-between">
                <div>
                  <div className="text-white font-medium text-sm">{item.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-[#6C47FF]/10 text-[#6C47FF] rounded text-xs">{item.schema_type}</span>
                    <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setGeneratedSchema(item.schema_data); setScriptTag(item.script_tag); }} className="p-1.5 text-gray-400 hover:text-white"><Copy size={14} /></button>
                  <button onClick={() => deleteSchema(item.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
