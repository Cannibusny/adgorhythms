import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { calendarTypesApi, calendarBookingsApi } from '../../lib/seoCalendarApi';
import type { CalendarType, AvailableSlot } from '../../types/seoCalendar';

export default function BookingWidgetPage() {
  const [types, setTypes] = useState<CalendarType[]>([]);
  const [selectedType, setSelectedType] = useState<CalendarType | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [form, setForm] = useState({ attendee_name: '', attendee_email: '', attendee_phone: '', notes: '' });
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    calendarTypesApi.list().then((res) => setTypes((res.data || []).filter((t: CalendarType) => t.active)));
  }, []);

  const loadSlots = async (date: string) => {
    if (!selectedType) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    try {
      const res = await calendarBookingsApi.availableSlots(selectedType.id, date);
      setSlots(res.slots || []);
    } catch { setSlots([]); }
  };

  const book = async () => {
    if (!selectedType || !selectedSlot || !form.attendee_name || !form.attendee_email) return;
    setLoading(true);
    try {
      await calendarBookingsApi.create({
        calendar_type_id: selectedType.id,
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

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1));

  if (booked) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center bg-[#1E1E36] rounded-2xl border border-white/5 p-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Booking Confirmed!</h2>
        <p className="text-gray-400 text-sm mb-1">
          {selectedType?.name} • {selectedType?.duration_minutes} minutes
        </p>
        <p className="text-gray-400 text-sm">
          {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedSlot?.display}
        </p>
        <p className="text-gray-500 text-xs mt-4">A confirmation email will be sent to {form.attendee_email}</p>
        <button
          onClick={() => { setBooked(false); setSelectedType(null); setSelectedDate(''); setSelectedSlot(null); setForm({ attendee_name: '', attendee_email: '', attendee_phone: '', notes: '' }); }}
          className="mt-6 px-6 py-2 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]"
        >
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar size={24} /> Book a Meeting
        </h1>
        <p className="text-gray-400 text-sm mt-1">Select a meeting type, date, and time</p>
      </div>

      {/* Step 1: Select Type */}
      {!selectedType ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-[#1E1E36] rounded-2xl border border-white/5">
              <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Meeting Types Available</h3>
              <p className="text-gray-400 text-sm">Configure meeting types in Calendar Settings first.</p>
            </div>
          ) : types.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t)}
              className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5 text-left hover:border-[#6C47FF] transition-colors"
            >
              <div className="text-white font-semibold">{t.name}</div>
              {t.description && <div className="text-xs text-gray-400 mt-1">{t.description}</div>}
              <div className="flex gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock size={12} /> {t.duration_minutes} min</span>
                {t.price_cents ? <span>${(t.price_cents / 100).toFixed(2)}</span> : <span>Free</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelectedType(null)} className="text-xs text-[#6C47FF]">← Change type</button>
              <span className="text-sm text-white font-medium">{selectedType.name} ({selectedType.duration_minutes} min)</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>
              <span className="text-white font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-white"><ChevronRight size={20} /></button>
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
                <h3 className="text-white font-semibold mb-3">
                  Available Times — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                {slots.length === 0 ? (
                  <p className="text-gray-400 text-sm">No available slots for this date.</p>
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
                <h3 className="text-white font-semibold mb-3">Your Details</h3>
                <div className="space-y-3">
                  <input value={form.attendee_name} onChange={(e) => setForm({ ...form, attendee_name: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Your name *" />
                  <input type="email" value={form.attendee_email} onChange={(e) => setForm({ ...form, attendee_email: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Your email *" />
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
      )}
    </div>
  );
}
