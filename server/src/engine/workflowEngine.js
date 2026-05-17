import { supabase } from '../supabase.js';

export async function executeWorkflows(triggerType, workspaceId, context) {
  try {
    const { data: workflows } = await supabase
      .from('workflows')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('trigger_type', triggerType)
      .eq('status', 'active');

    if (!workflows || workflows.length === 0) return;

    for (const workflow of workflows) {
      const conditionsMet = checkConditions(workflow.trigger_config, context);
      if (!conditionsMet) continue;

      const { data: execution } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflow.id,
          contact_id: context.contact?.id || null,
          deal_id: context.deal?.id || null,
          status: 'running',
        })
        .select()
        .single();

      try {
        await runActions(workflow.actions, context, workspaceId);

        await supabase
          .from('workflow_executions')
          .update({ status: 'completed', completed_at: new Date().toISOString(), result: { actions_run: workflow.actions?.length || 0 } })
          .eq('id', execution.id);
      } catch (err) {
        await supabase
          .from('workflow_executions')
          .update({ status: 'failed', completed_at: new Date().toISOString(), result: { error: err.message } })
          .eq('id', execution.id);
      }
    }
  } catch (err) {
    console.error('[WorkflowEngine] Error executing workflows:', err);
  }
}

function checkConditions(config, context) {
  if (!config || !config.conditions) return true;

  for (const condition of config.conditions) {
    const entity = context[condition.entity];
    if (!entity) return false;

    const fieldValue = entity[condition.field];
    switch (condition.operator) {
      case 'equals':
        if (fieldValue !== condition.value) return false;
        break;
      case 'not_equals':
        if (fieldValue === condition.value) return false;
        break;
      case 'contains':
        if (!String(fieldValue).includes(condition.value)) return false;
        break;
      case 'greater_than':
        if (parseFloat(fieldValue) <= parseFloat(condition.value)) return false;
        break;
      case 'less_than':
        if (parseFloat(fieldValue) >= parseFloat(condition.value)) return false;
        break;
      default:
        break;
    }
  }

  return true;
}

async function runActions(actions, context, workspaceId) {
  if (!actions || !Array.isArray(actions)) return;

  for (const action of actions) {
    switch (action.type) {
      case 'add_tag':
        if (context.contact?.id && action.tag) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('tags')
            .eq('id', context.contact.id)
            .single();
          const tags = [...(contact?.tags || []), action.tag];
          await supabase.from('contacts').update({ tags }).eq('id', context.contact.id);
        }
        break;

      case 'update_field':
        if (context.contact?.id && action.field && action.value !== undefined) {
          await supabase
            .from('contacts')
            .update({ [action.field]: action.value })
            .eq('id', context.contact.id);
        }
        break;

      case 'enroll_in_sequence':
        if (context.contact?.id && action.sequence_id) {
          await supabase.from('sequence_enrollments').upsert({
            sequence_id: action.sequence_id,
            contact_id: context.contact.id,
            current_step: 1,
            status: 'active',
            enrolled_at: new Date().toISOString(),
          }, { onConflict: 'sequence_id,contact_id' });
        }
        break;

      case 'create_activity':
        if (context.contact?.id) {
          await supabase.from('activities').insert({
            workspace_id: workspaceId,
            contact_id: context.contact.id,
            deal_id: context.deal?.id || null,
            activity_type: action.activity_type || 'task',
            subject: action.subject || 'Auto-created task',
            description: action.description || '',
            due_date: action.due_days ? new Date(Date.now() + action.due_days * 86400000).toISOString() : null,
          });
        }
        break;

      case 'update_lifecycle':
        if (context.contact?.id && action.lifecycle_stage) {
          await supabase
            .from('contacts')
            .update({ lifecycle_stage: action.lifecycle_stage })
            .eq('id', context.contact.id);
        }
        break;

      default:
        console.warn(`[WorkflowEngine] Unknown action type: ${action.type}`);
    }
  }
}
