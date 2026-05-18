import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Video, X } from 'lucide-react';
import { calendarBookingsApi } from '../../lib/seoCalendarApi';
import type { CalendarBooking } from '../../types/seoCalendar';

export default function BookingsCalendarPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<CalendarBooking | null>(null);

  const loadBookings = async () => {
    try {
      const start = currentWeekStart.toISOString();
      const end = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const params: { date_from: string; date_to: string; status?: string } = { date_from: start, date_to: end };
      if (filter) params.status = filter;
      const res = await calendarBookingsApi.list(params);
      setBookings(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadBookings(); }, [currentWeekStart, filter]);

  const prevWeek = () => setCurrentWeekStart(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  const nextWeek = () => setCurrentWeekStart(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000));

  const cancelBooking = async (id: string) => {
    await calendarBookingsApi.cancel(id);
    setSelected(null);
    loadBookings();
  };

  const completeBooking = async (id: string) => {
    await calendarBookingsApi.update(id, { status: 'completed' });
    setSelected(null);
    loadBookings();
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter((b) => b.scheduled_for.startsWith(dateStr));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'no_show': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays size={24} /> Bookings Calendar
          </h1>
          <p className="text-gray-400 text-sm mt-1">View and manage all your bookings</p>
        </div>
        <div className="flex gap-2">
          {['', 'scheduled', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                filter === f ? 'bg-[#6C47FF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-[#1E1E36] rounded-2xl border border-white/5 p-4">
        <button onClick={prevWeek} className="p-2 text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>
        <span className="text-white font-medium">
          {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button onClick={nextWeek} className="p-2 text-gray-400 hover:text-white"><ChevronRight size={20} /></button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
          return (
            <div key={day.toISOString()} className={`bg-[#1E1E36] rounded-2xl border p-3 min-h-[200px] ${isToday ? 'border-[#6C47FF]' : 'border-white/5'}`}>
              <div className={`text-xs font-medium mb-2 ${isToday ? 'text-[#6C47FF]' : 'text-gray-400'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-1.5">
                {dayBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className={`w-full text-left p-2 rounded-lg border text-xs ${statusColor(b.status)}`}
                  >
                    <div className="font-medium truncate">{b.attendee_name}</div>
                    <div className="opacity-70">{new Date(b.scheduled_for).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">{bookings.length}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{bookings.filter(b => b.status === 'scheduled').length}</div>
          <div className="text-xs text-gray-400">Scheduled</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{bookings.filter(b => b.status === 'completed').length}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{bookings.filter(b => b.status === 'cancelled').length}</div>
          <div className="text-xs text-gray-400">Cancelled</div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Booking Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400">Attendee</div>
                <div className="text-white">{selected.attendee_name}</div>
                <div className="text-sm text-gray-400">{selected.attendee_email}</div>
                {selected.attendee_phone && <div className="text-sm text-gray-400">{selected.attendee_phone}</div>}
              </div>
              <div>
                <div className="text-xs text-gray-400">Date & Time</div>
                <div className="text-white">{new Date(selected.scheduled_for).toLocaleString()}</div>
                <div className="text-sm text-gray-400">{selected.duration_minutes} minutes</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              {selected.meeting_url && (
                <div>
                  <div className="text-xs text-gray-400">Meeting Link</div>
                  <a href={selected.meeting_url} className="text-[#1DA1F2] text-sm flex items-center gap-1"><Video size={14} /> {selected.meeting_url}</a>
                </div>
              )}
              {selected.notes && (
                <div>
                  <div className="text-xs text-gray-400">Notes</div>
                  <div className="text-sm text-gray-300">{selected.notes}</div>
                </div>
              )}
              {selected.status === 'scheduled' && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => completeBooking(selected.id)} className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium hover:bg-green-500/30">
                    Mark Complete
                  </button>
                  <button onClick={() => cancelBooking(selected.id)} className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
