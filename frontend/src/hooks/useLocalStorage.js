import { useState, useCallback } from 'react';

/**
 * Generic localStorage hook with JSON serialization.
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value if key doesn't exist
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
