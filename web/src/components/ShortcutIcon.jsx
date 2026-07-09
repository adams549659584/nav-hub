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
  onDelete,
  onEditClick,
  settings,
  onDragOverShortcut,
  onDropOnShortcut,
  isDropTarget = false,
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
      onContextMenu={handleContextMenu}
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
        <span className="shortcut-name">{shortcut.name}</span>
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

      {/* Custom Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="custom-context-menu glass-card"
          style={{ left: `${menuPos.x}px`, top: `${menuPos.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="menu-item menu-edit" onClick={handleEditClickMenu}>
            <Icons.Edit2 size={12} />
            <span>编辑网址</span>
          </button>
          <button className="menu-item menu-danger" onClick={handleDeleteClick}>
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
          font-size: 11px;
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 1.5px 3px rgba(0, 0, 0, 0.8);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Custom Context Menu */
        .custom-context-menu {
          position: absolute;
          width: 120px;
          padding: 6px;
          border-radius: 10px;
          z-index: 99;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeIn 0.15s ease;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          width: 100%;
          padding: 6px 8px;
          color: rgba(255, 255, 255, 0.75);
          font-size: 11.5px;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.15s;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .menu-edit:hover {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }

        .menu-danger:hover {
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
