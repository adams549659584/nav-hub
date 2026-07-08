import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

const PRESET_ICONS = [
  'Home', 'Palette', 'Code', 'Newspaper', 'Tv', 'Gamepad',
  'Heart', 'BookOpen', 'ShoppingBag', 'Globe', 'Coffee', 'Music',
  'Film', 'Compass', 'Star', 'Flame'
];

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  editingCategory = null,
}) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Home');

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setName(editingCategory.name || '');
        setSelectedIcon(editingCategory.icon || 'Home');
      } else {
        setName('');
        setSelectedIcon('Home');
      }
    }
  }, [isOpen, editingCategory]);

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
      <div className="modal-content glass-card animate-fade" onClick={(e) => e.stopPropagation()} style={{ width: '380px' }}>
        <div className="modal-header">
          <h3>{editingCategory ? '编辑导航分类' : '新建导航分类'}</h3>
          <button className="modal-close-btn" onClick={onClose} title="关闭">
            <Icons.X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 1. Icon Selection First */}
          <div className="form-group">
            <label>选择图标</label>
            <div className="icon-selector-grid">
              {PRESET_ICONS.map((iconName) => {
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
              })}
            </div>
          </div>

          {/* 2. Name Input Second */}
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

          {/* 3. Actions with consistent spacing */}
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

        .icon-selector-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          max-height: 160px;
          overflow-y: auto;
          padding-right: 4px;
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

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: transparent;
        }

        .save-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-color: transparent;
        }
      `}</style>
    </div>
  );
}
