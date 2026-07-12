import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import EditShortcutModal from './components/EditShortcutModal';
import AddCategoryModal from './components/AddCategoryModal';
import CalendarWidget from './components/Widgets/CalendarWidget';
import QuoteFooter from './components/QuoteFooter';
import LoginModal from './components/LoginModal';
import ConfirmModal from './components/ConfirmModal';
import CommandPalette from './components/CommandPalette';
import IframeViewer from './components/IframeViewer';
import IframeSessionDock from './components/IframeSessionDock';
import * as Icons from 'lucide-react';

import {
  DEFAULT_CATEGORIES,
  DEFAULT_SHORTCUTS,
  DEFAULT_WALLPAPERS,
  DEFAULT_SETTINGS,
} from './utils/defaultData';
import {
  fetchPublicConfig,
  fetchAuthMe,
  fetchWallpapers,
  saveAdminConfig,
  logout as apiLogout,
} from './utils/api';
import { findCommonCategoryId, nextCategoryCode, nextNumericId } from './utils/ids';
import { shortcutMatchesQuery } from './utils/matchText';
import {
  getCategoryIds,
  isAllCategory,
  shortcutBelongsTo,
  withCategoryIds,
} from './utils/categories';
import {
  applyWallpaperSelection,
  normalizeWallpaperSettings,
} from './utils/wallpaper';
import './App.css';

