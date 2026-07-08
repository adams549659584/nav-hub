import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export default function Sidebar({
  categories,
  activeCategoryId,
  setActiveCategoryId,
  onOpenSettings,
  onAddCategory,
  onDeleteCategory,
  isEditing,
}) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const renderIcon = (iconName, size = 20) => {
    const IconComponent = Icons[iconName] || Icons.Grid;
    return <IconComponent size={size} />;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="sidebar-container glass-card">
      <div className="logo-section">
        <div className="logo-icon">iT</div>
      </div>

      <nav className="nav-items">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <div key={cat.id} className="nav-item-wrapper">
              <button
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategoryId(cat.id)}
                title={cat.name}
              >
                {renderIcon(cat.icon || 'Grid')}
                <span className="nav-label">{cat.name}</span>
              </button>
              {isEditing && categories.length > 1 && cat.id !== 'common' && (
                <button
                  className="delete-cat-btn"
                  onClick={() => onDeleteCategory(cat.id)}
                  title="删除该分类"
                >
                  <Icons.X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Category Section */}
        {showAddInput ? (
          <form onSubmit={handleAddSubmit} className="add-cat-form">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="名称"
              className="glass-input cat-input"
              maxLength={6}
              autoFocus
              onBlur={() => setTimeout(() => setShowAddInput(false), 200)}
            />
          </form>
        ) : (
          <button
            className="nav-item add-btn"
            onClick={() => setShowAddInput(true)}
            title="添加分类"
          >
            <Icons.Plus size={20} />
            <span className="nav-label">添加</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item footer-btn" onClick={onOpenSettings} title="全局设置">
          <Icons.Settings size={20} />
          <span className="nav-label">设置</span>
        </button>
      </div>

      <style>{`
        .sidebar-container {
          width: 72px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
          border-radius: 0 16px 16px 0; /* flat left, rounded right */
          border-left: none;
          z-index: 20;
          flex-shrink: 0;
        }

        .logo-section {
          margin-bottom: 24px;
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

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          align-items: center;
          flex: 1;
          overflow-y: auto;
          padding: 10px 0;
          scrollbar-width: none; /* Firefox */
        }

        .nav-items::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }

        .nav-item-wrapper {
          position: relative;
          width: 80%;
          display: flex;
          justify-content: center;
        }

        .nav-item {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.65);
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .nav-item svg {
          transition: transform 0.2s;
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
          font-size: 9px;
          margin-top: 3px;
          display: none; /* simple icon-only sidebar initially, hover displays label or fits text */
        }

        .add-btn {
          color: rgba(255, 255, 255, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.2);
        }

        .add-btn:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }

        .delete-cat-btn {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
        }

        .add-cat-form {
          width: 80%;
          display: flex;
          justify-content: center;
        }

        .cat-input {
          width: 48px;
          height: 32px;
          padding: 2px 4px;
          font-size: 10px;
          text-align: center;
          border-radius: 8px;
        }

        .sidebar-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-btn {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Tooltip style on hover */
        .nav-item::after {
          content: attr(title);
          position: absolute;
          left: 64px;
          background: rgba(15, 15, 15, 0.85);
          color: white;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }

        .nav-item:hover::after {
          opacity: 1;
          visibility: visible;
          left: 60px;
        }
      `}</style>
    </div>
  );
}
