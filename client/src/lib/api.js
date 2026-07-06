/**
 * Thin fetch wrapper.
 * In dev, requests go to /api/v1/* which Vite proxies to localhost:5000.
 * In production the frontend (Vercel) and backend (Render) are on different
 * domains, so VITE_API_URL must point at the deployed backend's origin.
 * Cookies are sent automatically (credentials: 'include').
 */

const BASE = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

/* For plain <a href> links (e.g. file downloads) that can't go through fetch(). */
export const API_BASE = BASE;

class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(method, path, body = null, isFormData = false) {
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
