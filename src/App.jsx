import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import EditShortcutModal from './components/EditShortcutModal';
import AddCategoryModal from './components/AddCategoryModal';
import CalendarWidget from './components/Widgets/CalendarWidget';
import QuoteFooter from './components/QuoteFooter';
import * as Icons from 'lucide-react';

import {
  DEFAULT_CATEGORIES,
  DEFAULT_SHORTCUTS,
  DEFAULT_WALLPAPERS,
  DEFAULT_SETTINGS,
} from './utils/defaultData';
import './App.css';

export default function App() {
  // --- States ---
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('itab_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('itab_shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('itab_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [activeCategoryId, setActiveCategoryId] = useState('common');
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditShortcutOpen, setIsEditShortcutOpen] = useState(false);
  const [shortcutToEdit, setShortcutToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('itab_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('itab_shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  useEffect(() => {
    localStorage.setItem('itab_settings', JSON.stringify(settings));
  }, [settings]);

  // --- Theme variables (Light / Dark mode adaptation) ---
  useEffect(() => {
    const root = document.documentElement;
    // Set active text colors based on brightness
    if (settings.bgBrightness < 60) {
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--glass-bg', 'rgba(20, 20, 20, 0.45)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--glass-shadow', '0 8px 32px 0 rgba(0, 0, 0, 0.37)');
    } else {
      // adapt to wallpaper presets - default is dark immersive overlay
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--glass-bg', 'rgba(15, 15, 20, 0.5)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-shadow', '0 8px 32px 0 rgba(0, 0, 0, 0.25)');
    }
  }, [settings.bgBrightness]);

  // --- Wallpaper Helper ---
  const getWallpaperStyles = () => {
    let backgroundStyle = {};
    const filters = `blur(${settings.bgBlur}px) brightness(${settings.bgBrightness}%)`;

    if (settings.customWallpaperUrl) {
      backgroundStyle = {
        backgroundImage: `url(${settings.customWallpaperUrl})`,
        filter: filters,
      };
    } else {
      const activeWp = DEFAULT_WALLPAPERS.find((w) => w.id === settings.selectedWallpaper) || DEFAULT_WALLPAPERS[0];
      if (activeWp.url.startsWith('#')) {
        backgroundStyle = {
          backgroundColor: activeWp.url,
          filter: filters,
        };
      } else {
        backgroundStyle = {
          backgroundImage: `url(${activeWp.url})`,
          filter: filters,
        };
      }
    }

    return backgroundStyle;
  };

  // --- Category Handlers ---
  const handleSaveCategory = (name, icon = 'Grid', id) => {
    if (id) {
      setCategories(categories.map((c) => (c.id === id ? { ...c, name, icon } : c)));
    } else {
      const newId = `cat-${Date.now()}`;
      const newCat = {
        id: newId,
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
    if (catId === 'common') return; // Cannot delete core

    // Confirm deletion
    if (window.confirm('删除该分类将会同时删除分类下的所有快捷方式，确定删除吗？')) {
      setCategories(categories.filter((c) => c.id !== catId));
      setShortcuts(shortcuts.filter((s) => s.categoryId !== catId));
      setActiveCategoryId('common');
    }
  };

  // --- Shortcut Handlers ---
  const handleSaveShortcut = (payload) => {
    const exists = shortcuts.some((s) => s.id === payload.id);
    if (exists) {
      setShortcuts(
        shortcuts.map((s) => (s.id === payload.id ? { ...payload, categoryId: s.categoryId } : s))
      );
    } else {
      // Append current category id
      const newShortcut = {
        ...payload,
        categoryId: activeCategoryId,
      };
      setShortcuts([...shortcuts, newShortcut]);
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

  // --- Data Management Handlers ---
  const handleExportData = () => {
    return {
      categories,
      shortcuts,
      settings,
    };
  };

  const handleImportData = (parsedData) => {
    if (parsedData.categories) setCategories(parsedData.categories);
    if (parsedData.shortcuts) setShortcuts(parsedData.shortcuts);
    if (parsedData.settings) setSettings(parsedData.settings);
  };

  const handleResetAll = () => {
    localStorage.removeItem('itab_categories');
    localStorage.removeItem('itab_shortcuts');
    localStorage.removeItem('itab_settings');
    setCategories(DEFAULT_CATEGORIES);
    setShortcuts(DEFAULT_SHORTCUTS);
    setSettings(DEFAULT_SETTINGS);
    setActiveCategoryId('common');
    setIsEditing(false);
  };

  return (
    <div className="app-container">
      {/* Background elements */}
      <div className="wallpaper-bg" style={getWallpaperStyles()} />
      <div className="wallpaper-overlay" />

      {/* Sidebar navigation */}
      <Sidebar
        categories={categories}
        activeCategoryId={activeCategoryId}
        setActiveCategoryId={setActiveCategoryId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddCategoryClick={() => setIsAddCategoryOpen(true)}
        onEditCategoryClick={handleEditCategoryClick}
        onDeleteCategory={handleDeleteCategory}
        isEditing={isEditing}
      />

      {/* Main Content Dashboard */}
      <main className="main-content">
        {/* Floating Edit Mode indicator */}
        <div className="top-actions-bar">
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
        </div>

        {/* Clock/Calendar Widget in the middle */}
        {settings.showCalendar && <CalendarWidget isHeader={true} />}

        {/* Search Engine and Input bar */}
        <SearchBar
          currentEngineId={settings.searchEngine}
          onChangeEngine={(engineId) => setSettings({ ...settings, searchEngine: engineId })}
          showSuggestionsSetting={settings.showSuggestions !== false}
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          shortcuts={shortcuts}
          activeCategoryId={activeCategoryId}
        />

        <Dashboard
          shortcuts={shortcuts.filter(s =>
            s.categoryId === activeCategoryId &&
            (searchQuery.trim() === '' || s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          )}
          activeCategoryId={activeCategoryId}
          isEditing={isEditing}
          onDeleteShortcut={handleDeleteShortcut}
          onEditShortcut={handleEditShortcutClick}
          onUpdateShortcut={handleUpdateShortcut}
          onAddShortcutClick={handleAddShortcutClick}
          settings={settings}
        />

        {/* Daily Quote Footer */}
        {settings.showQuote !== false && <QuoteFooter />}
      </main>

      {/* Modals Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetAll={handleResetAll}
        onImportData={handleImportData}
        onExportData={handleExportData}
      />

      <EditShortcutModal
        isOpen={isEditShortcutOpen}
        onClose={() => setIsEditShortcutOpen(false)}
        onSave={handleSaveShortcut}
        shortcutToEdit={shortcutToEdit}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => {
          setIsAddCategoryOpen(false);
          setCategoryToEdit(null);
        }}
        onSave={handleSaveCategory}
        editingCategory={categoryToEdit}
      />

      <style>{`
        .top-actions-bar {
          align-self: flex-end;
          display: flex;
          gap: 12px;
          margin-bottom: -10px;
          z-index: 25;
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
