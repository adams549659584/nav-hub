import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { SEARCH_ENGINES } from '../utils/defaultData';
import { shortcutMatchesQuery } from '../utils/matchText';
import { shortcutBelongsTo } from '../utils/categories';
import ShortcutListIcon, { NAV_LIST_ITEM_STYLES } from './ShortcutListIcon';
import SearchEngineIcon from './SearchEngineIcon';

function formatSuggestHost(url) {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname + (u.pathname && u.pathname !== '/' ? u.pathname : '');
  } catch {
    return String(url).replace(/^https?:\/\//, '').slice(0, 48);
  }
}

export default function SearchBar({
  currentEngineId,
  onChangeEngine,
  showSuggestionsSetting,
  query,
  onChangeQuery,
  shortcuts = [],
  activeCategoryId,
  onOpenCommand,
}) {
  const [isOpenEngineMenu, setIsOpenEngineMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef(null);
  const searchContainerRef = useRef(null);
  const listRef = useRef(null);

  const modKey = useMemo(() => {
    if (typeof navigator === 'undefined') return 'Ctrl';
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '')
      ? '⌘'
      : 'Ctrl';
  }, []);

  const currentEngine = SEARCH_ENGINES.find((e) => e.id === currentEngineId) || SEARCH_ENGINES[0];

  // 本地导航：当前分类 + 原文/全拼/拼音首字母
  const matchingLocalShortcuts = useMemo(
    () =>
      query && query.trim()
        ? shortcuts.filter(
            (s) => shortcutBelongsTo(s, activeCategoryId) && shortcutMatchesQuery(s, query)
          )
        : [],
    [query, shortcuts, activeCategoryId]
  );

  // 扁平候选列表：本地导航在前，搜索建议在后（便于键盘上下切换）
  const flatItems = useMemo(() => {
    const items = [];
    for (const s of matchingLocalShortcuts) {
      items.push({ type: 'local', shortcut: s });
    }
    for (const text of suggestions) {
      items.push({ type: 'web', text });
    }
    return items;
  }, [matchingLocalShortcuts, suggestions]);

  // Close menus on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpenEngineMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate mock intelligent search suggestions
  useEffect(() => {
    if (!query || !query.trim() || !showSuggestionsSetting) {
      setSuggestions([]);
      return;
    }

    const keywords = [
      'react tutorial', 'react hooks', 'react router', 'react 19 new features',
      'github alternative', 'github copilot', 'github actions',
      'bilibili ranking', 'bilibili live',
      'css gradients', 'css flexbox', 'css grid layout', 'css variables',
      'vite js config', 'vite vs webpack',
      'figma UI templates', 'figma plugins',
      'chatgpt online', 'chatgpt prompt guide',
      'weibo hot topic', 'baidu map', 'zhihu hot search', 'weather tomorrow'
    ];

    const filtered = keywords.filter((k) =>
      k.toLowerCase().includes(query.toLowerCase())
    );

    // Add generic additions if short of suggestions
    const extraSuggestions = [
      `${query}`,
      `${query} 教程`,
      `${query} github`,
      `${query} docs`,
      `${query} 官网`
    ];

    // Combine and limit to top 6
    const combined = [...new Set([...filtered, ...extraSuggestions])].slice(0, 6);
    setSuggestions(combined);
  }, [query, showSuggestionsSetting]);

  // 查询或候选变化时重置高亮
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, flatItems.length]);

  // 高亮项滚入可视区域
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-suggest-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const openLocalShortcut = (s) => {
    window.open(s.url, '_blank', 'noopener,noreferrer');
    onChangeQuery('');
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    const url = `${currentEngine.url}${encodeURIComponent(searchQuery)}`;
    window.open(url, '_blank');
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const activateItem = (item) => {
    if (!item) return;
    if (item.type === 'local') {
      openLocalShortcut(item.shortcut);
    } else {
      onChangeQuery(item.text);
      handleSearch(item.text);
    }
  };

  const handleKeyDown = (e) => {
    const listOpen =
      showSuggestions && flatItems.length > 0;

    if (e.key === 'ArrowDown') {
      if (!listOpen) {
        if (flatItems.length > 0) setShowSuggestions(true);
        return;
      }
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((i) => (i + 1) % flatItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (!listOpen) return;
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
      return;
    }

    if (e.key === 'Escape') {
      if (showSuggestions) {
        e.preventDefault();
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (listOpen && activeIndex >= 0 && activeIndex < flatItems.length) {
        activateItem(flatItems[activeIndex]);
      } else {
        handleSearch();
      }
    }
  };

  const selectEngine = (engineId) => {
    onChangeEngine(engineId);
    setIsOpenEngineMenu(false);
  };

  const clearQuery = () => {
    onChangeQuery('');
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const panelVisible =
    showSuggestions && (suggestions.length > 0 || matchingLocalShortcuts.length > 0);

  return (
    <div ref={searchContainerRef} className="search-bar-wrapper">
      <div className="search-bar-inner glass-card">
        {/* Engine selector */}
        <div ref={menuRef} className="engine-select-container">
          <button
            className="engine-btn"
            onClick={() => setIsOpenEngineMenu(!isOpenEngineMenu)}
            type="button"
          >
            <SearchEngineIcon id={currentEngine.id} size={20} />
            <Icons.ChevronDown size={14} className="chevron-icon" />
          </button>

          {isOpenEngineMenu && (
            <div className="engine-dropdown glass-card">
              {SEARCH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  className={`dropdown-item${engine.id === currentEngine.id ? ' is-active' : ''}`}
                  onClick={() => selectEngine(engine.id)}
                  type="button"
                >
                  <SearchEngineIcon id={engine.id} size={18} />
                  <span>{engine.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={query || ''}
          onChange={(e) => {
            onChangeQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={currentEngine.placeholder}
          className="search-input-field"
          role="combobox"
          aria-expanded={panelVisible}
          aria-controls="search-suggestions-list"
          aria-activedescendant={
            activeIndex >= 0 ? `search-suggest-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
        />

        {/* Clear & Search Actions */}
        <div className="search-actions">
          {query && (
            <button className="search-action-btn" onClick={clearQuery} title="清除">
              <Icons.X size={16} />
            </button>
          )}
          {typeof onOpenCommand === 'function' && (
            <button
              type="button"
              className="search-cmd-chip"
              onClick={onOpenCommand}
              title={`命令面板（${modKey}+K 或 /）`}
              aria-label="打开命令面板"
            >
              <kbd>{modKey}</kbd>
              <kbd>K</kbd>
            </button>
          )}
          <button className="search-action-btn search-submit-btn" onClick={() => handleSearch()} title="搜索">
            <Icons.Search size={18} />
          </button>
        </div>
      </div>

      {/* Suggestions Popup */}
      {panelVisible && (
        <div
          id="search-suggestions-list"
          ref={listRef}
          className="suggestions-list glass-card"
          role="listbox"
        >
          {/* Local Shortcuts Section */}
          {matchingLocalShortcuts.length > 0 && (
            <div className="local-shortcuts-suggestion-section">
              <div className="nav-list-section-title">本地导航</div>
              {matchingLocalShortcuts.map((s, i) => {
                const idx = i;
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={s.id}
                    id={`search-suggest-${idx}`}
                    data-suggest-index={idx}
                    role="option"
                    aria-selected={isActive}
                    className={`nav-list-item${isActive ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => openLocalShortcut(s)}
                    type="button"
                  >
                    <ShortcutListIcon shortcut={s} />
                    <span className="nav-list-item-text">
                      <span className="nav-list-item-title">{s.name}</span>
                      <span className="nav-list-item-sub">{formatSuggestHost(s.url)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Web Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="web-suggestions-section">
              <div className="nav-list-section-title">网页搜索</div>
              {suggestions.map((suggestion, i) => {
                const idx = matchingLocalShortcuts.length + i;
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={`web-${suggestion}-${i}`}
                    id={`search-suggest-${idx}`}
                    data-suggest-index={idx}
                    role="option"
                    aria-selected={isActive}
                    className={`nav-list-item${isActive ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      onChangeQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                    type="button"
                  >
                    <span className="nav-list-action-icon">
                      <Icons.Search size={15} style={{ opacity: 0.9 }} />
                    </span>
                    <span className="nav-list-item-text">
                      <span className="nav-list-item-title">{suggestion}</span>
                      <span className="nav-list-item-sub">使用当前搜索引擎</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        ${NAV_LIST_ITEM_STYLES}

        .search-bar-wrapper {
          position: relative;
          width: 560px;
          max-width: 90%;
          margin: 40px auto 48px auto;
          z-index: 30;
        }

        .search-cmd-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          height: 26px;
          padding: 0 7px;
          margin-right: 2px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.42);
          cursor: pointer;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
        }

        .search-cmd-chip:hover {
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .search-cmd-chip kbd {
          font-family: inherit;
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
          padding: 0;
          border: none;
          background: none;
          color: inherit;
        }

        .search-bar-inner {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          height: 52px;
          border-radius: 26px;
          padding: 2px 8px 2px 6px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-bar-inner:focus-within {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.35);
          transform: scale(1.01);
        }

        .engine-select-container {
          position: relative;
        }

        .engine-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          padding: 8px 10px 8px 12px;
          cursor: pointer;
          border-radius: 20px;
          transition: background-color 0.2s;
        }

        .engine-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .chevron-icon {
          color: rgba(255, 255, 255, 0.5);
        }

        .engine-dropdown {
          position: absolute;
          top: 56px;
          left: 0;
          width: 140px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-radius: 12px;
          z-index: 40;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          width: 100%;
          padding: 8px 10px;
          text-align: left;
          color: white;
          font-size: 13px;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .dropdown-item:hover,
        .dropdown-item.is-active {
          background: rgba(255, 255, 255, 0.12);
        }

        .dropdown-item svg {
          flex-shrink: 0;
          display: block;
        }

        .search-input-field {
          flex: 1;
          height: 100%;
          background: none;
          border: none;
          outline: none;
          color: white;
          font-size: 15px;
          padding: 0 8px;
        }

        .search-input-field::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .search-action-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-action-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .search-submit-btn {
          color: #fff;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .search-submit-btn:hover {
          background: linear-gradient(135deg, #4f46e5, #3b82f6);
          transform: scale(1.05);
        }

        /* Suggestions styles */
        .suggestions-list {
          position: absolute;
          top: 58px;
          left: 0;
          right: 0;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-radius: 16px;
          z-index: 35;
          animation: slideDown 0.2s ease;
          max-height: min(360px, 50vh);
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          /* 滚动条出现时两侧预留，避免高亮项看起来右侧重、左轻 */
          scrollbar-gutter: stable both-edges;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
          box-sizing: border-box;
        }

        .suggestions-list::-webkit-scrollbar {
          width: 6px;
        }

        .suggestions-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.25);
          border-radius: 999px;
        }

        .suggestions-list::-webkit-scrollbar-track {
          background: transparent;
        }

        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .local-shortcuts-suggestion-section,
        .web-suggestions-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>
    </div>
  );
}
