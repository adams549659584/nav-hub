import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { resolveCategoryIcons } from '../utils/categoryIcons';

const AVAILABLE_ICONS = resolveCategoryIcons(Icons);

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  editingCategory = null,
}) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Home');
  const [iconQuery, setIconQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setName(editingCategory.name || '');
        setSelectedIcon(editingCategory.icon || 'Home');
      } else {
        setName('');
        setSelectedIcon('Home');
      }
      setIconQuery('');
    }
  }, [isOpen, editingCategory]);

  const iconList = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    let list = AVAILABLE_ICONS;
    if (q) {
      list = list.filter((n) => n.toLowerCase().includes(q));
    }
    // 编辑时若当前图标不在预设里，仍展示可选
    if (selectedIcon && !list.includes(selectedIcon) && Icons[selectedIcon]) {
      list = [selectedIcon, ...list];
    }
    return list;
  }, [iconQuery, selectedIcon]);

  const renderIcon = (iconName, size = 18) => {
    const IconComponent = Icons[iconName] || Icons.Grid;
    return <IconComponent size={size} />;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), selectedIcon, editingCategory?.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card animate-fade"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '420px', maxWidth: 'min(420px, calc(100vw - 24px))', maxHeight: '80dvh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h3>{editingCategory ? '编辑导航分类' : '新建导航分类'}</h3>
          <button className="modal-close-btn" onClick={onClose} title="关闭" type="button">
            <Icons.X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>选择图标</label>
            <div className="icon-search-row">
              <Icons.Search size={14} className="icon-search-glyph" />
              <input
                type="search"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder="搜索图标名，如 code、music…"
                className="glass-input icon-search-input"
                autoComplete="off"
              />
            </div>
            <div className="icon-selector-grid">
              {iconList.length === 0 ? (
                <div className="icon-empty">无匹配图标</div>
              ) : (
                iconList.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      className={`icon-select-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedIcon(iconName)}
                      title={iconName}
                    >
                      {renderIcon(iconName, 18)}
                    </button>
                  );
                })
              )}
            </div>
            <div className="icon-selected-hint">
              当前：{renderIcon(selectedIcon, 14)}
              <span>{selectedIcon}</span>
              <span className="icon-count">共 {AVAILABLE_ICONS.length} 个可选</span>
            </div>
          </div>

          <div className="form-group">
            <label>分类名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入分类名称 (最多10个字符)"
              className="glass-input"
              maxLength={10}
              required
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="glass-btn cancel-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="glass-btn save-btn">
              {editingCategory ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: white;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: color 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }

        .modal-close-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.08);
          transform: rotate(90deg);
        }

        .modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 500;
        }

        .icon-search-row {
          position: relative;
          display: flex;
          align-items: center;
        }

        .icon-search-glyph {
          position: absolute;
          left: 10px;
          color: rgba(255, 255, 255, 0.35);
          pointer-events: none;
        }

        .icon-search-input {
          width: 100%;
          padding-left: 32px !important;
          font-size: 13px;
          height: 36px;
        }

        .icon-selector-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .icon-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 24px 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .icon-select-btn {
          height: 38px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          outline: none;
        }

        .icon-select-btn:hover {
          color: white;
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
        }

        .icon-select-btn.selected {
          background: rgba(59, 130, 246, 0.25);
          border-color: #3b82f6;
          color: #93c5fd;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
        }

        .icon-selected-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
        }

        .icon-selected-hint span:first-of-type {
          color: rgba(255, 255, 255, 0.7);
        }

        .icon-count {
          margin-left: auto;
          color: rgba(255, 255, 255, 0.3);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .save-btn {
          background: rgba(59, 130, 246, 0.85) !important;
        }

        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0;
            align-items: stretch;
          }
          .modal-content {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            max-height: none !important;
            border-radius: 0 !important;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .modal-actions {
            gap: 10px;
            margin-top: 8px;
          }

          .modal-actions .glass-btn {
            flex: 1;
            justify-content: center;
            min-height: 44px;
          }
        }

      `}</style>
    </div>
  );
}