export default function App() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS);
  const [settings, setSettings] = useState(() => normalizeWallpaperSettings(DEFAULT_SETTINGS));
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const skipPersist = useRef(true);
  const saveTimer = useRef(null);

  const [activeCategoryId, setActiveCategoryId] = useState(
    () => findCommonCategoryId(DEFAULT_CATEGORIES)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditShortcutOpen, setIsEditShortcutOpen] = useState(false);
  const [shortcutToEdit, setShortcutToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  /** 统一删除确认弹窗 */
  const [confirmDialog, setConfirmDialog] = useState(null);
  /** 命令面板 Cmd/Ctrl+K */
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  /** 移动端侧边栏抽屉 */
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  /**
   * 站内 iframe 会话：{ key, id, url, title, device }
   * activeIframeKey 为当前展开的；其余在右下角托盘可恢复（iframe 不卸载）
   */
  const [iframeSessions, setIframeSessions] = useState([]);
  const [activeIframeKey, setActiveIframeKey] = useState(null);
  /** 已完成加载的壁纸 key；与当前 key 不同则显示 loading */
  const [wallpaperLoadedKey, setWallpaperLoadedKey] = useState('');

  const applyConfig = useCallback((cfg) => {
    if (cfg.categories?.length) {
      setCategories(cfg.categories);
      setActiveCategoryId((prev) => {
        if (cfg.categories.some((c) => c.id === prev)) return prev;
        return findCommonCategoryId(cfg.categories);
      });
    }
    if (cfg.shortcuts) setShortcuts(cfg.shortcuts);
    if (cfg.settings) {
      setSettings(normalizeWallpaperSettings({ ...DEFAULT_SETTINGS, ...cfg.settings }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cfg, me] = await Promise.all([fetchPublicConfig(), fetchAuthMe()]);
        if (cancelled) return;
        applyConfig(cfg);
        setIsAdmin(!!me.admin);
        setConfigError('');
      } catch {
        if (!cancelled) setConfigError('无法加载配置，显示默认数据');
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
          skipPersist.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyConfig]);

  const persistConfig = useCallback(
    (cats, shorts, sett) => {
      if (!isAdmin) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await saveAdminConfig({
            categories: cats,
            shortcuts: shorts,
            settings: sett,
          });
          setSaveError('');
        } catch (e) {
          setSaveError(e.message || '保存失败');
        }
      }, 600);
    },
    [isAdmin]
  );

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    persistConfig(categories, shortcuts, settings);
  }, [categories, shortcuts, settings, persistConfig]);

  useEffect(() => {
    if (!isAdmin) setIsEditing(false);
  }, [isAdmin]);

  // 命令面板：⌘/Ctrl+K；非输入框时按 / 打开
  // 任意浮层（设置/登录/预览等）都不拦截：面板挂 body 且 z-index 最高
  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el || !(el instanceof Element)) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (el.isContentEditable) return true;
      return !!el.closest('[contenteditable="true"]');
    };

    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
        return;
      }
      if (e.key === '/' && !mod && !e.altKey) {
        if (isTypingTarget(e.target)) return;
        if (isCommandOpen) return;
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCommandOpen]);

  // 浏览器标签标题与 meta description
  useEffect(() => {
    const t = (settings.siteTitle || '').trim() || DEFAULT_SETTINGS.siteTitle;
    document.title = t;

    const desc =
      (settings.siteDescription || '').trim() || DEFAULT_SETTINGS.siteDescription;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, [settings.siteTitle, settings.siteDescription]);

  const wallpaper = normalizeWallpaperSettings(settings).wallpaper;

  useEffect(() => {
    const root = document.documentElement;
    const brightness = wallpaper.brightness ?? settings.bgBrightness ?? 80;
    if (brightness < 60) {
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--glass-bg', 'rgba(20, 20, 20, 0.45)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--glass-shadow', '0 8px 32px 0 rgba(0, 0, 0, 0.37)');
    } else {
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--glass-bg', 'rgba(15, 15, 20, 0.5)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-shadow', '0 8px 32px 0 rgba(0, 0, 0, 0.25)');
    }
  }, [wallpaper.brightness, settings.bgBrightness]);

  // 必应每日自动壁纸
  useEffect(() => {
    if (!wallpaper.autoDaily || wallpaper.source !== 'bing') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWallpapers({ source: 'bing', page: 1, size: 1 });
        const item = res.items?.[0];
        if (!item || cancelled) return;
        if (item.src && item.src !== wallpaper.src) {
          setSettings((prev) => applyWallpaperSelection(prev, { ...item, source: 'bing' }));
          skipPersist.current = false;
        }
      } catch {
        /* ignore network errors */
      }
    })();
    return () => {
      cancelled = true;
    };
    // only re-check when autoDaily toggled or source is bing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallpaper.autoDaily, wallpaper.source]);

  const resolveWallpaperSrc = () => {
    if (wallpaper.src) return wallpaper;
    // legacy fallback
    if (settings.customWallpaperUrl) {
      return {
        ...wallpaper,
        type: 'image',
        src: settings.customWallpaperUrl,
      };
    }
    const preset =
      DEFAULT_WALLPAPERS.find((w) => w.id === settings.selectedWallpaper) || DEFAULT_WALLPAPERS[0];
    const isColor = preset.url.startsWith('#');
    return {
      ...wallpaper,
      type: isColor ? 'color' : 'image',
      src: preset.url,
      title: preset.name,
      id: preset.id,
      source: 'preset',
    };
  };

  const activeWp = resolveWallpaperSrc();
  const blur = activeWp.blur ?? settings.bgBlur ?? 0;
  const brightness = activeWp.brightness ?? settings.bgBrightness ?? 80;
  const mask = activeWp.mask ?? 0.15;
  const filters = `blur(${blur}px) brightness(${brightness}%)`;
  const isColorWp =
    activeWp.type === 'color' || (activeWp.src || '').startsWith('#');
  const isVideoWp = activeWp.type === 'video';
  const wallpaperKey = `${activeWp.type || 'image'}:${activeWp.src || ''}`;
  const wallpaperLoading =
    !isColorWp && !!activeWp.src && wallpaperLoadedKey !== wallpaperKey;

  const markWallpaperReady = useCallback(() => {
    setWallpaperLoadedKey(wallpaperKey);
  }, [wallpaperKey]);

  const handleWallpaperImgRef = useCallback(
    (el) => {
      // 缓存命中时 onLoad 可能已触发，用 complete 兜底
      if (el?.complete && el.naturalWidth > 0) {
        setWallpaperLoadedKey(wallpaperKey);
      }
    },
    [wallpaperKey]
  );

  const handleSaveCategory = (name, icon = 'Grid', id) => {
    if (id != null) {
      setCategories(categories.map((c) => (c.id === id ? { ...c, name, icon } : c)));
    } else {
      const newId = nextNumericId(categories);
      const newCat = {
        id: newId,
        code: nextCategoryCode(categories),
        name,
        icon,
      };
      setCategories([...categories, newCat]);
      setActiveCategoryId(newId);
    }
  };

  const handleEditCategoryClick = (category) => {
    setCategoryToEdit(category);
    setIsAddCategoryOpen(true);
  };

  const handleDeleteCategory = (catId) => {
    if (categories.length <= 1) return;
    const target = categories.find((c) => c.id === catId);
    if (target?.code === 'common') return;
    const name = target?.name ? `「${target.name}」` : '该';
    setConfirmDialog({
      title: '删除分类',
      message: `确定删除分类${name}吗？\n导航不会被删除，只会从该分类中移除。`,
      confirmText: '删除',
      onConfirm: () => {
        const nextCats = categories.filter((c) => c.id !== catId);
        setCategories(nextCats);
        setShortcuts(
          shortcuts.map((s) =>
            withCategoryIds(
              s,
              getCategoryIds(s).filter((id) => id !== catId)
            )
          )
        );
        if (activeCategoryId === catId) {
          setActiveCategoryId(findCommonCategoryId(nextCats));
        }
      },
    });
  };

  const handleSaveShortcut = (payload) => {
    let categoryIds = Array.isArray(payload.categoryIds)
      ? payload.categoryIds.map(Number).filter((n) => n > 0)
      : [];
    // 新建且未选分类：若当前在具体分类下则默认归入当前分类；「全部」下可为空
    if (
      !Array.isArray(payload.categoryIds) &&
      !categoryIds.length &&
      !payload.id &&
      !isAllCategory(activeCategoryId)
    ) {
      categoryIds = [Number(activeCategoryId)];
    }

    const openMode = payload.openMode === 'iframe' ? 'iframe' : 'tab';
    const iframeDevice = payload.iframeDevice === 'mobile' ? 'mobile' : 'desktop';

    const exists = shortcuts.some((s) => s.id === payload.id);
    if (exists) {
      setShortcuts(
        shortcuts.map((s) =>
          s.id === payload.id
            ? withCategoryIds(
                {
                  id: s.id,
                  name: payload.name,
                  url: payload.url,
                  letter: payload.letter || '',
                  bgColor: payload.bgColor || '',
                  favicon: payload.favicon || '',
                  openMode,
                  iframeDevice,
                },
                categoryIds
              )
            : s
        )
      );
    } else {
      setShortcuts([
        ...shortcuts,
        withCategoryIds(
          {
            id: nextNumericId(shortcuts),
            name: payload.name,
            url: payload.url,
            letter: payload.letter || '',
            bgColor: payload.bgColor || '',
            favicon: payload.favicon || '',
            openMode,
            iframeDevice,
          },
          categoryIds
        ),
      ]);
    }
    setShortcutToEdit(null);
  };

  const handleOpenShortcut = useCallback((shortcut) => {
    if (!shortcut?.url) return;
    // 移动端屏幕小、多数站点也禁嵌，站内 iframe 预览收益低 → 一律新标签
    const isMobileViewport =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches;
    if (shortcut.openMode === 'iframe' && !isMobileViewport) {
      const key = `sc-${shortcut.id ?? shortcut.url}`;
      const device = shortcut.iframeDevice === 'mobile' ? 'mobile' : 'desktop';
      setIframeSessions((prev) => {
        const exists = prev.find((s) => s.key === key);
        if (exists) {
          // 已有会话：更新标题/图标/设备偏好并复用
          return prev.map((s) =>
            s.key === key
              ? {
                  ...s,
                  title: shortcut.name || shortcut.url,
                  url: shortcut.url,
                  favicon: shortcut.favicon || '',
                  letter: shortcut.letter || '',
                  bgColor: shortcut.bgColor || '',
                  device: s.device || device,
                }
              : s
          );
        }
        return [
          ...prev,
          {
            key,
            id: shortcut.id,
            url: shortcut.url,
            title: shortcut.name || shortcut.url,
            favicon: shortcut.favicon || '',
            letter: shortcut.letter || '',
            bgColor: shortcut.bgColor || '',
            device,
          },
        ];
      });
      setActiveIframeKey(key);
      return;
    }
    window.open(shortcut.url, '_blank', 'noopener,noreferrer');
  }, []);

  /** 从备份全量还原并立即写库（绕过 debounce） */
  const handleRestoreConfig = useCallback(
    async (cfg) => {
      if (!isAdmin) throw new Error('需要管理员权限');
      const nextSettings = normalizeWallpaperSettings({
        ...DEFAULT_SETTINGS,
        ...(cfg.settings || {}),
      });
      skipPersist.current = true;
      setCategories(Array.isArray(cfg.categories) ? cfg.categories : []);
      setShortcuts(Array.isArray(cfg.shortcuts) ? cfg.shortcuts : []);
      setSettings(nextSettings);
      setActiveCategoryId((prev) => {
        const cats = Array.isArray(cfg.categories) ? cfg.categories : [];
        if (cats.some((c) => c.id === prev)) return prev;
        return findCommonCategoryId(cats);
      });
      await saveAdminConfig({
        categories: cfg.categories,
        shortcuts: cfg.shortcuts,
        settings: nextSettings,
      });
      setSaveError('');
    },
    [isAdmin]
  );

  const minimizeIframe = useCallback(() => {
    setActiveIframeKey(null);
  }, []);

  const closeIframeSession = useCallback((key) => {
    setIframeSessions((prev) => prev.filter((s) => s.key !== key));
    setActiveIframeKey((cur) => (cur === key ? null : cur));
  }, []);

  const restoreIframeSession = useCallback((key) => {
    setActiveIframeKey(key);
  }, []);

  const handleDeleteShortcut = (id) => {
    const target = shortcuts.find((s) => s.id === id);
    const label = target?.name ? `「${target.name}」` : '该';
    setConfirmDialog({
      title: '删除快捷方式',
      message: `确定删除快捷方式${label}吗？此操作不可撤销。`,
      confirmText: '删除',
      onConfirm: () => {
        setShortcuts((prev) => prev.filter((s) => s.id !== id));
      },
    });
  };

  const handleUpdateShortcut = (updated) => {
    setShortcuts(shortcuts.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleEditShortcutClick = (shortcut) => {
    setShortcutToEdit(shortcut);
    setIsEditShortcutOpen(true);
  };

  const handleAddShortcutClick = () => {
    setShortcutToEdit(null);
    setIsEditShortcutOpen(true);
  };

  /** 侧边栏分类拖拽排序 */
  const handleReorderCategories = (fromId, toId) => {
    if (fromId === toId) return;
    const list = [...categories];
    const fromIdx = list.findIndex((c) => c.id === fromId);
    const toIdx = list.findIndex((c) => c.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [item] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, item);
    setCategories(list);
  };

  /** 导航内快捷方式拖拽排序（全部视图用全局顺序；分类视图调整全局中相对位置） */
  const handleReorderShortcuts = (fromId, toId) => {
    if (fromId === toId) return;
    const visible = shortcuts.filter((s) => shortcutBelongsTo(s, activeCategoryId));
    const fromIdx = visible.findIndex((s) => s.id === fromId);
    const toIdx = visible.findIndex((s) => s.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...visible];
    const [item] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, item);
    const orderMap = new Map(reordered.map((s, i) => [s.id, i]));
    const rest = shortcuts.filter((s) => !orderMap.has(s.id));
    // 可见项按新顺序，其余保持相对顺序接在后面
    setShortcuts([...reordered, ...rest]);
  };

  /**
   * 编辑布局下拖拽快捷方式到侧栏分类：
   * - 分类 A →「全部」：只去掉 A 的关联（仍可在全部里看到，不碰其他分类）
   * - 分类 A → 分类 B：从 A 去掉、加上 B
   * - 「全部」→ 任意分类：只加上目标，不减少任何关联（全部永远都能看到）
   */
  const handleAssignShortcutToCategory = (shortcutId, targetCategoryId, fromCategoryId) => {
    const sourceId =
      fromCategoryId != null && fromCategoryId !== ''
        ? fromCategoryId
        : activeCategoryId;

    // 拖到「全部」：仅解除当前所在分类的关联
    if (isAllCategory(targetCategoryId)) {
      if (isAllCategory(sourceId)) return; // 已在全部视图，无源分类可减
      const fromId = Number(sourceId);
      if (!fromId) return;
      setShortcuts(
        shortcuts.map((s) => {
          if (s.id !== shortcutId) return s;
          return withCategoryIds(
            s,
            getCategoryIds(s).filter((id) => id !== fromId)
          );
        })
      );
      return;
    }

    const targetId = Number(targetCategoryId);
    if (!targetId) return;

    setShortcuts(
      shortcuts.map((s) => {
        if (s.id !== shortcutId) return s;
        let ids = getCategoryIds(s);
        // 从具体分类挪出：减去源分类；从「全部」出发：不减，只加
        if (!isAllCategory(sourceId)) {
          const fromId = Number(sourceId);
          if (fromId && fromId !== targetId) {
            ids = ids.filter((id) => id !== fromId);
          }
        }
        if (!ids.includes(targetId)) {
          ids = [...ids, targetId];
        }
        return withCategoryIds(s, ids);
      })
    );
  };

  const handleLogout = async () => {
    await apiLogout();
    setIsAdmin(false);
    setIsEditing(false);
    const cfg = await fetchPublicConfig();
    applyConfig(cfg);
    skipPersist.current = true;
  };

  if (configLoading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>加载中…</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* z-index:0 黑底 + 媒体层；勿用负 z-index，会被 body 黑底盖住 */}
      <div className="wallpaper-bg">
        {isColorWp ? (
          <div
            className="wallpaper-color-fill"
            style={{ backgroundColor: activeWp.src || '#000', filter: filters }}
          />
        ) : isVideoWp && activeWp.src ? (
          <video
            key={wallpaperKey}
            className="wallpaper-video"
            src={activeWp.src}
            autoPlay
            muted
            loop
            playsInline
            style={{ filter: filters }}
            onLoadedData={markWallpaperReady}
            onError={markWallpaperReady}
          />
        ) : activeWp.src ? (
          <img
            key={wallpaperKey}
            ref={handleWallpaperImgRef}
            className={`wallpaper-media${wallpaperLoading ? ' is-loading' : ' is-ready'}`}
            src={activeWp.src}
            alt=""
            draggable={false}
            style={{ filter: filters }}
            onLoad={markWallpaperReady}
            onError={markWallpaperReady}
          />
        ) : null}
      </div>
      <div
        className="wallpaper-overlay"
        style={{ background: `rgba(0, 0, 0, ${mask})` }}
      />
      {wallpaperLoading && (
        <div className="wallpaper-loading" aria-live="polite" aria-busy="true">
          <div className="wallpaper-loading-spinner" />
          <span className="wallpaper-loading-text">壁纸加载中</span>
        </div>
      )}

      <Sidebar
        categories={categories}
        activeCategoryId={activeCategoryId}
        setActiveCategoryId={setActiveCategoryId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddCategoryClick={() => setIsAddCategoryOpen(true)}
        onEditCategoryClick={handleEditCategoryClick}
        onDeleteCategory={handleDeleteCategory}
        isAdmin={isAdmin}
        isEditing={isAdmin && isEditing}
        onReorderCategories={handleReorderCategories}
        onAssignShortcut={handleAssignShortcutToCategory}
        logoText={settings.logoText}
        logoBgColor={settings.logoBgColor}
        logoBgColorEnd={settings.logoBgColorEnd}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      {isMobileNavOpen && (
        <button
          type="button"
          className="mobile-nav-overlay"
          aria-label="关闭导航菜单"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <main className="main-content">
        <div className="top-actions-bar">
          <div className="top-actions-left">
            <button
              type="button"
              className="glass-btn mobile-menu-btn"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="打开导航菜单"
              title="菜单"
            >
              <Icons.Menu size={18} />
            </button>
          </div>
          <div className="top-actions-right">
            {configError && (
              <span style={{ fontSize: 12, color: '#fcd34d', marginRight: 8 }}>{configError}</span>
            )}
            {saveError && (
              <span style={{ fontSize: 12, color: '#fca5a5', marginRight: 8 }}>{saveError}</span>
            )}
            {isAdmin ? (
              <>
                <button
                  className={`glass-btn edit-toggle-btn ${isEditing ? 'active-editing' : ''}`}
                  onClick={() => setIsEditing(!isEditing)}
                  type="button"
                >
                  {isEditing ? (
                    <>
                      <Icons.Check size={14} />
                      <span className="btn-label">退出编辑</span>
                    </>
                  ) : (
                    <>
                      <Icons.Edit3 size={14} />
                      <span className="btn-label">编辑布局</span>
                    </>
                  )}
                </button>
                <button className="glass-btn edit-toggle-btn" onClick={handleLogout} type="button">
                  <Icons.LogOut size={14} />
                  <span className="btn-label">退出</span>
                </button>
              </>
            ) : (
              <button
                className="glass-btn edit-toggle-btn icon-only-btn"
                onClick={() => setIsLoginOpen(true)}
                type="button"
                title="设置"
                aria-label="设置"
              >
                <Icons.Settings size={16} />
              </button>
            )}
          </div>
        </div>

        {settings.showCalendar && <CalendarWidget isHeader={true} />}

        <SearchBar
          currentEngineId={settings.searchEngine}
          onChangeEngine={(engineId) => {
            // 任何人可切换当前搜索引擎；仅管理员会经 persist 写回服务端
            setSettings((prev) => ({ ...prev, searchEngine: engineId }));
          }}
          showSuggestionsSetting={settings.showSuggestions !== false}
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          shortcuts={shortcuts}
          activeCategoryId={activeCategoryId}
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenShortcut={handleOpenShortcut}
        />

        <Dashboard
          shortcuts={shortcuts.filter(
            (s) =>
              shortcutBelongsTo(s, activeCategoryId) &&
              shortcutMatchesQuery(s, searchQuery)
          )}
          activeCategoryId={activeCategoryId}
          isEditing={isAdmin && isEditing}
          isAdmin={isAdmin}
          onDeleteShortcut={handleDeleteShortcut}
          onEditShortcut={handleEditShortcutClick}
          onUpdateShortcut={handleUpdateShortcut}
          onOpenShortcut={handleOpenShortcut}
          onAddShortcutClick={handleAddShortcutClick}
          onReorderShortcuts={handleReorderShortcuts}
          settings={settings}
        />

        {settings.showQuote !== false && <QuoteFooter />}
      </main>

      {isAdmin && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          categories={categories}
          shortcuts={shortcuts}
          onUpdateSettings={setSettings}
          onRestoreConfig={handleRestoreConfig}
          onConfirmRestore={(opts) =>
            setConfirmDialog({
              title: opts.title,
              message: opts.message,
              confirmText: opts.confirmText || '还原',
              onConfirm: opts.onConfirm,
            })
          }
        />
      )}

      {isAdmin && (
        <EditShortcutModal
          isOpen={isEditShortcutOpen}
          onClose={() => setIsEditShortcutOpen(false)}
          onSave={handleSaveShortcut}
          shortcutToEdit={shortcutToEdit}
          categories={categories}
          defaultCategoryIds={
            !isAllCategory(activeCategoryId)
              ? [Number(activeCategoryId)]
              : findCommonCategoryId(categories) != null
                ? [findCommonCategoryId(categories)]
                : []
          }
        />
      )}

      {isAdmin && (
        <AddCategoryModal
          isOpen={isAddCategoryOpen}
          onClose={() => {
            setIsAddCategoryOpen(false);
            setCategoryToEdit(null);
          }}
          onSave={handleSaveCategory}
          editingCategory={categoryToEdit}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={async () => {
          const me = await fetchAuthMe();
          setIsAdmin(!!me.admin);
        }}
      />

      <ConfirmModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmText={confirmDialog?.confirmText}
        danger
        onConfirm={confirmDialog?.onConfirm}
        onClose={() => setConfirmDialog(null)}
      />

      {iframeSessions.map((session) => (
        <IframeViewer
          key={session.key}
          sessionKey={session.key}
          open={activeIframeKey === session.key}
          keepAlive
          url={session.url}
          title={session.title}
          initialDevice={session.device || 'desktop'}
          onMinimize={minimizeIframe}
          onClose={() => closeIframeSession(session.key)}
          onDeviceChange={(device) => {
            setIframeSessions((prev) =>
              prev.map((s) => (s.key === session.key ? { ...s, device } : s))
            );
          }}
        />
      ))}

      <IframeSessionDock
        sessions={iframeSessions.filter((s) => s.key !== activeIframeKey)}
        onRestore={restoreIframeSession}
        onClose={closeIframeSession}
      />

      <CommandPalette
        open={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        shortcuts={shortcuts}
        categories={categories}
        settings={settings}
        isAdmin={isAdmin}
        isEditing={isEditing}
        onOpenShortcut={handleOpenShortcut}
        onSearch={(engine, q) => {
          if (!engine?.url || !q) return;
          window.open(
            `${engine.url}${encodeURIComponent(q)}`,
            '_blank',
            'noopener,noreferrer'
          );
        }}
        onOpenUrl={(url) => {
          if (!url) return;
          const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
          window.open(href, '_blank', 'noopener,noreferrer');
        }}
        onGotoCategory={(id) => setActiveCategoryId(id)}
        onOpenSettings={() => {
          if (isAdmin) setIsSettingsOpen(true);
          else setIsLoginOpen(true);
        }}
        onToggleEdit={() => {
          if (isAdmin) setIsEditing((v) => !v);
        }}
        onAddShortcut={() => {
          if (isAdmin) handleAddShortcutClick();
        }}
        onAddCategory={() => {
          if (isAdmin) {
            setCategoryToEdit(null);
            setIsAddCategoryOpen(true);
          }
        }}
        onLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          if (isAdmin) handleLogout();
        }}
      />

      <style>{`
        .top-actions-bar {
          align-self: flex-end;
          display: flex;
          gap: 12px;
          margin-bottom: 0;
          z-index: 25;
          align-items: center;
          justify-content: flex-end;
          width: auto;
        }

        .top-actions-left {
          display: none;
          align-items: center;
        }

        .top-actions-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .edit-toggle-btn {
          height: 32px;
          font-size: 12px;
          padding: 0 12px;
          border-radius: 16px;
        }

        .edit-toggle-btn.icon-only-btn {
          width: 32px;
          padding: 0;
          justify-content: center;
        }

        .edit-toggle-btn.active-editing {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          color: #fca5a5;
        }

        .edit-toggle-btn.active-editing:hover {
          background: rgba(239, 68, 68, 0.35);
        }

        @media (max-width: 768px) {
          .top-actions-bar {
            align-self: stretch;
            width: 100%;
            justify-content: space-between;
            margin-bottom: 4px;
            gap: 8px;
          }

          .top-actions-left {
            display: flex;
          }

          .top-actions-right {
            gap: 8px;
            margin-left: auto;
          }

          .edit-toggle-btn {
            width: 36px;
            min-width: 36px;
            height: 36px;
            padding: 0;
            justify-content: center;
            border-radius: 12px;
          }

          .edit-toggle-btn .btn-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}