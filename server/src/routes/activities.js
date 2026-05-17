import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Log activity
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('activities')
      .insert({ ...req.body, workspace_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List activities
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { contact_id, deal_id, activity_type, date_from, date_to, completed } = req.query;

    let query = supabase
      .from('activities')
      .select('*, contacts(id, email, first_name, last_name)', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (contact_id) query = query.eq('contact_id', contact_id);
    if (deal_id) query = query.eq('deal_id', deal_id);
    if (activity_type) query = query.eq('activity_type', activity_type);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
    if (completed !== undefined) query = query.eq('completed', completed === 'true');

    query = query.order('created_at', { ascending: false }).limit(100);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update activity
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete activity
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('activities').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark task as completed
router.put('/:id/complete', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update({ completed: true, completed_at: new Date().toISOString() })
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
