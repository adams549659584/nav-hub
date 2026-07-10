import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

function tileTextColor(bgColor) {
  if (!bgColor) return '#fff';
  const clean = bgColor.toLowerCase().trim();
  if (clean === '#ffffff' || clean === '#fff' || clean === 'white') {
    return '#1e293b';
  }
  return '#fff';
}

function tileBackground(bgColor) {
  if (!bgColor) return 'transparent';
  return bgColor;
}

export default function ShortcutIcon({
  shortcut,
  isEditing,
  isAdmin = false,
  onDelete,
  onEditClick,
  settings,
  onDragOverShortcut,
  onDropOnShortcut,
  isDropTarget = false,
  /** 当前侧栏分类（拖到其他分类时用于「移出源分类」） */
  sourceCategoryId,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef(null);
  const didDragRef = useRef(false);

  // Handle outside clicks to close context menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleClick = (e) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      e.preventDefault();
      return;
    }
    if (showMenu) {
      setShowMenu(false);
      e.preventDefault();
      return;
    }

    if (isEditing) {
      e.preventDefault();
      onEditClick(shortcut);
    } else {
      window.open(shortcut.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleContextMenu = (e) => {
    // 访客无编辑权限，使用浏览器默认行为即可
    if (!isAdmin) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      x: Math.min(e.clientX - rect.left, rect.width - 120),
      y: Math.min(e.clientY - rect.top, rect.height - 20),
    });
    setShowMenu(true);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(shortcut.id);
    setShowMenu(false);
  };

  const handleEditClickMenu = (e) => {
    e.stopPropagation();
    onEditClick(shortcut);
    setShowMenu(false);
  };

  const getIconSizeClass = () => {
    switch (settings.iconSize) {
      case 'small': return 'size-sm';
      case 'large': return 'size-lg';
      default: return 'size-md';
    }
  };

  const handleDragStart = (e) => {
    if (!isEditing) {
      e.preventDefault();
      return;
    }
    didDragRef.current = true;
    e.dataTransfer.setData('application/x-shortcut-id', String(shortcut.id));
    if (sourceCategoryId != null && sourceCategoryId !== '') {
      e.dataTransfer.setData('application/x-from-category-id', String(sourceCategoryId));
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(shortcut.id));
  };

  const handleDragOver = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOverShortcut?.(shortcut.id);
  };

  const handleDrop = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    const fromId = Number(e.dataTransfer.getData('application/x-shortcut-id'));
    if (fromId && fromId !== shortcut.id) {
      onDropOnShortcut?.(fromId, shortcut.id);
    }
  };

  const displayName = shortcut.name || '';

  return (
    <div
      className={`shortcut-item-wrapper ${isEditing ? 'wiggle' : ''} size-x-1 size-y-1${
        isDropTarget ? ' is-drop-target' : ''
      }`}
      role="button"
      tabIndex={0}
      draggable={!!isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
      onContextMenu={isAdmin ? handleContextMenu : undefined}
      style={{
        gridColumn: 'span 1',
        gridRow: 'span 1',
        cursor: isEditing ? 'grab' : 'pointer',
      }}
    >
      {/* 1x1 Standard Shortcut layout */}
      <div className="layout-1x1 flex-center-col">
        <div
          className={`shortcut-tile ${getIconSizeClass()}${
            shortcut.favicon && !imageError ? ' has-favicon' : ''
          }${!shortcut.bgColor ? ' is-transparent' : ''}`}
          style={{
            backgroundColor: tileBackground(shortcut.bgColor),
            color: tileTextColor(shortcut.bgColor),
            borderRadius: settings.iconRadius || '16px',
          }}
        >
          {shortcut.favicon && !imageError ? (
            <img
              src={shortcut.favicon}
              alt=""
              className="shortcut-favicon-img"
              onError={() => setImageError(true)}
            />
          ) : shortcut.letter ? (
            <span className="shortcut-letter">{shortcut.letter}</span>
          ) : (
            <Icons.Link size={24} />
          )}
        </div>
        <span className="shortcut-name">{displayName}</span>
      </div>

      {/* Unified Edit Delete Badge overlay for all cards */}
      {isEditing && (
        <button
          className="delete-badge flex-center"
          onClick={handleDeleteClick}
          type="button"
          title="删除"
        >
          <Icons.X size={10} strokeWidth={3} />
        </button>
      )}

      {/* 仅管理员显示编辑/删除右键菜单（样式与侧栏分类菜单一致） */}
      {isAdmin && showMenu && (
        <div
          ref={menuRef}
          className="custom-context-menu glass-card"
          style={{ left: `${menuPos.x}px`, top: `${menuPos.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="context-menu-item" onClick={handleEditClickMenu}>
            <Icons.Edit3 size={12} style={{ opacity: 0.8 }} />
            <span>编辑网址</span>
          </button>
          <button
            type="button"
            className="context-menu-item delete-item"
            onClick={handleDeleteClick}
          >
            <Icons.Trash2 size={12} />
            <span>删除链接</span>
          </button>
        </div>
      )}

      <style>{`
        .shortcut-item-wrapper {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .shortcut-item-wrapper:hover {
          z-index: 40;
        }

        .shortcut-item-wrapper:hover:not(.wiggle) {
          transform: translateY(-4px);
        }

        .shortcut-item-wrapper.is-drop-target {
          outline: 2px dashed rgba(59, 130, 246, 0.85);
          outline-offset: 4px;
          border-radius: 12px;
        }

        .shortcut-item-wrapper.wiggle {
          cursor: grab;
        }

        .shortcut-item-wrapper.wiggle:active {
          cursor: grabbing;
        }

        .shortcut-item-wrapper * {
          cursor: inherit;
        }

        .flex-center-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }

        /* 1x1 standard link tile */
        .layout-1x1 {
          position: relative;
          width: 100%;
          height: 100%;
          gap: 6px;
        }

        .shortcut-tile {
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          position: relative;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
        }

        .shortcut-tile.is-transparent:not(.has-favicon) {
          background-color: rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .shortcut-tile.has-favicon {
          padding: 0;
        }

        .shortcut-favicon-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .shortcut-item-wrapper:hover:not(.wiggle) .shortcut-tile {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          filter: brightness(1.1);
        }

        /* Icon sizing config */
        .size-sm { width: 44px; height: 44px; font-size: 15px; }
        .size-md { width: 56px; height: 56px; font-size: 19px; }
        .size-lg { width: 68px; height: 68px; font-size: 23px; }

        .shortcut-letter {
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
        }

        .shortcut-name {
          position: relative;
          z-index: 2;
          display: block;
          box-sizing: border-box;
          max-width: 100%;
          line-height: 1.4;
          padding: 2px 0;
          font-size: 11px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.88);
          text-align: center;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          transition:
            max-width 0.28s cubic-bezier(0.22, 1, 0.36, 1),
            padding 0.22s ease,
            background 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease,
            text-shadow 0.2s ease;
        }

        /* 悬停：名称展开为克制毛玻璃标签 */
        .shortcut-item-wrapper:hover .shortcut-name {
          z-index: 50;
          max-width: min(220px, 48vw);
          width: max-content;
          padding: 4px 10px;
          overflow: visible;
          text-overflow: clip;
          color: rgba(255, 255, 255, 0.96);
          text-shadow: none;
          background: rgba(20, 20, 24, 0.72);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
        }

        /* 与侧栏 context-menu 统一 */
        .custom-context-menu {
          position: absolute;
          min-width: 110px;
          padding: 4px;
          border-radius: 10px;
          z-index: 99;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeIn 0.15s ease;
        }

        .custom-context-menu .context-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 11.5px;
          padding: 8px 12px;
          width: 100%;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .custom-context-menu .context-menu-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .custom-context-menu .context-menu-item.delete-item {
          color: #ef4444;
        }

        .custom-context-menu .context-menu-item.delete-item:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        .delete-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          z-index: 80;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        }

        .delete-badge:hover {
          transform: scale(1.15);
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}
