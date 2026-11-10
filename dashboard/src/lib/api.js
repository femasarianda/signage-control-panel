const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(method, path, body) {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body && !isForm && { 'Content-Type': 'application/json' }),
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
    },
    body: body && (isForm ? body : JSON.stringify(body)),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // Token kedaluwarsa / tidak valid -> paksa login ulang (kecuali saat memang sedang login)
    if (res.status === 401 && path !== '/auth/login') onUnauthorized();
    throw new ApiError(res.status, data?.error || `Request gagal (${res.status})`);
  }
  return data;
}

export const api = {
  login: (username, password) => request('POST', '/auth/login', { username, password }),

  devices: {
    list: () => request('GET', '/devices'),
    create: (body) => request('POST', '/devices', body),
    update: (id, body) => request('PUT', `/devices/${id}`, body),
    remove: (id) => request('DELETE', `/devices/${id}`),
    playlist: (id) => request('GET', `/devices/${id}/playlist`),
    savePlaylist: (id, items) => request('PUT', `/devices/${id}/playlist`, { items }),
    push: (id, content_id) => request('POST', `/devices/${id}/push`, { content_id }),
  },

  contents: {
    list: () => request('GET', '/contents'),
    create: (body) => request('POST', '/contents', body),
    upload: (file, judul) => {
      const form = new FormData();
      form.append('file', file);
      if (judul) form.append('judul', judul);
      return request('POST', '/contents/upload', form);
    },
    update: (id, body) => request('PUT', `/contents/${id}`, body),
    remove: (id) => request('DELETE', `/contents/${id}`),
  },
};
