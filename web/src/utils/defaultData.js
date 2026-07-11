// 前端兜底：真实默认数据以服务端 seed（/api/public/config）为准，此处只保结构合法。
export const DEFAULT_CATEGORIES = [
  { id: 1, code: 'common', name: '常用推荐', icon: 'Home' },
];

export const DEFAULT_SHORTCUTS = [];

export const DEFAULT_WALLPAPERS = [
  {
    id: 'wp-nature1',
    name: '山川湖泊',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'wp-nature2',
    name: '极光星空',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1483168527879-c66136b56105?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'wp-minimal1',
    name: '流沙粉褐',
    category: 'minimalist',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'wp-minimal2',
    name: '渐变柔光',
    category: 'minimalist',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'wp-anime1',
    name: '新海诚风天空',
    category: 'anime',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'wp-city1',
    name: '赛博霓虹',
    category: 'city',
    url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'wp-dark1',
    name: '纯黑极简',
    category: 'solid',
    url: '#1e1e1e',
  },
];

export const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', placeholder: '在 Google 中搜索，或者输入网址', color: '#4285f4' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', placeholder: '百度一下，你就知道', color: '#2319dc' },
  { id: 'bing', name: 'Bing', url: 'https://cn.bing.com/search?q=', placeholder: '输入搜索内容...', color: '#00809d' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', placeholder: '搜索 GitHub 仓库...', color: '#24292e' },
  { id: 'duck', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', placeholder: '隐私安全搜索...', color: '#de5833' },
];


export const DEFAULT_SETTINGS = {
  iconSize: "medium",
  iconRadius: "20px",
  columns: 10,
  gap: 12,
  maxWidth: 1200,
  // legacy flat fields (kept in sync with wallpaper.*)
  bgBlur: 0,
  bgBrightness: 100,
  selectedWallpaper: "",
  customWallpaperUrl: "",
  // structured wallpaper (iTab-style)
  wallpaper: {
    source: "wallhaven",
    type: "image",
    id: "wallhaven:1qr7vg",
    src: "https://w.wallhaven.cc/full/1q/wallhaven-1qr7vg.png",
    thumb: "https://th.wallhaven.cc/small/1q/1qr7vg.jpg",
    title: "3840x2160 · 1qr7vg",
    mask: 0,
    blur: 0,
    brightness: 100,
    autoDaily: false,
  },
  searchEngine: "google",
  showSuggestions: true,
  showCalendar: true,
  showQuote: true,
  // 站点品牌
  siteTitle: "导航页",
  siteDescription: "一个高颜值、极简、无广告的卡片式导航页。",
  logoText: "iT",
  logoBgColor: "#535353",
  logoBgColorEnd: "#000000",
};

