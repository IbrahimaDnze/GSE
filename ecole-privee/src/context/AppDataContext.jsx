import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AppDataContext = createContext(null);

/* ── color palette for avatars ─────────────────────────── */
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-pink-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-teal-500',  'bg-orange-500','bg-emerald-500','bg-cyan-500',
  'bg-rose-500',  'bg-amber-500', 'bg-blue-600',   'bg-green-600',
];
export const pickColor = (list) => AVATAR_COLORS[list.length % AVATAR_COLORS.length];

/* ── generate initials ──────────────────────────────────── */
export const getInitials = (name) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

/* ── users initialisés vide (localStorage uniquement) ─── */
const DEFAULT_USERS = [];

export const AppDataProvider = ({ children }) => {
  /* ── Auth ─────────────────────────────────────────────── */
  const [users,       setUsers]      = useLocalStorage('ep_users',    DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useLocalStorage('ep_auth',    null);

  const login = useCallback(
    (email, password) => {
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (found) {
        const session = { id: found.id, name: found.name, email: found.email, role: found.role, color: found.color };
        setCurrentUser(session);
        return true;
      }
      return false;
    },
    [users, setCurrentUser]
  );

  const logout = useCallback(() => setCurrentUser(null), [setCurrentUser]);

  const addUser = useCallback(
    (user) =>
      setUsers((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          color: pickColor(prev),
          active: true,
          ...user,
        },
      ]),
    [setUsers]
  );

  const updateUser = useCallback(
    (id, updates) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u))),
    [setUsers]
  );

  const deleteUser = useCallback(
    (id) => setUsers((prev) => prev.filter((u) => u.id !== id)),
    [setUsers]
  );

  /* ── Students ─────────────────────────────────────────── */
  const [students, setStudents] = useLocalStorage('ep_students', []);

  const addStudent = useCallback(
    (data) =>
      setStudents((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          initials: getInitials(data.name),
          color: pickColor(prev),
          status: 'Actif',
          ...data,
        },
      ]),
    [setStudents]
  );

  const updateStudent = useCallback(
    (id, updates) =>
      setStudents((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, ...updates, initials: updates.name ? getInitials(updates.name) : s.initials }
            : s
        )
      ),
    [setStudents]
  );

  const deleteStudent = useCallback(
    (id) => setStudents((prev) => prev.filter((s) => s.id !== id)),
    [setStudents]
  );

  /* ── Teachers ─────────────────────────────────────────── */
  const [teachers, setTeachers] = useLocalStorage('ep_teachers', []);

  const addTeacher = useCallback(
    (data) =>
      setTeachers((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          initials: getInitials(data.name),
          color: pickColor(prev),
          classes: [],
          status: 'Actif',
          years: 0,
          ...data,
        },
      ]),
    [setTeachers]
  );

  const updateTeacher = useCallback(
    (id, updates) =>
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...updates, initials: updates.name ? getInitials(updates.name) : t.initials }
            : t
        )
      ),
    [setTeachers]
  );

  const deleteTeacher = useCallback(
    (id) => setTeachers((prev) => prev.filter((t) => t.id !== id)),
    [setTeachers]
  );

  /* ── Classes ──────────────────────────────────────────── */
  const [classes, setClasses] = useLocalStorage('ep_classes', []);

  const addClass = useCallback(
    (data) => {
      const COLORS = [
        { color: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700'   },
        { color: 'bg-emerald-500',light: 'bg-emerald-50',text: 'text-emerald-700'},
        { color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700' },
        { color: 'bg-pink-500',   light: 'bg-pink-50',   text: 'text-pink-700'   },
        { color: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700'  },
        { color: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700'   },
      ];
      return setClasses((prev) => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          subjects: 8,
          avgGrade: 0,
          ...COLORS[prev.length % COLORS.length],
          ...data,
        },
      ]);
    },
    [setClasses]
  );

  const updateClass = useCallback(
    (id, updates) =>
      setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c))),
    [setClasses]
  );

  const deleteClass = useCallback(
    (id) => setClasses((prev) => prev.filter((c) => c.id !== id)),
    [setClasses]
  );

  /* ── Enrollments ──────────────────────────────────────── */
  const [enrollments, setEnrollments] = useLocalStorage('ep_enrollments', []);

  const addEnrollment = useCallback(
    (data) =>
      setEnrollments((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'En attente',
          docs: false,
          ...data,
        },
      ]),
    [setEnrollments]
  );

  const updateEnrollment = useCallback(
    (id, updates) =>
      setEnrollments((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e))),
    [setEnrollments]
  );

  // Synchronisation centralisée entre élèves et inscriptions
  const syncStudentWithEnrollments = useCallback(
    (studentId, studentData, oldStudentName = null) => {
      // Récupérer les valeurs les plus récentes directement depuis le state
      const currentStudents = students;
      const currentEnrollments = enrollments;
      
      const student = currentStudents.find(s => s.id === studentId);
      if (!student) return;

      // Trouver toutes les inscriptions associées à cet élève
      const enrollmentsToUpdate = currentEnrollments.filter(enr => 
        (oldStudentName && enr.student === oldStudentName) || 
        enr.student === student.name ||
        enr.student === studentData.name
      );

      // Mettre à jour toutes les inscriptions trouvées
      enrollmentsToUpdate.forEach(enrollment => {
        updateEnrollment(enrollment.id, {
          student: studentData.name || enrollment.student,
          parent: studentData.parent || enrollment.parent,
          parentPhone: studentData.parentPhone || enrollment.parentPhone,
          classReq: studentData.class || enrollment.classReq,
          schoolYear: studentData.schoolYear || enrollment.schoolYear,
          gender: studentData.gender || enrollment.gender,
          photo: studentData.photo || enrollment.photo,
          matricule: studentData.matricule || enrollment.matricule,
          status: enrollment.status
        });
      });
    },
    [students, enrollments, updateEnrollment]
  );

  const deleteEnrollment = useCallback(
    (id) => setEnrollments((prev) => prev.filter((e) => e.id !== id)),
    [setEnrollments]
  );

  // Synchronisation lors de la suppression d'un élève
  const syncDeleteStudentWithEnrollments = useCallback(
    (studentId) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      // Trouver toutes les inscriptions associées à cet élève
      const enrollmentsToDelete = enrollments.filter(enr => 
        enr.student === student.name
      );

      // Supprimer toutes les inscriptions trouvées
      enrollmentsToDelete.forEach(enrollment => {
        deleteEnrollment(enrollment.id);
      });
    },
    [students, enrollments, deleteEnrollment]
  );

  /* ── Payments ─────────────────────────────────────────── */
  const [payments, setPayments] = useLocalStorage('ep_payments', []);

  const addPayment = useCallback(
    (data) =>
      setPayments((prev) => [
        ...prev,
        {
          id: `p-${Date.now()}`,
          initials: getInitials(data.student),
          color: pickColor(prev),
          date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'En attente',
          ...data,
          amount: Number(data.amount),
        },
      ]),
    [setPayments]
  );

  const updatePayment = useCallback(
    (id, updates) =>
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...updates, amount: updates.amount ? Number(updates.amount) : p.amount }
            : p
        )
      ),
    [setPayments]
  );

  // Synchronisation des paiements avec les données des élèves
  const syncPaymentWithStudent = useCallback(
    (paymentId, paymentData) => {
      // Si le paiement a un matricule, chercher l'élève correspondant
      if (paymentData.matricule) {
        const student = students.find(s => s.matricule === paymentData.matricule);
        if (student) {
          // Mettre à jour le paiement avec les données de l'élève
          updatePayment(paymentId, {
            ...paymentData,
            student: student.name,
            photo: student.photo,
            initials: student.initials,
            color: student.color
          });
        } else {
          // Si aucun élève trouvé, mettre à jour juste le paiement
          updatePayment(paymentId, paymentData);
        }
      } else {
        // Si pas de matricule, mettre à jour normalement
        updatePayment(paymentId, paymentData);
      }
    },
    [students, updatePayment]
  );

  const deletePayment = useCallback(
    (id) => setPayments((prev) => prev.filter((p) => p.id !== id)),
    [setPayments]
  );

  /* ── Grades ───────────────────────────────────────────── */
  const [grades, setGrades] = useLocalStorage('ep_grades', []);

  const addGrade = useCallback(
    (data) =>
      setGrades((prev) => {
        const existing = prev.findIndex(
          (g) => g.studentName === data.studentName && g.class === data.class && g.trimestre === data.trimestre
        );
        if (existing !== -1) {
          return prev.map((g, i) => (i === existing ? { ...g, ...data } : g));
        }
        return [
          ...prev,
          {
            id: `g-${Date.now()}`,
            initials: getInitials(data.studentName),
            color: pickColor(prev),
            ...data,
          },
        ];
      }),
    [setGrades]
  );

  const updateGrade = useCallback(
    (id, updates) =>
      setGrades((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g))),
    [setGrades]
  );

  // Synchronisation des notes avec les données des élèves
  const syncGradeWithStudent = useCallback(
    (gradeId, gradeData) => {
      // Si la note a un matricule, chercher l'élève correspondant
      if (gradeData.matricule) {
        const student = students.find(s => s.matricule === gradeData.matricule);
        if (student) {
          // Mettre à jour la note avec les données de l'élève
          updateGrade(gradeId, {
            ...gradeData,
            studentName: student.name,
            photo: student.photo,
            initials: student.initials,
            color: student.color
          });
        } else {
          // Si aucun élève trouvé, mettre à jour juste la note
          updateGrade(gradeId, gradeData);
        }
      } else {
        // Si pas de matricule, mettre à jour normalement
        updateGrade(gradeId, gradeData);
      }
    },
    [students, updateGrade]
  );

  const deleteGrade = useCallback(
    (id) => setGrades((prev) => prev.filter((g) => g.id !== id)),
    [setGrades]
  );

  /* ── Notifications ────────────────────────────────────── */
  const [notifications, setNotifications] = useLocalStorage('ep_notifications', []);

  const addNotification = useCallback(
    (data) =>
      setNotifications((prev) => [
        {
          id: `n-${Date.now()}`,
          time: 'À l\'instant',
          read: false,
          important: false,
          ...data,
        },
        ...prev,
      ]),
    [setNotifications]
  );

  const markRead = useCallback(
    (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [setNotifications]
  );

  const markAllRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    [setNotifications]
  );

  const removeNotification = useCallback(
    (id) => setNotifications((prev) => prev.filter((n) => n.id !== id)),
    [setNotifications]
  );

  /* ── Schedule Events ──────────────────────────────────── */
  const [scheduleEvents, setScheduleEvents] = useLocalStorage('ep_schedule', []);

  const addScheduleEvent = useCallback(
    (data) =>
      setScheduleEvents((prev) => [
        ...prev,
        {
          id: `se-${Date.now()}`,
          color: 'bg-blue-500',
          border: 'border-blue-300',
          ...data,
          day: Number(data.day),
          startHour: Number(data.startHour),
          duration: Number(data.duration),
        },
      ]),
    [setScheduleEvents]
  );

  const deleteScheduleEvent = useCallback(
    (id) => setScheduleEvents((prev) => prev.filter((e) => e.id !== id)),
    [setScheduleEvents]
  );

  /* ── Calendar Events (Dashboard upcoming events) ─────── */
  const [calendarEvents, setCalendarEvents] = useLocalStorage('ep_calendar_events', []);

  const addCalendarEvent = useCallback(
    (data) =>
      setCalendarEvents((prev) => [
        ...prev,
        {
          id: `ce-${Date.now()}`,
          color: 'bg-primary-600',
          textColor: 'text-primary-700',
          bgLight: 'bg-primary-50',
          ...data,
        },
      ]),
    [setCalendarEvents]
  );

  const deleteCalendarEvent = useCallback(
    (id) => setCalendarEvents((prev) => prev.filter((e) => e.id !== id)),
    [setCalendarEvents]
  );

  const value = {
    /* auth */
    currentUser, login, logout,
    users, addUser, updateUser, deleteUser,
    /* data */
    students, addStudent, updateStudent, deleteStudent, syncStudentWithEnrollments, syncDeleteStudentWithEnrollments,
    teachers, addTeacher, updateTeacher, deleteTeacher,
    classes,  addClass,  updateClass,  deleteClass,
    enrollments, addEnrollment, updateEnrollment, deleteEnrollment,
    payments, addPayment, updatePayment, deletePayment, syncPaymentWithStudent,
    grades, addGrade, updateGrade, deleteGrade, syncGradeWithStudent,
    notifications, addNotification, markRead, markAllRead, removeNotification,
    scheduleEvents, addScheduleEvent, deleteScheduleEvent,
    calendarEvents, addCalendarEvent, deleteCalendarEvent,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
};
