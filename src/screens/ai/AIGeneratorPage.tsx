import { useState } from 'react';
import { Mic, FileText, Globe, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { aiGenerateApi } from '../../lib/aiApi';
import type { ContentType } from '../../types/ai';
import { CONTENT_TYPE_LABELS } from '../../types/ai';
import { useNavigate } from 'react-router-dom';

type InputTab = 'voice' | 'text' | 'url';

const contentTypeOptions: ContentType[] = ['social_post', 'email', 'blog', 'landing_page', 'ad_copy', 'video_script'];

export default function AIGeneratorPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<InputTab>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(['social_post', 'email', 'blog']);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState<{ generationId: string; itemsCreated: number } | null>(null);
  const [error, setError] = useState('');

  const toggleType = (t: ContentType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setVoiceTranscript('');
    const interval = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 300) {
          clearInterval(interval);
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    (window as Record<string, unknown>).__recordingInterval = interval;
  };

  const stopRecording = () => {
    setIsRecording(false);
    const interval = (window as Record<string, unknown>).__recordingInterval as ReturnType<typeof setInterval> | undefined;
    if (interval) clearInterval(interval);
    setVoiceTranscript('(Simulated voice transcript) I run a marketing agency that helps small businesses grow their online presence. We offer social media management, email marketing, and content creation services. Our target audience is small business owners who are too busy to handle their own marketing. We differentiate ourselves by providing personalized service and data-driven strategies.');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getInput = (): string => {
    if (tab === 'voice') return voiceTranscript;
    if (tab === 'url') return urlInput;
    return textInput;
  };

  const handleGenerate = async () => {
    const input = getInput();
    if (!input.trim()) {
      setError('Please provide input before generating.');
      return;
    }
    if (selectedTypes.length === 0) {
      setError('Select at least one content type.');
      return;
    }

    setError('');
    setGenerating(true);
    setProgress(0);
    setResult(null);

    const steps = [
      { pct: 20, label: 'Analyzing your input...' },
      { pct: 40, label: 'Generating social posts...' },
      { pct: 60, label: 'Writing email campaigns...' },
      { pct: 80, label: 'Creating blog articles...' },
      { pct: 95, label: 'Finalizing ad copy and scripts...' },
    ];

    for (const step of steps) {
      setProgress(step.pct);
      setProgressLabel(step.label);
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const res = await aiGenerateApi.generate({
        generation_type: tab,
        input: input.trim(),
        content_types: selectedTypes,
      });
      setProgress(100);
      setProgressLabel('Complete!');
      setResult({ generationId: res.generation.id, itemsCreated: res.items_created });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Content Generator</h1>
        <p className="text-gray-500 mt-1">Speak, type, or paste a URL — AI generates 30+ pieces of marketing content</p>
      </div>

      {result ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Content Generated Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Generated <span className="font-semibold text-blue-600">{result.itemsCreated}</span> pieces of content
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/ai/library')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              View All in Content Library
            </button>
            <button onClick={() => { setResult(null); setProgress(0); }} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
              Generate More
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Input Tabs */}
          <div className="bg-white rounded-xl border mb-6">
            <div className="flex border-b">
              {([
                { key: 'voice' as InputTab, icon: Mic, label: 'Voice Input' },
                { key: 'text' as InputTab, icon: FileText, label: 'Text Input' },
                { key: 'url' as InputTab, icon: Globe, label: 'URL Input' },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => !generating && setTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                    tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'voice' && (
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-6">
                    Talk for 2-5 minutes about your business, product, or campaign. Mention: What you offer, who it&apos;s for, what problems you solve, what makes you different.
                  </p>
                  {!voiceTranscript ? (
                    <>
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
                          isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Mic size={48} className="text-white" />
                      </button>
                      <p className="text-sm font-medium text-gray-700">
                        {isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Click to Record Your Pitch'}
                      </p>
                      {isRecording && (
                        <div className="mt-4 h-8 flex items-center justify-center gap-1">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: `${Math.random() * 24 + 8}px`, animationDelay: `${i * 0.05}s` }} />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-left">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-700">{voiceTranscript}</p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => {}} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Play Back</button>
                        <button onClick={() => setVoiceTranscript('')} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Record Again</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'text' && (
                <div>
                  <p className="text-gray-500 text-sm mb-3">
                    Describe your business, product, or campaign. Include: What you offer, target audience, pain points, benefits, unique selling points.
                  </p>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={8}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Tell us about your business..."
                    disabled={generating}
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">{textInput.length} characters</div>
                </div>
              )}

              {tab === 'url' && (
                <div>
                  <p className="text-gray-500 text-sm mb-3">
                    Import content from your website to generate marketing materials.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://yourwebsite.com"
                      disabled={generating}
                    />
                    <button className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Fetch Content</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Type Selector */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">What do you want to generate?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {contentTypeOptions.map((type) => (
                <label key={type} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTypes.includes(type) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="rounded text-blue-600"
                    disabled={generating}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{CONTENT_TYPE_LABELS[type]}</div>
                    <div className="text-xs text-gray-500">
                      {type === 'social_post' && '30 posts across platforms'}
                      {type === 'email' && '5 email sequences'}
                      {type === 'blog' && '3 long-form posts'}
                      {type === 'landing_page' && 'Full page copy'}
                      {type === 'ad_copy' && 'Facebook, Google, LinkedIn'}
                      {type === 'video_script' && '3 scripts'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Generate Button / Progress */}
          {generating ? (
            <div className="bg-white rounded-xl border p-8">
              <div className="text-center mb-4">
                <Loader2 size={32} className="text-blue-600 animate-spin mx-auto mb-3" />
                <p className="font-medium text-gray-900">{progressLabel}</p>
                <p className="text-xs text-gray-500 mt-1">This usually takes 2-5 minutes</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">{progress}% complete</p>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Sparkles size={20} />
              Generate Content
            </button>
          )}
        </>
      )}
    </div>
  );
}
