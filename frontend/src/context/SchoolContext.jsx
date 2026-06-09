import { createContext, useContext, useState } from 'react';

const SchoolContext = createContext(null);

const STORAGE_KEY = 'school_settings';

const defaultSettings = {
  logo: null,
  schoolName: 'École Privée',
  schoolSubtitle: 'Gestion Scolaire',
  schoolId: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  schoolYear: '2024-2025',
  currency: 'EUR (€)',
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const SchoolProvider = ({ children }) => {
  const [settings, setSettings] = useState(load);

  const updateSettings = (updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const setLogo = (dataUrl) => updateSettings({ logo: dataUrl });
  const removeLogo = () => updateSettings({ logo: null });
  const setSchoolName = (name) => updateSettings({ schoolName: name });

  return (
    <SchoolContext.Provider value={{ ...settings, setLogo, removeLogo, setSchoolName, updateSettings }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used inside SchoolProvider');
  return ctx;
};
