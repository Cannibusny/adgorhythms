import { supabase } from '../supabase.js';

export async function publishScheduledPosts() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from('social_posts')
    .select('*, social_accounts(platform, account_name)')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now);

  if (error) {
    console.error('[POST_PUBLISHER] Error fetching scheduled posts:', error.message);
    return;
  }

  if (!posts || posts.length === 0) return;

  console.log(`[POST_PUBLISHER] Publishing ${posts.length} scheduled posts...`);

  for (const post of posts) {
    try {
      // In production, this would call the platform API to publish
      const { error: updateErr } = await supabase
        .from('social_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateErr) {
        console.error(`[POST_PUBLISHER] Failed to publish post ${post.id}:`, updateErr.message);
        await supabase
          .from('social_posts')
          .update({ status: 'failed' })
          .eq('id', post.id);
      } else {
        console.log(`[POST_PUBLISHER] Published post ${post.id} to ${post.social_accounts?.platform}`);
      }
    } catch (err) {
      console.error(`[POST_PUBLISHER] Error publishing post ${post.id}:`, err.message);
      await supabase
        .from('social_posts')
        .update({ status: 'failed' })
        .eq('id', post.id);
    }
  }
}
