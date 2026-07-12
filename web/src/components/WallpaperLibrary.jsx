import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { fetchWallpaperSources, fetchWallpapers } from '../utils/api';

const SOURCE_META = {
  solid: { desc: '纯色背景', icon: 'Palette' },
  bing: { desc: '每日精选壁纸', icon: 'Sun' },
  dynamic: { desc: 'Deepin 动态视频', icon: 'Clapperboard' },
  wallhaven: { desc: '海量高清壁纸', icon: 'Images' },
  deepin: { desc: 'Deepin 静态壁纸', icon: 'Image' },
  custom: { desc: 'URL 或本地文件', icon: 'Link' },
};

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
  const mainScrollRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(false);
  const pageRef = useRef(1);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [customUrl, setCustomUrl] = useState(current?.source === 'custom' ? current.src || '' : '');
  const [previewItem, setPreviewItem] = useState(null);
  /** 移动端：list=来源列表，detail=当前来源内容（对齐全局设置） */
  const [mobileNavMode, setMobileNavMode] = useState('list');
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const onChange = (event) => setIsMobileViewport(event.matches);
    onChange(mediaQuery);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  // 仅在壁纸库从关→开时回到来源列表；勿监听 isMobileViewport 以免误重置
  const wasLibOpenRef = useRef(false);
  const ignoreOverlayCloseUntilRef = useRef(0);
  useEffect(() => {
    if (isOpen && !wasLibOpenRef.current) {
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
        setMobileNavMode('list');
      }
      // 打开后短时间忽略遮罩关闭，防止打开按钮的同一 tap 点穿
      ignoreOverlayCloseUntilRef.current = Date.now() + 400;
    }
    wasLibOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const load = useCallback(
    async (opts = {}) => {
      const nextPage = opts.page ?? 1;
      const nextSource = opts.source ?? source;
      const nextQuery = opts.q ?? query;
      if (nextSource === 'custom') {
        setItems([]);
        setHasMore(false);
        hasMoreRef.current = false;
        setLoading(false);
        loadingRef.current = false;
        setError('');
        return;
      }
      // 防止滚动触底连发
      if (loadingRef.current && nextPage > 1) return;
      loadingRef.current = true;
      setLoading(true);
      setError('');
      try {
        const res = await fetchWallpapers({
          source: nextSource,
          page: nextPage,
          size: 16,
          q: nextSource === 'wallhaven' ? nextQuery : '',
        });
        const more = !!res.hasMore;
        setItems((prev) => (nextPage === 1 ? res.items || [] : [...prev, ...(res.items || [])]));
        setHasMore(more);
        hasMoreRef.current = more;
        setPage(nextPage);
        pageRef.current = nextPage;
      } catch (e) {
        setError(e.message || '加载失败');
        if (nextPage === 1) setItems([]);
      } finally {
        loadingRef.current = false;
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
    pageRef.current = 1;
    load({ page: 1, source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, source]);

  // 滚动到底自动加载更多（替代手动「加载更多」）
  useEffect(() => {
    if (!isOpen) return undefined;
    if (source === 'custom') return undefined;
    // 手机列表页没有网格，不观察
    if (isMobileViewport && mobileNavMode === 'list') return undefined;

    const root = mainScrollRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!root || !sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loadingRef.current || !hasMoreRef.current) return;
        load({ page: pageRef.current + 1 });
      },
      {
        root,
        rootMargin: '120px 0px',
        threshold: 0,
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, source, isMobileViewport, mobileNavMode, items.length, hasMore, load]);

  if (!isOpen) return null;

  const activeSourceMeta = sources.find((s) => s.id === source) || sources[0];
  const openMobileSource = (sourceId) => {
    setSource(sourceId);
    setMobileNavMode('detail');
  };
  const backToMobileSourceList = () => setMobileNavMode('list');


  const handleSelect = (item) => {
    onSelect?.(item);
    // 推迟关闭，让父级先同步写好 ignore，并避免同一 tap 点穿到设置返回
    window.setTimeout(() => onClose?.(), 0);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (!url) return;
    onApplyCustom?.(url);
    window.setTimeout(() => onClose?.(), 0);
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
      window.setTimeout(() => onClose?.(), 0);
    };
    reader.readAsDataURL(file);
  };

  return createPortal(
    <>
    <div
      className="wp-lib-overlay"
      onClick={(e) => {
        e.stopPropagation();
        if (Date.now() < ignoreOverlayCloseUntilRef.current) return;
        onClose?.();
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="wp-lib-dialog glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="wp-lib-header">
          <div className="wp-lib-header-left">
            {isMobileViewport && mobileNavMode === 'detail' ? (
              <>
                {(() => {
                  const meta = SOURCE_META[source] || { icon: 'Image' };
                  const SourceIcon = Icons[meta.icon] || Icons.Image;
                  return <SourceIcon size={18} className="wp-lib-header-icon" />;
                })()}
                <h2 className="wp-lib-title">{activeSourceMeta?.name || '壁纸库'}</h2>
              </>
            ) : (
              <>
                <Icons.Images size={18} className="wp-lib-header-icon" />
                <h2 className="wp-lib-title">壁纸库</h2>
              </>
            )}
          </div>
          <div className="wp-lib-header-right">
            <button
              type="button"
              className="wp-lib-close"
              onClick={() => {
                if (isMobileViewport && mobileNavMode === 'detail') {
                  backToMobileSourceList();
                  return;
                }
                onClose();
              }}
              title={isMobileViewport && mobileNavMode === 'detail' ? '返回' : '关闭'}
              aria-label={isMobileViewport && mobileNavMode === 'detail' ? '返回来源列表' : '关闭'}
            >
              <Icons.X size={20} />
            </button>
          </div>
        </div>

        <div
          className={`wp-lib-body${
            isMobileViewport && mobileNavMode === 'list' ? ' is-mobile-menu' : ''
          }${isMobileViewport && mobileNavMode === 'detail' ? ' is-mobile-detail' : ''}`}
        >
          {(!isMobileViewport || mobileNavMode === 'list') && (
            <aside className={`wp-lib-sidebar${isMobileViewport ? ' is-mobile-menu-list' : ''}`}>
              {isMobileViewport
                ? sources.map((s) => {
                    const meta = SOURCE_META[s.id] || { desc: '浏览壁纸', icon: 'Image' };
                    const SourceIcon = Icons[meta.icon] || Icons.Image;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="wp-lib-menu-item"
                        onClick={() => openMobileSource(s.id)}
                      >
                        <span className="wp-lib-menu-icon">
                          <SourceIcon size={18} />
                        </span>
                        <span className="wp-lib-menu-text">
                          <span className="wp-lib-menu-label">{s.name}</span>
                          <span className="wp-lib-menu-desc">{meta.desc}</span>
                        </span>
                        <Icons.ChevronRight size={16} className="wp-lib-menu-chevron" />
                      </button>
                    );
                  })
                : sources.map((s) => (
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
          )}

          {(!isMobileViewport || mobileNavMode === 'detail') && (
          <div className="wp-lib-main" ref={mainScrollRef}>
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
                        {/* 右下角预览；右上角留给选中勾 */}
                        {!isColor && (item.src || item.thumb) && (
                          <span
                            className="wp-lib-preview-btn"
                            role="button"
                            tabIndex={0}
                            title="全屏预览"
                            aria-label="全屏预览"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPreviewItem(item);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                setPreviewItem(item);
                              }
                            }}
                          >
                            <Icons.Maximize2 size={13} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div ref={loadMoreSentinelRef} className="wp-lib-load-sentinel" aria-hidden />
                {loading && (
                  <p className="wp-lib-hint wp-lib-loading-status">
                    {page > 1 ? '加载更多…' : '加载中…'}
                  </p>
                )}
                {!loading && !hasMore && items.length > 0 && (
                  <p className="wp-lib-hint wp-lib-loading-status">已经到底了</p>
                )}
              </>
            )}
          </div>
          )}
        </div>

        <style>{`
          .wp-lib-overlay {
            position: fixed;
            inset: 0;
            z-index: 5000;
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
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 52px;
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            gap: 8px;
          }
          .wp-lib-header-left,
          .wp-lib-header-right {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            z-index: 1;
          }
          .wp-lib-header-right {
            margin-left: auto;
            flex-shrink: 0;
          }
          .wp-lib-header-icon {
            color: rgba(255, 255, 255, 0.85);
            flex-shrink: 0;
          }
          .wp-lib-title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .wp-lib-title-center {
            display: none;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            max-width: min(46%, 200px);
            text-align: center;
            pointer-events: none;
            font-size: 15px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .wp-lib-back-btn {
            display: none;
            align-items: center;
            gap: 0;
            margin: 0;
            padding: 6px 8px 6px 2px;
            border: none;
            border-radius: 10px;
            background: transparent;
            color: rgba(255, 255, 255, 0.88);
            font-size: 15px;
            font-weight: 500;
            line-height: 1;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
          .wp-lib-back-btn svg {
            flex-shrink: 0;
            margin-right: -2px;
          }
          .wp-lib-back-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.08);
          }
          .wp-lib-back-btn:active {
            opacity: 0.75;
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
          .wp-lib-menu-item {
            display: none;
          }
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
            z-index: 2;
            pointer-events: none;
          }
          /* 右下角全屏预览（避开右上角选中勾） */
          .wp-lib-preview-btn {
            position: absolute;
            right: 6px;
            bottom: 6px;
            z-index: 3;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.55);
            color: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            opacity: 0.92;
            cursor: pointer;
            transition: background 0.15s, opacity 0.15s, transform 0.15s;
          }
          .wp-lib-tile:hover .wp-lib-preview-btn,
          .wp-lib-preview-btn:focus-visible {
            opacity: 1;
            background: rgba(0, 0, 0, 0.72);
          }
          .wp-lib-preview-btn:hover {
            transform: scale(1.06);
            background: rgba(59, 130, 246, 0.85);
          }
          /* 须高于 .wp-lib-overlay(5000)，否则库弹窗（含标题栏）会挡住全屏预览 */
          .wp-lib-fullscreen {
            position: fixed;
            inset: 0;
            z-index: 5100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: max(16px, env(safe-area-inset-top, 0px))
              max(16px, env(safe-area-inset-right, 0px))
              max(16px, env(safe-area-inset-bottom, 0px))
              max(16px, env(safe-area-inset-left, 0px));
            background: rgba(0, 0, 0, 0.82);
            backdrop-filter: blur(12px) saturate(1.05);
            -webkit-backdrop-filter: blur(12px) saturate(1.05);
            cursor: zoom-out;
          }
          .wp-lib-fullscreen-close {
            position: absolute;
            top: max(12px, env(safe-area-inset-top, 0px));
            right: max(12px, env(safe-area-inset-right, 0px));
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2;
          }
          .wp-lib-fullscreen-close:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          .wp-lib-fullscreen-stage {
            position: relative;
            max-width: min(1200px, 100%);
            max-height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            cursor: default;
          }
          .wp-lib-fullscreen-media {
            display: block;
            max-width: min(1200px, 100%);
            max-height: min(82dvh, calc(100dvh - 120px));
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
            background: #0a0a0a;
          }
          .wp-lib-load-sentinel {
            width: 100%;
            height: 1px;
            flex-shrink: 0;
          }
          .wp-lib-loading-status {
            width: 100%;
            align-self: stretch;
            display: block;
            text-align: center;
            margin: 0;
            padding: 12px 0 8px;
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
  
        @media (max-width: 768px) {
          .wp-lib-overlay {
            padding: 0;
            align-items: stretch;
            justify-content: stretch;
          }
          .wp-lib-dialog {
            width: 100%;
            height: 100%;
            max-height: none;
            border-radius: 0;
          }
          .wp-lib-header {
            padding: calc(12px + env(safe-area-inset-top, 0px)) 12px 12px;
            min-height: 48px;
          }

          .wp-lib-body {
            flex-direction: column;
          }
          .wp-lib-body.is-mobile-menu .wp-lib-sidebar {
            display: flex;
          }
          .wp-lib-body.is-mobile-detail .wp-lib-sidebar {
            display: none;
          }

          /* 手机：来源列表（对齐全局设置） */
          .wp-lib-sidebar.is-mobile-menu-list {
            width: 100%;
            border-right: none;
            padding: 12px 14px calc(16px + env(safe-area-inset-bottom, 0px));
            gap: 8px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .wp-lib-sidebar.is-mobile-menu-list .wp-lib-source {
            display: none;
          }
          .wp-lib-menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            color: #fff;
            text-align: left;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s, transform 0.15s;
          }
          .wp-lib-menu-item:active {
            transform: scale(0.98);
            background: rgba(255, 255, 255, 0.1);
          }
          .wp-lib-menu-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: rgba(59, 130, 246, 0.22);
            color: #93c5fd;
            flex-shrink: 0;
          }
          .wp-lib-menu-text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          .wp-lib-menu-label {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.2;
          }
          .wp-lib-menu-desc {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.3;
          }
          .wp-lib-menu-chevron {
            flex-shrink: 0;
            color: rgba(255, 255, 255, 0.35);
          }

          .wp-lib-main {
            padding: 12px 14px calc(16px + env(safe-area-inset-bottom, 0px));
          }
          .wp-lib-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 8px;
          }
          .wp-lib-preview-btn {
            opacity: 1;
            width: 30px;
            height: 30px;
          }
          .wp-lib-fullscreen-media {
            max-height: min(78dvh, calc(100dvh - 72px));
          }
          .wp-lib-custom {
            max-width: none;
          }
          .wp-lib-custom-form {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .wp-lib-grid {
            grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
            gap: 6px;
          }
        }

      `}</style>
      </div>
    </div>

      {previewItem && (
        <div
          className="wp-lib-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label="壁纸预览"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewItem(null);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="wp-lib-fullscreen-close"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewItem(null);
            }}
            aria-label="关闭预览"
          >
            <Icons.X size={20} />
          </button>
          <div
            className="wp-lib-fullscreen-stage"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {previewItem.type === 'video' && previewItem.src ? (
              <video
                className="wp-lib-fullscreen-media"
                src={previewItem.src}
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <img
                className="wp-lib-fullscreen-media"
                src={previewItem.src || previewItem.thumb}
                alt={previewItem.title || previewItem.copyright || '壁纸预览'}
              />
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
