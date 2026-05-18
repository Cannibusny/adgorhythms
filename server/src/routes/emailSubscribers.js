import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Add subscriber
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { list_id, contact_id, email } = req.body;
    if (!list_id || !email) {
      return res.status(400).json({ error: 'list_id and email are required' });
    }

    const { data, error } = await supabase
      .from('email_subscribers')
      .insert({ workspace_id, list_id, contact_id, email, status: 'subscribed' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List subscribers with filters
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { list_id, status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('email_subscribers')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (list_id) query = query.eq('list_id', list_id);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('subscribed_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update subscriber
router.put('/:id', async (req, res) => {
  try {
    const { status, email } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (email !== undefined) updates.email = email;

    const { data, error } = await supabase
      .from('email_subscribers')
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

// Remove subscriber
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('email_subscribers')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unsubscribe
router.post('/:id/unsubscribe', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk add subscribers
router.post('/bulk-add', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { list_id, subscribers } = req.body;
    if (!list_id || !subscribers || !Array.isArray(subscribers)) {
      return res.status(400).json({ error: 'list_id and subscribers array are required' });
    }

    const rows = subscribers.map((s) => ({
      workspace_id,
      list_id,
      email: s.email,
      contact_id: s.contact_id || null,
      status: 'subscribed',
    }));

    const { data, error } = await supabase
      .from('email_subscribers')
      .upsert(rows, { onConflict: 'list_id,email' })
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ added: data?.length || 0, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
