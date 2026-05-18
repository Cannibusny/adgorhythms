import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// List sends for a campaign
router.get('/campaigns/:id/sends', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data, error, count } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact' })
      .eq('campaign_id', req.params.id)
      .order('sent_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campaign analytics
router.get('/campaigns/:id/analytics', async (req, res) => {
  try {
    const { data: sends, error } = await supabase
      .from('email_sends')
      .select('*')
      .eq('campaign_id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });

    const total = sends?.length || 0;
    const delivered = sends?.filter((s) => s.delivered_at).length || 0;
    const opened = sends?.filter((s) => s.opened_at).length || 0;
    const clicked = sends?.filter((s) => s.clicked_at).length || 0;
    const bounced = sends?.filter((s) => s.bounced).length || 0;
    const unsubscribed = sends?.filter((s) => s.unsubscribed_at).length || 0;

    res.json({
      total_sent: total,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed,
      delivery_rate: total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0,
      open_rate: delivered > 0 ? Math.round((opened / delivered) * 10000) / 100 : 0,
      click_rate: delivered > 0 ? Math.round((clicked / delivered) * 10000) / 100 : 0,
      bounce_rate: total > 0 ? Math.round((bounced / total) * 10000) / 100 : 0,
      unsubscribe_rate: delivered > 0 ? Math.round((unsubscribed / delivered) * 10000) / 100 : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track email open
router.post('/track/open', async (req, res) => {
  try {
    const { send_id } = req.body;
    if (!send_id) return res.status(400).json({ error: 'send_id is required' });

    await supabase
      .from('email_sends')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', send_id)
      .is('opened_at', null);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track link click
router.post('/track/click', async (req, res) => {
  try {
    const { send_id } = req.body;
    if (!send_id) return res.status(400).json({ error: 'send_id is required' });

    await supabase
      .from('email_sends')
      .update({
        clicked_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
      })
      .eq('id', send_id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
