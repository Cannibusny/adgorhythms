import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarTypesApi, calendarBookingsApi } from '../../lib/seoCalendarApi';
import type { CalendarType, AvailableSlot } from '../../types/seoCalendar';

export default function PublicBookingPage() {
  const { calendarTypeId } = useParams<{ calendarTypeId: string }>();
  const [calType, setCalType] = useState<CalendarType | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [form, setForm] = useState({ attendee_name: '', attendee_email: '', attendee_phone: '', notes: '' });
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!calendarTypeId) return;
    calendarTypesApi.list().then((res) => {
      const found = (res.data || []).find((t: CalendarType) => t.id === calendarTypeId);
      setCalType(found || null);
    });
  }, [calendarTypeId]);

  const loadSlots = async (date: string) => {
    if (!calendarTypeId) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    try {
      const res = await calendarBookingsApi.availableSlots(calendarTypeId, date);
      setSlots(res.slots || []);
    } catch { setSlots([]); }
  };

  const book = async () => {
    if (!calendarTypeId || !selectedSlot || !form.attendee_name || !form.attendee_email) return;
    setLoading(true);
    try {
      await calendarBookingsApi.create({
        calendar_type_id: calendarTypeId,
        attendee_name: form.attendee_name,
        attendee_email: form.attendee_email,
        attendee_phone: form.attendee_phone || undefined,
        scheduled_for: selectedSlot.time,
        notes: form.notes || undefined,
      });
      setBooked(true);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  if (!calType) {
    return (
      <div className="min-h-screen bg-[#12121F] flex items-center justify-center">
        <div className="text-center">
          <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Meeting Type Not Found</h2>
          <p className="text-gray-400 text-sm">This booking link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-[#12121F] flex items-center justify-center p-4">
        <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">You&apos;re Booked!</h2>
          <p className="text-gray-400 text-sm mb-1">{calType.name} • {calType.duration_minutes} minutes</p>
          <p className="text-gray-400 text-sm">
            {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedSlot?.display}
          </p>
          <p className="text-gray-500 text-xs mt-4">Confirmation sent to {form.attendee_email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12121F] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#6C47FF]/20 flex items-center justify-center mx-auto mb-3">
            <Calendar size={24} className="text-[#6C47FF]" />
          </div>
          <h1 className="text-2xl font-bold text-white">{calType.name}</h1>
          {calType.description && <p className="text-gray-400 text-sm mt-1">{calType.description}</p>}
          <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock size={12} /> {calType.duration_minutes} minutes</span>
            {calType.price_cents ? <span>${(calType.price_cents / 100).toFixed(2)}</span> : <span>Free</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>
              <span className="text-white font-medium">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 text-gray-400 hover:text-white"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-xs text-gray-500 py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isPast = dateStr < today;
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={day}
                    onClick={() => !isPast && loadSlots(dateStr)}
                    disabled={isPast}
                    className={`py-2 rounded-lg text-sm ${
                      isSelected ? 'bg-[#6C47FF] text-white' :
                      isPast ? 'text-gray-600 cursor-not-allowed' :
                      'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots + Form */}
          <div className="space-y-4">
            {selectedDate && (
              <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                {slots.length === 0 ? (
                  <p className="text-gray-400 text-sm">No slots available.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        onClick={() => setSelectedSlot(s)}
                        className={`py-2 rounded-lg text-sm font-medium ${
                          selectedSlot?.time === s.time ? 'bg-[#6C47FF] text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {s.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">Your Information</h3>
                <div className="space-y-3">
                  <input value={form.attendee_name} onChange={(e) => setForm({ ...form, attendee_name: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Name *" />
                  <input type="email" value={form.attendee_email} onChange={(e) => setForm({ ...form, attendee_email: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Email *" />
                  <input value={form.attendee_phone} onChange={(e) => setForm({ ...form, attendee_phone: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Phone (optional)" />
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Notes (optional)" />
                  <button onClick={book} disabled={loading || !form.attendee_name || !form.attendee_email} className="w-full py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4] disabled:opacity-50">
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
