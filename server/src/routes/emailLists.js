import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Create list
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await supabase
      .from('email_lists')
      .insert({ workspace_id, name, description })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all lists
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('email_lists')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list with subscriber count
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_lists')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'List not found' });

    const { count } = await supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', req.params.id)
      .eq('status', 'subscribed');

    res.json({ ...data, subscriber_count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update list
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('email_lists')
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

// Delete list
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('email_lists')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import subscribers from CSV (simplified)
router.post('/:id/import', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'emails array is required' });
    }

    const subscribers = emails.map((email) => ({
      workspace_id,
      list_id: req.params.id,
      email: typeof email === 'string' ? email : email.email,
      contact_id: typeof email === 'object' ? email.contact_id : null,
      status: 'subscribed',
    }));

    const { data, error } = await supabase
      .from('email_subscribers')
      .upsert(subscribers, { onConflict: 'list_id,email' })
      .select();

    if (error) return res.status(400).json({ error: error.message });

    // Update subscriber count
    const { count } = await supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', req.params.id)
      .eq('status', 'subscribed');

    await supabase
      .from('email_lists')
      .update({ subscriber_count: count || 0 })
      .eq('id', req.params.id);

    res.json({ imported: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
