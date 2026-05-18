import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Create post
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const postData = { ...req.body, workspace_id };
    if (postData.scheduled_for && postData.status === undefined) {
      postData.status = 'scheduled';
    }
    const { data, error } = await supabase
      .from('social_posts')
      .insert(postData)
      .select('*, social_accounts(platform, account_name, account_handle)')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List posts with filters
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { status, platform, date_from, date_to, sort_by, sort_order, page, limit } = req.query;

    let query = supabase
      .from('social_posts')
      .select('*, social_accounts(platform, account_name, account_handle)', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (status) query = query.eq('status', status);
    if (platform) {
      query = query.eq('social_accounts.platform', platform);
    }
    if (date_from) query = query.gte('scheduled_for', date_from);
    if (date_to) query = query.lte('scheduled_for', date_to);

    const sortField = sort_by || 'created_at';
    const ascending = sort_order === 'asc';
    query = query.order(sortField, { ascending });

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 50;
    const from = (pageNum - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    const filtered = platform
      ? (data || []).filter(p => p.social_accounts?.platform === platform)
      : data || [];

    res.json({ data: filtered, total: count, page: pageNum, limit: pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get post details with analytics
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*, social_accounts(platform, account_name, account_handle)')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Post not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update post
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*, social_accounts(platform, account_name, account_handle)')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish now
router.post('/:id/publish', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('social_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, social_accounts(platform, account_name, account_handle)')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk schedule
router.post('/bulk-schedule', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { posts } = req.body;
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'posts array is required' });
    }
    const postsData = posts.map(p => ({
      ...p,
      workspace_id,
      status: 'scheduled',
    }));
    const { data, error } = await supabase
      .from('social_posts')
      .insert(postsData)
      .select('*, social_accounts(platform, account_name, account_handle)');
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ scheduled: data.length, posts: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
