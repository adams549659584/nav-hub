import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

export default function ShortcutIcon({
  shortcut,
  isEditing,
  onDelete,
  onEditClick,
  onUpdate,
  settings,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  const sizeX = shortcut.sizeX || 1;
  const sizeY = shortcut.sizeY || 1;

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

  const handleResize = (x, y) => {
    if (onUpdate) {
      onUpdate({ ...shortcut, sizeX: x, sizeY: y });
    }
    setShowMenu(false);
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

  const getDomainName = (urlString) => {
    try {
      const parsed = new URL(urlString);
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return '';
    }
  };

  // 1x1 Standard Shortcut
  const render1x1 = () => (
    <div className="layout-1x1 flex-center-col">
      <div
        className={`shortcut-tile ${getIconSizeClass()}`}
        style={{
          backgroundColor: shortcut.bgColor || 'rgba(255,255,255,0.1)',
          color: shortcut.color || '#fff',
          borderRadius: settings.iconRadius || '16px',
        }}
      >
        {shortcut.letter ? (
          <span className="shortcut-letter">{shortcut.letter}</span>
        ) : (
          <Icons.Link size={24} />
        )}
      </div>
      <span className="shortcut-name">{shortcut.name}</span>
    </div>
  );

  // 2x1 Horizontal glass capsule
  const render2x1 = () => (
    <div className="layout-2x1 glass-card flex-center">
      <div
        className="shortcut-tile-small flex-center"
        style={{
          backgroundColor: shortcut.bgColor || 'rgba(255,255,255,0.15)',
          color: shortcut.color || '#fff',
          borderRadius: '10px',
        }}
      >
        {shortcut.letter ? shortcut.letter : 'L'}
      </div>
      <div className="card-text">
        <span className="card-title">{shortcut.name}</span>
        <span className="card-sub">{getDomainName(shortcut.url)}</span>
      </div>
    </div>
  );

  // 2x2 Square glass card
  const render2x2 = () => (
    <div className="layout-2x2 glass-card flex-center-col">
      <div
        className="shortcut-tile-large flex-center"
        style={{
          backgroundColor: shortcut.bgColor || 'rgba(255,255,255,0.15)',
          color: shortcut.color || '#fff',
          borderRadius: '16px',
        }}
      >
        {shortcut.letter ? shortcut.letter : 'L'}
      </div>
      <div className="card-footer-info">
        <span className="card-title">{shortcut.name}</span>
        <span className="card-sub">{getDomainName(shortcut.url)}</span>
      </div>
    </div>
  );

  // 2x4 Tall mock dashboard card
  const render2x4 = () => (
    <div className="layout-2x4 glass-card flex-center-col">
      <div
        className="shortcut-tile-large flex-center"
        style={{
          backgroundColor: shortcut.bgColor || 'rgba(255,255,255,0.15)',
          color: shortcut.color || '#fff',
          borderRadius: '16px',
          marginTop: '16px'
        }}
      >
        {shortcut.letter ? shortcut.letter : 'L'}
      </div>
      <div className="card-info-middle">
        <span className="card-title-large">{shortcut.name}</span>
        <span className="card-url">{getDomainName(shortcut.url)}</span>
      </div>

      <div className="widget-mock-feed">
        <div className="feed-row">
          <Icons.Activity size={10} className="feed-icon-pulsing" />
          <span>服务状态: 正常</span>
        </div>
        <div className="feed-row">
          <Icons.Globe size={10} />
          <span>连接响应: 极速</span>
        </div>
      </div>
    </div>
  );

  const getLayout = () => {
    if (sizeX === 2 && sizeY === 1) return render2x1();
    if (sizeX === 2 && sizeY === 2) return render2x2();
    if (sizeX === 2 && sizeY === 4) return render2x4();
    return render1x1();
  };

  return (
    <div
      className={`shortcut-item-wrapper ${isEditing ? 'wiggle' : ''} size-x-${sizeX} size-y-${sizeY}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        gridColumn: `span ${sizeX}`,
        gridRow: `span ${sizeY}`,
      }}
    >
      {getLayout()}

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
          <div className="menu-header">卡片尺寸</div>
          <button className={`menu-item ${sizeX === 1 && sizeY === 1 ? 'active' : ''}`} onClick={() => handleResize(1, 1)}>
            <Icons.Maximize size={12} />
            <span>1x1 小卡</span>
          </button>
          <button className={`menu-item ${sizeX === 2 && sizeY === 1 ? 'active' : ''}`} onClick={() => handleResize(2, 1)}>
            <Icons.Maximize size={12} />
            <span>2x1 宽卡</span>
          </button>
          <button className={`menu-item ${sizeX === 2 && sizeY === 2 ? 'active' : ''}`} onClick={() => handleResize(2, 2)}>
            <Icons.Maximize size={12} />
            <span>2x2 方卡</span>
          </button>
          <button className={`menu-item ${sizeX === 2 && sizeY === 4 ? 'active' : ''}`} onClick={() => handleResize(2, 4)}>
            <Icons.Maximize size={12} />
            <span>2x4 长卡</span>
          </button>
          <button className={`menu-item ${sizeX === 4 && sizeY === 2 ? 'active' : ''}`} onClick={() => handleResize(4, 2)}>
            <Icons.Maximize size={12} />
            <span>4x2 横板</span>
          </button>
          
          <div className="menu-divider" />
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

        /* 2x1 Horizontal glass capsule */
        .layout-2x1 {
          width: 100%;
          height: 100%;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
        }

        .shortcut-tile-small {
          width: 36px;
          height: 36px;
          font-size: 14px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .card-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
          text-align: left;
        }

        .card-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-sub {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 2x2 Square glass card */
        .layout-2x2 {
          width: 100%;
          height: 100%;
          padding: 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          justify-content: space-between;
          text-align: center;
        }

        .shortcut-tile-large {
          width: 50px;
          height: 50px;
          font-size: 20px;
          font-weight: bold;
        }

        .card-footer-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
        }

        /* 2x4 Vertical long card */
        .layout-2x4 {
          width: 100%;
          height: 100%;
          padding: 16px 12px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          justify-content: flex-start;
          gap: 12px;
          text-align: center;
        }

        .card-info-middle {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-title-large {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        .card-url {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.45);
        }

        .widget-mock-feed {
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 10px;
          margin-top: auto;
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          text-align: left;
        }

        .feed-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .feed-icon-pulsing {
          color: #10b981;
          animation: pulse 1.5s infinite;
        }

        /* Custom Context Menu */
        .custom-context-menu {
          position: absolute;
          width: 136px;
          padding: 6px;
          border-radius: 10px;
          z-index: 99;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeIn 0.15s ease;
        }

        .menu-header {
          font-size: 9px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          padding: 4px 8px;
          text-transform: uppercase;
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

        .menu-item.active {
          color: #3b82f6;
          font-weight: 600;
        }

        .menu-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 4px 0;
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

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
