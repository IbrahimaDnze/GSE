import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AppDataContext = createContext(null);

/* ── Normalization helpers ──────────────────────────────── */
const normalizeClass = (c) => ({
  ...c,
  id: c._id || c.id,
  level: c.niveau || c.level,
  status: c.actif === true ? 'Actif' : c.actif === false ? 'Inactif' : c.status || 'Actif',
  elevesCount: c.nombreEleves !== undefined ? c.nombreEleves : (c.elevesCount || 0),
  teacher: c.teacher || '',
  max: c.max || 0,
  subjects: Array.isArray(c.subjects) ? c.subjects : (c.subjects ? c.subjects.split(', ').filter(Boolean) : []),
});

const denormalizeClass = (data) => ({
  name: data.name,
  niveau: data.level || data.niveau,
  max: Number(data.max) || 0,
  subjects: Array.isArray(data.subjects) ? data.subjects : [],
  actif: data.status === 'Actif' || data.status === undefined || data.status === '' || data.actif,
  description: data.description || '',
});

const TYPE_MAP = { 'Scolarité': 'mensualite', 'Cantine': 'autre', 'Activité': 'inscription', 'Transport': 'autre', 'Autre': 'autre' };
const TYPE_MAP_REV = { 'mensualite': 'Scolarité', 'inscription': 'Activité', 'autre': 'Autre' };
const METHOD_MAP = { 'CB': 'Virement' };
const METHOD_MAP_REV = { 'Espèces': 'Espèces', 'Chèque': 'Chèque', 'Virement': 'Virement', 'Autre': 'Autre' };

const normalizePayment = (p) => {
  const student = p.student || {};
  const studentName = student.name || p.studentName || '';
  const studentMatricule = student.matricule || p.matricule || '';
  const studentPhoto = student.photo || p.photo || '';
  return {
    ...p,
    id: p._id || p.id,
    student: studentName,
    studentName: studentName,
    matricule: studentMatricule,
    amount: p.montant !== undefined ? p.montant : p.amount,
    method: METHOD_MAP_REV[p.modePaiement] || p.modePaiement || p.method,
    type: TYPE_MAP_REV[p.type] || p.type,
    date: p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : (p.date || ''),
    photo: studentPhoto,
    studentId: student._id || p.studentId,
  };
};

const denormalizePayment = (data) => ({
  student: data.studentId || data.student,
  studentName: typeof data.student === 'string' ? data.student : (data.studentName || ''),
  type: TYPE_MAP[data.type] || data.type,
  montant: Number(data.amount),
  modePaiement: METHOD_MAP[data.method] || data.method,
  datePaiement: data.date ? new Date(data.date) : new Date(),
  mois: data.mois || '',
  annee: data.annee || new Date().getFullYear(),
  reference: data.reference || '',
  notes: data.notes || '',
  status: data.status || 'Payé',
  matricule: data.matricule || '',
});

const normalizeTeacher = (t) => ({
  ...t,
  id: t._id || t.id,
  telephone: t.phone || t.telephone || '',
  sexe: t.gender || t.sexe || '',
  subjects: t.matieres || t.subjects || [],
});

const denormalizeTeacher = (data) => {
  const d = { ...data };
  d.phone = data.telephone || data.phone;
  d.gender = data.sexe || data.gender;
  d.matieres = data.subjects || data.matieres || [];
  delete d.telephone;
  delete d.sexe;
  delete d.subjects;
  delete d.nationalite;
  delete d.experience;
  delete d.contrat;
  delete d.niveauEnseignement;
  return d;
};

const normalizeStudent = (s) => ({
  ...s,
  id: s._id || s.id,
});

const normalizeSchedule = (ev) => ({
  ...ev,
  id: ev._id || ev.id,
  class: ev.className || ev.class,
});

const normalizeEnrollment = (e) => ({
  ...e,
  id: e._id || e.id,
});

