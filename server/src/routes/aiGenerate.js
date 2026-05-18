import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Main generation endpoint (stub - simulates AI content generation)
router.post('/generate', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { generation_type, input, content_types, quantity } = req.body;
    if (!generation_type || !input) {
      return res.status(400).json({ error: 'generation_type and input are required' });
    }

    const startTime = Date.now();

    // Create generation record
    const { data: generation, error: genError } = await supabase
      .from('content_generations')
      .insert({
        workspace_id,
        generation_type,
        input_source: generation_type === 'url' ? input : null,
        input_transcript: generation_type !== 'url' ? input : null,
        status: 'processing',
      })
      .select()
      .single();

    if (genError) return res.status(400).json({ error: genError.message });

    // Fetch brand voice settings
    const { data: brandVoice } = await supabase
      .from('ai_brand_voice')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single();

    const tone = brandVoice?.tone || 'professional';
    const industry = brandVoice?.industry || 'general';

    // Simulate AI content generation
    const requestedTypes = content_types || ['social_post', 'email', 'blog', 'landing_page', 'ad_copy', 'video_script'];
    const counts = quantity || { social_posts: 30, emails: 5, blogs: 3 };
    const libraryItems = [];

    if (requestedTypes.includes('social_post')) {
      const platforms = [
        { platform: 'instagram', count: 10 },
        { platform: 'facebook', count: 10 },
        { platform: 'linkedin', count: 5 },
        { platform: 'twitter', count: 5 },
      ];
      for (const p of platforms) {
        const num = Math.min(p.count, counts.social_posts || 30);
        for (let i = 0; i < num; i++) {
          libraryItems.push({
            workspace_id,
            generation_id: generation.id,
            content_type: 'social_post',
            platform: p.platform,
            title: `${p.platform} post ${i + 1}`,
            content: `[AI Generated - ${tone} tone, ${industry} industry] ${p.platform} post about: ${input.substring(0, 100)}... #marketing #business`,
            media_suggestions: { type: 'image', suggestion: 'Product photo or lifestyle image' },
            hashtags: ['marketing', 'business', industry.toLowerCase()],
            status: 'draft',
          });
        }
      }
    }

    if (requestedTypes.includes('email')) {
      const emailSubjects = ['Welcome & Introduction', 'Problem & Pain Point', 'Solution & Benefits', 'Social Proof & Testimonials', 'Special Offer & CTA'];
      const numEmails = Math.min(emailSubjects.length, counts.emails || 5);
      for (let i = 0; i < numEmails; i++) {
        libraryItems.push({
          workspace_id,
          generation_id: generation.id,
          content_type: 'email',
          title: `Email ${i + 1}: ${emailSubjects[i]}`,
          content: `[AI Generated - ${tone} tone]\n\nSubject: ${emailSubjects[i]}\nPreview: Discover how we can help...\n\nDear valued customer,\n\n${emailSubjects[i]} content based on: ${input.substring(0, 100)}...\n\nBest regards,\nYour Team`,
          status: 'draft',
        });
      }
    }

    if (requestedTypes.includes('blog')) {
      const blogTypes = ['How-To Guide', 'Top 10 Listicle', 'Thought Leadership'];
      const numBlogs = Math.min(blogTypes.length, counts.blogs || 3);
      for (let i = 0; i < numBlogs; i++) {
        libraryItems.push({
          workspace_id,
          generation_id: generation.id,
          content_type: 'blog',
          title: `${blogTypes[i]}: Generated from your input`,
          content: `[AI Generated - ${tone} tone, ${industry} industry]\n\n# ${blogTypes[i]}\n\n## Introduction\nBased on: ${input.substring(0, 200)}...\n\n## Key Points\n- Point 1\n- Point 2\n- Point 3\n\n## Conclusion\nTake action today.`,
          media_suggestions: { type: 'featured_image', suggestion: 'Hero image related to topic' },
          status: 'draft',
        });
      }
    }

    if (requestedTypes.includes('landing_page')) {
      libraryItems.push({
        workspace_id,
        generation_id: generation.id,
        content_type: 'landing_page',
        title: 'Landing Page Copy',
        content: `[AI Generated - ${tone} tone]\n\n## Hero\nHeadline: Transform Your Business Today\nSubheadline: The solution you've been looking for\n\n## Benefits\n1. Save Time - Automate your workflow\n2. Grow Revenue - Reach more customers\n3. Scale Easily - Built for growth\n\n## Social Proof\n"This changed everything for our business." - Happy Customer\n\n## CTA\nGet Started Now - It's Free`,
        status: 'draft',
      });
    }

    if (requestedTypes.includes('ad_copy')) {
      const adTypes = [
        { platform: 'facebook', label: 'Facebook Ad' },
        { platform: 'facebook', label: 'Facebook Ad' },
        { platform: 'google', label: 'Google Ad' },
        { platform: 'google', label: 'Google Ad' },
        { platform: 'linkedin', label: 'LinkedIn Ad' },
        { platform: 'linkedin', label: 'LinkedIn Ad' },
      ];
      for (let i = 0; i < adTypes.length; i++) {
        libraryItems.push({
          workspace_id,
          generation_id: generation.id,
          content_type: 'ad_copy',
          platform: adTypes[i].platform,
          title: `${adTypes[i].label} Variation ${Math.floor(i / 2) + 1}`,
          content: `[AI Generated - ${tone} tone]\n\nHeadline: Discover the Difference\nPrimary Text: Based on: ${input.substring(0, 80)}...\nCTA: Learn More`,
          status: 'draft',
        });
      }
    }

    if (requestedTypes.includes('video_script')) {
      const scriptTypes = ['30-second Explainer', '60-second Tutorial', '90-second Story'];
      for (let i = 0; i < scriptTypes.length; i++) {
        libraryItems.push({
          workspace_id,
          generation_id: generation.id,
          content_type: 'video_script',
          title: `Video Script: ${scriptTypes[i]}`,
          content: `[AI Generated - ${tone} tone]\n\n## ${scriptTypes[i]}\n\nScene 1: Introduction\nVisual: Product shot\nVoiceover: "Are you tired of..."\n\nScene 2: Solution\nVisual: Demo footage\nVoiceover: "Introducing..."\n\nScene 3: CTA\nVisual: Logo + website\nVoiceover: "Get started today at..."`,
          media_suggestions: { type: 'video', suggestion: 'Product demo footage' },
          status: 'draft',
        });
      }
    }

    // Insert all library items
    if (libraryItems.length > 0) {
      const { error: libError } = await supabase
        .from('content_library')
        .insert(libraryItems);
      if (libError) {
        await supabase.from('content_generations').update({ status: 'failed' }).eq('id', generation.id);
        return res.status(400).json({ error: libError.message });
      }
    }

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    // Update generation as completed
    const { data: completed, error: updateError } = await supabase
      .from('content_generations')
      .update({
        status: 'completed',
        business_context: { tone, industry, input_length: input.length },
        generated_content: { total_items: libraryItems.length, types: requestedTypes },
        tokens_used: Math.floor(Math.random() * 10000) + 5000,
        generation_time_seconds: elapsedSeconds || 1,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id)
      .select()
      .single();

    if (updateError) return res.status(400).json({ error: updateError.message });
    res.status(201).json({ generation: completed, items_created: libraryItems.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate single piece of content
router.post('/generate-single', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { content_type, platform, topic } = req.body;
    if (!content_type || !topic) {
      return res.status(400).json({ error: 'content_type and topic are required' });
    }

    const { data: brandVoice } = await supabase
      .from('ai_brand_voice')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single();

    const tone = brandVoice?.tone || 'professional';

    const { data, error } = await supabase
      .from('content_library')
      .insert({
        workspace_id,
        content_type,
        platform: platform || null,
        title: `${content_type}: ${topic}`,
        content: `[AI Generated - ${tone} tone] Content about: ${topic}`,
        status: 'draft',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get generation status and results
router.get('/generations/:id', async (req, res) => {
  try {
    const { data: generation, error: genError } = await supabase
      .from('content_generations')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (genError) return res.status(404).json({ error: 'Generation not found' });

    const { data: items, error: itemsError } = await supabase
      .from('content_library')
      .select('*')
      .eq('generation_id', req.params.id)
      .order('content_type')
      .order('created_at');

    if (itemsError) return res.status(400).json({ error: itemsError.message });
    res.json({ generation, items: items || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all generations
router.get('/generations', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('content_generations')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
