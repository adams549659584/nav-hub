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

    if (
      window.confirm(
        '确定删除该分类吗？导航不会被删除，只会从该分类中移除。'
      )
    ) {
      const nextCats = categories.filter((c) => c.id !== catId);
      setCategories(nextCats);
      // 仅解除关联；无分类的导航仍在「全部」中
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
    }
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
          },
          categoryIds
        ),
      ]);
    }
    setShortcutToEdit(null);
  };

  const handleDeleteShortcut = (id) => {
    setShortcuts(shortcuts.filter((s) => s.id !== id));
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

  /** 将导航加入某分类（多对多，不移除原分类） */
  const handleAssignShortcutToCategory = (shortcutId, categoryId) => {
    const cid = Number(categoryId);
    if (!cid) return;
    setShortcuts(
      shortcuts.map((s) => {
        if (s.id !== shortcutId) return s;
        const ids = getCategoryIds(s);
        if (ids.includes(cid)) return s;
        return withCategoryIds(s, [...ids, cid]);
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
      />

      <main className="main-content">
        <div className="top-actions-bar">
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
              >
                {isEditing ? (
                  <>
                    <Icons.Check size={14} />
                    <span>退出编辑</span>
                  </>
                ) : (
                  <>
                    <Icons.Edit2 size={14} />
                    <span>编辑布局</span>
                  </>
                )}
              </button>
              <button className="glass-btn edit-toggle-btn" onClick={handleLogout} type="button">
                <Icons.LogOut size={14} />
                <span>退出</span>
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

        {settings.showCalendar && <CalendarWidget isHeader={true} />}

        <SearchBar
          currentEngineId={settings.searchEngine}
          onChangeEngine={(engineId) => {
            if (!isAdmin) return;
            setSettings({ ...settings, searchEngine: engineId });
          }}
          showSuggestionsSetting={settings.showSuggestions !== false}
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          shortcuts={shortcuts}
          activeCategoryId={activeCategoryId}
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
          onUpdateSettings={setSettings}
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

      <style>{`
        .top-actions-bar {
          align-self: flex-end;
          display: flex;
          gap: 12px;
          margin-bottom: -10px;
          z-index: 25;
          align-items: center;
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
      `}</style>
    </div>
  );
}