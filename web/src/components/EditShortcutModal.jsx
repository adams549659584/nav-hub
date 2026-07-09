import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { getCategoryIds } from '../utils/categories';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber/Yellow
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#6b7280', // Grey
  '#1e1e1e', // Dark
  '#ffffff', // White
];

export default function EditShortcutModal({
  isOpen,
  onClose,
  onSave,
  shortcutToEdit,
  categories = [],
  defaultCategoryIds = [],
}) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [letter, setLetter] = useState('');
  // 空字符串 = 透明背景
  const [bgColor, setBgColor] = useState('');
  const [favicon, setFavicon] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (shortcutToEdit) {
      setUrl(shortcutToEdit.url || '');
      setName(shortcutToEdit.name || '');
      setLetter(shortcutToEdit.letter || '');
      setBgColor(shortcutToEdit.bgColor || '');
      setFavicon(shortcutToEdit.favicon || '');
      setSelectedCategoryIds(getCategoryIds(shortcutToEdit));
    } else {
      setUrl('');
      setName('');
      setLetter('');
      setBgColor('');
      setFavicon('');
      setSelectedCategoryIds(
        (defaultCategoryIds || []).map(Number).filter((n) => n > 0)
      );
    }
    // 仅在打开/切换编辑对象时初始化，避免 defaultCategoryIds 引用变化重置表单
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcutToEdit, isOpen]);

  // Autocomplete letter from name
  useEffect(() => {
    if (!shortcutToEdit && name.trim() && !letter) {
      setLetter(name.trim().charAt(0).toUpperCase());
    }
  }, [name]);

  const handleUrlBlur = () => {
    if (url && !name) {
      try {
        let hostname = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          hostname = 'https://' + url;
        }
        const parsed = new URL(hostname);
        const parts = parsed.hostname.split('.');
        const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
        if (domain) {
          const capitalized = domain.charAt(0).toUpperCase() + domain.slice(1);
          setName(capitalized);
        }
      } catch (e) {
        // ignore invalid URL lookups
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 200KB max to avoid localStorage bloat
    if (file.size > 200 * 1024) {
      alert('图片大小不能超过 200KB，请压缩后上传！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFavicon(uploadEvent.target.result); // Base64 data URL
      setLetter(''); // Clear text letter
    };
    reader.readAsDataURL(file);
    // 允许同一文件再次选择
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || !name.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const hasIcon = !!favicon.trim();
    const payload = {
      id: shortcutToEdit?.id,
      name: name.trim(),
      url: finalUrl,
      // 有自定义图标时可不填文字
      letter: hasIcon
        ? (letter.trim() || '')
        : (letter.trim() || name.trim().charAt(0)).toUpperCase(),
      bgColor: bgColor || '',
      favicon: favicon.trim(),
      // 允许为空：无分类仅在「全部」中显示
      categoryIds: selectedCategoryIds.map(Number).filter((n) => n > 0),
    };

    onSave(payload);
    onClose();
  };

  const toggleCategory = (catId) => {
    const id = Number(catId);
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isTransparent = !bgColor;

  const getTextColor = (bg) => {
    if (!bg) return '#ffffff';
    const clean = bg.toLowerCase().trim();
    if (clean === '#ffffff' || clean === '#fff' || clean === 'white') {
      return '#1e293b'; // slate-800 dark text
    }
    return '#ffffff';
  };

  const tileBgStyle = isTransparent
    ? {
        backgroundColor: 'transparent',
        // 棋盘格提示透明
        backgroundImage:
          'linear-gradient(45deg, rgba(255,255,255,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.12) 75%)',
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
      }
    : { backgroundColor: bgColor };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{shortcutToEdit ? '编辑快捷链接' : '添加快捷链接'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <Icons.X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>网站链接</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="e.g. github.com"
              className="glass-input"
              required
            />
          </div>

          <div className="form-group">
            <label>网站名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GitHub"
              className="glass-input"
              maxLength={12}
              required
            />
          </div>

          <div className="form-group-row" style={{ alignItems: 'flex-end', gap: '12px' }}>
            <div className="form-group short-input">
              <label>图标文字</label>
              <input
                type="text"
                value={letter}
                onChange={(e) => {
                  setLetter(e.target.value);
                  if (e.target.value) setFavicon(''); // clear uploaded icon if typing text
                }}
                placeholder="G"
                className="glass-input text-center"
                maxLength={2}
              />
            </div>

            <div className="form-group flex-1">
              <label>上传本地图标</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="glass-btn"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    height: '36px',
                    padding: '0 12px',
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icons.Upload size={13} />
                  <span>上传图标</span>
                </button>
                {favicon && (
                  <button
                    type="button"
                    className="glass-btn"
                    onClick={() => setFavicon('')}
                    style={{
                      fontSize: '11px',
                      height: '36px',
                      padding: '0 10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#fca5a5',
                      cursor: 'pointer'
                    }}
                  >
                    清除
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            <div className="form-group" style={{ marginLeft: 'auto' }}>
              <label>预览</label>
              <div className="icon-preview-container">
                <div
                  className={`icon-preview-tile${favicon ? ' has-favicon' : ''}`}
                  style={{
                    ...tileBgStyle,
                    color: getTextColor(bgColor),
                    borderRadius: '12px',
                  }}
                >
                  {favicon ? (
                    <img src={favicon} alt="" className="icon-preview-img" />
                  ) : (
                    letter || name.charAt(0) || '?'
                  )}
                </div>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="form-group">
              <label>
                所属分类
                <span className="label-hint">可多选；不选则仅在「全部」中显示</span>
              </label>
              <div className="category-check-grid">
                {categories.map((cat) => {
                  const checked = selectedCategoryIds.includes(Number(cat.id));
                  return (
                    <label
                      key={cat.id}
                      className={`category-check-item${checked ? ' checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      <span>{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>
              背景颜色
              <span className="label-hint">可选，清除后为透明</span>
            </label>
            <div className="colors-grid">
              <button
                type="button"
                className={`color-btn transparent-btn ${isTransparent ? 'selected' : ''}`}
                title="透明背景"
                onClick={() => setBgColor('')}
              >
                <Icons.Ban size={12} />
              </button>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-btn ${bgColor === color ? 'selected' : ''}`}
                  style={{
                    backgroundColor: color,
                    border:
                      color.toLowerCase() === '#ffffff'
                        ? '1px solid rgba(255, 255, 255, 0.4)'
                        : undefined,
                  }}
                  onClick={() => setBgColor(color)}
                />
              ))}
              <input
                type="color"
                value={bgColor || '#3b82f6'}
                onChange={(e) => setBgColor(e.target.value)}
                className="color-picker-input"
                title="自定义颜色"
              />
              {!isTransparent && (
                <button
                  type="button"
                  className="color-clear-btn"
                  onClick={() => setBgColor('')}
                  title="清除背景色"
                >
                  <Icons.Eraser size={12} />
                  清除
                </button>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="glass-btn cancel-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="glass-btn save-btn">
              保存
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
        }

        .modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.55);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .label-hint {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.35);
          font-weight: 400;
        }

        .category-check-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .category-check-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.75);
          font-size: 12px;
          cursor: pointer;
          user-select: none;
        }

        .category-check-item.checked {
          border-color: rgba(59, 130, 246, 0.55);
          background: rgba(59, 130, 246, 0.2);
          color: #fff;
        }

        .category-check-item input {
          accent-color: #3b82f6;
          margin: 0;
        }

        .form-group-row {
          display: flex;
          gap: 16px;
        }

        .short-input {
          width: 80px;
        }

        .text-center {
          text-align: center;
        }

        .flex-1 {
          flex: 1;
        }

        .icon-preview-container {
          display: flex;
          align-items: center;
          height: 44px;
        }

        .icon-preview-tile {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 15px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          overflow: hidden;
          position: relative;
        }

        .icon-preview-tile.has-favicon {
          padding: 0;
        }

        .icon-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .colors-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .color-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-btn.selected {
          border-color: white;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        }

        .color-btn.transparent-btn {
          background:
            linear-gradient(45deg, rgba(255,255,255,0.25) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.25) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.25) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.25) 75%);
          background-size: 6px 6px;
          background-position: 0 0, 0 3px, 3px -3px, -3px 0;
          background-color: rgba(0,0,0,0.2);
          color: rgba(255,255,255,0.7);
        }

        .color-clear-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 22px;
          padding: 0 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          cursor: pointer;
        }

        .color-clear-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.12);
        }

        .color-picker-input {
          width: 22px;
          height: 22px;
          border: none;
          background: none;
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
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
