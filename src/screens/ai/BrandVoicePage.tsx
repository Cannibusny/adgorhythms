import { useState, useEffect } from 'react';
import { Save, Sparkles, Loader2 } from 'lucide-react';
import type { BrandVoice, BrandTone } from '../../types/ai';
import { TONE_DESCRIPTIONS, INDUSTRY_OPTIONS } from '../../types/ai';
import { brandVoiceApi, aiGenerateApi } from '../../lib/aiApi';

const tones: BrandTone[] = ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'empathetic'];

export default function BrandVoicePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tone, setTone] = useState<BrandTone>('professional');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keyValues, setKeyValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState('');
  const [avoidWords, setAvoidWords] = useState<string[]>([]);
  const [newAvoidWord, setNewAvoidWord] = useState('');
  const [sampleContent, setSampleContent] = useState('');
  const [testTopic, setTestTopic] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadBrandVoice();
  }, []);

  const loadBrandVoice = async () => {
    try {
      const data = await brandVoiceApi.get();
      if (data) {
        setTone(data.tone);
        setIndustry(data.industry || '');
        setTargetAudience(data.target_audience || '');
        setKeyValues(data.key_values || []);
        setAvoidWords(data.avoid_words || []);
        setSampleContent(data.sample_content || '');
      }
    } catch {
      /* first time - no brand voice yet */
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await brandVoiceApi.update({
        tone,
        industry: industry || null,
        target_audience: targetAudience || null,
        key_values: keyValues,
        avoid_words: avoidWords,
        sample_content: sampleContent || null,
      } as Partial<BrandVoice>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!sampleContent.trim()) return;
    setAnalyzing(true);
    try {
      const result = await brandVoiceApi.analyze(sampleContent);
      setTone(result.suggestions.tone);
      setKeyValues(result.suggestions.key_values);
      setAvoidWords(result.suggestions.avoid_words);
    } catch {
      /* ignore */
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTestVoice = async () => {
    if (!testTopic.trim()) return;
    setTestLoading(true);
    setTestResult('');
    try {
      const item = await aiGenerateApi.generateSingle({
        content_type: 'social_post',
        topic: testTopic,
      });
      setTestResult(item.content);
    } catch {
      setTestResult('Error generating test content.');
    } finally {
      setTestLoading(false);
    }
  };

  const addValue = () => {
    if (newValue.trim() && !keyValues.includes(newValue.trim())) {
      setKeyValues([...keyValues, newValue.trim()]);
      setNewValue('');
    }
  };

  const removeValue = (v: string) => setKeyValues(keyValues.filter((x) => x !== v));

  const addAvoidWord = () => {
    if (newAvoidWord.trim() && !avoidWords.includes(newAvoidWord.trim())) {
      setAvoidWords([...avoidWords, newAvoidWord.trim()]);
      setNewAvoidWord('');
    }
  };

  const removeAvoidWord = (w: string) => setAvoidWords(avoidWords.filter((x) => x !== w));

  if (loading) return <div className="p-6 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Brand Voice Settings</h1>
        <p className="text-gray-500 mt-1">Configure how AI generates content for your brand</p>
      </div>

      {/* Tone Selector */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tone</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tones.map((t) => (
            <label key={t} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${tone === t ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
              <input type="radio" name="tone" checked={tone === t} onChange={() => setTone(t)} className="mt-0.5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 capitalize">{t}</div>
                <div className="text-xs text-gray-500">{TONE_DESCRIPTIONS[t]}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Industry & Audience */}
      <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Select industry...</option>
            {INDUSTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="e.g., 25-45 wellness-focused consumers"
          />
        </div>
      </div>

      {/* Key Values */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Values</h3>
        <p className="text-xs text-gray-500 mb-3">Add values your brand represents</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {keyValues.map((v) => (
            <span key={v} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
              {v}
              <button onClick={() => removeValue(v)} className="hover:text-red-600">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addValue()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="e.g., Sustainability, Innovation"
          />
          <button onClick={addValue} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Add</button>
        </div>
      </div>

      {/* Words to Avoid */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Words to Avoid</h3>
        <p className="text-xs text-gray-500 mb-3">Words or phrases AI should never use</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {avoidWords.map((w) => (
            <span key={w} className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded-full flex items-center gap-1">
              {w}
              <button onClick={() => removeAvoidWord(w)} className="hover:text-red-900">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newAvoidWord}
            onChange={(e) => setNewAvoidWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAvoidWord()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="e.g., cheap, discount"
          />
          <button onClick={addAvoidWord} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Add</button>
        </div>
      </div>

      {/* Sample Content */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sample Content</h3>
        <p className="text-xs text-gray-500 mb-3">Paste 2-3 examples of your best content for AI to learn your style</p>
        <textarea
          value={sampleContent}
          onChange={(e) => setSampleContent(e.target.value)}
          rows={6}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-3"
          placeholder="Paste your best content here..."
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !sampleContent.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Analyze My Style
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 mb-8"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saved ? 'Saved!' : 'Save Brand Voice'}
      </button>

      {/* Test Your Brand Voice */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Test Your Brand Voice</h3>
        <p className="text-xs text-gray-500 mb-3">Generate a sample post using your current brand voice settings</p>
        <div className="flex gap-2 mb-4">
          <input
            value={testTopic}
            onChange={(e) => setTestTopic(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="e.g., new product launch"
          />
          <button
            onClick={handleTestVoice}
            disabled={testLoading || !testTopic.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            {testLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate
          </button>
        </div>
        {testResult && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{testResult}</div>
        )}
      </div>
    </div>
  );
}
