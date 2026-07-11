import { SEARCH_ENGINES } from './defaultData';
import { shortcutMatchesQuery, textMatchesQuery } from './matchText';
import { ALL_CATEGORY_ID } from './categories';

/** 是否像可直接打开的 URL / 域名 */
export function looksLikeUrl(raw) {
  const q = String(raw ?? '').trim();
  if (!q || /\s/.test(q)) return false;
  if (/^https?:\/\//i.test(q)) return true;
  if (/^localhost(:\d+)?(\/|$)/i.test(q)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(q)) return true;
  // domain.tld...
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/.*)?$/i.test(q)) {
    return true;
  }
  return false;
}

export function normalizeOpenUrl(raw) {
  const q = String(raw ?? '').trim();
  if (!q) return '';
  if (/^https?:\/\//i.test(q)) return q;
  return `https://${q}`;
}

/**
 * 构建命令面板分区列表
 * @returns {{ sections: Array<{ id, title, items: Array }>, flat: Array }}
 */
export function buildCommandSections({
  query = '',
  shortcuts = [],
  categories = [],
  settings = {},
  isAdmin = false,
  isEditing = false,
}) {
  const q = String(query ?? '').trim();
  const sections = [];
  const defaultEngineId = settings.searchEngine || 'google';
  const engines = [...SEARCH_ENGINES].sort((a, b) => {
    if (a.id === defaultEngineId) return -1;
    if (b.id === defaultEngineId) return 1;
    return 0;
  });

  // —— 导航 ——
  let navList;
  if (!q) {
    navList = shortcuts.slice(0, 8);
  } else {
    navList = shortcuts.filter((s) => shortcutMatchesQuery(s, q)).slice(0, 12);
  }
  if (navList.length) {
    sections.push({
      id: 'nav',
      title: q ? '导航' : '导航（常用）',
      items: navList.map((s) => ({
        id: `nav-${s.id}`,
        type: 'shortcut',
        title: s.name || s.url || '未命名',
        subtitle: formatHost(s.url),
        shortcut: s,
      })),
    });
  }

  // —— 直接打开 URL ——
  if (q && looksLikeUrl(q)) {
    const url = normalizeOpenUrl(q);
    sections.push({
      id: 'url',
      title: '打开链接',
      items: [
        {
          id: 'open-url',
          type: 'open_url',
          title: `打开 ${q}`,
          subtitle: url,
          url,
        },
      ],
    });
  }

  // —— 搜索引擎：图标 + 搜索词 + 灰色引擎名 ——
  if (q && !looksLikeUrl(q)) {
    sections.push({
      id: 'search',
      title: '搜索',
      items: engines.map((engine) => ({
        id: `search-${engine.id}`,
        type: 'search',
        title: q,
        subtitle: engine.name,
        engine,
        searchQuery: q,
        engineId: engine.id,
      })),
    });
  }

  // —— 动作 ——
  const gotoActions = [];
  const catCandidates = [
    { id: ALL_CATEGORY_ID, name: '全部', icon: 'LayoutGrid' },
    ...categories,
  ];
  for (const cat of catCandidates) {
    const label = `前往：${cat.name}`;
    if (!q || textMatchesQuery(cat.name, q) || textMatchesQuery(label, q) || textMatchesQuery('前往', q)) {
      gotoActions.push({
        id: `goto-cat-${cat.id}`,
        type: 'goto_category',
        title: label,
        subtitle: '切换分类',
        categoryId: cat.id,
        icon: cat.icon || 'Folder',
      });
    }
  }

  const manageActions = [];
  if (isAdmin) {
    const adminActions = [
      {
        id: 'action-settings',
        type: 'open_settings',
        title: '打开设置',
        subtitle: '壁纸、布局、账号',
        keywords: '设置 偏好 壁纸 settings',
        icon: 'Settings',
      },
      {
        id: 'action-toggle-edit',
        type: 'toggle_edit',
        title: isEditing ? '退出编辑布局' : '编辑布局',
        subtitle: isEditing ? '完成拖拽排序' : '拖拽排序与归类',
        keywords: '编辑 布局 拖拽 edit',
        icon: isEditing ? 'Check' : 'Edit3',
      },
      {
        id: 'action-add-shortcut',
        type: 'add_shortcut',
        title: '添加快捷方式',
        subtitle: '新建导航链接',
        keywords: '添加 新建 链接 导航 add',
        icon: 'Plus',
      },
      {
        id: 'action-add-category',
        type: 'add_category',
        title: '添加分类',
        subtitle: '新建侧栏分类',
        keywords: '分类 添加 category',
        icon: 'FolderPlus',
      },
      {
        id: 'action-logout',
        type: 'logout',
        title: '退出登录',
        subtitle: '结束管理员会话',
        keywords: '退出 登出 logout',
        icon: 'LogOut',
      },
    ];
    for (const a of adminActions) {
      if (
        !q ||
        textMatchesQuery(a.title, q) ||
        textMatchesQuery(a.keywords || '', q) ||
        textMatchesQuery(a.subtitle || '', q)
      ) {
        manageActions.push(a);
      }
    }
  } else if (!q || textMatchesQuery('登录', q) || textMatchesQuery('login', q) || textMatchesQuery('设置', q)) {
    manageActions.push({
      id: 'action-login',
      type: 'login',
      title: '管理员登录',
      subtitle: '编辑导航与设置',
      icon: 'Lock',
    });
  }

  // 空查询限制「前往分类」条数，管理动作始终附上
  const gotoLimited = !q ? gotoActions.slice(0, 8) : gotoActions;
  const actionItems = [...gotoLimited, ...manageActions];
  if (actionItems.length) {
    sections.push({
      id: 'actions',
      title: '操作',
      items: actionItems,
    });
  }

  const flat = [];
  for (const sec of sections) {
    for (const item of sec.items) {
      flat.push(item);
    }
  }

  return { sections, flat };
}

function formatHost(url) {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname + (u.pathname && u.pathname !== '/' ? u.pathname : '');
  } catch {
    return String(url).slice(0, 48);
  }
}
