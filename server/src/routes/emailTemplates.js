import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// List templates
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { name, subject_template, html_template, thumbnail_url, category } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await supabase
      .from('email_templates')
      .insert({ workspace_id, name, subject_template, html_template, thumbnail_url, category })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const { name, subject_template, html_template, thumbnail_url, category } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (subject_template !== undefined) updates.subject_template = subject_template;
    if (html_template !== undefined) updates.html_template = html_template;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (category !== undefined) updates.category = category;

    const { data, error } = await supabase
      .from('email_templates')
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

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
