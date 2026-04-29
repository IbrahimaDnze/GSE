import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';
import { exportToCSV } from '../utils/export';

const DAYS  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

const COLOR_PRESETS = [
  { label: 'Bleu',   color: 'bg-blue-500',    border: 'border-blue-300',    hex: '#3B82F6' },
  { label: 'Rose',   color: 'bg-pink-500',    border: 'border-pink-300',    hex: '#EC4899' },
  { label: 'Vert',   color: 'bg-emerald-500', border: 'border-emerald-300', hex: '#10B981' },
  { label: 'Violet', color: 'bg-violet-500',  border: 'border-violet-300',  hex: '#8B5CF6' },
  { label: 'Orange', color: 'bg-orange-500',  border: 'border-orange-300',  hex: '#F97316' },
  { label: 'Ambre',  color: 'bg-amber-500',   border: 'border-amber-300',   hex: '#F59E0B' },
  { label: 'Teal',   color: 'bg-teal-500',    border: 'border-teal-300',    hex: '#14B8A6' },
];

const CELL_H = 56;

const EMPTY_FORM = { class: '', day: 0, startHour: 0, duration: 1, subject: '', teacher: '', room: '', colorIndex: 0 };

const Schedule = () => {
  const location = useLocation();
  const { scheduleEvents, addScheduleEvent, deleteScheduleEvent, classes, teachers } = useAppData();

  const classNames = classes.length > 0 ? classes.map(c => c.name) : ['6ème A', '5ème B', '4ème C', '3ème A', '2nde B'];
  const [filterClass, setFilterClass] = useState(classNames[0] || '');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (location.state?.filterClass) {
      setFilterClass(location.state.filterClass);
    }
  }, [location.state]);

  /* ── Filtered events ─────────────────────────────── */
  const events = scheduleEvents.filter(e => e.class === filterClass);

  /* ── Build grid ──────────────────────────────────── */
  const grid = {};
  const spanMap = {};
  events.forEach((ev) => {
    const key = `${ev.day}-${ev.startHour}`;
    grid[key] = ev;
    for (let i = 1; i < ev.duration; i++) {
      spanMap[`${ev.day}-${ev.startHour + i}`] = true;
    }
  });

  /* ── Color style from class name ─────────────────── */
  const getColorStyle = (colorClass) => {
    const name = colorClass.replace('bg-', '').replace('-500', '').replace('-600', '');
    return {
      bg: `${colorClass}/10`,
      text: `text-${name}-700`,
    };
  };

  /* ── Add event ───────────────────────────────────── */
  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setFormError('Le nom de la matière est requis.');
      return;
    }
    const preset = COLOR_PRESETS[form.colorIndex];
    addScheduleEvent({
      class: filterClass,
      day: Number(form.day),
      startHour: Number(form.startHour),
      duration: Number(form.duration),
      subject: form.subject.trim(),
      teacher: form.teacher.trim(),
      room: form.room.trim(),
      color: preset.color,
      border: preset.border,
    });
    setForm({ ...EMPTY_FORM, class: filterClass });
    setFormError('');
    setShowModal(false);
  };

  /* ── Export ──────────────────────────────────────── */
  const handleExport = () => {
    if (events.length === 0) return alert('Aucun cours à exporter pour cette classe.');
    exportToCSV(
      events.map(ev => ({
        Jour: DAYS[ev.day] || ev.day,
        Heure: HOURS[ev.startHour] || ev.startHour,
        Durée: `${ev.duration}h`,
        Matière: ev.subject,
        Enseignant: ev.teacher,
        Salle: ev.room,
        Classe: ev.class,
      })),
      `emploi_du_temps_${filterClass}`
    );
  };

  return (
    <div className="space-y-6">
      <PageBanner
        label="Planification"
        title="Emploi du temps"
        subtitle="Visualisation hebdomadaire par classe"
        actions={
          <div className="flex gap-3">
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/15 border border-white/20 text-white text-sm font-medium backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50">
              {classNames.map(c => <option key={c} value={c} className="text-slate-900 bg-white">{c}</option>)}
            </select>
            <button onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 text-sm font-medium border border-white/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exporter
            </button>
            <button onClick={() => { setForm({ ...EMPTY_FORM, class: filterClass }); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Ajouter un cours
            </button>
          </div>
        }
      />

      {/* Timetable */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            Emploi du temps — Classe <span className="text-primary-600">{filterClass}</span>
          </p>
          <p className="text-xs text-slate-400">{events.length} cours planifié{events.length !== 1 ? 's' : ''}</p>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-sm font-medium">Aucun cours pour {filterClass}</p>
            <button onClick={() => { setForm({ ...EMPTY_FORM, class: filterClass }); setShowModal(true); }}
              className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
              Ajouter le premier cours
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="grid" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
                <div />
                {DAYS.map(d => (
                  <div key={d} className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 border-l border-slate-100">
                    {d}
                  </div>
                ))}
              </div>
              {/* Time slots */}
              {HOURS.map((hour, hi) => (
                <div key={hour} className="grid" style={{ gridTemplateColumns: '60px repeat(5, 1fr)', height: CELL_H }}>
                  <div className="flex items-start justify-end pr-3 pt-1 border-r border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium">{hour}</span>
                  </div>
                  {DAYS.map((_, di) => {
                    const key = `${di}-${hi}`;
                    if (spanMap[key]) return null;
                    const ev = grid[key];
                    return (
                      <div key={di} className="border-b border-l border-slate-100 relative p-1 group"
                        style={{ height: ev ? CELL_H * ev.duration - 2 : CELL_H, gridRow: ev ? `span ${ev.duration}` : undefined }}>
                        {ev && (
                          <div className="h-full rounded-xl border-l-4 px-2.5 py-1.5 overflow-hidden relative"
                            style={{ backgroundColor: `${COLOR_PRESETS.find(p => p.color === ev.color)?.hex || '#3B82F6'}15`, borderColor: COLOR_PRESETS.find(p => p.color === ev.color)?.hex || '#3B82F6' }}>
                            <div className="font-bold leading-tight text-[11px]"
                              style={{ color: COLOR_PRESETS.find(p => p.color === ev.color)?.hex || '#3B82F6' }}>
                              {ev.subject}
                            </div>
                            <div className="text-slate-500 text-[10px] mt-0.5">{ev.teacher}</div>
                            <div className="text-slate-400 text-[10px]">{ev.room}</div>
                            <button
                              onClick={() => { if (window.confirm('Supprimer ce cours ?')) deleteScheduleEvent(ev.id); }}
                              className="absolute top-1 right-1 p-0.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Ajouter un cours</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{formError}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jour *</label>
                  <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Heure de début *</label>
                  <select value={form.startHour} onChange={e => setForm(f => ({ ...f, startHour: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    {HOURS.map((h, i) => <option key={h} value={i}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Durée</label>
                  <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                    <option value={1}>1 heure</option>
                    <option value={2}>2 heures</option>
                    <option value={3}>3 heures</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Matière *</label>
                  <input required type="text" placeholder="ex: Mathématiques" value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Enseignant</label>
                  {teachers.length > 0 ? (
                    <select value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                      <option value="">— Sélectionner —</option>
                      {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" placeholder="ex: M. Lefebvre" value={form.teacher}
                      onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Salle</label>
                  <input type="text" placeholder="ex: Salle 12" value={form.room}
                    onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c, i) => (
                    <button key={i} type="button" onClick={() => setForm(f => ({ ...f, colorIndex: i }))}
                      title={c.label}
                      className={`w-8 h-8 rounded-xl transition-transform hover:scale-110 ${
                        form.colorIndex === i ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
