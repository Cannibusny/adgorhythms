import { useState, useEffect } from 'react';
import { Settings, Plus, Clock, DollarSign, Trash2, Edit2, X } from 'lucide-react';
import { calendarTypesApi, calendarAvailabilityApi } from '../../lib/seoCalendarApi';
import type { CalendarType, CalendarAvailability } from '../../types/seoCalendar';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarSettingsPage() {
  const [types, setTypes] = useState<CalendarType[]>([]);
  const [availability, setAvailability] = useState<CalendarAvailability[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [editType, setEditType] = useState<CalendarType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', duration_minutes: 30, buffer_before_minutes: 0, buffer_after_minutes: 0, price_cents: 0 });
  const [availForm, setAvailForm] = useState({ day_of_week: 1, start_time: '09:00', end_time: '17:00', timezone: 'UTC' });

  const loadData = async () => {
    try {
      const [t, a] = await Promise.all([calendarTypesApi.list(), calendarAvailabilityApi.list()]);
      setTypes(t.data || []);
      setAvailability(a.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadData(); }, []);

  const saveType = async () => {
    if (!typeForm.name) return;
    if (editType) {
      await calendarTypesApi.update(editType.id, typeForm);
    } else {
      await calendarTypesApi.create(typeForm);
    }
    setShowTypeModal(false);
    setEditType(null);
    setTypeForm({ name: '', description: '', duration_minutes: 30, buffer_before_minutes: 0, buffer_after_minutes: 0, price_cents: 0 });
    loadData();
  };

  const deleteType = async (id: string) => {
    await calendarTypesApi.delete(id);
    loadData();
  };

  const saveAvail = async () => {
    await calendarAvailabilityApi.create(availForm);
    setShowAvailModal(false);
    setAvailForm({ day_of_week: 1, start_time: '09:00', end_time: '17:00', timezone: 'UTC' });
    loadData();
  };

  const deleteAvail = async (id: string) => {
    await calendarAvailabilityApi.delete(id);
    loadData();
  };

  const openEditType = (t: CalendarType) => {
    setEditType(t);
    setTypeForm({
      name: t.name,
      description: t.description || '',
      duration_minutes: t.duration_minutes,
      buffer_before_minutes: t.buffer_before_minutes,
      buffer_after_minutes: t.buffer_after_minutes,
      price_cents: t.price_cents || 0,
    });
    setShowTypeModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={24} /> Calendar Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">Configure meeting types and availability</p>
      </div>

      {/* Meeting Types */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Meeting Types</h3>
          <button
            onClick={() => { setEditType(null); setTypeForm({ name: '', description: '', duration_minutes: 30, buffer_before_minutes: 0, buffer_after_minutes: 0, price_cents: 0 }); setShowTypeModal(true); }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#6C47FF] text-white rounded-lg hover:bg-[#5a3ad4]"
          >
            <Plus size={14} /> Add Type
          </button>
        </div>

        {types.length === 0 ? (
          <p className="text-gray-400 text-sm">No meeting types yet. Create one to start accepting bookings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {types.map((t) => (
              <div key={t.id} className="bg-[#12121F] rounded-xl p-4 flex items-start justify-between">
                <div>
                  <div className="text-white font-medium">{t.name}</div>
                  {t.description && <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>}
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={12} /> {t.duration_minutes} min</span>
                    {t.price_cents ? <span className="flex items-center gap-1"><DollarSign size={12} /> ${(t.price_cents / 100).toFixed(2)}</span> : null}
                    {t.buffer_before_minutes > 0 && <span>{t.buffer_before_minutes}m buffer before</span>}
                    {t.buffer_after_minutes > 0 && <span>{t.buffer_after_minutes}m buffer after</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditType(t)} className="p-1.5 text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                  <button onClick={() => deleteType(t.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="bg-[#1E1E36] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Availability</h3>
          <button
            onClick={() => setShowAvailModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#6C47FF] text-white rounded-lg hover:bg-[#5a3ad4]"
          >
            <Plus size={14} /> Add Slot
          </button>
        </div>

        {availability.length === 0 ? (
          <p className="text-gray-400 text-sm">No availability set. Add time slots for each day you accept bookings.</p>
        ) : (
          <div className="space-y-2">
            {availability.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-[#12121F] rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white w-24">{DAYS[a.day_of_week]}</span>
                  <span className="text-sm text-gray-400">{a.start_time} – {a.end_time}</span>
                  <span className="text-xs text-gray-500">{a.timezone}</span>
                </div>
                <button onClick={() => deleteAvail(a.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meeting Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{editType ? 'Edit' : 'Create'} Meeting Type</h3>
              <button onClick={() => setShowTypeModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Name (e.g. Discovery Call)" />
              <input value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm" placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Duration (min)</label>
                  <input type="number" value={typeForm.duration_minutes} onChange={(e) => setTypeForm({ ...typeForm, duration_minutes: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Price (cents)</label>
                  <input type="number" value={typeForm.price_cents} onChange={(e) => setTypeForm({ ...typeForm, price_cents: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Buffer Before (min)</label>
                  <input type="number" value={typeForm.buffer_before_minutes} onChange={(e) => setTypeForm({ ...typeForm, buffer_before_minutes: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Buffer After (min)</label>
                  <input type="number" value={typeForm.buffer_after_minutes} onChange={(e) => setTypeForm({ ...typeForm, buffer_after_minutes: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1" />
                </div>
              </div>
              <button onClick={saveType} className="w-full py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]">
                {editType ? 'Update' : 'Create'} Meeting Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E36] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Add Availability</h3>
              <button onClick={() => setShowAvailModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Day</label>
                <select value={availForm.day_of_week} onChange={(e) => setAvailForm({ ...availForm, day_of_week: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Start Time</label>
                  <input type="time" value={availForm.start_time} onChange={(e) => setAvailForm({ ...availForm, start_time: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">End Time</label>
                  <input type="time" value={availForm.end_time} onChange={(e) => setAvailForm({ ...availForm, end_time: e.target.value })} className="w-full px-3 py-2 bg-[#12121F] border border-white/10 rounded-xl text-white text-sm mt-1" />
                </div>
              </div>
              <button onClick={saveAvail} className="w-full py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium hover:bg-[#5a3ad4]">
                Add Availability
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
