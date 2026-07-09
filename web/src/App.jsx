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

  const getWallpaperStyles = () => {
    if (activeWp.type === 'video') {
      return { filter: filters, backgroundColor: '#000' };
    }
    if (activeWp.type === 'color' || (activeWp.src || '').startsWith('#')) {
      return {
        backgroundColor: activeWp.src,
        filter: filters,
      };
    }
    return {
      backgroundImage: activeWp.src ? `url(${activeWp.src})` : undefined,
      filter: filters,
    };
  };

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

    if (window.confirm('删除该分类将会同时删除分类下的所有快捷方式，确定删除吗？')) {
      setCategories(categories.filter((c) => c.id !== catId));
      setShortcuts(shortcuts.filter((s) => s.categoryId !== catId));
      setActiveCategoryId(findCommonCategoryId(categories.filter((c) => c.id !== catId)));
    }
  };

  const handleSaveShortcut = (payload) => {
    const exists = shortcuts.some((s) => s.id === payload.id);
    if (exists) {
      setShortcuts(
        shortcuts.map((s) =>
          s.id === payload.id
            ? {
                id: s.id,
                categoryId: s.categoryId,
                name: payload.name,
                url: payload.url,
                letter: payload.letter || '',
                bgColor: payload.bgColor || '',
                favicon: payload.favicon || '',
              }
            : s
        )
      );
    } else {
      setShortcuts([
        ...shortcuts,
        {
          id: nextNumericId(shortcuts),
          categoryId: activeCategoryId,
          name: payload.name,
          url: payload.url,
          letter: payload.letter || '',
          bgColor: payload.bgColor || '',
          favicon: payload.favicon || '',
        },
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
      <div className="wallpaper-bg" style={getWallpaperStyles()}>
        {activeWp.type === 'video' && activeWp.src && (
          <video
            className="wallpaper-video"
            src={activeWp.src}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
      </div>
      <div
        className="wallpaper-overlay"
        style={{ background: `rgba(0, 0, 0, ${mask})` }}
      />

      <Sidebar
        categories={categories}
        activeCategoryId={activeCategoryId}
        setActiveCategoryId={setActiveCategoryId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddCategoryClick={() => setIsAddCategoryOpen(true)}
        onEditCategoryClick={handleEditCategoryClick}
        onDeleteCategory={handleDeleteCategory}
        isAdmin={isAdmin}
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
              className="glass-btn edit-toggle-btn"
              onClick={() => setIsLoginOpen(true)}
              type="button"
            >
              <Icons.Lock size={14} />
              <span>管理员</span>
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
              s.categoryId === activeCategoryId &&
              shortcutMatchesQuery(s, searchQuery)
          )}
          activeCategoryId={activeCategoryId}
          isEditing={isAdmin && isEditing}
          isAdmin={isAdmin}
          onDeleteShortcut={handleDeleteShortcut}
          onEditShortcut={handleEditShortcutClick}
          onUpdateShortcut={handleUpdateShortcut}
          onAddShortcutClick={handleAddShortcutClick}
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