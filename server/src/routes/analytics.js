import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Track custom event
router.post('/track', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { event_type, source, medium, campaign, contact_id, deal_id, metadata } = req.body;
    if (!event_type) return res.status(400).json({ error: 'event_type is required' });

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({ workspace_id, event_type, source, medium, campaign, contact_id, deal_id, metadata })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Query events
router.get('/events', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { event_type, source, date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (event_type) query = query.eq('event_type', event_type);
    if (source) query = query.eq('source', source);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Funnel analysis
router.get('/funnel', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const steps = ['page_view', 'form_submit', 'signup', 'purchase'];

    const counts = {};
    for (const step of steps) {
      const { count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace_id)
        .eq('event_type', step);
      counts[step] = count || 0;
    }

    const funnel = steps.map((step, i) => ({
      step,
      count: counts[step],
      conversion_rate: i === 0 ? 100 : (counts[steps[0]] > 0 ? Math.round((counts[step] / counts[steps[0]]) * 10000) / 100 : 0),
      drop_off: i === 0 ? 0 : Math.max(0, counts[steps[i - 1]] - counts[step]),
    }));

    res.json({ funnel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List sessions
router.get('/sessions', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { source, device_type, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('analytics_sessions')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (source) query = query.eq('source', source);
    if (device_type) query = query.eq('device_type', device_type);

    const { data, error, count } = await query
      .order('started_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session details
router.get('/sessions/:id', async (req, res) => {
  try {
    const { data: session, error } = await supabase
      .from('analytics_sessions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Session not found' });

    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('workspace_id', session.workspace_id)
      .order('created_at');

    res.json({ session, events: events || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top traffic sources
router.get('/sources', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;

    const { data: sessions, error } = await supabase
      .from('analytics_sessions')
      .select('source, medium, campaign')
      .eq('workspace_id', workspace_id);

    if (error) return res.status(400).json({ error: error.message });

    const sourceMap = {};
    for (const s of sessions || []) {
      const key = `${s.source || 'direct'}|${s.medium || 'none'}|${s.campaign || 'none'}`;
      sourceMap[key] = (sourceMap[key] || 0) + 1;
    }

    const sources = Object.entries(sourceMap)
      .map(([key, count]) => {
        const [source, medium, campaign] = key.split('|');
        return { source, medium, campaign, sessions: count };
      })
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20);

    res.json({ data: sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attribution for deal
router.get('/attribution/:dealId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attribution_touchpoints')
      .select('*')
      .eq('deal_id', req.params.dealId)
      .order('occurred_at');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate attribution weights
router.post('/attribution/calculate', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;

    const { data: touchpoints, error } = await supabase
      .from('attribution_touchpoints')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('occurred_at');

    if (error) return res.status(400).json({ error: error.message });

    // Simple linear attribution: equal weight for each touchpoint per deal
    const dealTouchpoints = {};
    for (const tp of touchpoints || []) {
      if (!tp.deal_id) continue;
      if (!dealTouchpoints[tp.deal_id]) dealTouchpoints[tp.deal_id] = [];
      dealTouchpoints[tp.deal_id].push(tp);
    }

    const updates = [];
    for (const [dealId, tps] of Object.entries(dealTouchpoints)) {
      const weight = Math.round((1 / tps.length) * 10000) / 10000;
      for (const tp of tps) {
        updates.push({ id: tp.id, attribution_weight: weight });
      }
    }

    for (const u of updates) {
      await supabase
        .from('attribution_touchpoints')
        .update({ attribution_weight: u.attribution_weight })
        .eq('id', u.id);
    }

    res.json({ calculated: updates.length, deals: Object.keys(dealTouchpoints).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROI by channel
router.get('/roi', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;

    const { data: touchpoints } = await supabase
      .from('attribution_touchpoints')
      .select('source, medium, attribution_weight, deal_id')
      .eq('workspace_id', workspace_id);

    const { data: deals } = await supabase
      .from('deals')
      .select('id, amount, stage')
      .eq('workspace_id', workspace_id)
      .eq('stage', 'closed_won');

    const dealAmounts = {};
    for (const d of deals || []) {
      dealAmounts[d.id] = Number(d.amount) || 0;
    }

    const channelRevenue = {};
    for (const tp of touchpoints || []) {
      if (!tp.deal_id || !dealAmounts[tp.deal_id]) continue;
      const key = `${tp.source || 'direct'}|${tp.medium || 'none'}`;
      const attributed = dealAmounts[tp.deal_id] * (Number(tp.attribution_weight) || 0);
      channelRevenue[key] = (channelRevenue[key] || 0) + attributed;
    }

    const roi = Object.entries(channelRevenue)
      .map(([key, revenue]) => {
        const [source, medium] = key.split('|');
        return { source, medium, attributed_revenue: Math.round(revenue * 100) / 100 };
      })
      .sort((a, b) => b.attributed_revenue - a.attributed_revenue);

    res.json({ data: roi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overview dashboard
router.get('/overview', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;

    const { count: totalEvents } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id);

    const { count: totalSessions } = await supabase
      .from('analytics_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id);

    const { count: conversions } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .in('event_type', ['purchase', 'signup', 'form_submit']);

    const { data: deals } = await supabase
      .from('deals')
      .select('amount')
      .eq('workspace_id', workspace_id)
      .eq('stage', 'closed_won');

    const totalRevenue = (deals || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    res.json({
      total_events: totalEvents || 0,
      total_sessions: totalSessions || 0,
      conversions: conversions || 0,
      conversion_rate: (totalSessions || 0) > 0 ? Math.round(((conversions || 0) / totalSessions) * 10000) / 100 : 0,
      total_revenue: totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Traffic analytics
router.get('/traffic', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;

    const { data: sessions } = await supabase
      .from('analytics_sessions')
      .select('source, medium, device_type, browser, country, landing_page, page_views')
      .eq('workspace_id', workspace_id);

    const bySource = {};
    const byDevice = {};
    const byCountry = {};
    const byPage = {};

    for (const s of sessions || []) {
      const src = s.source || 'direct';
      bySource[src] = (bySource[src] || 0) + 1;
      const dev = s.device_type || 'unknown';
      byDevice[dev] = (byDevice[dev] || 0) + 1;
      const country = s.country || 'unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
      const page = s.landing_page || '/';
      byPage[page] = (byPage[page] || 0) + 1;
    }

    const toArray = (obj) => Object.entries(obj).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    res.json({
      total_sessions: sessions?.length || 0,
      by_source: toArray(bySource),
      by_device: toArray(byDevice),
      by_country: toArray(byCountry),
      top_pages: toArray(byPage).slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conversion analytics
router.get('/conversions', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;

    const conversionTypes = ['form_submit', 'signup', 'purchase'];
    const results = {};

    for (const type of conversionTypes) {
      const { count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace_id)
        .eq('event_type', type);
      results[type] = count || 0;
    }

    const { count: totalSessions } = await supabase
      .from('analytics_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id);

    const total = Object.values(results).reduce((sum, c) => sum + c, 0);

    res.json({
      total_conversions: total,
      conversion_rate: (totalSessions || 0) > 0 ? Math.round((total / totalSessions) * 10000) / 100 : 0,
      by_type: results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;

    const { data: deals } = await supabase
      .from('deals')
      .select('amount, stage, expected_close_date, actual_close_date, created_at')
      .eq('workspace_id', workspace_id);

    const wonDeals = (deals || []).filter((d) => d.stage === 'closed_won');
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const avgDealSize = wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0;

    const pipeline = (deals || [])
      .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    res.json({
      total_revenue: totalRevenue,
      deals_closed: wonDeals.length,
      avg_deal_size: avgDealSize,
      pipeline_value: pipeline,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
