import { supabase } from '../supabase.js';

export async function runSequenceAutomation() {
  const { data: enrollments, error } = await supabase
    .from('sequence_enrollments')
    .select('*, email_sequences(id, name, status)')
    .eq('status', 'active');

  if (error) {
    console.error('[SequenceRunner] Error fetching enrollments:', error);
    return;
  }

  if (!enrollments || enrollments.length === 0) {
    console.log('[SequenceRunner] No active enrollments to process.');
    return;
  }

  let processed = 0;
  let completed = 0;

  for (const enrollment of enrollments) {
    if (enrollment.email_sequences?.status !== 'active') continue;

    const { data: steps } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', enrollment.sequence_id)
      .order('step_number', { ascending: true });

    if (!steps || steps.length === 0) continue;

    const currentStepData = steps.find(s => s.step_number === enrollment.current_step);
    if (!currentStepData) {
      // All steps completed
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', enrollment.id);
      completed++;
      continue;
    }

    // Check if delay has passed since enrollment or last email
    const referenceDate = enrollment.last_email_sent_at || enrollment.enrolled_at;
    const delayMs = currentStepData.delay_days * 86400000;
    const now = Date.now();
    const refTime = new Date(referenceDate).getTime();

    if (now - refTime < delayMs) continue;

    // "Send" the email (log as activity)
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, email, workspace_id')
      .eq('id', enrollment.contact_id)
      .single();

    if (contact) {
      await supabase.from('activities').insert({
        workspace_id: contact.workspace_id,
        contact_id: contact.id,
        activity_type: 'email',
        subject: currentStepData.subject,
        description: `Sequence email sent: Step ${currentStepData.step_number} of "${enrollment.email_sequences.name}"`,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    // Move to next step
    const nextStep = enrollment.current_step + 1;
    const hasMoreSteps = steps.some(s => s.step_number === nextStep);

    if (hasMoreSteps) {
      await supabase
        .from('sequence_enrollments')
        .update({ current_step: nextStep, last_email_sent_at: new Date().toISOString() })
        .eq('id', enrollment.id);
    } else {
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          last_email_sent_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);
      completed++;
    }

    processed++;
  }

  console.log(`[SequenceRunner] Processed: ${processed}, Completed: ${completed}`);
  return { processed, completed };
}
