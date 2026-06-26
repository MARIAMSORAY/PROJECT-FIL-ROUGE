// Petit client HTTP pour parler à l'API SOCket.
// Le token JWT est conservé en localStorage (côté navigateur de l'analyste,
// dans un contexte interne SOC) puis envoyé en en-tête Authorization.

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('socket_token');
}

function setSession(token, user) {
  localStorage.setItem('socket_token', token);
  localStorage.setItem('socket_user', JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem('socket_user');
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem('socket_token');
  localStorage.removeItem('socket_user');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    window.location.href = '/login.html';
    throw new Error('Session expirée');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

const Api = {
  login: (username, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  listIncidents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/incidents${qs ? `?${qs}` : ''}`);
  },
  getIncident: (id) => apiFetch(`/incidents/${id}`),
  createIncident: (data) => apiFetch('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateIncident: (id, data) => apiFetch(`/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIncident: (id) => apiFetch(`/incidents/${id}`, { method: 'DELETE' }),
  addComment: (id, content) =>
    apiFetch(`/incidents/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  listUsers: () => apiFetch('/users'),
  listLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/logs${qs ? `?${qs}` : ''}`);
  },
};
