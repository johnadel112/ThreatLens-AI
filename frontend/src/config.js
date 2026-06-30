export function getApiUrl() {
  if (typeof window !== 'undefined' && window.THREATLENS_CONFIG?.apiUrl) {
    return window.THREATLENS_CONFIG.apiUrl;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
}
