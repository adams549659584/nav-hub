import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function Sidebar({
  categories,
  activeCategoryId,
  setActiveCategoryId,
  onOpenSettings,
  onAddCategoryClick,
  onEditCategoryClick,
  onDeleteCategory,
  isAdmin = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, category: null });

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => setContextMenu({ visible: false, x: 0, y: 0, category: null });
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const renderIcon = (iconName, size = 20) => {
    const IconComponent = Icons[iconName] || Icons.Grid;
    return <IconComponent size={size} />;
  };

  const handleContextMenu = (e, cat) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      category: cat,
    });
  };

  const handleMoreClick = (e, cat) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: rect.left - 50,
      y: rect.bottom + 6,
      category: cat,
    });
  };

  return (
    <div className={`sidebar-container glass-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="logo-section">
        {isExpanded ? (
          <>
            <div className="logo-icon">iT</div>
            <button
              className="sidebar-toggle-btn flex-center"
              onClick={() => setIsExpanded(false)}
              title="收起侧边栏"
            >
              <Icons.ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <button
            className="logo-icon clickable"
            onClick={() => setIsExpanded(true)}
            title="展开侧边栏"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            iT
          </button>
        )}
      </div>

      <nav className="nav-items">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <div
              key={cat.id}
              className="nav-item-wrapper"
              onContextMenu={isAdmin ? (e) => handleContextMenu(e, cat) : undefined}
            >
              <button
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategoryId(cat.id)}
                data-title={cat.name}
              >
                {renderIcon(cat.icon || 'Grid')}
                <span className="nav-label">{cat.name}</span>
              </button>
              
              {/* Ellipsis button visible on hover in expanded sidebar */}
              {isAdmin && isExpanded && (
                <button
                  className="more-options-btn"
                  onClick={(e) => handleMoreClick(e, cat)}
                  title="分类选项"
                >
                  <Icons.MoreHorizontal size={14} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Category Trigger Button */}
        {isAdmin && (
          <button
            className="nav-item add-btn"
            onClick={onAddCategoryClick}
            aria-label="添加分类"
          >
            <Icons.Plus size={20} />
            <span className="nav-label">添加分类</span>
          </button>
        )}
      </nav>

      {isAdmin && (
        <div className="sidebar-footer">
          <button
            className="nav-item footer-btn"
            onClick={onOpenSettings}
            aria-label="全局设置"
          >
            <Icons.Settings size={20} />
            <span className="nav-label">全局设置</span>
          </button>
        </div>
      )}

      {/* Floating Context / Dropdown Menu */}
      {isAdmin && contextMenu.visible && (
        <div
          className="context-menu glass-card animate-fade"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 120,
            padding: '4px',
            borderRadius: '10px',
            minWidth: '110px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              onEditCategoryClick(contextMenu.category);
              setContextMenu({ visible: false, x: 0, y: 0, category: null });
            }}
          >
            <Icons.Edit3 size={12} style={{ opacity: 0.8 }} />
            <span>编辑分类</span>
          </button>
          {categories.length > 1 && contextMenu.category.code !== 'common' && (
            <button
              className="context-menu-item delete-item"
              onClick={() => {
                if (window.confirm('删除该分类将会同时删除分类下的所有快捷方式，确定删除吗？')) {
                  onDeleteCategory(contextMenu.category.id);
                }
                setContextMenu({ visible: false, x: 0, y: 0, category: null });
              }}
            >
              <Icons.Trash2 size={12} />
              <span>删除分类</span>
            </button>
          )}
        </div>
      )}

      <style>{`
        .sidebar-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
          border-radius: 0 16px 16px 0;
          border-left: none;
          z-index: 50;
          flex-shrink: 0;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s;
        }

        .sidebar-container.collapsed {
          width: 72px;
        }

        .sidebar-container.expanded {
          width: 180px;
          padding: 20px 12px;
        }

        .logo-section {
          margin-bottom: 24px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .sidebar-container.expanded .logo-section {
          justify-content: space-between;
          padding: 0 8px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-weight: bold;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .sidebar-toggle-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.2s;
        }

        .sidebar-toggle-btn:hover {
          color: white;
          background: rgba(255,255,255,0.15);
        }

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          align-items: center;
          flex: 1;
          overflow-y: auto;
          padding: 10px 0;
          scrollbar-width: none; /* Firefox */
        }

        .nav-items::-webkit-scrollbar {
          display: none;
        }

        .nav-item-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .nav-item {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.65);
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .nav-item,
        .nav-item * {
          cursor: pointer;
        }

        .sidebar-container.collapsed .nav-item {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          flex-direction: column;
          justify-content: center;
          padding-top: 4px;
        }

        .sidebar-container.expanded .nav-item {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          flex-direction: row;
          justify-content: flex-start;
          padding: 0 14px;
          gap: 12px;
        }

        .nav-item svg {
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .nav-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-item:hover svg {
          transform: scale(1.1);
        }

        .nav-item.active {
          color: #fff;
          background: rgba(59, 130, 246, 0.25);
          border: 1px solid rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
        }

        .nav-label {
          transition: opacity 0.2s, max-width 0.2s;
        }

        .sidebar-container.collapsed .nav-label {
          display: block;
          font-size: 10px;
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
          white-space: nowrap;
          max-width: 46px;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          transition: color 0.2s;
        }

        .sidebar-container.collapsed .nav-item:hover .nav-label {
          color: white;
        }

        .sidebar-container.expanded .nav-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }

        .add-btn {
          color: rgba(255, 255, 255, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.2);
        }

        .sidebar-container.collapsed .add-btn {
          width: 52px;
          height: 52px;
          border-radius: 12px;
        }

        .sidebar-container.expanded .add-btn {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          padding: 0 14px;
        }

        .add-btn:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }

        /* Hover actions inside expanded rows */
        .more-options-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
        }

        .more-options-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-item-wrapper:hover .more-options-btn {
          opacity: 1;
        }

        .sidebar-container.expanded .nav-item {
          padding-right: 32px; /* make space for hover options button */
        }

        .sidebar-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sidebar-container.expanded .sidebar-footer {
          padding: 16px 8px 0 8px;
        }

        .footer-btn {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Context menu items styling */
        .context-menu-item {
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

        .context-menu-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .context-menu-item.delete-item {
          color: #ef4444;
        }

        .context-menu-item.delete-item:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        /* 收起态：仅带 data-title 的分类项显示侧边提示（排除设置/添加等） */
        .sidebar-container.collapsed .nav-item[data-title]::after {
          content: attr(data-title);
          position: absolute;
          left: 80px;
          background: rgba(15, 23, 42, 0.85); /* Deep slate */
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transform: translateX(-10px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
          pointer-events: none;
        }

        .sidebar-container.collapsed .nav-item[data-title]:hover::after {
          opacity: 1;
          visibility: visible;
          left: 84px;
          transform: translateX(0);
        }

        .sidebar-container.collapsed .nav-item[data-title]::before {
          content: '';
          position: absolute;
          left: 74px;
          border-width: 5px;
          border-style: solid;
          border-color: transparent rgba(15, 23, 42, 0.85) transparent transparent;
          opacity: 0;
          visibility: hidden;
          transform: translateX(-10px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .sidebar-container.collapsed .nav-item[data-title]:hover::before {
          opacity: 1;
          visibility: visible;
          left: 79px;
          transform: translateX(0);
        }
      `}</style>
    </div>
  );
}
