import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Create booking
router.post('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { calendar_type_id, contact_id, attendee_name, attendee_email, attendee_phone, scheduled_for, notes } = req.body;
    if (!calendar_type_id || !attendee_name || !attendee_email || !scheduled_for) {
      return res.status(400).json({ error: 'calendar_type_id, attendee_name, attendee_email, and scheduled_for are required' });
    }

    // Get calendar type for duration
    const { data: calType, error: typeErr } = await supabase
      .from('calendar_types')
      .select('duration_minutes')
      .eq('id', calendar_type_id)
      .single();

    if (typeErr) return res.status(400).json({ error: 'Invalid calendar type' });

    const meetingUrl = `https://meet.adgorhythms.com/${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from('calendar_bookings')
      .insert({
        workspace_id, calendar_type_id, contact_id,
        attendee_name, attendee_email, attendee_phone,
        scheduled_for, duration_minutes: calType.duration_minutes,
        meeting_url: meetingUrl, notes,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List bookings
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { status, date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('calendar_bookings')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace_id);

    if (status) query = query.eq('status', status);
    if (date_from) query = query.gte('scheduled_for', date_from);
    if (date_to) query = query.lte('scheduled_for', date_to);

    const { data, error, count } = await query
      .order('scheduled_for', { ascending: true })
      .range(offset, offset + Number(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update booking
router.put('/:id', async (req, res) => {
  try {
    const { status, notes, attendee_name, attendee_email, attendee_phone } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (attendee_name !== undefined) updates.attendee_name = attendee_name;
    if (attendee_email !== undefined) updates.attendee_email = attendee_email;
    if (attendee_phone !== undefined) updates.attendee_phone = attendee_phone;

    const { data, error } = await supabase
      .from('calendar_bookings')
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

// Cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calendar_bookings')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reschedule booking
router.post('/:id/reschedule', async (req, res) => {
  try {
    const { scheduled_for } = req.body;
    if (!scheduled_for) return res.status(400).json({ error: 'scheduled_for is required' });

    const { data, error } = await supabase
      .from('calendar_bookings')
      .update({ scheduled_for, status: 'scheduled' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available slots for a calendar type
router.get('/available-slots', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { calendar_type_id, date } = req.query;
    if (!calendar_type_id || !date) {
      return res.status(400).json({ error: 'calendar_type_id and date are required' });
    }

    // Get calendar type
    const { data: calType } = await supabase
      .from('calendar_types')
      .select('duration_minutes, buffer_before_minutes, buffer_after_minutes')
      .eq('id', calendar_type_id)
      .single();

    if (!calType) return res.status(400).json({ error: 'Invalid calendar type' });

    // Get availability for the day of week
    const dayOfWeek = new Date(date).getDay();
    const { data: availability } = await supabase
      .from('calendar_availability')
      .select('start_time, end_time')
      .eq('workspace_id', workspace_id)
      .eq('day_of_week', dayOfWeek);

    if (!availability || availability.length === 0) {
      return res.json({ slots: [] });
    }

    // Get existing bookings for the date
    const dayStart = `${date}T00:00:00Z`;
    const dayEnd = `${date}T23:59:59Z`;
    const { data: bookings } = await supabase
      .from('calendar_bookings')
      .select('scheduled_for, duration_minutes')
      .eq('workspace_id', workspace_id)
      .gte('scheduled_for', dayStart)
      .lte('scheduled_for', dayEnd)
      .neq('status', 'cancelled');

    // Generate slots
    const slots = [];
    for (const avail of availability) {
      const [startH, startM] = avail.start_time.split(':').map(Number);
      const [endH, endM] = avail.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const slotDuration = calType.duration_minutes + (calType.buffer_before_minutes || 0) + (calType.buffer_after_minutes || 0);

      for (let t = startMinutes; t + calType.duration_minutes <= endMinutes; t += slotDuration) {
        const slotH = Math.floor(t / 60);
        const slotM = t % 60;
        const slotTime = `${date}T${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}:00Z`;

        // Check for conflicts
        const hasConflict = (bookings || []).some((b) => {
          const bStart = new Date(b.scheduled_for).getTime();
          const bEnd = bStart + b.duration_minutes * 60 * 1000;
          const sStart = new Date(slotTime).getTime();
          const sEnd = sStart + calType.duration_minutes * 60 * 1000;
          return sStart < bEnd && sEnd > bStart;
        });

        if (!hasConflict) {
          slots.push({
            time: slotTime,
            display: `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`,
          });
        }
      }
    }

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
