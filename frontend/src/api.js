// Cliente HTTP da API. O token JWT fica no localStorage.
const BASE = (import.meta.env?.VITE_API_URL || '') + '/api';
const TOKEN_KEY = 'desospidoso.token';

/** Endereço completo de um arquivo servido pela API (ex.: foto de perfil "/api/avatars/..."). */
export const apiUrl = (path) => (path?.startsWith('/api/') ? (import.meta.env?.VITE_API_URL || '') + path : path);

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, path, body, { raw = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  }
  if (res.status === 401 && token) onUnauthorized();
  if (raw && res.ok) return res;
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Não foi possível concluir a operação. Tente novamente.', res.status, data.details);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (payload) => request('POST', '/auth/register', payload),
  forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),
  verifyCode: (email, code) => request('POST', '/auth/verify-code', { email, code }),
  resetPassword: (resetToken, password, confirmPassword) =>
    request('POST', '/auth/reset-password', { resetToken, password, confirmPassword }),

  // Conta
  me: () => request('GET', '/me'),
  updateMe: (payload) => request('PUT', '/me', payload),
  updatePreferences: (prefs) => request('PUT', '/me/preferences', prefs),
  uploadAvatar: (image) => request('PUT', '/me/avatar', { image }), // image: data URL
  removeAvatar: () => request('DELETE', '/me/avatar'),
  deleteMe: () => request('DELETE', '/me'),

  // Questionários
  forms: () => request('GET', '/forms'),

  // Pacientes
  patients: (filter = 'todos', q = '') =>
    request('GET', `/patients?filter=${encodeURIComponent(filter)}&q=${encodeURIComponent(q)}`),
  patient: (id) => request('GET', `/patients/${id}`),
  createPatient: (payload) => request('POST', '/patients', payload),
  updatePatient: (id, payload) => request('PUT', `/patients/${id}`, payload),
  saveSection: (id, role, answers) => request('PUT', `/patients/${id}/sections/${role}`, { answers }),
  deletePatient: (id) => request('DELETE', `/patients/${id}`),
  restorePatient: (id) => request('POST', `/patients/${id}/restore`),

  // Fichas completas
  records: (q = '') => request('GET', `/records?q=${encodeURIComponent(q)}`),
  downloadPdf: async (id) => {
    const res = await request('GET', `/patients/${id}/pdf`, undefined, { raw: true });
    const blob = await res.blob();
    const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'ficha.pdf';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
