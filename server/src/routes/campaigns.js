import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Create campaign
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({ ...req.body, workspace_id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List campaigns
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { status } = req.query;

    let query = supabase
      .from('email_campaigns')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign with stats
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Campaign not found' });

    const openRate = data.recipient_count > 0 ? ((data.opened_count / data.recipient_count) * 100).toFixed(1) : 0;
    const clickRate = data.recipient_count > 0 ? ((data.clicked_count / data.recipient_count) * 100).toFixed(1) : 0;

    res.json({ ...data, open_rate: parseFloat(openRate), click_rate: parseFloat(clickRate) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
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

// Send campaign
router.post('/:id/send', async (req, res) => {
  try {
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status === 'sent') return res.status(400).json({ error: 'Campaign already sent' });

    const workspace_id = campaign.workspace_id;
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email')
      .eq('workspace_id', workspace_id);

    const recipientCount = contacts?.length || 0;

    const { data, error } = await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: recipientCount,
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    res.json({ ...data, message: `Campaign sent to ${recipientCount} contacts` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule campaign
router.post('/:id/schedule', async (req, res) => {
  try {
    const { send_at } = req.body;
    if (!send_at) return res.status(400).json({ error: 'send_at is required' });

    const { data, error } = await supabase
      .from('email_campaigns')
      .update({ status: 'scheduled', send_at })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campaign stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Campaign not found' });

    const openRate = data.recipient_count > 0 ? ((data.opened_count / data.recipient_count) * 100).toFixed(1) : 0;
    const clickRate = data.recipient_count > 0 ? ((data.clicked_count / data.recipient_count) * 100).toFixed(1) : 0;
    const bounceRate = 0;

    res.json({
      recipient_count: data.recipient_count,
      opened_count: data.opened_count,
      clicked_count: data.clicked_count,
      open_rate: parseFloat(openRate),
      click_rate: parseFloat(clickRate),
      bounce_rate: bounceRate,
      sent_at: data.sent_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
