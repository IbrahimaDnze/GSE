import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageBanner from '../components/PageBanner';
import { useAppData } from '../context/AppDataContext';

const LEVELS = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];

const ClassCard = ({ cls, students, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const enrolled = students.filter((s) => s.class === cls.name).length;
  const fill = cls.max > 0 ? Math.round((enrolled / cls.max) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
      <div className={`h-1.5 ${cls.color}`} style={{ width: `${fill}%` }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`inline-flex items-center gap-1.5 ${cls.light} ${cls.text} px-2.5 py-1 rounded-lg text-xs font-bold mb-2`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /></svg>
              {cls.name}
            </div>
            <p className="text-sm text-slate-500 font-medium">Prof. principal : {cls.teacher || 'Non assigné'}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(cls)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Modifier">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onClick={() => onDelete(cls.id)} className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Élèves', value: `${enrolled}/${cls.max}` },
            { label: 'Matières', value: cls.subjects },
            { label: 'Moy. classe', value: cls.avgGrade ? `${cls.avgGrade}/20` : '—' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-bold text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Taux de remplissage</span>
            <span className={`text-[11px] font-bold ${cls.text}`}>{fill}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${cls.color}`} style={{ width: `${fill}%` }} />
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={() => navigate('/students', { state: { filterClass: cls.name } })}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${cls.light} ${cls.text} hover:opacity-80 transition-opacity`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Voir les élèves
        </button>
        <button
          onClick={() => navigate('/schedule', { state: { filterClass: cls.name } })}
          className="flex-1 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Emploi du temps
        </button>
      </div>
    </div>
  );
};

const EMPTY_FORM = { name: '', level: '6ème', teacher: '', max: 30, subjects: 8 };

const Classes = () => {
  const { classes, students, teachers, addClass, updateClass, deleteClass } = useAppData();
  const [showModal, setShowModal]   = useState(false);
  const [editClass, setEditClass]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);

  const totalStudents = students.length;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditClass(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setForm({ name: c.name, level: c.level || '6ème', teacher: c.teacher || '', max: c.max, subjects: c.subjects });
    setEditClass(c);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editClass) {
      updateClass(editClass.id, { ...form, max: Number(form.max), subjects: Number(form.subjects) });
    } else {
      addClass({ ...form, max: Number(form.max), subjects: Number(form.subjects) });
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditClass(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette classe définitivement ?')) deleteClass(id);
  };

  const placesLeft = classes.reduce((acc, c) => {
    const enrolled = students.filter((s) => s.class === c.name).length;
    return acc + Math.max(0, c.max - enrolled);
  }, 0);

  return (
    <div className="space-y-6">
      <PageBanner
        label="Organisation"
        title="Gestion des Classes"
        subtitle={`${classes.length} classe${classes.length !== 1 ? 's' : ''} actives · ${totalStudents} élèves au total`}
        actions={
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 transition-colors px-4 py-2 text-sm font-semibold shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nouvelle classe
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Classes',         value: classes.length,        bg: 'bg-primary-50',  text: 'text-primary-600'  },
          { label: 'Élèves',          value: totalStudents,          bg: 'bg-emerald-50',  text: 'text-emerald-700'  },
          { label: 'Places restantes',value: placesLeft,             bg: 'bg-amber-50',    text: 'text-amber-700'    },
          { label: 'Enseignants',     value: teachers.length,        bg: 'bg-violet-50',   text: 'text-violet-700'   },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-slate-200/60 p-5`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card flex flex-col items-center justify-center py-16 text-slate-400">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <p className="text-sm font-medium">Aucune classe créée</p>
          <button onClick={openAdd} className="mt-3 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors">
            Créer la première classe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} students={students} onDelete={handleDelete} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{editClass ? 'Modifier la classe' : 'Nouvelle classe'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom de la classe *</label>
                <input type="text" required placeholder="ex: 6ème A" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Niveau</label>
                <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Professeur principal</label>
                <select value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all">
                  <option value="">Non assigné</option>
                  {teachers.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Capacité max.</label>
                  <input type="number" min="1" value={form.max} onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre de matières</label>
                  <input type="number" min="1" value={form.subjects} onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">{editClass ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
