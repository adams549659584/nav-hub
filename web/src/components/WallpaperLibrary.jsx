import React, { useCallback, useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { fetchWallpaperSources, fetchWallpapers } from '../utils/api';

const FALLBACK_SOURCES = [
  { id: 'solid', name: '纯色' },
  { id: 'bing', name: '必应壁纸' },
  { id: 'dynamic', name: '动态壁纸' },
  { id: 'wallhaven', name: 'Wallhaven' },
  { id: 'deepin', name: 'Deepin' },
  { id: 'custom', name: '自定义壁纸' },
];

export default function WallpaperLibrary({
  isOpen,
  onClose,
  current,
  onSelect,
  onApplyCustom,
}) {
  const [sources, setSources] = useState(FALLBACK_SOURCES);
  const [source, setSource] = useState(current?.source === 'preset' ? 'bing' : current?.source || 'bing');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [customUrl, setCustomUrl] = useState(current?.source === 'custom' ? current.src || '' : '');

  const load = useCallback(
    async (opts = {}) => {
      const nextPage = opts.page ?? 1;
      const nextSource = opts.source ?? source;
      const nextQuery = opts.q ?? query;
      if (nextSource === 'custom') {
        setItems([]);
        setHasMore(false);
        setLoading(false);
        setError('');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await fetchWallpapers({
          source: nextSource,
          page: nextPage,
          size: 16,
          q: nextSource === 'wallhaven' ? nextQuery : '',
        });
        setItems((prev) => (nextPage === 1 ? res.items || [] : [...prev, ...(res.items || [])]));
        setHasMore(!!res.hasMore);
        setPage(nextPage);
      } catch (e) {
        setError(e.message || '加载失败');
        if (nextPage === 1) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [source, query]
  );

  useEffect(() => {
    if (!isOpen) return;
    fetchWallpaperSources()
      .then((list) => {
        if (list?.length) setSources(list);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    load({ page: 1, source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, source]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    onSelect?.(item);
    onClose?.();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (!url) return;
    onApplyCustom?.(url);
    onClose?.();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('图片请控制在 2MB 以内（建议使用 URL 或压缩后上传）');
      return;
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('请选择图片或视频文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      onSelect?.({
        id: 'custom-file',
        source: 'custom',
        type: file.type.startsWith('video/') ? 'video' : 'image',
        src: dataUrl,
        thumb: dataUrl,
        title: file.name,
      });
      onClose?.();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="wp-lib-overlay" onClick={onClose}>
      <div className="wp-lib-dialog glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="wp-lib-header">
          <h2>壁纸库</h2>
          <button type="button" className="wp-lib-close" onClick={onClose} title="关闭">
            <Icons.X size={18} />
          </button>
        </div>

        <div className="wp-lib-body">
          <aside className="wp-lib-sidebar">
            {sources.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`wp-lib-source ${source === s.id ? 'active' : ''}`}
                onClick={() => setSource(s.id)}
              >
                {s.name}
              </button>
            ))}
          </aside>

          <div className="wp-lib-main">
            {source === 'wallhaven' && (
              <form
                className="wp-lib-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  load({ page: 1, q: query });
                }}
              >
                <input
                  className="glass-input"
                  placeholder="搜索 Wallhaven（英文关键词）"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="glass-btn">
                  搜索
                </button>
              </form>
            )}

            {source === 'custom' ? (
              <div className="wp-lib-custom">
                <p className="wp-lib-hint">粘贴图片 / 视频直链，或从本地选择文件（≤2MB）</p>
                <form onSubmit={handleCustomSubmit} className="wp-lib-custom-form">
                  <input
                    className="glass-input"
                    placeholder="https://..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <button type="submit" className="glass-btn primary">
                    应用 URL
                  </button>
                </form>
                <label className="wp-lib-upload glass-btn">
                  <Icons.Upload size={14} />
                  选择本地文件
                  <input type="file" accept="image/*,video/*" hidden onChange={handleFile} />
                </label>
              </div>
            ) : (
              <>
                {source === 'bing' && (
                  <p className="wp-lib-hint">必应每日壁纸 · 来自 Bing HPImageArchive</p>
                )}
                {source === 'dynamic' && (
                  <p className="wp-lib-hint">Deepin 动态壁纸（视频，需网络加载）</p>
                )}
                {error && <p className="wp-lib-error">{error}</p>}
                <div className="wp-lib-grid">
                  {items.map((item) => {
                    const active = current?.id === item.id || current?.src === item.src;
                    const isColor = item.type === 'color' || (item.src || '').startsWith('#');
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`wp-lib-tile ${active ? 'selected' : ''}`}
                        title={item.title || item.copyright || ''}
                        onClick={() => handleSelect(item)}
                        style={
                          isColor
                            ? { backgroundColor: item.src }
                            : item.type === 'video'
                              ? {
                                  backgroundImage: item.thumb ? `url(${item.thumb})` : undefined,
                                  backgroundColor: '#111',
                                }
                              : { backgroundImage: `url(${item.thumb || item.src})` }
                        }
                      >
                        {item.type === 'video' && (
                          <span className="wp-lib-badge">
                            <Icons.Play size={12} />
                            视频
                          </span>
                        )}
                        <span className="wp-lib-tile-title">
                          {item.title || item.copyright || item.id}
                        </span>
                        {active && (
                          <span className="wp-lib-check">
                            <Icons.Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {loading && <p className="wp-lib-hint">加载中…</p>}
                {!loading && hasMore && (
                  <button
                    type="button"
                    className="glass-btn wp-lib-more"
                    onClick={() => load({ page: page + 1 })}
                  >
                    加载更多
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <style>{`
          .wp-lib-overlay {
            position: fixed;
            inset: 0;
            z-index: 200;
            background: rgba(0,0,0,0.55);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .wp-lib-dialog {
            width: min(920px, 100%);
            height: min(640px, 90vh);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-radius: 16px;
          }
          .wp-lib-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .wp-lib-header h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #fff;
          }
          .wp-lib-close {
            background: none;
            border: none;
            color: rgba(255,255,255,0.55);
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .wp-lib-close:hover { color: #fff; background: rgba(255,255,255,0.08); }
          .wp-lib-body {
            flex: 1;
            display: flex;
            min-height: 0;
          }
          .wp-lib-sidebar {
            width: 140px;
            flex-shrink: 0;
            border-right: 1px solid rgba(255,255,255,0.08);
            padding: 12px 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            overflow-y: auto;
          }
          .wp-lib-source {
            background: none;
            border: none;
            text-align: left;
            color: rgba(255,255,255,0.65);
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
          }
          .wp-lib-source:hover { background: rgba(255,255,255,0.06); color: #fff; }
          .wp-lib-source.active {
            background: rgba(59,130,246,0.25);
            color: #fff;
            border: 1px solid rgba(59,130,246,0.4);
          }
          .wp-lib-main {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .wp-lib-search {
            display: flex;
            gap: 8px;
          }
          .wp-lib-search .glass-input { flex: 1; }
          .wp-lib-hint {
            margin: 0;
            font-size: 12px;
            color: rgba(255,255,255,0.45);
          }
          .wp-lib-error {
            margin: 0;
            font-size: 13px;
            color: #fca5a5;
          }
          .wp-lib-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
          }
          .wp-lib-tile {
            position: relative;
            aspect-ratio: 16/9;
            border-radius: 10px;
            border: 2px solid transparent;
            background-size: cover;
            background-position: center;
            cursor: pointer;
            overflow: hidden;
            padding: 0;
          }
          .wp-lib-tile:hover { border-color: rgba(255,255,255,0.35); transform: translateY(-1px); }
          .wp-lib-tile.selected { border-color: #3b82f6; box-shadow: 0 0 0 1px rgba(59,130,246,0.5); }
          .wp-lib-tile-title {
            position: absolute;
            left: 0; right: 0; bottom: 0;
            padding: 18px 8px 6px;
            font-size: 11px;
            color: #fff;
            text-align: left;
            background: linear-gradient(transparent, rgba(0,0,0,0.75));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .wp-lib-badge {
            position: absolute;
            top: 6px; left: 6px;
            display: inline-flex;
            align-items: center;
            gap: 3px;
            background: rgba(0,0,0,0.55);
            color: #fff;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 999px;
          }
          .wp-lib-check {
            position: absolute;
            top: 6px; right: 6px;
            width: 20px; height: 20px;
            border-radius: 50%;
            background: #3b82f6;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .wp-lib-more { align-self: center; margin-top: 8px; }
          .wp-lib-custom {
            display: flex;
            flex-direction: column;
            gap: 14px;
            max-width: 480px;
          }
          .wp-lib-custom-form {
            display: flex;
            gap: 8px;
          }
          .wp-lib-custom-form .glass-input { flex: 1; }
          .wp-lib-upload {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            width: fit-content;
            cursor: pointer;
          }
          .glass-btn.primary {
            background: rgba(59,130,246,0.85) !important;
          }
        `}</style>
      </div>
    </div>
  );
}
