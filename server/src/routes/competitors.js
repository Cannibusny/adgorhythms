import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Add competitor
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { competitor_name, platform, account_handle } = req.body;
    if (!competitor_name) return res.status(400).json({ error: 'competitor_name is required' });

    // Simulate initial data
    const follower_count = Math.floor(Math.random() * 500000) + 100;
    const avg_engagement_rate = parseFloat((Math.random() * 6 + 0.5).toFixed(2));

    const { data, error } = await supabase
      .from('competitor_tracking')
      .insert({
        workspace_id,
        competitor_name,
        platform: platform || null,
        account_handle: account_handle || null,
        follower_count,
        avg_engagement_rate,
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List tracked competitors
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { platform } = req.query;

    let query = supabase
      .from('competitor_tracking')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('last_synced_at', { ascending: false });

    if (platform) query = query.eq('platform', platform);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get competitor detail
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('competitor_tracking')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Competitor not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete competitor
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('competitor_tracking')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync competitor data (simulates fetching latest stats)
router.post('/:id/sync', async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('competitor_tracking')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (fetchErr) return res.status(404).json({ error: 'Competitor not found' });

    const followerChange = Math.floor(Math.random() * 2000) - 500;
    const engagementChange = parseFloat((Math.random() * 1 - 0.3).toFixed(2));

    const { data, error } = await supabase
      .from('competitor_tracking')
      .update({
        follower_count: Math.max(0, (existing.follower_count || 0) + followerChange),
        avg_engagement_rate: Math.max(0, parseFloat(((existing.avg_engagement_rate || 0) + engagementChange).toFixed(2))),
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
