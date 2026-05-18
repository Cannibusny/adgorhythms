import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// List inbox messages
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { message_type, platform, replied, date_from, date_to, page, limit } = req.query;

    let query = supabase
      .from('social_inbox')
      .select('*, social_accounts(platform, account_name, account_handle)', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (message_type) query = query.eq('message_type', message_type);
    if (replied !== undefined) query = query.eq('replied', replied === 'true');
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    query = query.order('created_at', { ascending: false });

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 50;
    const from = (pageNum - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    let filtered = data || [];
    if (platform) {
      filtered = filtered.filter(m => m.social_accounts?.platform === platform);
    }

    res.json({ data: filtered, total: count, page: pageNum, limit: pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reply to message
router.put('/:id/reply', async (req, res) => {
  try {
    const { reply_text } = req.body;
    if (!reply_text) return res.status(400).json({ error: 'reply_text is required' });
    const { data, error } = await supabase
      .from('social_inbox')
      .update({
        replied: true,
        reply_text,
        replied_at: new Date().toISOString(),
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

// Mark as replied without sending
router.put('/:id/mark-replied', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('social_inbox')
      .update({
        replied: true,
        replied_at: new Date().toISOString(),
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

export default router;
