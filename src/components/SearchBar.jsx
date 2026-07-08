import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { SEARCH_ENGINES } from '../utils/defaultData';

export default function SearchBar({
  currentEngineId,
  onChangeEngine,
  showSuggestionsSetting,
  query,
  onChangeQuery,
  shortcuts = [],
  activeCategoryId,
}) {
  const [isOpenEngineMenu, setIsOpenEngineMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef(null);
  const searchContainerRef = useRef(null);

  const currentEngine = SEARCH_ENGINES.find((e) => e.id === currentEngineId) || SEARCH_ENGINES[0];

  // Filter local bookmarks/shortcuts matching current category and search query
  const matchingLocalShortcuts = (query && query.trim()) ? shortcuts.filter(s =>
    s.categoryId === activeCategoryId &&
    s.name.toLowerCase().includes(query.trim().toLowerCase())
  ) : [];

  // Close menus on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpenEngineMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
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

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    const url = `${currentEngine.url}${encodeURIComponent(searchQuery)}`;
    window.open(url, '_blank');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectEngine = (engineId) => {
    onChangeEngine(engineId);
    setIsOpenEngineMenu(false);
  };

  const clearQuery = () => {
    onChangeQuery('');
    setSuggestions([]);
  };

  const GithubIcon = ({ size, color }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color || 'currentColor'}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );

  const renderEngineIcon = (id, size = 16) => {
    switch (id) {
      case 'google':
        return <Icons.Globe size={size} color="#4285f4" />;
      case 'baidu':
        return <Icons.Search size={size} color="#2319dc" />;
      case 'bing':
        return <Icons.Compass size={size} color="#00809d" />;
      case 'github':
        return <GithubIcon size={size} color="#ffffff" />;
      case 'duck':
        return <Icons.HelpCircle size={size} color="#de5833" />;
      default:
        return <Icons.Search size={size} />;
    }
  };

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
            {renderEngineIcon(currentEngine.id, 20)}
            <Icons.ChevronDown size={14} className="chevron-icon" />
          </button>

          {isOpenEngineMenu && (
            <div className="engine-dropdown glass-card">
              {SEARCH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  className="dropdown-item"
                  onClick={() => selectEngine(engine.id)}
                  type="button"
                >
                  {renderEngineIcon(engine.id, 16)}
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
        />

        {/* Clear & Search Actions */}
        <div className="search-actions">
          {query && (
            <button className="search-action-btn" onClick={clearQuery} title="清除">
              <Icons.X size={16} />
            </button>
          )}
          <button className="search-action-btn search-submit-btn" onClick={() => handleSearch()} title="搜索">
            <Icons.Search size={18} />
          </button>
        </div>
      </div>

      {/* Suggestions Popup */}
      {showSuggestions && (suggestions.length > 0 || matchingLocalShortcuts.length > 0) && (
        <div className="suggestions-list glass-card">
          {/* Local Shortcuts Section */}
          {matchingLocalShortcuts.length > 0 && (
            <div className="local-shortcuts-suggestion-section">
              <div className="suggestion-section-title">本地导航</div>
              {matchingLocalShortcuts.map((s) => (
                <button
                  key={s.id}
                  className="suggestion-item local-shortcut-item"
                  onClick={() => {
                    window.open(s.url, '_blank', 'noopener,noreferrer');
                    onChangeQuery(''); // clear search query on select
                    setShowSuggestions(false);
                  }}
                  type="button"
                >
                  <Icons.Bookmark size={13} className="local-shortcut-icon" />
                  <span className="local-shortcut-name">{s.name}</span>
                  <span className="local-shortcut-url">{s.url.replace('https://', '').replace('http://', '')}</span>
                </button>
              ))}
              {suggestions.length > 0 && <div className="suggestion-section-divider" />}
            </div>
          )}

          {/* Web Search Suggestions */}
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-item"
              onClick={() => {
                onChangeQuery(suggestion);
                handleSearch(suggestion);
              }}
              type="button"
            >
              <Icons.Search size={14} className="suggestion-icon" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .search-bar-wrapper {
          position: relative;
          width: 560px;
          max-width: 90%;
          margin: 40px auto 48px auto;
          z-index: 30;
        }

        .search-bar-inner {
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

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.12);
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
        }

        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          width: 100%;
          padding: 10px 14px;
          color: rgba(255, 255, 255, 0.85);
          text-align: left;
          font-size: 13.5px;
          cursor: pointer;
          border-radius: 10px;
          transition: background-color 0.15s;
        }

        .suggestion-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .suggestion-icon {
          color: rgba(255, 255, 255, 0.4);
        }

        .local-shortcuts-suggestion-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .suggestion-section-title {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          padding: 6px 14px 4px 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .local-shortcut-item {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .local-shortcut-icon {
          color: #10b981;
          flex-shrink: 0;
        }

        .local-shortcut-name {
          font-weight: 500;
          color: #fff;
          margin-right: 8px;
        }

        .local-shortcut-url {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 280px;
        }

        .suggestion-section-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 6px 8px;
        }
      `}</style>
    </div>
  );
}
