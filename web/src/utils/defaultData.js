export const DEFAULT_CATEGORIES = [
  { id: 'common', name: '常用推荐', icon: 'Home' },
  { id: 'design', name: '设计创意', icon: 'Palette' },
  { id: 'dev', name: '开发工具', icon: 'Code' },
  { id: 'news', name: '资讯头条', icon: 'Newspaper' },
  { id: 'play', name: '影音娱乐', icon: 'Tv' },
];

export const DEFAULT_SHORTCUTS = [
  // 常用推荐 - 纯快捷方式图标
  { id: 's1', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: '哔哩哔哩', url: 'https://www.bilibili.com', bgColor: '#e33e6f', color: '#ffffff', letter: 'B' },
  { id: 's2', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'GitHub', url: 'https://github.com', bgColor: '#181717', color: '#ffffff', letter: 'G' },
  { id: 's3', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: '百度', url: 'https://www.baidu.com', bgColor: '#2319dc', color: '#ffffff', letter: '度' },
  { id: 's4', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: '知乎', url: 'https://www.zhihu.com', bgColor: '#0084ff', color: '#ffffff', letter: '知' },
  { id: 's5', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'ChatGPT', url: 'https://chatgpt.com', bgColor: '#10a37f', color: '#ffffff', letter: 'AI' },
  { id: 's6', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'YouTube', url: 'https://www.youtube.com', bgColor: '#ff0000', color: '#ffffff', letter: 'Y' },
  { id: 's7', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: '微博', url: 'https://weibo.com', bgColor: '#e6162d', color: '#ffffff', letter: '博' },
  { id: 's8', categoryId: 'common', type: 'shortcut', sizeX: 1, sizeY: 1, name: '豆瓣', url: 'https://www.douban.com', bgColor: '#00b51e', color: '#ffffff', letter: '豆' },

  // 设计创意
  { id: 's9', categoryId: 'design', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Figma', url: 'https://www.figma.com', bgColor: '#f24e1e', color: '#ffffff', letter: 'F' },
  { id: 's10', categoryId: 'design', type: 'shortcut', sizeX: 2, sizeY: 1, name: 'Dribbble', url: 'https://dribbble.com', bgColor: '#ea4c89', color: '#ffffff', letter: 'D' },
  { id: 's11', categoryId: 'design', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Behance', url: 'https://www.behance.net', bgColor: '#0057ff', color: '#ffffff', letter: 'B' },
  { id: 's12', categoryId: 'design', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Unsplash', url: 'https://unsplash.com', bgColor: '#000000', color: '#ffffff', letter: 'U' },
  { id: 's13', categoryId: 'design', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Pinterest', url: 'https://www.pinterest.com', bgColor: '#e60023', color: '#ffffff', letter: 'P' },
  { id: 's14', categoryId: 'design', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Iconfont', url: 'https://www.iconfont.cn', bgColor: '#ff5c4b', color: '#ffffff', letter: 'I' },

  // 开发工具
  { id: 's15', categoryId: 'dev', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'StackOverflow', url: 'https://stackoverflow.com', bgColor: '#f48024', color: '#ffffff', letter: 'S' },
  { id: 's16', categoryId: 'dev', type: 'shortcut', sizeX: 2, sizeY: 1, name: 'MDN Web Docs', url: 'https://developer.mozilla.org', bgColor: '#1b1b1b', color: '#ffffff', letter: 'M' },
  { id: 's17', categoryId: 'dev', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'V2EX', url: 'https://www.v2ex.com', bgColor: '#333333', color: '#ffffff', letter: 'V' },
  { id: 's18', categoryId: 'dev', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'npm', url: 'https://www.npmjs.com', bgColor: '#cb3837', color: '#ffffff', letter: 'N' },
  { id: 's19', categoryId: 'dev', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Vite', url: 'https://vite.dev', bgColor: '#646cff', color: '#ffffff', letter: 'V' },
  { id: 's20', categoryId: 'dev', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'React', url: 'https://react.dev', bgColor: '#149eca', color: '#ffffff', letter: 'R' },

  // 资讯头条
  { id: 's21', categoryId: 'news', type: 'shortcut', sizeX: 1, sizeY: 1, name: '36氪', url: 'https://36kr.com', bgColor: '#0066ff', color: '#ffffff', letter: '氪' },
  { id: 's22', categoryId: 'news', type: 'shortcut', sizeX: 2, sizeY: 1, name: 'IT之家', url: 'https://www.ithome.com', bgColor: '#d22222', color: '#ffffff', letter: 'IT' },
  { id: 's23', categoryId: 'news', type: 'shortcut', sizeX: 1, sizeY: 1, name: '掘金', url: 'https://juejin.cn', bgColor: '#007fff', color: '#ffffff', letter: '掘' },
  { id: 's24', categoryId: 'news', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Hacker News', url: 'https://news.ycombinator.com', bgColor: '#ff6600', color: '#ffffff', letter: 'HN' },
  { id: 's25', categoryId: 'news', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Reddit', url: 'https://www.reddit.com', bgColor: '#ff4500', color: '#ffffff', letter: 'R' },

  // 影音娱乐
  { id: 's26', categoryId: 'play', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Steam', url: 'https://store.steampowered.com', bgColor: '#171a21', color: '#ffffff', letter: 'S' },
  { id: 's27', categoryId: 'play', type: 'shortcut', sizeX: 1, sizeY: 1, name: 'Netflix', url: 'https://www.netflix.com', bgColor: '#e50914', color: '#ffffff', letter: 'N' },
  { id: 's28', categoryId: 'play', type: 'shortcut', sizeX: 2, sizeY: 1, name: '网易云音乐', url: 'https://music.163.com', bgColor: '#e60026', color: '#ffffff', letter: '乐' },
  { id: 's29', categoryId: 'play', type: 'shortcut', sizeX: 1, sizeY: 1, name: '爱奇艺', url: 'https://www.iqiyi.com', bgColor: '#00cc4c', color: '#ffffff', letter: '奇' },
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
  bgBlur: 8,
  bgBrightness: 80,
  selectedWallpaper: 'wp-nature1',
  customWallpaperUrl: '',
  searchEngine: 'google',
  showSuggestions: true,
  showCalendar: true, // Center header clock toggle
  showQuote: true, // Bottom quote toggle
};
