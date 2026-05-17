import { supabase } from '../supabase.js';

const SCORE_MAP = {
  email_opened: 5,
  email_link_clicked: 10,
  website_visit: 10,
  pricing_page_visit: 20,
  demo_request: 50,
  form_submission: 15,
};

export async function updateLeadScore(contactId, event) {
  const points = SCORE_MAP[event] || 0;
  if (points === 0) return null;

  const { data: contact } = await supabase
    .from('contacts')
    .select('lead_score')
    .eq('id', contactId)
    .single();

  if (!contact) return null;

  const newScore = Math.min((contact.lead_score || 0) + points, 100);

  const { data, error } = await supabase
    .from('contacts')
    .update({ lead_score: newScore, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-upgrade lifecycle stage based on score
  let newStage = null;
  if (newScore >= 80) newStage = 'sql';
  else if (newScore >= 50) newStage = 'mql';

  if (newStage && data.lifecycle_stage !== newStage) {
    await supabase
      .from('contacts')
      .update({ lifecycle_stage: newStage })
      .eq('id', contactId);
  }

  return data;
}

export { SCORE_MAP };
