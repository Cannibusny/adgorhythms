import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Set availability
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { day_of_week, start_time, end_time, timezone } = req.body;
    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'day_of_week, start_time, and end_time are required' });
    }

    const { data, error } = await supabase
      .from('calendar_availability')
      .insert({ workspace_id, day_of_week, start_time, end_time, timezone: timezone || 'UTC' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get availability
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('calendar_availability')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('day_of_week');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update availability slot
router.put('/:id', async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, timezone } = req.body;
    const updates = {};
    if (day_of_week !== undefined) updates.day_of_week = day_of_week;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (timezone !== undefined) updates.timezone = timezone;

    const { data, error } = await supabase
      .from('calendar_availability')
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

// Remove availability slot
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('calendar_availability')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
