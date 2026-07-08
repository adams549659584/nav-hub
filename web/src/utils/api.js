export async function fetchPublicConfig() {
  const res = await fetch('/api/public/config', { credentials: 'include' });
  if (!res.ok) throw new Error('failed to load config');
  return res.json();
}

export async function fetchAuthMe() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return { admin: false };
  return res.json();
}

export async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'login failed');
  return data;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function saveAdminConfig(payload) {
  const res = await fetch('/api/admin/config', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'save failed');
  return data;
}