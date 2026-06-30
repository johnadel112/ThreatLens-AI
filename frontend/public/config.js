// Overwritten at container startup in cloud/Docker deployments.
// Local dev uses Vite env; Docker Compose uses /api via nginx proxy.
window.THREATLENS_CONFIG = window.THREATLENS_CONFIG || {
  apiUrl: '/api',
};
