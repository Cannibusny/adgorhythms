import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';
import { updateLeadScore } from '../engine/leadScoring.js';
import { executeWorkflows } from '../engine/workflowEngine.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create contact
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const contactData = { ...req.body, workspace_id };
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    // Trigger workflows
    await executeWorkflows('contact_created', workspace_id, { contact: data });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List contacts with filters
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { lifecycle_stage, tags, lead_score_min, lead_source, search, sort_by, sort_order, page, limit } = req.query;

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (lifecycle_stage) query = query.eq('lifecycle_stage', lifecycle_stage);
    if (lead_source) query = query.eq('lead_source', lead_source);
    if (lead_score_min) query = query.gte('lead_score', parseInt(lead_score_min));
    if (tags) query = query.overlaps('tags', tags.split(','));
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const sortField = sort_by || 'created_at';
    const ascending = sort_order === 'asc';
    query = query.order(sortField, { ascending });

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 50;
    const from = (pageNum - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ data, total: count, page: pageNum, limit: pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get contact with activity timeline
router.get('/:id', async (req, res) => {
  try {
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Contact not found' });

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', req.params.id)
      .order('created_at', { ascending: false });

    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .eq('contact_id', req.params.id)
      .order('created_at', { ascending: false });

    const { data: enrollments } = await supabase
      .from('sequence_enrollments')
      .select('*, email_sequences(name, status)')
      .eq('contact_id', req.params.id);

    res.json({ ...contact, activities: activities || [], deals: deals || [], enrollments: enrollments || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    await executeWorkflows('contact_updated', workspace_id, { contact: data });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import from CSV
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

    const contacts = records.map(r => ({
      workspace_id,
      email: r.email || r.Email,
      first_name: r.first_name || r.FirstName || r['First Name'],
      last_name: r.last_name || r.LastName || r['Last Name'],
      phone: r.phone || r.Phone,
      company: r.company || r.Company,
      job_title: r.job_title || r.JobTitle || r['Job Title'],
      website: r.website || r.Website,
      lead_source: r.lead_source || r.LeadSource || r['Lead Source'],
      lifecycle_stage: r.lifecycle_stage || 'lead',
      tags: r.tags ? r.tags.split(';').map(t => t.trim()) : [],
    }));

    const { data, error } = await supabase
      .from('contacts')
      .upsert(contacts, { onConflict: 'workspace_id,email' })
      .select();
    if (error) return res.status(400).json({ error: error.message });

    res.json({ imported: data.length, contacts: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export contacts to CSV
router.get('/export', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    const headers = ['email', 'first_name', 'last_name', 'phone', 'company', 'job_title', 'website', 'lead_source', 'lead_score', 'lifecycle_stage', 'tags'];
    const csvRows = [headers.join(',')];
    (data || []).forEach(c => {
      const row = headers.map(h => {
        const val = c[h];
        if (Array.isArray(val)) return `"${val.join(';')}"`;
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val ?? '';
      });
      csvRows.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add tag
router.post('/:id/tag', async (req, res) => {
  try {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'Tag is required' });

    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', req.params.id)
      .single();

    const currentTags = contact?.tags || [];
    if (currentTags.includes(tag)) return res.json({ message: 'Tag already exists' });

    const { data, error } = await supabase
      .from('contacts')
      .update({ tags: [...currentTags, tag], updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove tag
router.delete('/:id/tag/:tagName', async (req, res) => {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', req.params.id)
      .single();

    const currentTags = contact?.tags || [];
    const newTags = currentTags.filter(t => t !== req.params.tagName);

    const { data, error } = await supabase
      .from('contacts')
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update lead score
router.post('/:id/score', async (req, res) => {
  try {
    const { event } = req.body;
    const data = await updateLeadScore(req.params.id, event);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
