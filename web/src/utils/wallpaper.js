/** Trigger a real file download (same-origin proxy for remote URLs). */
export function downloadWallpaperFile(src, title = 'wallpaper') {
  if (!src || src.startsWith('#') || src.startsWith('data:')) return;
  const name = String(title || 'wallpaper')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .trim()
    .slice(0, 80) || 'wallpaper';
  const params = new URLSearchParams({ url: src, name });
  const a = document.createElement('a');
  a.href = `/api/public/wallpapers/download?${params}`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Default wallpaper object stored in settings.wallpaper */
export const DEFAULT_WALLPAPER = {
  source: 'preset',
  type: 'image', // image | video | color
  id: 'wp-nature1',
  src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  thumb: '',
  title: '山川湖泊',
  mask: 0.15,
  blur: 8,
  brightness: 80,
  autoDaily: false,
};

/**
 * Normalize legacy settings into wallpaper object + flat fields for sliders.
 */
export function normalizeWallpaperSettings(settings = {}) {
  const base = { ...DEFAULT_WALLPAPER };
  const wp = settings.wallpaper && typeof settings.wallpaper === 'object'
    ? { ...base, ...settings.wallpaper }
    : { ...base };

  // legacy → wallpaper
  if (!settings.wallpaper) {
    if (settings.customWallpaperUrl) {
      wp.source = 'custom';
      wp.type = 'image';
      wp.src = settings.customWallpaperUrl;
      wp.id = 'custom';
      wp.title = '自定义';
    } else if (settings.selectedWallpaper) {
      wp.id = settings.selectedWallpaper;
      wp.source = 'preset';
    }
    if (typeof settings.bgBlur === 'number') wp.blur = settings.bgBlur;
    if (typeof settings.bgBrightness === 'number') wp.brightness = settings.bgBrightness;
  }

  // keep flat aliases for existing UI
  return {
    ...settings,
    wallpaper: wp,
    bgBlur: wp.blur,
    bgBrightness: wp.brightness,
    customWallpaperUrl: wp.source === 'custom' ? wp.src : settings.customWallpaperUrl || '',
    selectedWallpaper: wp.source === 'preset' ? wp.id : settings.selectedWallpaper || '',
  };
}

export function applyWallpaperSelection(settings, item) {
  const prev = settings.wallpaper || DEFAULT_WALLPAPER;
  const wallpaper = {
    ...prev,
    source: item.source || prev.source,
    type: item.type || 'image',
    id: item.id || '',
    src: item.src || '',
    thumb: item.thumb || '',
    title: item.title || '',
    autoDaily: item.source === 'bing' ? !!prev.autoDaily : false,
  };
  return normalizeWallpaperSettings({
    ...settings,
    wallpaper,
    bgBlur: wallpaper.blur,
    bgBrightness: wallpaper.brightness,
    customWallpaperUrl: wallpaper.source === 'custom' ? wallpaper.src : '',
    selectedWallpaper: '',
  });
}

export function updateWallpaperField(settings, patch) {
  const prev = settings.wallpaper || DEFAULT_WALLPAPER;
  const wallpaper = { ...prev, ...patch };
  return normalizeWallpaperSettings({
    ...settings,
    wallpaper,
    bgBlur: wallpaper.blur,
    bgBrightness: wallpaper.brightness,
    customWallpaperUrl: wallpaper.source === 'custom' ? wallpaper.src : settings.customWallpaperUrl,
  });
}
