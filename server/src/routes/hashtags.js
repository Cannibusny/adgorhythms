import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Research hashtag (simulates API call, stores result)
router.post('/research', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { hashtag, platform } = req.body;
    if (!hashtag) return res.status(400).json({ error: 'hashtag is required' });

    const tag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;

    // Simulate research data
    const post_count = Math.floor(Math.random() * 10000000) + 1000;
    const engagement_rate = parseFloat((Math.random() * 8 + 0.5).toFixed(2));
    const difficulty_score = post_count > 5000000 ? Math.floor(Math.random() * 3) + 8
      : post_count > 1000000 ? Math.floor(Math.random() * 3) + 5
      : Math.floor(Math.random() * 4) + 1;

    const { data, error } = await supabase
      .from('hashtag_research')
      .upsert({
        workspace_id,
        hashtag: tag,
        platform: platform || null,
        post_count,
        engagement_rate,
        difficulty_score,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List saved hashtags
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { platform, sort_by, sort_order } = req.query;

    let query = supabase
      .from('hashtag_research')
      .select('*')
      .eq('workspace_id', workspace_id);

    if (platform) query = query.eq('platform', platform);

    const sortField = sort_by || 'last_updated';
    const ascending = sort_order === 'asc';
    query = query.order(sortField, { ascending });

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete hashtag
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('hashtag_research')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hashtag suggestions based on content
router.get('/suggestions', async (req, res) => {
  try {
    const { content } = req.query;
    if (!content) return res.json({ suggestions: [] });

    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const suggestions = words.slice(0, 10).map(word => ({
      hashtag: `#${word}`,
      relevance: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
    }));
    suggestions.sort((a, b) => b.relevance - a.relevance);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
