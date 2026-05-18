import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Initiate OAuth connection (stub - stores account info)
router.post('/connect', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { platform, account_name, account_handle, profile_image_url } = req.body;
    if (!platform || !account_name) {
      return res.status(400).json({ error: 'platform and account_name are required' });
    }
    const { data, error } = await supabase
      .from('social_accounts')
      .insert({
        workspace_id,
        platform,
        account_name,
        account_handle,
        profile_image_url,
        is_connected: true,
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List connected accounts
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect account
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh access token (stub)
router.post('/:id/refresh', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('social_accounts')
      .update({
        is_connected: true,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
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
