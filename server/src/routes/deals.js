import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';
import { executeWorkflows } from '../engine/workflowEngine.js';

const router = Router();

// Create deal
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('deals')
      .insert({ ...req.body, workspace_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List deals with filters
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { stage, amount_min, amount_max, assigned_to, search, sort_by, sort_order } = req.query;

    let query = supabase
      .from('deals')
      .select('*, contacts(id, email, first_name, last_name, company)', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (stage) query = query.eq('stage', stage);
    if (amount_min) query = query.gte('amount', parseFloat(amount_min));
    if (amount_max) query = query.lte('amount', parseFloat(amount_max));
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (search) query = query.ilike('name', `%${search}%`);

    const sortField = sort_by || 'created_at';
    const ascending = sort_order === 'asc';
    query = query.order(sortField, { ascending });

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get deal details
router.get('/forecast', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('deals')
      .select('amount, probability, expected_close_date, stage')
      .eq('workspace_id', workspace_id)
      .neq('stage', 'closed_lost');
    if (error) return res.status(400).json({ error: error.message });

    const totalPipeline = (data || []).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const weightedPipeline = (data || []).reduce((sum, d) => sum + ((parseFloat(d.amount) || 0) * ((d.probability || 0) / 100)), 0);

    const byMonth = {};
    (data || []).forEach(d => {
      if (d.expected_close_date) {
        const month = d.expected_close_date.substring(0, 7);
        if (!byMonth[month]) byMonth[month] = { month, total: 0, weighted: 0, count: 0 };
        byMonth[month].total += parseFloat(d.amount) || 0;
        byMonth[month].weighted += (parseFloat(d.amount) || 0) * ((d.probability || 0) / 100);
        byMonth[month].count += 1;
      }
    });

    const byStage = {};
    (data || []).forEach(d => {
      if (!byStage[d.stage]) byStage[d.stage] = { stage: d.stage, total: 0, count: 0 };
      byStage[d.stage].total += parseFloat(d.amount) || 0;
      byStage[d.stage].count += 1;
    });

    res.json({
      totalPipeline,
      weightedPipeline,
      dealCount: data.length,
      byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
      byStage: Object.values(byStage),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get deal by id
router.get('/:id', async (req, res) => {
  try {
    const { data: deal, error } = await supabase
      .from('deals')
      .select('*, contacts(id, email, first_name, last_name, company, phone)')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Deal not found' });

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('deal_id', req.params.id)
      .order('created_at', { ascending: false });

    res.json({ ...deal, activities: activities || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update deal
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete deal
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('deals').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move deal to different stage
router.put('/:id/stage', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { stage } = req.body;
    const updateData = { stage, updated_at: new Date().toISOString() };
    if (stage === 'closed_won' || stage === 'closed_lost') {
      updateData.actual_close_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    await executeWorkflows('deal_stage_changed', workspace_id, { deal: data, new_stage: stage });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
