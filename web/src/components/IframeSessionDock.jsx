import React from 'react';
import * as Icons from 'lucide-react';

/**
 * 已最小化的站内预览托盘：点击恢复，可单独关闭。
 */
export default function IframeSessionDock({ sessions = [], onRestore, onClose }) {
  if (!sessions.length) return null;

  return (
    <div className="iframe-dock" role="region" aria-label="已最小化的预览">
      <div className="iframe-dock-label">
        <Icons.Layers size={12} />
        <span>预览</span>
      </div>
      <div className="iframe-dock-list">
        {sessions.map((s) => (
          <div key={s.key} className="iframe-dock-item glass-card">
            <button
              type="button"
              className="iframe-dock-main"
              onClick={() => onRestore?.(s.key)}
              title={`恢复：${s.title || s.url}`}
            >
              <span className="iframe-dock-icon" aria-hidden>
                {s.device === 'mobile' ? (
                  <Icons.Smartphone size={13} />
                ) : (
                  <Icons.Monitor size={13} />
                )}
              </span>
              <span className="iframe-dock-title">{s.title || s.url}</span>
            </button>
            <button
              type="button"
              className="iframe-dock-close"
              onClick={() => onClose?.(s.key)}
              title="关闭"
            >
              <Icons.X size={12} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .iframe-dock {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 210;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          max-width: min(280px, calc(100vw - 32px));
          pointer-events: none;
        }

        .iframe-dock-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.45);
          font-size: 10.5px;
          pointer-events: none;
        }

        .iframe-dock-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          pointer-events: auto;
        }

        .iframe-dock-item {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px 4px 4px 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          animation: dockIn 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes dockIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .iframe-dock-main {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .iframe-dock-main:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .iframe-dock-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: rgba(59, 130, 246, 0.25);
          color: rgba(255, 255, 255, 0.85);
        }

        .iframe-dock-title {
          font-size: 12.5px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .iframe-dock-close {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.15s;
        }

        .iframe-dock-close:hover {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.15);
        }
      `}</style>
    </div>
  );
}
