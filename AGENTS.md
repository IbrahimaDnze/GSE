## Goal
- Aligner exactement l'UI de ecole-privee sur le design de l'application GSEC (gestion école coranique)
- Remplacer tout le stockage localStorage par un backend Node.js/MongoDB/Express complet

## Constraints & Preferences
- Le design doit être **identique** à GSEC : sidebar bleu marine (#1e3a5f), boutons #0d7a5e, accents or (#d97706/#b8860b), fond #f5f3ee, bordures #e8e4db
- Toutes les pages doivent suivre la mise en page GSEC (stat cards, filtres, tableaux avec en-têtes colorées, pagination)
- Utilisation de Font Awesome pour les icônes
- CSS custom (pas que Tailwind) pour reproduire les détails GSEC
- Backend identique en structure au GSEC (server.js, config/db.js, config/cloudinary.js, middleware/auth.js, modèles Mongoose, routes REST)
- Frontend utilise Axios avec intercepteur Bearer token (comme GSEC)
- Auth via JWT (AuthContext + `/api/auth/login`) au lieu du localStorage
- Cloudinary pour les uploads d'images (photos élèves/enseignants, settings)

## Progress
### Done
- **Backend complet** : server.js, config/db.js, config/cloudinary.js, middleware/auth.js, models (User, Student, Teacher, Class, Subject, Enrollment, Grade, Payment, Notification, ScheduleEvent, Setting), routes (auth, users, students, teachers, classes, subjects, enrollments, grades, payments, notifications, schedule, dashboard, settings), seed.js
- **AuthContext.jsx** : authentification JWT avec `login(email, password, rememberMe)`, `logout()`, `refreshUser()`, chargement /auth/me au montage, normalisation user (nom→name, telephone→phone)
- **AppDataContext.jsx** : réécrit avec appels API (Promise.allSettled pour 9 endpoints), normalisation des champs (backend→frontend) pour Classes, Payments, Teachers, Students, Schedule ; dénormalisation pour l'écriture (frontend→backend) ; alias calendarEvents pour Dashboard ; map _id→id
- **App.jsx** : AuthProvider wrapper, ProtectedApp avec useAuth() (vérifie user + loading), AppDataProvider uniquement quand user connecté, ToastProvider wrapper
- **ToastContext.jsx** : système de notifications toast (success/error/info) avec animation slideIn, auto-disparition 3s
- **Toutes les pages CRUD** : showToast() ajouté sur chaque opération (ajout, modification, suppression) avec messages de succès/erreur en français
- **Login.jsx** : utilise `useAuth().login()` + message d'erreur toast
- **Register.jsx** : utilise `/api/auth/register` + auto-login via AuthContext + toasts
- **Sidebar.jsx** : `useAuth().user` au lieu de `useAppData().currentUser`
- **Header.jsx** : `useAuth().user/logout` au lieu de `useAppData().currentUser/logout`
- **Dashboard.jsx** : `useAuth().user` pour currentUser ; events via API ; stats financières via normalisation
- **Profile.jsx** : utilise `useAuth().user/refreshUser` + `api.put('/auth/profile')`
- **Settings.jsx** : gestion utilisateurs via API `/users`, changement mot de passe via `api.put('/auth/profile')`, plus de dépendance à `useAppData().currentUser`
- **Students.jsx** : retrait des sync* (obsolètes avec backend)
- **TeacherForm.jsx** : matières et classes chargées depuis la base de données (subjects + classes API)
- **api/axios.js** : intercepteur Bearer token + redirection 401 vers /login
- **config.js** : API_BASE (VITE_API_URL → http://localhost:5000/api)
- **index.css** : ajout animation `slideIn` pour les toasts

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Auth géré dans un contexte séparé (`AuthContext`) tandis que AppDataContext gère uniquement les données métier
- Normalisation des champs dans AppDataContext (frontend→backend via denormalize*, backend→frontend via normalize*) plutôt que de modifier le backend GSEC
- Les classes `.col-*` pour les en-têtes colorées : col-nom (#0d7a5e), col-id (#b8860b), col-classe (#059669), col-contact (#0891b2), col-date (#7c3aed), col-statut (#be185d), col-actions (#78716c)
- Les stat cards utilisent `.stu-stat-card` avec border-top colorée en inline style
- La sidebar utilise bleu marine (#1e3a5f) au lieu du vert forêt (#133626) d'origine
- Les pages Dashboard, Students, Teachers, Classes, Payments suivent le layout GSEC

## Next Steps
1. Démarrer le backend : `cd backend && npm install && npm run seed && npm start`
2. Démarrer le frontend : `npm run dev`
3. Tester la connexion (admin@ecole.com / admin123)
4. Vérifier le CRUD complet des élèves, enseignants, classes, paiements, inscriptions
5. Aligner Schedule.jsx sur le format d'événements du backend (className, day en String, time)
6. Vérifier les reports et les graphiques Dashboard avec données réelles
7. Ajouter la gestion d'erreurs et les notifications toast

## Critical Context
- GSEC original se trouve dans `C:\Users\Dnze\Desktop\GSEC\frontend`
- Backend écoute sur le **port 5000** (GSEC utilise 5001)
- MongoDB : localhost (mongodb://localhost:27017/ecole-privee)
- Le seed crée un admin : admin@ecole.com / admin123
- Les champs backend en français (`niveau`, `montant`, `modePaiement`, `datePaiement`, `actif`, `className`, `matieres`) sont automatiquement normalisés vers les noms frontend (`level`, `amount`, `method`, `date`, `status`, `class`, `subjects`)
- Mongoose fournit le virtual `id` en JSON à côté de `_id` pour la compatibilité
