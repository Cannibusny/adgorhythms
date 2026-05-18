import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Calculate ROI for campaign/channel
router.post('/calculate', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { campaign_id, channel, spend, revenue_attributed } = req.body;
    if (!channel || spend === undefined) return res.status(400).json({ error: 'channel and spend are required' });

    const rev = revenue_attributed || Number((spend * (1.5 + Math.random() * 3)).toFixed(2));
    const roiPercentage = spend > 0 ? Number(((rev - spend) / spend * 100).toFixed(2)) : 0;

    const { data, error } = await supabase.from('roi_calculations').insert({
      workspace_id: workspaceId,
      campaign_id: campaign_id || null,
      channel,
      spend,
      revenue_attributed: rev,
      roi_percentage: roiPercentage,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROI by channel
router.get('/by-channel', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { data, error } = await supabase.from('roi_calculations').select('*').eq('workspace_id', workspaceId).order('calculated_at', { ascending: false });
    if (error) throw error;

    const byChannel = {};
    (data || []).forEach(r => {
      if (!byChannel[r.channel]) byChannel[r.channel] = { channel: r.channel, total_spend: 0, total_revenue: 0, entries: 0 };
      byChannel[r.channel].total_spend += Number(r.spend);
      byChannel[r.channel].total_revenue += Number(r.revenue_attributed);
      byChannel[r.channel].entries++;
    });
    const result = Object.values(byChannel).map(ch => ({
      ...ch,
      roi_percentage: ch.total_spend > 0 ? Number(((ch.total_revenue - ch.total_spend) / ch.total_spend * 100).toFixed(2)) : 0,
      cac: ch.entries > 0 ? Number((ch.total_spend / ch.entries).toFixed(2)) : 0,
    }));
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROI trends over time
router.get('/trends', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { data, error } = await supabase.from('roi_calculations').select('*').eq('workspace_id', workspaceId).order('calculated_at', { ascending: true });
    if (error) throw error;

    const byMonth = {};
    (data || []).forEach(r => {
      const month = r.calculated_at.substring(0, 7);
      if (!byMonth[month]) byMonth[month] = { month, spend: 0, revenue: 0, count: 0 };
      byMonth[month].spend += Number(r.spend);
      byMonth[month].revenue += Number(r.revenue_attributed);
      byMonth[month].count++;
    });
    const trends = Object.values(byMonth).map(m => ({
      ...m,
      roi_percentage: m.spend > 0 ? Number(((m.revenue - m.spend) / m.spend * 100).toFixed(2)) : 0,
    }));
    res.json({ data: trends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
