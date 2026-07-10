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

export async function changeAdminPassword(currentPassword, newPassword) {
  const res = await fetch('/api/admin/password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.error === 'current password is incorrect'
        ? '当前密码不正确'
        : data.error === 'new password must be at least 6 characters'
          ? '新密码至少 6 位'
          : data.error || '修改密码失败';
    throw new Error(msg);
  }
  return data;
}

/** 服务端抓取站点图标（SVG 优先），返回 data URL */
export async function fetchFavicon(pageUrl) {
  const params = new URLSearchParams({ url: pageUrl });
  const res = await fetch(`/api/public/favicon?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '获取图标失败');
  if (!data.favicon) throw new Error('未返回图标');
  return data.favicon;
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