import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { exportToCSV } from '../utils/export';

const DAYS  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

const COLOR_PRESETS = [
  { label: 'Or', hex: '#d97706' },
  { label: 'Rose',   hex: '#EC4899' },
  { label: 'Vert',   hex: '#10B981' },
  { label: 'Violet', hex: '#8B5CF6' },
  { label: 'Orange', hex: '#F97316' },
  { label: 'Ambre',  hex: '#F59E0B' },
  { label: 'Teal',   hex: '#14B8A6' },
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
  const { showToast } = useToast();

  useEffect(() => {
    if (location.state?.filterClass) {
      setFilterClass(location.state.filterClass);
    }
  }, [location.state]);

  const events = scheduleEvents.filter(e => e.class === filterClass);

  const grid = {};
  const spanMap = {};
  events.forEach((ev) => {
    const key = `${ev.day}-${ev.startHour}`;
    grid[key] = ev;
    for (let i = 1; i < ev.duration; i++) {
      spanMap[`${ev.day}-${ev.startHour + i}`] = true;
    }
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setFormError('Le nom de la matière est requis.');
      return;
    }
    try {
      const preset = COLOR_PRESETS[form.colorIndex];
      await addScheduleEvent({
        class: filterClass,
        day: Number(form.day),
        startHour: Number(form.startHour),
        duration: Number(form.duration),
        subject: form.subject.trim(),
        teacher: form.teacher.trim(),
        room: form.room.trim(),
        color: preset.hex,
      });
      showToast('Cours ajouté avec succès', 'success');
      setForm({ ...EMPTY_FORM, class: filterClass });
      setFormError('');
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'ajout du cours', 'error');
    }
  };

  const handleExport = () => {
    if (events.length === 0) return alert('Aucun cours à exporter pour cette classe.');
    exportToCSV(
      events.map(ev => ({
        Jour: DAYS[ev.day] || ev.day,
        Heure: HOURS[ev.startHour] || ev.startHour,
        'Durée': `${ev.duration}h`,
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
      <div className="page-header">
        <h2><i className="fa-solid fa-calendar-days" style={{ color: '#b8860b', marginRight: 8 }}></i> Emploi du temps</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="stu-filter-group" style={{ margin: 0 }}>
            <i className="fa-solid fa-school"></i>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              {classNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={handleExport} className="btn btn-primary">
            <i className="fa-solid fa-download"></i> Exporter
          </button>
          <button onClick={() => { setForm({ ...EMPTY_FORM, class: filterClass }); setShowModal(true); }} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Ajouter un cours
          </button>
        </div>
      </div>

      <div className="table-container">
        {events.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fa-solid fa-calendar-days" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aucun cours pour {filterClass}</p>
            <button onClick={() => { setForm({ ...EMPTY_FORM, class: filterClass }); setShowModal(true); }} className="btn btn-primary" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-plus"></i> Ajouter le premier cours
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e4db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#57534e' }}>
                <i className="fa-solid fa-school" style={{ marginRight: 6, color: '#0d7a5e' }}></i>
                {filterClass}
              </span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{events.length} cours</span>
            </div>
            <div className="min-w-[700px]">
              <div className="grid" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
                <div />
                {DAYS.map(d => (
                  <div key={d} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#57534e', textTransform: 'uppercase', borderBottom: '1px solid #e8e4db', borderLeft: '1px solid #e8e4db', background: '#f8f7f3' }}>
                    {d}
                  </div>
                ))}
              </div>
              {HOURS.map((hour, hi) => (
                <div key={hour} className="grid" style={{ gridTemplateColumns: '60px repeat(5, 1fr)', height: CELL_H }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, borderRight: '1px solid #e8e4db' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{hour}</span>
                  </div>
                  {DAYS.map((_, di) => {
                    const key = `${di}-${hi}`;
                    if (spanMap[key]) return null;
                    const ev = grid[key];
                    return (
                      <div key={di} style={{ borderBottom: '1px solid #e8e4db', borderLeft: '1px solid #e8e4db', position: 'relative', padding: 3, height: ev ? CELL_H * ev.duration - 2 : CELL_H, gridRow: ev ? `span ${ev.duration}` : undefined }}>
                        {ev && (() => {
                          const col = ev.color || '#0d7a5e';
                          return (
                            <div style={{ height: '100%', borderRadius: 8, borderLeft: `4px solid ${col}`, padding: '6px 8px', overflow: 'hidden', position: 'relative', background: `${col}15` }}>
                              <div style={{ fontWeight: 700, fontSize: 11, color: col, lineHeight: 1.2 }}>{ev.subject}</div>
                              <div style={{ fontSize: 10, color: '#78716c', marginTop: 2 }}>{ev.teacher}</div>
                              <div style={{ fontSize: 10, color: '#9ca3af' }}>{ev.room}</div>
                              <button onClick={async () => { if (!window.confirm('Supprimer ce cours ?')) return; try { await deleteScheduleEvent(ev.id); showToast('Cours supprimé', 'success'); } catch (err) { showToast('Erreur lors de la suppression', 'error'); } }}
                                style={{ position: 'absolute', top: 2, right: 2, padding: 2, border: 'none', background: 'transparent', color: '#d4cfc4', cursor: 'pointer', borderRadius: 4, fontSize: 11 }}
                                title="Supprimer">
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Ajouter un cours</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleAdd}>
              {formError && <p style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 12 }}>{formError}</p>}
              <div className="form-row">
                <div className="form-group required">
                  <label>Jour</label>
                  <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} required>
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group required">
                  <label>Heure début</label>
                  <select value={form.startHour} onChange={e => setForm(f => ({ ...f, startHour: e.target.value }))} required>
                    {HOURS.map((h, i) => <option key={h} value={i}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Durée</label>
                  <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                    <option value={1}>1 heure</option>
                    <option value={2}>2 heures</option>
                    <option value={3}>3 heures</option>
                  </select>
                </div>
                <div className="form-group required">
                  <label>Matière</label>
                  <input required type="text" placeholder="ex: Mathématiques" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Enseignant</label>
                  {teachers.length > 0 ? (
                    <select value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" placeholder="ex: M. Lefebvre" value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} />
                  )}
                </div>
                <div className="form-group">
                  <label>Salle</label>
                  <input type="text" placeholder="ex: Salle 12" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Couleur</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLOR_PRESETS.map((c, i) => (
                    <button key={i} type="button" onClick={() => setForm(f => ({ ...f, colorIndex: i }))} title={c.label}
                      style={{ width: 32, height: 32, borderRadius: 8, border: form.colorIndex === i ? '3px solid #1a1a2e' : 'none', background: c.hex, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-cancel">Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
