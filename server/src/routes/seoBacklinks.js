import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Discover backlinks for domain (simulated)
router.post('/discover', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'domain is required' });

    const simulated = [
      { source_url: `https://blog.example.com/review-${domain}`, target_url: `https://${domain}`, anchor_text: domain, domain_authority: 45, page_authority: 32 },
      { source_url: `https://directory.example.com/${domain}`, target_url: `https://${domain}`, anchor_text: `Visit ${domain}`, domain_authority: 38, page_authority: 25 },
      { source_url: `https://news.example.com/featured-${domain}`, target_url: `https://${domain}/about`, anchor_text: 'Learn more', domain_authority: 62, page_authority: 40 },
      { source_url: `https://partner.example.com/links`, target_url: `https://${domain}`, anchor_text: 'Our partner', domain_authority: 55, page_authority: 35 },
      { source_url: `https://forum.example.com/thread/best-tools`, target_url: `https://${domain}/pricing`, anchor_text: 'Check pricing', domain_authority: 30, page_authority: 18 },
    ];

    const rows = simulated.map((b) => ({ workspace_id, ...b, status: 'active' }));

    const { data, error } = await supabase
      .from('seo_backlinks')
      .insert(rows)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ discovered: data?.length || 0, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List backlinks
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('seo_backlinks')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('discovered_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lost backlinks
router.get('/lost', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('seo_backlinks')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('status', 'lost')
      .order('discovered_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New backlinks (last 30 days)
router.get('/new', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('seo_backlinks')
      .select('*')
      .eq('workspace_id', workspace_id)
      .gte('discovered_at', thirtyDaysAgo)
      .eq('status', 'active')
      .order('discovered_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
