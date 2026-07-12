import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { getCategoryIds } from '../utils/categories';
import { fetchFavicon } from '../utils/api';

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

const MAX_ICON_BYTES = 200 * 1024;

/** 阿里 iconfont 等 SVG 源码 → data URL，供 <img> 使用 */
function svgSourceToDataUrl(raw) {
  let s = (raw || '').trim();
  if (!s) throw new Error('请粘贴 SVG 代码');

  const match = s.match(/<svg\b[\s\S]*?<\/svg>/i);
  if (!match) throw new Error('未识别到 <svg>…</svg>，请粘贴完整 SVG 代码');
  s = match[0];

  if (!/\sxmlns\s*=/.test(s)) {
    s = s.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  s = s.replace(/<\?xml[\s\S]*?\?>/i, '').trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
}

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
  const [openMode, setOpenMode] = useState('tab'); // tab | iframe
  const [iframeDevice, setIframeDevice] = useState('desktop'); // desktop | mobile
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [showSvgPaste, setShowSvgPaste] = useState(false);
  const [svgError, setSvgError] = useState('');
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [faviconHint, setFaviconHint] = useState('');
  const fileInputRef = useRef(null);
  const faviconRef = useRef('');
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    faviconRef.current = favicon;
  }, [favicon]);

  useEffect(() => {
    if (!isOpen) return;
    if (shortcutToEdit) {
      setUrl(shortcutToEdit.url || '');
      setName(shortcutToEdit.name || '');
      setLetter(shortcutToEdit.letter || '');
      setBgColor(shortcutToEdit.bgColor || '');
      setFavicon(shortcutToEdit.favicon || '');
      setOpenMode(shortcutToEdit.openMode === 'iframe' ? 'iframe' : 'tab');
      setIframeDevice(
        shortcutToEdit.iframeDevice === 'mobile' ? 'mobile' : 'desktop'
      );
      setSelectedCategoryIds(getCategoryIds(shortcutToEdit));
    } else {
      setUrl('');
      setName('');
      setLetter('');
      setBgColor('');
      setFavicon('');
      setOpenMode('tab');
      setIframeDevice('desktop');
      setSelectedCategoryIds(
        (defaultCategoryIds || []).map(Number).filter((n) => n > 0)
      );
    }
    setShowSvgPaste(false);
    setSvgError('');
    setFaviconLoading(false);
    setFaviconHint('');
    fetchSeqRef.current += 1;
    // 仅在打开/切换编辑对象时初始化，避免 defaultCategoryIds 引用变化重置表单
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcutToEdit, isOpen]);

  useEffect(() => {
    if (!shortcutToEdit && name.trim() && !letter) {
      setLetter(name.trim().charAt(0).toUpperCase());
    }
  }, [name]);

  const normalizePageUrl = (raw) => {
    let s = (raw || '').trim();
    if (!s) return '';
    if (!s.startsWith('http://') && !s.startsWith('https://')) {
      s = 'https://' + s;
    }
    return s;
  };

  const applyFavicon = (dataUrl) => {
    if (dataUrl.length > MAX_ICON_BYTES) {
      setSvgError('图标数据过大（超过约 200KB），请简化 SVG 或压缩图片');
      setShowSvgPaste(true);
      return false;
    }
    setFavicon(dataUrl);
    setLetter('');
    setSvgError('');
    setShowSvgPaste(false);
    setFaviconHint('');
    return true;
  };

  /** force=true 时覆盖已有图标；否则仅在无图标时应用 */
  const loadFaviconFromUrl = async (rawUrl, { force = false } = {}) => {
    const pageUrl = normalizePageUrl(rawUrl);
    if (!pageUrl) return;
    try {
      // eslint-disable-next-line no-new
      new URL(pageUrl);
    } catch {
      if (force) setFaviconHint('链接无效，无法获取图标');
      return;
    }
    if (!force && faviconRef.current) return;

    const seq = ++fetchSeqRef.current;
    setFaviconLoading(true);
    if (force) setFaviconHint('');
    try {
      const dataUrl = await fetchFavicon(pageUrl);
      if (seq !== fetchSeqRef.current) return;
      if (!force && faviconRef.current) return;
      applyFavicon(dataUrl);
    } catch (err) {
      if (seq !== fetchSeqRef.current) return;
      if (force) {
        setFaviconHint(err.message || '获取图标失败');
      }
    } finally {
      if (seq === fetchSeqRef.current) setFaviconLoading(false);
    }
  };

  const handleUrlBlur = () => {
    if (url && !name) {
      try {
        const parsed = new URL(normalizePageUrl(url));
        const parts = parsed.hostname.split('.');
        const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
        if (domain) {
          setName(domain.charAt(0).toUpperCase() + domain.slice(1));
        }
      } catch {
        // ignore invalid URL
      }
    }
    // 无图标时自动抓取（含 SVG）
    if (url.trim() && !faviconRef.current) {
      loadFaviconFromUrl(url, { force: false });
    }
  };

  const tryApplySvgText = (text) => {
    try {
      return applyFavicon(svgSourceToDataUrl(text));
    } catch (err) {
      setShowSvgPaste(true);
      setSvgError(err.message || 'SVG 解析失败');
      return false;
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_ICON_BYTES) {
      alert('图片大小不能超过 200KB，请压缩后上传！');
      e.target.value = '';
      return;
    }

    const isSvg =
      file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = String(ev.target.result || '');
      if (isSvg) {
        tryApplySvgText(result);
      } else {
        applyFavicon(result);
      }
    };
    if (isSvg) reader.readAsText(file);
    else reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePasteSvg = async () => {
    if (showSvgPaste) {
      setShowSvgPaste(false);
      setSvgError('');
      return;
    }
    setSvgError('');
    try {
      if (!navigator.clipboard?.readText) {
        setShowSvgPaste(true);
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        setShowSvgPaste(true);
        setSvgError('剪贴板为空，请粘贴 SVG 到下方');
        return;
      }
      tryApplySvgText(text);
    } catch {
      setShowSvgPaste(true);
    }
  };

  const handleSvgTextareaPaste = (e) => {
    const text = e.clipboardData?.getData('text');
    if (!text?.trim()) return;
    e.preventDefault();
    tryApplySvgText(text);
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
      openMode: openMode === 'iframe' ? 'iframe' : 'tab',
      iframeDevice:
        openMode === 'iframe' && iframeDevice === 'mobile' ? 'mobile' : 'desktop',
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
      <div
        className="modal-content glass-card edit-shortcut-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{shortcutToEdit ? '编辑快捷链接' : '添加快捷链接'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <Icons.X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-body">
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

          <div className="form-group-row icon-meta-row">
            <div className="form-group short-input">
              <label>图标文字</label>
              <input
                type="text"
                value={letter}
                onChange={(e) => {
                  setLetter(e.target.value);
                  if (e.target.value) setFavicon('');
                }}
                placeholder="G"
                className="glass-input text-center"
                maxLength={2}
              />
            </div>

            <div className="form-group icon-actions-group">
              <label>图标</label>
              <div className="icon-upload-actions">
                <button
                  type="button"
                  className="glass-btn icon-upload-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Icons.Upload size={13} />
                  <span>上传</span>
                </button>
                <button
                  type="button"
                  className="glass-btn icon-upload-btn"
                  onClick={() => loadFaviconFromUrl(url, { force: true })}
                  disabled={faviconLoading || !url.trim()}
                  title="从网站自动获取图标（优先 SVG）"
                >
                  <Icons.Download size={13} />
                  <span>{faviconLoading ? '获取中…' : '获取'}</span>
                </button>
                <button
                  type="button"
                  className="glass-btn icon-upload-btn"
                  onClick={handlePasteSvg}
                  title="从剪贴板粘贴 iconfont 等 SVG 代码"
                >
                  <Icons.ClipboardPaste size={13} />
                  <span>SVG</span>
                </button>
              </div>
            </div>

            <div className="form-group icon-preview-group">
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
                {favicon && (
                  <button
                    type="button"
                    className="icon-preview-clear"
                    onClick={() => {
                      setFavicon('');
                      setSvgError('');
                      setShowSvgPaste(false);
                      setFaviconHint('');
                    }}
                    title="清除图标"
                  >
                    <Icons.X size={11} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {faviconHint && <p className="favicon-fetch-hint">{faviconHint}</p>}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*,.svg,image/svg+xml"
            style={{ display: 'none' }}
          />
          {showSvgPaste && (
            <div className="svg-paste-panel">
              <textarea
                className="glass-input svg-paste-input"
                defaultValue=""
                onPaste={handleSvgTextareaPaste}
                placeholder="在此粘贴 SVG（Ctrl/⌘+V），粘贴后自动应用"
                rows={3}
                spellCheck={false}
                autoFocus
              />
              {svgError && <p className="svg-paste-error">{svgError}</p>}
            </div>
          )}

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
              打开方式
              <span className="label-hint">部分网站禁止嵌入，iframe 可能空白</span>
            </label>
            <div className="open-mode-row">
              <button
                type="button"
                className={`open-mode-btn${openMode === 'tab' ? ' is-active' : ''}`}
                onClick={() => setOpenMode('tab')}
              >
                <Icons.ExternalLink size={14} />
                新标签页
              </button>
              <button
                type="button"
                className={`open-mode-btn${openMode === 'iframe' ? ' is-active' : ''}`}
                onClick={() => setOpenMode('iframe')}
              >
                <Icons.AppWindow size={14} />
                站内预览
              </button>
            </div>
            {openMode === 'iframe' && (
              <div className="iframe-device-row">
                <span className="iframe-device-label">默认视口</span>
                {[
                  { id: 'mobile', label: '手机', icon: Icons.Smartphone },
                  { id: 'desktop', label: '电脑', icon: Icons.Monitor },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`open-mode-btn compact${iframeDevice === id ? ' is-active' : ''}`}
                    onClick={() => setIframeDevice(id)}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
        .edit-shortcut-modal.modal-content {
          width: min(520px, calc(100vw - 24px));
          max-width: min(520px, calc(100vw - 24px));
          max-height: min(80dvh, 85vh);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
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
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 0;
          gap: 0;
        }

        .modal-form-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overscroll-behavior: contain;
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

        .open-mode-row,
        .iframe-device-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .iframe-device-row {
          margin-top: 8px;
        }

        .iframe-device-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-right: 2px;
        }

        .open-mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .open-mode-btn.compact {
          height: 28px;
          padding: 0 10px;
          font-size: 11.5px;
        }

        .open-mode-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .open-mode-btn.is-active {
          color: #fff;
          border-color: rgba(59, 130, 246, 0.55);
          background: rgba(59, 130, 246, 0.25);
        }

        .form-group-row {
          display: flex;
          gap: 16px;
        }

        /* 与 .glass-input 同高 */
        .icon-meta-row {
          align-items: flex-end;
          gap: 12px;
        }

        .icon-meta-row .glass-input {
          height: 34px;
          padding-top: 0;
          padding-bottom: 0;
        }

        .icon-actions-group {
          flex: 1;
          min-width: 0;
        }

        .icon-preview-group {
          flex-shrink: 0;
        }

        .icon-upload-actions {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          align-items: center;
        }

        .icon-upload-btn {
          height: 34px;
          padding: 0 12px;
          font-size: 12px;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .icon-upload-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .favicon-fetch-hint {
          margin: -8px 0 0;
          font-size: 11.5px;
          color: #fca5a5;
          line-height: 1.35;
        }

        .svg-paste-panel {
          margin-top: -4px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .svg-paste-input {
          width: 100%;
          min-height: 72px;
          height: auto !important;
          padding: 10px 12px !important;
          font-size: 11.5px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          line-height: 1.4;
          resize: vertical;
        }

        .svg-paste-error {
          margin: 0;
          font-size: 12px;
          color: #fca5a5;
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
          position: relative;
          display: flex;
          align-items: center;
          height: 34px;
          width: 34px;
        }

        .icon-preview-tile {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
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

        .icon-preview-clear {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 16px;
          height: 16px;
          padding: 0;
          border: none;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.92);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          z-index: 2;
        }

        .icon-preview-clear:hover {
          background: #dc2626;
          transform: scale(1.08);
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
          flex-shrink: 0;
          padding: 14px 24px 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.15);
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
          .edit-shortcut-modal.modal-content {
            width: min(520px, calc(100vw - 24px));
            max-width: min(520px, calc(100vw - 24px));
            height: 100% !important;
            max-height: none !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }

          .edit-shortcut-modal .modal-actions {
            gap: 10px;
            padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 0px));
          }

          .edit-shortcut-modal .modal-actions .glass-btn {
            flex: 1;
            justify-content: center;
            min-height: 44px;
          }

          /* 图标区：勿横排挤在一起，避免预览盖住上传/获取/SVG */
          .icon-meta-row {
            flex-wrap: wrap;
            align-items: flex-end;
            gap: 12px 10px;
          }

          .icon-meta-row .short-input {
            width: 72px;
            flex: 0 0 auto;
            order: 1;
          }

          .icon-preview-group {
            flex: 0 0 auto;
            order: 2;
            margin-left: 0;
          }

          .icon-actions-group {
            flex: 1 1 100%;
            width: 100%;
            order: 3;
            min-width: 100%;
          }

          .icon-upload-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            width: 100%;
          }

          .icon-upload-btn {
            width: 100%;
            min-width: 0;
            justify-content: center;
            padding: 0 8px;
          }

          .icon-preview-container {
            width: 40px;
            height: 40px;
            overflow: visible;
          }

          .icon-preview-tile {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }

          /* 清除钮不压到左侧按钮区 */
          .icon-preview-clear {
            top: -4px;
            right: -4px;
            z-index: 3;
          }

          .form-group-row {
            flex-wrap: wrap;
            gap: 12px;
          }

          .form-group-row > .form-group {
            min-width: 0;
          }
        }

        @media (max-width: 480px) {
          .icon-upload-actions {
            grid-template-columns: 1fr;
          }

          .icon-upload-btn {
            height: 38px;
            font-size: 13px;
          }
        }

      `}</style>
    </div>
  );
}
