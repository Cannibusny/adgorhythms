export type GenerationType = 'voice' | 'text' | 'url';
export type GenerationStatus = 'processing' | 'completed' | 'failed';
export type ContentType = 'social_post' | 'email' | 'blog' | 'landing_page' | 'ad_copy' | 'video_script';
export type ContentStatus = 'draft' | 'approved' | 'published' | 'archived';
export type BrandTone = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'empathetic';

export interface ContentGeneration {
  id: string;
  workspace_id: string;
  generation_type: GenerationType;
  input_source: string | null;
  input_transcript: string | null;
  business_context: Record<string, unknown> | null;
  generated_content: Record<string, unknown> | null;
  status: GenerationStatus;
  tokens_used: number | null;
  generation_time_seconds: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface ContentLibraryItem {
  id: string;
  workspace_id: string;
  generation_id: string | null;
  content_type: ContentType;
  platform: string | null;
  title: string | null;
  content: string;
  media_suggestions: Record<string, unknown> | null;
  hashtags: string[] | null;
  status: ContentStatus;
  used_at: string | null;
  created_at: string;
}

export interface BrandVoice {
  id: string;
  workspace_id: string;
  tone: BrandTone;
  industry: string | null;
  target_audience: string | null;
  key_values: string[];
  avoid_words: string[];
  sample_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentTemplate {
  id: string;
  workspace_id: string;
  template_name: string;
  content_type: string;
  template_structure: Record<string, unknown> | null;
  is_default: boolean;
  created_at: string;
}

export interface BrandVoiceAnalysis {
  analysis: {
    word_count: number;
    avg_word_length: number;
    has_exclamations: boolean;
    has_questions: boolean;
    has_emoji: boolean;
  };
  suggestions: {
    tone: BrandTone;
    key_values: string[];
    avoid_words: string[];
  };
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  social_post: 'Social Post',
  email: 'Email',
  blog: 'Blog Article',
  landing_page: 'Landing Page',
  ad_copy: 'Ad Copy',
  video_script: 'Video Script',
};

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  social_post: '#1DA1F2',
  email: '#E4405F',
  blog: '#10B981',
  landing_page: '#8B5CF6',
  ad_copy: '#F59E0B',
  video_script: '#EF4444',
};

export const TONE_DESCRIPTIONS: Record<BrandTone, string> = {
  professional: 'Formal, credible, expert-focused',
  casual: 'Conversational, approachable, friendly',
  friendly: 'Warm, welcoming, personable',
  authoritative: 'Confident, commanding, decisive',
  playful: 'Fun, energetic, humorous',
  empathetic: 'Understanding, supportive, caring',
};

export const INDUSTRY_OPTIONS = [
  'Cannabis', 'Healthcare', 'Technology', 'E-commerce', 'Education',
  'Finance', 'Real Estate', 'Food & Beverage', 'Fashion', 'Fitness',
  'Travel', 'Entertainment', 'Non-Profit', 'SaaS', 'Agency', 'Other',
];
