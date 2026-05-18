import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Create meeting type
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { name, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, price_cents } = req.body;
    if (!name || !duration_minutes) {
      return res.status(400).json({ error: 'name and duration_minutes are required' });
    }

    const { data, error } = await supabase
      .from('calendar_types')
      .insert({
        workspace_id, name, description, duration_minutes,
        buffer_before_minutes: buffer_before_minutes || 0,
        buffer_after_minutes: buffer_after_minutes || 0,
        price_cents: price_cents || null,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List meeting types
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('calendar_types')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update meeting type
router.put('/:id', async (req, res) => {
  try {
    const { name, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, price_cents, active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (buffer_before_minutes !== undefined) updates.buffer_before_minutes = buffer_before_minutes;
    if (buffer_after_minutes !== undefined) updates.buffer_after_minutes = buffer_after_minutes;
    if (price_cents !== undefined) updates.price_cents = price_cents;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase
      .from('calendar_types')
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

// Delete meeting type
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('calendar_types')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
