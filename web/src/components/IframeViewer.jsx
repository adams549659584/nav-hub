import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import QuickTooltip from './QuickTooltip';

/** 悬浮窗尺寸：手机 / 小屏 PC（常见 1366×768） */
const DEVICES = [
  { id: 'mobile', label: '手机', width: 375, height: 720, icon: 'Smartphone' },
  { id: 'desktop', label: '电脑', width: 1366, height: 768, icon: 'Monitor' },
];

/**
 * 站内 iframe 悬浮窗；控制条在右侧。
 * 最小化后不卸载 iframe，由父级继续挂载以复用页面状态。
 *
 * 注意：跨域成功加载与被 X-Frame/CSP 拒绝时，浏览器侧都无法可靠区分，
 * 因此「可能禁止嵌入」仅由用户手动打开，避免误挡正常页面。
 */
export default function IframeViewer({
  open,
  url,
  title,
  sessionKey,
  initialDevice = 'desktop',
  onClose,
  onMinimize,
  onDeviceChange,
  /** 是否在 DOM 中保留（最小化时 open=false 仍 keepAlive） */
  keepAlive = false,
}) {
  const [device, setDevice] = useState(
    initialDevice === 'mobile' ? 'mobile' : 'desktop'
  );
  const [loading, setLoading] = useState(true);
  const [showEmbedHint, setShowEmbedHint] = useState(false);

  useEffect(() => {
    if (!open && !keepAlive) return;
    setDevice(initialDevice === 'mobile' ? 'mobile' : 'desktop');
    // 仅会话切换时同步设备，避免最小化/恢复时重置
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  // 切换会话或 URL 时重置加载 / 提示（不自动弹出拦截遮罩）
  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setShowEmbedHint(false);
  }, [sessionKey, url]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Esc 优先最小化（可复用），无最小化回调则关闭
        if (onMinimize) onMinimize();
        else onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onMinimize]);

  if (!url) return null;
  if (!open && !keepAlive) return null;

  const conf = DEVICES.find((d) => d.id === device) || DEVICES[1];

  const switchDevice = (id) => {
    setDevice(id);
    onDeviceChange?.(id);
  };

  return (
    <div
      className={`iframe-viewer-overlay${open ? '' : ' is-hidden'}`}
      role={open ? 'dialog' : undefined}
      aria-modal={open ? true : undefined}
      aria-label={title || '预览'}
      aria-hidden={!open}
      onMouseDown={(e) => {
        if (open && e.target === e.currentTarget) {
          // 点遮罩 = 最小化（可从托盘恢复）
          if (onMinimize) onMinimize();
          else onClose?.();
        }
      }}
    >
      <div className="iframe-viewer-stack">
        <div
          className={`iframe-viewer-window glass-card device-${device}`}
          style={{
            width: `min(${conf.width}px, calc(100vw - 72px))`,
            height: `min(${conf.height}px, calc(100vh - 24px))`,
          }}
        >
          <div className="iframe-viewer-body">
            {open && loading && !showEmbedHint && (
              <div className="iframe-loading">加载中…</div>
            )}
            {open && showEmbedHint && (
              <div className="iframe-embed-hint">
                <Icons.ShieldOff size={22} strokeWidth={1.6} />
                <p className="iframe-embed-hint-title">此站点可能禁止嵌入</p>
                <p className="iframe-embed-hint-desc">
                  若预览为空白或报错，多半是对方安全策略拦截。可新标签打开，或在编辑中改为「新标签页」。
                </p>
                <div className="iframe-embed-hint-actions">
                  <a
                    className="iframe-hint-btn primary"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icons.ExternalLink size={14} />
                    新标签打开
                  </a>
                  <button
                    type="button"
                    className="iframe-hint-btn"
                    onClick={() => setShowEmbedHint(false)}
                  >
                    关闭提示
                  </button>
                  {onClose && (
                    <button
                      type="button"
                      className="iframe-hint-btn"
                      onClick={onClose}
                    >
                      关闭预览
                    </button>
                  )}
                </div>
              </div>
            )}
            <iframe
              // 稳定 key：同 session 不重建，最小化恢复不刷新
              key={sessionKey || url}
              className="iframe-viewer-frame"
              src={url}
              title={title || url}
              onLoad={() => setLoading(false)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {open && (
          <div
            className="iframe-viewer-rail glass-card"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="iframe-viewer-devices" role="group" aria-label="视口模式">
              {DEVICES.map((d) => {
                const Icon = Icons[d.icon] || Icons.Monitor;
                return (
                  <QuickTooltip key={d.id} content={d.label} side="right">
                    <button
                      type="button"
                      className={`iframe-device-btn${device === d.id ? ' is-active' : ''}`}
                      onClick={() => switchDevice(d.id)}
                      aria-label={d.label}
                    >
                      <Icon size={15} />
                    </button>
                  </QuickTooltip>
                );
              })}
            </div>

            <div className="iframe-rail-sep" />

            <QuickTooltip content="新标签打开" side="right">
              <a
                className="iframe-tool-btn"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="新标签打开"
              >
                <Icons.ExternalLink size={15} />
              </a>
            </QuickTooltip>
            <QuickTooltip content="预览空白？" side="right">
              <button
                type="button"
                className={`iframe-tool-btn${showEmbedHint ? ' is-active' : ''}`}
                onClick={() => {
                  setLoading(false);
                  setShowEmbedHint((v) => !v);
                }}
                aria-label="预览空白帮助"
              >
                <Icons.CircleHelp size={15} />
              </button>
            </QuickTooltip>
            {onMinimize && (
              <QuickTooltip content="最小化" side="right">
                <button
                  type="button"
                  className="iframe-tool-btn"
                  onClick={onMinimize}
                  aria-label="最小化"
                >
                  <Icons.Minus size={16} />
                </button>
              </QuickTooltip>
            )}
            <QuickTooltip content="关闭" side="right">
              <button
                type="button"
                className="iframe-tool-btn"
                onClick={onClose}
                aria-label="关闭"
              >
                <Icons.X size={16} />
              </button>
            </QuickTooltip>
          </div>
        )}
      </div>

      <style>{`
        .iframe-viewer-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.4);
          -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
          animation: iframeFade 0.15s ease;
        }

        .iframe-viewer-overlay.is-hidden {
          /* 保留 iframe 挂载，移出视口且不可点 */
          position: fixed;
          width: 0;
          height: 0;
          padding: 0;
          margin: 0;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
          animation: none;
          -webkit-backdrop-filter: none;
          backdrop-filter: none;
          background: transparent;
        }

        @keyframes iframeFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .iframe-viewer-stack {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          max-width: 100%;
          max-height: 100%;
        }

        .iframe-viewer-overlay:not(.is-hidden) .iframe-viewer-stack {
          animation: iframePop 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes iframePop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .iframe-viewer-window {
          display: flex;
          flex-direction: column;
          max-width: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 56px rgba(0, 0, 0, 0.5);
          transition: width 0.28s cubic-bezier(0.22, 1, 0.36, 1),
            height 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .iframe-viewer-window.device-mobile {
          border-radius: 22px;
        }

        .iframe-viewer-body {
          position: relative;
          flex: 1;
          width: 100%;
          height: 100%;
          min-height: 0;
          background: #111;
        }

        .iframe-viewer-frame {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          background: #fff;
        }

        .iframe-loading {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(12, 14, 20, 0.88);
          color: rgba(255, 255, 255, 0.55);
          font-size: 12.5px;
          pointer-events: none;
        }

        .iframe-embed-hint {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px 20px;
          text-align: center;
          background: rgba(12, 14, 20, 0.92);
          color: rgba(255, 255, 255, 0.88);
        }

        .iframe-embed-hint-title {
          margin: 4px 0 0;
          font-size: 14px;
          font-weight: 600;
        }

        .iframe-embed-hint-desc {
          margin: 0;
          max-width: 280px;
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.55);
        }

        .iframe-embed-hint-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }

        .iframe-hint-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          font-size: 12.5px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s;
        }

        .iframe-hint-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .iframe-hint-btn.primary {
          background: rgba(59, 130, 246, 0.55);
          border-color: rgba(59, 130, 246, 0.45);
        }

        .iframe-hint-btn.primary:hover {
          background: rgba(59, 130, 246, 0.75);
        }

        .iframe-viewer-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
          flex-shrink: 0;
        }

        .iframe-viewer-devices {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .iframe-rail-sep {
          width: 16px;
          height: 1px;
          margin: 4px 0;
          background: rgba(255, 255, 255, 0.12);
        }

        .iframe-device-btn,
        .iframe-tool-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s;
        }

        .iframe-device-btn:hover,
        .iframe-tool-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
        }

        .iframe-device-btn.is-active,
        .iframe-tool-btn.is-active {
          color: #fff;
          background: rgba(59, 130, 246, 0.5);
        }

        @media (max-width: 768px) {
          .iframe-viewer-overlay:not(.is-hidden) {
            padding: 0;
            align-items: stretch;
            justify-content: stretch;
          }

          .iframe-viewer-overlay:not(.is-hidden) .iframe-viewer-stack {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            flex-direction: column;
            gap: 0;
          }

          .iframe-viewer-window {
            width: 100% !important;
            height: 100% !important;
            max-width: 100%;
            max-height: 100%;
            border-radius: 0;
            flex: 1;
          }

          .iframe-viewer-window.device-mobile {
            width: 100% !important;
            height: 100% !important;
            max-width: 100%;
            border-radius: 0;
          }

          .iframe-viewer-header,
          .iframe-viewer-toolbar,
          .iframe-side-rail {
            padding-left: calc(8px + var(--safe-left, 0px));
            padding-right: calc(8px + var(--safe-right, 0px));
          }

          .iframe-viewer-header {
            padding-top: calc(8px + var(--safe-top, 0px));
          }
        }

      `}</style>
    </div>
  );
}
