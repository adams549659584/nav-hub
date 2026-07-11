import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { SEARCH_ENGINES } from '../utils/defaultData';
import { buildCommandSections, looksLikeUrl, normalizeOpenUrl } from '../utils/commandItems';

function tileTextColor(bgColor) {
  if (!bgColor) return '#fff';
  const clean = bgColor.toLowerCase().trim();
  if (clean === '#ffffff' || clean === '#fff' || clean === 'white') return '#1e293b';
  return '#fff';
}

export default function CommandPalette({
  open,
  onClose,
  shortcuts = [],
  categories = [],
  settings = {},
  isAdmin = false,
  isEditing = false,
  onOpenShortcut,
  onSearch,
  onOpenUrl,
  onGotoCategory,
  onOpenSettings,
  onToggleEdit,
  onAddShortcut,
  onAddCategory,
  onLogin,
  onLogout,
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const { sections, flat } = useMemo(
    () =>
      buildCommandSections({
        query,
        shortcuts,
        categories,
        settings,
        isAdmin,
        isEditing,
      }),
    [query, shortcuts, categories, settings, isAdmin, isEditing]
  );

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const runItem = (item) => {
    if (!item) return;
    switch (item.type) {
      case 'shortcut':
        onOpenShortcut?.(item.shortcut);
        break;
      case 'search':
        onSearch?.(item.engine, item.searchQuery);
        break;
      case 'open_url':
        onOpenUrl?.(item.url);
        break;
      case 'goto_category':
        onGotoCategory?.(item.categoryId);
        break;
      case 'open_settings':
        onOpenSettings?.();
        break;
      case 'toggle_edit':
        onToggleEdit?.();
        break;
      case 'add_shortcut':
        onAddShortcut?.();
        break;
      case 'add_category':
        onAddCategory?.();
        break;
      case 'login':
        onLogin?.();
        break;
      case 'logout':
        onLogout?.();
        break;
      default:
        break;
    }
    onClose?.();
  };

  const runDefault = () => {
    if (flat.length > 0) {
      runItem(flat[Math.min(activeIndex, flat.length - 1)] ?? flat[0]);
      return;
    }
    const q = query.trim();
    if (!q) {
      onClose?.();
      return;
    }
    if (looksLikeUrl(q)) {
      onOpenUrl?.(normalizeOpenUrl(q));
    } else {
      const engine =
        SEARCH_ENGINES.find((e) => e.id === settings.searchEngine) || SEARCH_ENGINES[0];
      onSearch?.(engine, q);
    }
    onClose?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!flat.length) return;
      setActiveIndex((i) => (i + 1) % flat.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flat.length) return;
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flat.length) {
        runItem(flat[activeIndex] || flat[0]);
      } else {
        runDefault();
      }
    }
  };

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="cmd-palette-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        className="cmd-palette glass-card"
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        onKeyDown={onKeyDown}
      >
        <div className="cmd-palette-input-row">
          <Icons.Search size={18} className="cmd-palette-search-icon" />
          <input
            ref={inputRef}
            className="cmd-palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索导航、网页或执行操作…"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-palette-kbd">Esc</kbd>
        </div>

        <div className="cmd-palette-list" ref={listRef}>
          {flat.length === 0 ? (
            <div className="cmd-palette-empty">
              {query.trim() ? '无匹配结果，回车将使用默认搜索引擎' : '开始输入以搜索导航'}
            </div>
          ) : (
            sections.map((sec) => (
              <div key={sec.id} className="cmd-palette-section">
                <div className="cmd-palette-section-title">{sec.title}</div>
                {sec.items.map((item) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-cmd-index={idx}
                      className={`cmd-palette-item${active ? ' is-active' : ''}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => runItem(item)}
                    >
                      <span className="cmd-palette-item-icon">{renderIcon(item)}</span>
                      <span className="cmd-palette-item-text">
                        <span className="cmd-palette-item-title">{item.title}</span>
                        {item.subtitle && (
                          <span className="cmd-palette-item-sub">{item.subtitle}</span>
                        )}
                      </span>
                      {item.primary && <span className="cmd-palette-badge">默认</span>}
                      {item.type === 'shortcut' && (
                        <Icons.CornerDownLeft size={14} className="cmd-palette-enter-hint" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="cmd-palette-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> 选择
          </span>
          <span>
            <kbd>Enter</kbd> 打开
          </span>
          <span>
            <kbd>⌘</kbd>
            <kbd>K</kbd> 面板
          </span>
        </div>
      </div>

      <style>{`
        .cmd-palette-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: min(18vh, 140px) 16px 24px;
          background: rgba(0, 0, 0, 0.5);
          -webkit-backdrop-filter: blur(10px) saturate(1.1);
          backdrop-filter: blur(10px) saturate(1.1);
          animation: cmdFadeIn 0.15s ease;
        }

        @keyframes cmdFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .cmd-palette {
          width: min(560px, 100%);
          max-height: min(72vh, 560px);
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
          animation: cmdScaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes cmdScaleIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cmd-palette-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .cmd-palette-search-icon {
          color: rgba(255, 255, 255, 0.45);
          flex-shrink: 0;
        }

        .cmd-palette-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          font-size: 15px;
          line-height: 1.4;
        }

        .cmd-palette-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .cmd-palette-kbd {
          font-family: inherit;
          font-size: 11px;
          padding: 3px 7px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.45);
        }

        .cmd-palette-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .cmd-palette-empty {
          padding: 28px 16px;
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        .cmd-palette-section {
          margin-bottom: 6px;
        }

        .cmd-palette-section-title {
          padding: 8px 10px 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
        }

        .cmd-palette-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: rgba(255, 255, 255, 0.9);
          text-align: left;
          cursor: pointer;
          transition: background 0.12s ease;
        }

        .cmd-palette-item.is-active,
        .cmd-palette-item:hover {
          background: rgba(59, 130, 246, 0.22);
        }

        .cmd-palette-item-icon {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.08);
        }

        .cmd-palette-fav {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cmd-palette-letter {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .cmd-palette-item-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cmd-palette-item-title {
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cmd-palette-item-sub {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cmd-palette-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.35);
          color: rgba(255, 255, 255, 0.85);
          flex-shrink: 0;
        }

        .cmd-palette-enter-hint {
          opacity: 0;
          color: rgba(255, 255, 255, 0.45);
          flex-shrink: 0;
        }

        .cmd-palette-item.is-active .cmd-palette-enter-hint {
          opacity: 1;
        }

        .cmd-palette-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          padding: 10px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.4);
        }

        .cmd-palette-footer kbd {
          font-family: inherit;
          font-size: 10.5px;
          padding: 1px 5px;
          margin: 0 2px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

function renderIcon(item) {
  if (item.type === 'shortcut' && item.shortcut) {
    const s = item.shortcut;
    if (s.favicon) {
      return <img src={s.favicon} alt="" className="cmd-palette-fav" />;
    }
    return (
      <span
        className="cmd-palette-letter"
        style={{
          backgroundColor: s.bgColor || 'rgba(255,255,255,0.12)',
          color: tileTextColor(s.bgColor),
        }}
      >
        {s.letter || (s.name || '?').charAt(0)}
      </span>
    );
  }

  const name = item.icon || iconForType(item.type);
  const Cmp = Icons[name] || Icons.Sparkles;
  return <Cmp size={15} style={{ opacity: 0.85 }} />;
}

function iconForType(type) {
  switch (type) {
    case 'search':
      return 'Search';
    case 'open_url':
      return 'ExternalLink';
    case 'goto_category':
      return 'Folder';
    default:
      return 'Command';
  }
}
