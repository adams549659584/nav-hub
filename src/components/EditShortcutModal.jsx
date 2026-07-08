import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

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
}) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [letter, setLetter] = useState('');
  const [bgColor, setBgColor] = useState(PRESET_COLORS[0]);
  const [favicon, setFavicon] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (shortcutToEdit) {
      setUrl(shortcutToEdit.url || '');
      setName(shortcutToEdit.name || '');
      setLetter(shortcutToEdit.letter || '');
      setBgColor(shortcutToEdit.bgColor || PRESET_COLORS[0]);
      setFavicon(shortcutToEdit.favicon || '');
    } else {
      setUrl('');
      setName('');
      setLetter('');
      setBgColor(PRESET_COLORS[0]);
      setFavicon('');
    }
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || !name.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const payload = {
      id: shortcutToEdit ? shortcutToEdit.id : `s-${Date.now()}`,
      type: 'shortcut',
      name: name.trim(),
      url: finalUrl,
      letter: (letter.trim() || name.trim().charAt(0)).toUpperCase(),
      bgColor,
      color: '#ffffff',
      sizeX: shortcutToEdit ? shortcutToEdit.sizeX || 1 : 1,
      sizeY: shortcutToEdit ? shortcutToEdit.sizeY || 1 : 1,
      favicon: favicon.trim(),
    };

    onSave(payload);
    onClose();
  };

  const getTextColor = (bg) => {
    if (!bg) return '#ffffff';
    const clean = bg.toLowerCase().trim();
    if (clean === '#ffffff' || clean === '#fff' || clean === 'white') {
      return '#1e293b'; // slate-800 dark text
    }
    return '#ffffff';
  };

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
                  className="icon-preview-tile"
                  style={{
                    backgroundColor: bgColor,
                    color: getTextColor(bgColor),
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px'
                  }}
                >
                  {favicon ? (
                    <img
                      src={favicon}
                      alt=""
                      style={{
                        width: '24px',
                        height: '24px',
                        objectFit: 'contain',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    letter || name.charAt(0) || '?'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>背景颜色</label>
            <div className="colors-grid">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-btn ${bgColor === color ? 'selected' : ''}`}
                  style={{
                    backgroundColor: color,
                    border: color.toLowerCase() === '#ffffff' ? '1px solid rgba(255, 255, 255, 0.4)' : undefined
                  }}
                  onClick={() => setBgColor(color)}
                />
              ))}
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="color-picker-input"
              />
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
          height: 36px;
        }

        .icon-preview-tile {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 15px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
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
        }

        .color-btn.selected {
          border-color: white;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
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
