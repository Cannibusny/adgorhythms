export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type InboxMessageType = 'comment' | 'dm' | 'mention';

export interface SocialAccount {
  id: string;
  workspace_id: string;
  platform: SocialPlatform;
  account_name: string;
  account_handle: string | null;
  profile_image_url: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  is_connected: boolean;
  created_at: string;
}

export interface SocialPost {
  id: string;
  workspace_id: string;
  account_id: string;
  content: string;
  media_urls: string[] | null;
  scheduled_for: string | null;
  status: PostStatus;
  platform_post_id: string | null;
  published_at: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reach: number;
  created_at: string;
  social_accounts?: Pick<SocialAccount, 'platform' | 'account_name' | 'account_handle'> | null;
}

export interface SocialInboxMessage {
  id: string;
  workspace_id: string;
  account_id: string;
  message_type: InboxMessageType;
  from_user: string;
  from_user_handle: string | null;
  message_text: string | null;
  platform_message_id: string | null;
  replied: boolean;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
  social_accounts?: Pick<SocialAccount, 'platform' | 'account_name' | 'account_handle'> | null;
}

export interface HashtagResearch {
  id: string;
  workspace_id: string;
  hashtag: string;
  platform: string | null;
  post_count: number | null;
  engagement_rate: number | null;
  difficulty_score: number | null;
  last_updated: string;
}

export interface CompetitorTracking {
  id: string;
  workspace_id: string;
  competitor_name: string;
  platform: string | null;
  account_handle: string | null;
  follower_count: number | null;
  avg_engagement_rate: number | null;
  last_synced_at: string;
}

export interface HashtagSuggestion {
  hashtag: string;
  relevance: number;
}

export const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
};

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  tiktok: '#000000',
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
};
