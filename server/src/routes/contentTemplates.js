import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// List templates (including defaults)
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const templates = data || [];

    // If no defaults exist, return built-in defaults
    const hasDefaults = templates.some((t) => t.is_default);
    if (!hasDefaults) {
      const defaults = getBuiltInDefaults(workspace_id);
      templates.unshift(...defaults);
    }

    res.json({ data: templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { template_name, content_type, template_structure } = req.body;
    if (!template_name || !content_type) {
      return res.status(400).json({ error: 'template_name and content_type are required' });
    }

    const { data, error } = await supabase
      .from('content_templates')
      .insert({
        workspace_id,
        template_name,
        content_type,
        template_structure: template_structure || {},
        is_default: false,
      })
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
    const { template_name, content_type, template_structure } = req.body;
    const updates = {};
    if (template_name !== undefined) updates.template_name = template_name;
    if (content_type !== undefined) updates.content_type = content_type;
    if (template_structure !== undefined) updates.template_structure = template_structure;

    const { data, error } = await supabase
      .from('content_templates')
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
      .from('content_templates')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getBuiltInDefaults(workspace_id) {
  return [
    {
      id: 'default-1',
      workspace_id,
      template_name: 'Product Launch Social Series',
      content_type: 'social_post',
      template_structure: {
        description: '30 posts about a new product launch',
        sections: ['Teaser', 'Announcement', 'Features', 'Benefits', 'Social Proof', 'CTA'],
        format: '[Hook] [Body] [CTA] [Hashtags]',
      },
      is_default: true,
    },
    {
      id: 'default-2',
      workspace_id,
      template_name: 'Educational Email Sequence',
      content_type: 'email',
      template_structure: {
        description: '5 emails teaching about a topic',
        sections: ['Welcome', 'Foundation', 'Deep Dive', 'Case Study', 'Next Steps'],
        format: 'Subject + Preview + Body + CTA',
      },
      is_default: true,
    },
    {
      id: 'default-3',
      workspace_id,
      template_name: 'SEO Blog Post Structure',
      content_type: 'blog',
      template_structure: {
        description: 'SEO-optimized blog post outline',
        sections: ['SEO Title', 'Meta Description', 'Introduction', 'H2 Sections', 'Conclusion + CTA'],
        format: 'Title (60 chars) + Meta (160 chars) + H1/H2/H3 outline + Content',
      },
      is_default: true,
    },
    {
      id: 'default-4',
      workspace_id,
      template_name: 'Landing Page Formula',
      content_type: 'landing_page',
      template_structure: {
        description: 'High-converting landing page copy',
        sections: ['Hero', 'Benefits', 'Social Proof', 'FAQ', 'CTA'],
        format: 'Headline + Subheadline + Benefits + Testimonials + FAQ + CTA',
      },
      is_default: true,
    },
    {
      id: 'default-5',
      workspace_id,
      template_name: 'Facebook Ad Variations',
      content_type: 'ad_copy',
      template_structure: {
        description: '6 ad copy variations for split testing',
        sections: ['Headline', 'Primary Text', 'Description', 'CTA'],
        format: 'Headline (40 chars) + Primary Text (125 chars) + CTA',
      },
      is_default: true,
    },
    {
      id: 'default-6',
      workspace_id,
      template_name: 'Explainer Video Script',
      content_type: 'video_script',
      template_structure: {
        description: 'Problem-solution-CTA video script',
        sections: ['Problem', 'Solution', 'How It Works', 'CTA'],
        format: 'Scene + Voiceover + Visual + Music/Tone',
      },
      is_default: true,
    },
  ];
}

export default router;
