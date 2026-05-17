import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Create workflow
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('workflows')
      .insert({ ...req.body, workspace_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List workflows
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data: workflows, error, count } = await supabase
      .from('workflows')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    const enriched = await Promise.all((workflows || []).map(async (wf) => {
      const { count: execCount } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true })
        .eq('workflow_id', wf.id);
      return { ...wf, execution_count: execCount || 0 };
    }));

    res.json({ data: enriched, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get workflow details
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Workflow not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update workflow
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workflows')
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

// Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('workflows').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle workflow active/paused
router.put('/:id/toggle', async (req, res) => {
  try {
    const { data: current } = await supabase
      .from('workflows')
      .select('status')
      .eq('id', req.params.id)
      .single();

    const newStatus = current?.status === 'active' ? 'paused' : 'active';
    const { data, error } = await supabase
      .from('workflows')
      .update({ status: newStatus })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List workflow executions
router.get('/:id/executions', async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from('workflow_executions')
      .select('*, contacts(id, email, first_name, last_name)', { count: 'exact' })
      .eq('workflow_id', req.params.id)
      .order('executed_at', { ascending: false })
      .limit(100);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
