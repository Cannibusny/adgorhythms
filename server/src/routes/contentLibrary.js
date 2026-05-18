import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// List all library content with filters
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { content_type, platform, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('content_library')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (content_type) query = query.eq('content_type', content_type);
    if (platform) query = query.eq('platform', platform);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get content details
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Content not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update content
router.put('/:id', async (req, res) => {
  try {
    const { title, content, hashtags, platform } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (hashtags !== undefined) updates.hashtags = hashtags;
    if (platform !== undefined) updates.platform = platform;

    const { data, error } = await supabase
      .from('content_library')
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

// Delete content
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('content_library')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve content
router.post('/:id/approve', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_library')
      .update({ status: 'approved' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish content
router.post('/:id/publish', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_library')
      .update({ status: 'published', used_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule content (sets status to approved and used_at for future)
router.post('/:id/schedule', async (req, res) => {
  try {
    const { scheduled_for } = req.body;
    const { data, error } = await supabase
      .from('content_library')
      .update({ status: 'approved', used_at: scheduled_for || new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk approve
router.post('/bulk-approve', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const { data, error } = await supabase
      .from('content_library')
      .update({ status: 'approved' })
      .in('id', ids)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ updated: data?.length || 0, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk archive
router.post('/bulk-archive', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const { data, error } = await supabase
      .from('content_library')
      .update({ status: 'archived' })
      .in('id', ids)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ updated: data?.length || 0, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const { error } = await supabase
      .from('content_library')
      .delete()
      .in('id', ids);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
