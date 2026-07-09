export const DEFAULT_CATEGORIES = [
  { id: 1, code: 'common', name: '常用推荐', icon: 'Home' },
  { id: 2, code: 'design', name: '设计创意', icon: 'Palette' },
  { id: 3, code: 'dev', name: '开发工具', icon: 'Code' },
  { id: 4, code: 'news', name: '资讯头条', icon: 'Newspaper' },
  { id: 5, code: 'play', name: '影音娱乐', icon: 'Tv' },
];

export const DEFAULT_SHORTCUTS = [
  // 常用推荐
  { id: 1, categoryIds: [1], name: '哔哩哔哩', url: 'https://www.bilibili.com', bgColor: '#e33e6f', letter: 'B' },
  { id: 2, categoryIds: [1], name: 'GitHub', url: 'https://github.com', bgColor: '#181717', letter: 'G' },
  { id: 3, categoryIds: [1], name: '百度', url: 'https://www.baidu.com', bgColor: '#2319dc', letter: '度' },
  { id: 4, categoryIds: [1], name: '知乎', url: 'https://www.zhihu.com', bgColor: '#0084ff', letter: '知' },
  { id: 5, categoryIds: [1], name: 'ChatGPT', url: 'https://chatgpt.com', bgColor: '#10a37f', letter: 'AI' },
  { id: 6, categoryIds: [1], name: 'YouTube', url: 'https://www.youtube.com', bgColor: '#ff0000', letter: 'Y' },
  { id: 7, categoryIds: [1], name: '微博', url: 'https://weibo.com', bgColor: '#e6162d', letter: '博' },
  { id: 8, categoryIds: [1], name: '豆瓣', url: 'https://www.douban.com', bgColor: '#00b51e', letter: '豆' },

  // 设计创意
  { id: 9, categoryIds: [2], name: 'Figma', url: 'https://www.figma.com', bgColor: '#f24e1e', letter: 'F' },
  { id: 10, categoryIds: [2], name: 'Dribbble', url: 'https://dribbble.com', bgColor: '#ea4c89', letter: 'D' },
  { id: 11, categoryIds: [2], name: 'Behance', url: 'https://www.behance.net', bgColor: '#0057ff', letter: 'B' },
  { id: 12, categoryIds: [2], name: 'Unsplash', url: 'https://unsplash.com', bgColor: '#000000', letter: 'U' },
  { id: 13, categoryIds: [2], name: 'Pinterest', url: 'https://www.pinterest.com', bgColor: '#e60023', letter: 'P' },
  { id: 14, categoryIds: [2], name: 'Iconfont', url: 'https://www.iconfont.cn', bgColor: '#ff5c4b', letter: 'I' },

  // 开发工具
  { id: 15, categoryIds: [3], name: 'StackOverflow', url: 'https://stackoverflow.com', bgColor: '#f48024', letter: 'S' },
  { id: 16, categoryIds: [3], name: 'MDN Web Docs', url: 'https://developer.mozilla.org', bgColor: '#1b1b1b', letter: 'M' },
  { id: 17, categoryIds: [3], name: 'V2EX', url: 'https://www.v2ex.com', bgColor: '#333333', letter: 'V' },
  { id: 18, categoryIds: [3], name: 'npm', url: 'https://www.npmjs.com', bgColor: '#cb3837', letter: 'N' },
  { id: 19, categoryIds: [3], name: 'Vite', url: 'https://vite.dev', bgColor: '#646cff', letter: 'V' },
  { id: 20, categoryIds: [3], name: 'React', url: 'https://react.dev', bgColor: '#149eca', letter: 'R' },

  // 资讯头条
  { id: 21, categoryIds: [4], name: '36氪', url: 'https://36kr.com', bgColor: '#0066ff', letter: '氪' },
  { id: 22, categoryIds: [4], name: 'IT之家', url: 'https://www.ithome.com', bgColor: '#d22222', letter: 'IT' },
  { id: 23, categoryIds: [4], name: '掘金', url: 'https://juejin.cn', bgColor: '#007fff', letter: '掘' },
  { id: 24, categoryIds: [4], name: 'Hacker News', url: 'https://news.ycombinator.com', bgColor: '#ff6600', letter: 'HN' },
  { id: 25, categoryIds: [4], name: 'Reddit', url: 'https://www.reddit.com', bgColor: '#ff4500', letter: 'R' },

  // 影音娱乐
  { id: 26, categoryIds: [5], name: 'Steam', url: 'https://store.steampowered.com', bgColor: '#171a21', letter: 'S' },
  { id: 27, categoryIds: [5], name: 'Netflix', url: 'https://www.netflix.com', bgColor: '#e50914', letter: 'N' },
  { id: 28, categoryIds: [5], name: '网易云音乐', url: 'https://music.163.com', bgColor: '#e60026', letter: '乐' },
  { id: 29, categoryIds: [5], name: '爱奇艺', url: 'https://www.iqiyi.com', bgColor: '#00cc4c', letter: '奇' },
];

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
  iconSize: 'medium',
  iconRadius: '20px',
  columns: 10,
  gap: 12,
  maxWidth: 1200,
  // legacy flat fields (kept in sync with wallpaper.*)
  bgBlur: 8,
  bgBrightness: 80,
  selectedWallpaper: 'wp-nature1',
  customWallpaperUrl: '',
  // structured wallpaper (iTab-style)
  wallpaper: {
    source: 'preset',
    type: 'image',
    id: 'wp-nature1',
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    thumb: '',
    title: '山川湖泊',
    mask: 0.15,
    blur: 8,
    brightness: 80,
    autoDaily: false,
  },
  searchEngine: 'google',
  showSuggestions: true,
  showCalendar: true,
  showQuote: true,
  // 站点品牌
  siteTitle: '导航页',
  siteDescription: '一个高颜值、极简、无广告的卡片式导航页。',
  logoText: 'iT',
  logoBgColor: '#4f46e5',
  logoBgColorEnd: '#ec4899',
};
