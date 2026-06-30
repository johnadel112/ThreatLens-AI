export function getApiUrl() {
  const viteUrl = import.meta.env.VITE_API_URL;
  // Vercel/cloud builds: full backend URL baked in at build time
  if (viteUrl && /^https?:\/\//.test(viteUrl)) {
    return viteUrl;
  }
  // Docker: runtime config.js from entrypoint (or /api via nginx proxy)
  if (typeof window !== 'undefined' && window.THREATLENS_CONFIG?.apiUrl) {
    return window.THREATLENS_CONFIG.apiUrl;
  }
  return viteUrl || 'http://localhost:4000/api';
}
