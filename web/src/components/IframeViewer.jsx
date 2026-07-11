import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';

/** 悬浮窗尺寸：手机 / 小屏 PC（常见 1366×768） */
const DEVICES = [
  { id: 'mobile', label: '手机', width: 375, height: 720, icon: 'Smartphone' },
  { id: 'desktop', label: '电脑', width: 1366, height: 768, icon: 'Monitor' },
];

/**
 * 站内 iframe 悬浮窗；控制条贴在窗口右侧，不占预览高度。
 */
export default function IframeViewer({
  open,
  url,
  title,
  initialDevice = 'desktop',
  onClose,
  onDeviceChange,
}) {
  const [device, setDevice] = useState(initialDevice || 'desktop');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    // 兼容旧数据 tablet → desktop
    setDevice(initialDevice === 'mobile' ? 'mobile' : 'desktop');
    setLoading(true);
  }, [open, url, initialDevice]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !url) return null;

  const conf = DEVICES.find((d) => d.id === device) || DEVICES[1];

  const switchDevice = (id) => {
    setDevice(id);
    onDeviceChange?.(id);
  };

  return (
    <div
      className="iframe-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title || '预览'}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="iframe-viewer-stack">
        <div
          className={`iframe-viewer-window glass-card device-${device}`}
          style={{
            width: `min(${conf.width}px, calc(100vw - 72px))`,
            height: `min(${conf.height}px, calc(100vh - 24px))`,
          }}
          title={title || url}
        >
          <div className="iframe-viewer-body">
            {loading && <div className="iframe-loading">加载中…</div>}
            <iframe
              key={url}
              className="iframe-viewer-frame"
              src={url}
              title={title || url}
              onLoad={() => setLoading(false)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* 控制条贴窗口右侧，纵向排列，不占高度 */}
        <div className="iframe-viewer-rail glass-card" onMouseDown={(e) => e.stopPropagation()}>
          <div className="iframe-viewer-devices" role="group" aria-label="视口模式">
            {DEVICES.map((d) => {
              const Icon = Icons[d.icon] || Icons.Monitor;
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`iframe-device-btn${device === d.id ? ' is-active' : ''}`}
                  onClick={() => switchDevice(d.id)}
                  title={d.label}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>

          <div className="iframe-rail-sep" />

          <a
            className="iframe-tool-btn"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="新标签打开"
          >
            <Icons.ExternalLink size={15} />
          </a>
          <button type="button" className="iframe-tool-btn" onClick={onClose} title="关闭 (Esc)">
            <Icons.X size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .iframe-viewer-overlay {
          position: fixed;
          inset: 0;
          z-index: 220;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.4);
          -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
          animation: iframeFade 0.15s ease;
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

        /* 右侧竖条：仅占宽度，不占预览高度 */
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

        .iframe-device-btn.is-active {
          color: #fff;
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
