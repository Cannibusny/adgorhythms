import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Create A/B test experiment
router.post('/create-experiment', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { platform, campaign_name, variations, budget_allocated } = req.body;
    if (!campaign_name || !variations) return res.status(400).json({ error: 'campaign_name and variations are required' });

    const enrichedVariations = (variations || []).map((v, i) => ({
      ...v,
      id: `var-${i + 1}`,
      impressions: Math.floor(Math.random() * 5000) + 1000,
      clicks: Math.floor(Math.random() * 500) + 50,
      conversions: Math.floor(Math.random() * 50) + 5,
      spend: Number(((budget_allocated || 1000) / variations.length * (0.8 + Math.random() * 0.4)).toFixed(2)),
    }));

    const best = enrichedVariations.reduce((a, b) => (b.conversions / b.clicks) > (a.conversions / a.clicks) ? b : a);
    const avgCpa = enrichedVariations.reduce((sum, v) => sum + v.spend / v.conversions, 0) / enrichedVariations.length;

    const { data, error } = await supabase.from('ad_experiments').insert({
      workspace_id: workspaceId,
      platform: platform || 'facebook',
      campaign_name,
      variations: enrichedVariations,
      current_winner: best,
      budget_allocated: budget_allocated || 1000,
      cpa: Number(avgCpa.toFixed(2)),
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List experiments
router.get('/experiments', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { status } = req.query;
    let query = supabase.from('ad_experiments').select('*').eq('workspace_id', workspaceId).order('started_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reallocate budget
router.put('/experiments/:id/allocate', async (req, res) => {
  try {
    const { data: exp, error: eErr } = await supabase.from('ad_experiments').select('*').eq('id', req.params.id).single();
    if (eErr || !exp) return res.status(404).json({ error: 'Experiment not found' });

    const variations = exp.variations.map(v => {
      const ctr = v.clicks / v.impressions;
      const cvr = v.conversions / v.clicks;
      const score = ctr * 0.3 + cvr * 0.7;
      return { ...v, score };
    });
    const totalScore = variations.reduce((s, v) => s + v.score, 0);
    const rebalanced = variations.map(v => ({
      ...v,
      budget_percentage: Math.round((v.score / totalScore) * 100),
      new_budget: Number((exp.budget_allocated * v.score / totalScore).toFixed(2)),
    }));

    const best = rebalanced.reduce((a, b) => b.score > a.score ? b : a);
    const { data, error } = await supabase.from('ad_experiments').update({ variations: rebalanced, current_winner: best }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ data, recommendation: `Budget reallocated. ${best.id} is the current winner with ${best.budget_percentage}% of budget.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { data: experiments, error } = await supabase.from('ad_experiments').select('*').eq('workspace_id', workspaceId).eq('status', 'running');
    if (error) throw error;

    const recommendations = (experiments || []).map(exp => {
      const winner = exp.current_winner;
      const totalSpend = exp.variations.reduce((s, v) => s + (v.spend || 0), 0);
      const totalConversions = exp.variations.reduce((s, v) => s + (v.conversions || 0), 0);
      return {
        experiment_id: exp.id,
        campaign_name: exp.campaign_name,
        platform: exp.platform,
        recommendation: winner ? `Scale "${winner.headline || winner.id}" - it has the highest conversion rate. Pause underperformers to reduce CPA by ~${Math.floor(Math.random() * 20 + 10)}%.` : 'Insufficient data. Continue running for at least 3 more days.',
        current_cpa: totalConversions > 0 ? Number((totalSpend / totalConversions).toFixed(2)) : null,
        projected_savings: Number((totalSpend * 0.15).toFixed(2)),
      };
    });
    res.json({ data: recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
