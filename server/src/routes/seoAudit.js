import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Run site audit (simulated)
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const score = Math.floor(Math.random() * 40) + 55;
    const issues_critical = Math.floor(Math.random() * 5);
    const issues_warnings = Math.floor(Math.random() * 15) + 2;
    const issues_info = Math.floor(Math.random() * 20) + 5;

    const issues_details = {
      critical: [],
      warnings: [],
      info: [],
    };

    if (issues_critical > 0) {
      const criticalIssues = [
        { issue: 'Missing SSL certificate', page: url, impact: 'high' },
        { issue: 'Broken internal links found', page: `${url}/about`, impact: 'high' },
        { issue: 'Missing meta description on key pages', page: `${url}/services`, impact: 'high' },
        { issue: 'Duplicate title tags detected', page: `${url}/blog`, impact: 'high' },
        { issue: 'Server returning 5xx errors', page: `${url}/api`, impact: 'high' },
      ];
      issues_details.critical = criticalIssues.slice(0, issues_critical);
    }

    const warningIssues = [
      { issue: 'Images missing alt text', pages: 12, impact: 'medium' },
      { issue: 'Pages with slow load time (>3s)', pages: 5, impact: 'medium' },
      { issue: 'Missing Open Graph tags', pages: 8, impact: 'medium' },
      { issue: 'Low word count pages (<300 words)', pages: 3, impact: 'medium' },
      { issue: 'Missing H1 tags', pages: 2, impact: 'medium' },
      { issue: 'Redirect chains detected', pages: 4, impact: 'medium' },
      { issue: 'Pages not mobile-friendly', pages: 1, impact: 'medium' },
    ];
    issues_details.warnings = warningIssues.slice(0, Math.min(issues_warnings, warningIssues.length));

    const infoIssues = [
      { issue: 'Pages with external links', pages: 15 },
      { issue: 'Pages using deprecated HTML', pages: 3 },
      { issue: 'CSS files not minified', pages: 2 },
      { issue: 'JavaScript files not minified', pages: 4 },
      { issue: 'Pages without structured data', pages: 10 },
    ];
    issues_details.info = infoIssues.slice(0, Math.min(issues_info, infoIssues.length));

    const { data, error } = await supabase
      .from('seo_site_audits')
      .insert({
        workspace_id, url, audit_score: score,
        issues_critical, issues_warnings, issues_info,
        issues_details,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List past audits
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('seo_site_audits')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('audited_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get audit details
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('seo_site_audits')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Audit not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
