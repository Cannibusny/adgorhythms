import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Research keyword (simulated SEO API)
router.post('/research', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });

    // Simulated SEO data
    const hash = keyword.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const results = {
      keyword,
      search_volume: Math.floor((hash % 50000) + 100),
      difficulty: Math.floor((hash % 80) + 10),
      cpc: Math.round(((hash % 2000) / 100 + 0.5) * 100) / 100,
      trend: 'stable',
      related_keywords: [
        `${keyword} tips`,
        `best ${keyword}`,
        `${keyword} for beginners`,
        `how to ${keyword}`,
        `${keyword} strategy`,
      ],
    };

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add keyword to track
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { keyword, search_volume, difficulty, cpc, target_rank } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });

    const { data, error } = await supabase
      .from('seo_keywords')
      .insert({
        workspace_id, keyword, search_volume, difficulty, cpc,
        target_rank, tracked: true,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List tracked keywords
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { tracked } = req.query;

    let query = supabase
      .from('seo_keywords')
      .select('*')
      .eq('workspace_id', workspace_id);

    if (tracked === 'true') query = query.eq('tracked', true);

    const { data, error } = await query.order('last_updated', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update keyword
router.put('/:id', async (req, res) => {
  try {
    const { current_rank, target_rank, tracked } = req.body;
    const updates = { last_updated: new Date().toISOString() };
    if (current_rank !== undefined) updates.current_rank = current_rank;
    if (target_rank !== undefined) updates.target_rank = target_rank;
    if (tracked !== undefined) updates.tracked = tracked;

    const { data, error } = await supabase
      .from('seo_keywords')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete keyword
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('seo_keywords')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keyword suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { seed } = req.query;
    if (!seed) return res.status(400).json({ error: 'seed keyword is required' });

    const suggestions = [
      { keyword: `${seed} marketing`, volume: Math.floor(Math.random() * 10000) + 500, difficulty: Math.floor(Math.random() * 60) + 20 },
      { keyword: `${seed} tips`, volume: Math.floor(Math.random() * 8000) + 300, difficulty: Math.floor(Math.random() * 50) + 15 },
      { keyword: `best ${seed}`, volume: Math.floor(Math.random() * 15000) + 1000, difficulty: Math.floor(Math.random() * 70) + 25 },
      { keyword: `${seed} for small business`, volume: Math.floor(Math.random() * 5000) + 200, difficulty: Math.floor(Math.random() * 40) + 10 },
      { keyword: `${seed} strategy`, volume: Math.floor(Math.random() * 7000) + 400, difficulty: Math.floor(Math.random() * 55) + 20 },
      { keyword: `how to ${seed}`, volume: Math.floor(Math.random() * 12000) + 800, difficulty: Math.floor(Math.random() * 45) + 15 },
      { keyword: `${seed} examples`, volume: Math.floor(Math.random() * 6000) + 300, difficulty: Math.floor(Math.random() * 35) + 10 },
      { keyword: `${seed} tools`, volume: Math.floor(Math.random() * 9000) + 600, difficulty: Math.floor(Math.random() * 50) + 20 },
    ];

    res.json({ data: suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