export const AppDataProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes, cRes, subRes, eRes, pRes, gRes, nRes, schRes] = await Promise.allSettled([
        api.get('/students'),
        api.get('/teachers'),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/enrollments'),
        api.get('/payments'),
        api.get('/grades'),
        api.get('/notifications'),
        api.get('/schedule'),
      ]);
      if (sRes.status === 'fulfilled') setStudents(sRes.value.data.map(normalizeStudent));
      if (tRes.status === 'fulfilled') setTeachers(tRes.value.data.map(normalizeTeacher));
      if (cRes.status === 'fulfilled') setClasses(cRes.value.data.map(normalizeClass));
      if (subRes.status === 'fulfilled') {
        setSubjectData(subRes.value.data);
        setSubjects([...new Set(subRes.value.data.map(s => s.name))]);
      }
      if (eRes.status === 'fulfilled') setEnrollments(eRes.value.data.map(normalizeEnrollment));
      if (pRes.status === 'fulfilled') setPayments(pRes.value.data.map(normalizePayment));
      if (gRes.status === 'fulfilled') setGrades(gRes.value.data);
      if (nRes.status === 'fulfilled') setNotifications(nRes.value.data);
      if (schRes.status === 'fulfilled') setScheduleEvents(schRes.value.data.map(normalizeSchedule));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) fetchData();
    else setLoading(false);
  }, [fetchData]);

  /* ── Students ─────────────────────────────────────────────── */
  const addStudent = useCallback(async (data) => {
    const res = await api.post('/students', data);
    setStudents(prev => [...prev, normalizeStudent(res.data)]);
    return res.data;
  }, []);

  const updateStudent = useCallback(async (id, updates) => {
    const old = students.find(s => s._id === id);
    const res = await api.put(`/students/${id}`, updates);
    const updated = normalizeStudent(res.data);
    setStudents(prev => prev.map(s => s._id === id ? { ...s, ...updated } : s));
    if (old) {
      const enrollmentUpdates = {};
      if (updates.name !== undefined && updates.name !== old.name) enrollmentUpdates.student = updates.name;
      if (updates.parent !== undefined && updates.parent !== old.parent) enrollmentUpdates.parent = updates.parent;
      if (updates.parentPhone !== undefined && updates.parentPhone !== old.parentPhone) enrollmentUpdates.parentPhone = updates.parentPhone;
      if (updates.photo !== undefined && updates.photo !== old.photo) enrollmentUpdates.photo = updates.photo;
      if (updates.matricule !== undefined && updates.matricule !== old.matricule) enrollmentUpdates.matricule = updates.matricule;
      if (updates.gender !== undefined && updates.gender !== old.gender) enrollmentUpdates.gender = updates.gender;
      if (updates.class !== undefined && updates.class !== old.class) enrollmentUpdates.classReq = updates.class;
      if (Object.keys(enrollmentUpdates).length > 0) {
        const matchName = old.name?.trim();
        setEnrollments(prev => prev.map(e =>
          e.studentId === id || (matchName && e.student?.trim().toLowerCase() === matchName.toLowerCase())
            ? { ...e, ...enrollmentUpdates } : e
        ));
      }
      if (updates.name && updates.name !== old.name) {
        const matchName = old.name?.trim();
        setPayments(prev => prev.map(p => p.studentId === id || p.student === old.name ? { ...p, student: updates.name } : p));
        setGrades(prev => prev.map(g => g.studentId === id || g.studentName === old.name ? { ...g, studentName: updates.name } : g));
      }
    }
    return res.data;
  }, [students]);

  const deleteStudent = useCallback(async (id) => {
    const s = students.find(s => s._id === id || s.id === id);
    await api.delete(`/students/${id}`);
    setStudents(prev => prev.filter(st => st._id !== id));
    if (s) {
      const name = s.name?.trim();
      setEnrollments(prev => prev.filter(e =>
        e.studentId !== id && (!name || e.student?.trim().toLowerCase() !== name.toLowerCase())
      ));
      setPayments(prev => prev.filter(p => p.studentId !== id));
      setGrades(prev => prev.filter(g => g.studentId !== id));
    }
  }, [students]);

  /* ── Teachers ─────────────────────────────────────────────── */
  const addTeacher = useCallback(async (data) => {
    const res = await api.post('/teachers', denormalizeTeacher(data));
    setTeachers(prev => [...prev, normalizeTeacher(res.data)]);
    return res.data;
  }, []);

  const updateTeacher = useCallback(async (id, updates) => {
    const old = teachers.find(t => t._id === id);
    const res = await api.put(`/teachers/${id}`, denormalizeTeacher(updates));
    const updated = normalizeTeacher(res.data);
    setTeachers(prev => prev.map(t => t._id === id ? { ...t, ...updated } : t));
    if (old && updates.name && updates.name !== old.name) {
      setScheduleEvents(prev => prev.map(ev => ev.teacher === old.name ? { ...ev, teacher: updates.name } : ev));
    }
    return res.data;
  }, [teachers]);

  const deleteTeacher = useCallback(async (id) => {
    const t = teachers.find(t => t._id === id || t.id === id);
    await api.delete(`/teachers/${id}`);
    setTeachers(prev => prev.filter(t => t._id !== id));
    if (t) {
      setScheduleEvents(prev => prev.map(ev => ev.teacher === t.name ? { ...ev, teacher: '' } : ev));
    }
  }, [teachers]);

  /* ── Classes ───────────────────────────────────────────────── */
  const addClass = useCallback(async (data) => {
    const res = await api.post('/classes', denormalizeClass(data));
    setClasses(prev => [...prev, normalizeClass(res.data)]);
    return res.data;
  }, []);

  const updateClass = useCallback(async (id, updates) => {
    const res = await api.put(`/classes/${id}`, denormalizeClass(updates));
    setClasses(prev => prev.map(c => c._id === id ? { ...c, ...normalizeClass(res.data) } : c));
    return res.data;
  }, []);

  const deleteClass = useCallback(async (id) => {
    await api.delete(`/classes/${id}`);
    setClasses(prev => prev.filter(c => c._id !== id));
  }, []);

  /* ── Subjects ──────────────────────────────────────────────── */
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects');
      setSubjectData(res.data);
      setSubjects([...new Set(res.data.map(s => s.name))]);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  }, []);

  const addSubject = useCallback(async ({ name, level }) => {
    const res = await api.post('/subjects', { name, level: level || '' });
    setSubjectData(prev => [...prev, res.data]);
    setSubjects(prev => prev.includes(res.data.name) ? prev : [...prev, res.data.name]);
    return res.data;
  }, []);

  const deleteSubject = useCallback(async (id) => {
    await api.delete(`/subjects/${id}`);
    fetchSubjects();
  }, [fetchSubjects]);

  /* ── Enrollments ──────────────────────────────────────────── */
  const addEnrollment = useCallback(async (data) => {
    const res = await api.post('/enrollments', data);
    setEnrollments(prev => [...prev, normalizeEnrollment(res.data)]);
    return res.data;
  }, []);

  const updateEnrollment = useCallback(async (id, updates) => {
    const res = await api.put(`/enrollments/${id}`, updates);
    setEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...normalizeEnrollment(res.data) } : e));
    return res.data;
  }, []);

  const deleteEnrollment = useCallback(async (id) => {
    await api.delete(`/enrollments/${id}`);
    setEnrollments(prev => prev.filter(e => e.id !== id));
  }, []);

  /* ── Payments ──────────────────────────────────────────────── */
  const addPayment = useCallback(async (data) => {
    const res = await api.post('/payments', denormalizePayment(data));
    setPayments(prev => [...prev, normalizePayment(res.data)]);
    return res.data;
  }, []);

  const updatePayment = useCallback(async (id, updates) => {
    const res = await api.put(`/payments/${id}`, denormalizePayment(updates));
    setPayments(prev => prev.map(p => p._id === id ? { ...p, ...normalizePayment(res.data) } : p));
    return res.data;
  }, []);

  const deletePayment = useCallback(async (id) => {
    await api.delete(`/payments/${id}`);
    setPayments(prev => prev.filter(p => p._id !== id));
  }, []);

  const syncPaymentWithStudent = useCallback(async (paymentId, paymentData) => {
    if (paymentData.matricule) {
      try {
        const studRes = await api.get('/students', { params: { search: paymentData.matricule } });
        if (studRes.data.length > 0) {
          const student = studRes.data[0];
          return updatePayment(paymentId, {
            ...paymentData,
            student: student.name,
            studentId: student._id,
            photo: student.photo,
          });
        }
      } catch {}
    }
    return updatePayment(paymentId, paymentData);
  }, [updatePayment]);

  /* ── Grades ────────────────────────────────────────────────── */
  const addGrade = useCallback(async (data) => {
    const res = await api.post('/grades', data);
    setGrades(prev => {
      const idx = prev.findIndex(g => g._id === res.data._id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = res.data;
        return updated;
      }
      return [...prev, res.data];
    });
    return res.data;
  }, []);

  const updateGrade = useCallback(async (id, updates) => {
    const res = await api.put(`/grades/${id}`, updates);
    setGrades(prev => prev.map(g => g._id === id ? { ...g, ...res.data } : g));
    return res.data;
  }, []);

  const deleteGrade = useCallback(async (id) => {
    await api.delete(`/grades/${id}`);
    setGrades(prev => prev.filter(g => g._id !== id));
  }, []);

  const syncGradeWithStudent = useCallback(async (gradeId, gradeData) => {
    if (gradeData.matricule) {
      try {
        const studRes = await api.get('/students', { params: { search: gradeData.matricule } });
        if (studRes.data.length > 0) {
          const student = studRes.data[0];
          return updateGrade(gradeId, { ...gradeData, studentName: student.name, photo: student.photo });
        }
      } catch {}
    }
    return updateGrade(gradeId, gradeData);
  }, [updateGrade]);

  /* ── Notifications ─────────────────────────────────────────── */
  const addNotification = useCallback(async (data) => {
    const res = await api.post('/notifications', data);
    setNotifications(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  const markRead = useCallback(async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback(async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
  }, []);

  /* ── Schedule Events ──────────────────────────────────────── */
  const addScheduleEvent = useCallback(async (data) => {
    const backendData = {
      className: data.class || data.className,
      day: String(data.day),
      time: `${String(data.startHour).padStart(2, '0')}:00`,
      subject: data.subject,
      teacher: data.teacher,
      room: data.room,
    };
    const res = await api.post('/schedule', backendData);
    setScheduleEvents(prev => [...prev, normalizeSchedule(res.data)]);
    return res.data;
  }, []);

  const deleteScheduleEvent = useCallback(async (id) => {
    await api.delete(`/schedule/${id}`);
    setScheduleEvents(prev => prev.filter(e => e._id !== id));
  }, []);

  const calendarEvents = scheduleEvents.slice(0, 4).map(e => ({
    day: new Date().getDate().toString().padStart(2, '0'),
    month: new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', ''),
    title: e.subject || e.class || 'Événement',
    time: e.time || '',
  }));

  const value = {
    loading, students, addStudent, updateStudent, deleteStudent,
    teachers, addTeacher, updateTeacher, deleteTeacher,
    classes, addClass, updateClass, deleteClass,
    subjects, subjectData, addSubject, deleteSubject, fetchSubjects,
    enrollments, addEnrollment, updateEnrollment, deleteEnrollment,
    payments, addPayment, updatePayment, deletePayment, syncPaymentWithStudent,
    grades, addGrade, updateGrade, deleteGrade, syncGradeWithStudent,
    notifications, addNotification, markRead, markAllRead, removeNotification,
    scheduleEvents, addScheduleEvent, deleteScheduleEvent,
    calendarEvents,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
};
