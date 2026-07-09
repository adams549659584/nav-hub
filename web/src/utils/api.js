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

export async function fetchWallpaperSources() {
  const res = await fetch('/api/public/wallpapers/sources');
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? '壁纸接口不存在，请重启后端 API（make dev-api）'
        : `加载壁纸分类失败 (${res.status})`
    );
  }
  const data = await res.json();
  return data.sources || [];
}

export async function fetchWallpapers({ source = 'bing', page = 1, size = 16, q = '' } = {}) {
  const params = new URLSearchParams({
    source,
    page: String(page),
    size: String(size),
  });
  if (q) params.set('q', q);
  let res;
  try {
    res = await fetch(`/api/public/wallpapers?${params}`);
  } catch {
    throw new Error('无法连接后端，请确认 make dev-api 已启动（:8080）');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error('壁纸接口不存在，请用最新代码重启后端 API（make dev-api）');
    }
    throw new Error(data.error || `加载壁纸失败 (${res.status})`);
  }
  return res.json();
}