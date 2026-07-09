/**
 * Thin fetch wrapper.
 * Always uses a relative path: in dev, Vite's proxy (vite.config.js) forwards
 * /api to localhost:5000; in production, Vercel's rewrite (vercel.json)
 * proxies /api to the Render backend. This keeps every request same-origin
 * from the browser's perspective — no CORS, no cross-site cookie issues.
 * Cookies are sent automatically (credentials: 'include').
 */

const BASE = '/api/v1';

/* For plain <a href> links (e.g. file downloads) that can't go through fetch(). */
export const API_BASE = BASE;

class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/* Routes that must never trigger a refresh-and-retry (avoids infinite loops
 * and pointless refresh attempts on login/refresh failures themselves). */
const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/logout'];

/* Access tokens expire after 15 minutes (JWT_EXPIRES_IN). Without this, a
 * user active past that window gets silently logged out on their next
 * request even though their refresh token (7d) is still valid. De-duped so
 * concurrent 401s only trigger one refresh call. */
let refreshInFlight = null;
function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

async function request(method, path, body = null, isFormData = false, _isRetry = false) {
  const headers = {};
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  if (res.status === 401 && !_isRetry && !NO_REFRESH_PATHS.includes(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(method, path, body, isFormData, true);
    }
  }

  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new ApiError(
      data?.message || `HTTP ${res.status}`,
      res.status,
      data?.errors || []
    );
  }

  return data;
}

export const api = {
  get:    (path)          => request('GET',    path),
  post:   (path, body)    => request('POST',   path, body),
  patch:  (path, body)    => request('PATCH',  path, body),
  put:    (path, body)    => request('PUT',    path, body),
  delete: (path)          => request('DELETE', path),
  upload: (path, formData) => request('POST',  path, formData, true),
  uploadPatch: (path, formData) => request('PATCH', path, formData, true),
};

export { ApiError };
