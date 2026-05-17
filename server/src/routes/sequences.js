import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Create sequence
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('email_sequences')
      .insert({ ...req.body, workspace_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List sequences
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    let query = supabase
      .from('email_sequences')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    const { data: sequences, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    const enriched = await Promise.all((sequences || []).map(async (seq) => {
      const { count: enrolledCount } = await supabase
        .from('sequence_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('sequence_id', seq.id);

      const { count: completedCount } = await supabase
        .from('sequence_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('sequence_id', seq.id)
        .eq('status', 'completed');

      const { count: stepCount } = await supabase
        .from('sequence_steps')
        .select('*', { count: 'exact', head: true })
        .eq('sequence_id', seq.id);

      return {
        ...seq,
        enrolled_count: enrolledCount || 0,
        completed_count: completedCount || 0,
        step_count: stepCount || 0,
        completion_rate: enrolledCount > 0 ? Math.round(((completedCount || 0) / enrolledCount) * 100) : 0,
      };
    }));

    res.json({ data: enriched, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sequence with steps
router.get('/:id', async (req, res) => {
  try {
    const { data: sequence, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Sequence not found' });

    const { data: steps } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', req.params.id)
      .order('step_number', { ascending: true });

    const { data: enrollments } = await supabase
      .from('sequence_enrollments')
      .select('*, contacts(id, email, first_name, last_name)')
      .eq('sequence_id', req.params.id)
      .order('enrolled_at', { ascending: false });

    res.json({ ...sequence, steps: steps || [], enrollments: enrollments || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update sequence
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_sequences')
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

// Delete sequence
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('email_sequences').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add step to sequence
router.post('/:id/steps', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sequence_steps')
      .insert({ ...req.body, sequence_id: req.params.id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update step
router.put('/:id/steps/:stepId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sequence_steps')
      .update(req.body)
      .eq('id', req.params.stepId)
      .eq('sequence_id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete step
router.delete('/:id/steps/:stepId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('sequence_steps')
      .delete()
      .eq('id', req.params.stepId)
      .eq('sequence_id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enroll contacts in sequence
router.post('/:id/enroll', async (req, res) => {
  try {
    const { contact_ids } = req.body;
    if (!contact_ids || !contact_ids.length) {
      return res.status(400).json({ error: 'contact_ids array is required' });
    }

    const enrollments = contact_ids.map(contact_id => ({
      sequence_id: req.params.id,
      contact_id,
      current_step: 1,
      status: 'active',
      enrolled_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('sequence_enrollments')
      .upsert(enrollments, { onConflict: 'sequence_id,contact_id' })
      .select();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ enrolled: data.length, enrollments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unenroll contacts
router.post('/:id/unenroll', async (req, res) => {
  try {
    const { contact_ids } = req.body;
    if (!contact_ids || !contact_ids.length) {
      return res.status(400).json({ error: 'contact_ids array is required' });
    }

    const { data, error } = await supabase
      .from('sequence_enrollments')
      .update({ status: 'unsubscribed' })
      .eq('sequence_id', req.params.id)
      .in('contact_id', contact_ids)
      .select();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ unenrolled: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
