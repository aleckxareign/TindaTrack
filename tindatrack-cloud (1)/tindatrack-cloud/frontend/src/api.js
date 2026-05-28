const BASE = 'https://tranquil-charisma-production-f820.up.railway.app/api';

export const api = {
  get: (path) => fetch(`${BASE}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  postForm: (path, formData) => fetch(`${BASE}${path}`, { method: 'POST', body: formData }).then(r => r.json()),
  putForm: (path, formData) => fetch(`${BASE}${path}`, { method: 'PUT', body: formData }).then(r => r.json()),
  delete: (path) => fetch(`${BASE}${path}`, { method: 'DELETE' }).then(r => r.json()),
};

export const imgUrl = (img) => img || null;
export const fmt = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
