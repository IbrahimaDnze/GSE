const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const BASE_URL = API_URL;
export const API_BASE = `${API_URL}/api`;

export function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}/uploads/${url}`;
}
