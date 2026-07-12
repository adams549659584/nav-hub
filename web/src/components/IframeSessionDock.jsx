import React from 'react';
import * as Icons from 'lucide-react';
import QuickTooltip from './QuickTooltip';
import ShortcutListIcon from './ShortcutListIcon';

/**
 * 已最小化的站内预览托盘：窄条 + 站点图标；超过 5 条可滚动。
 */
export default function IframeSessionDock({ sessions = [], onRestore, onClose }) {
  if (!sessions.length) return null;

  return (
    <div className="iframe-dock" role="region" aria-label="已最小化的站内预览">
      <div className="iframe-dock-label">
        <Icons.Layers size={12} />
        <span>站内预览</span>
        {sessions.length > 1 && (
          <span className="iframe-dock-count">{sessions.length}</span>
        )}
      </div>
      <div className="iframe-dock-list">
        {sessions.map((s) => {
          const label = s.title || s.url || '未命名';
          return (
            <div key={s.key} className="iframe-dock-item glass-card">
              <QuickTooltip content={`恢复：${label}`}>
                <button
                  type="button"
                  className="iframe-dock-main"
                  onClick={() => onRestore?.(s.key)}
                  aria-label={`恢复：${label}`}
                >
                  <ShortcutListIcon
                    shortcut={{
                      favicon: s.favicon,
                      letter: s.letter,
                      bgColor: s.bgColor,
                      name: s.title,
                    }}
                    size={22}
                  />
                  <span className="iframe-dock-title">{label}</span>
                </button>
              </QuickTooltip>
              <QuickTooltip content="关闭预览">
                <button
                  type="button"
                  className="iframe-dock-close"
                  onClick={() => onClose?.(s.key)}
                  aria-label="关闭预览"
                >
                  <Icons.X size={12} />
                </button>
              </QuickTooltip>
            </div>
          );
        })}
      </div>

      <style>{`
        .iframe-dock {
          position: fixed;
          right: calc(12px + var(--safe-right, 0px));
          bottom: calc(12px + var(--safe-bottom, 0px));
          z-index: 80;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 6px;
          width: min(168px, calc(100vw - 32px));
          pointer-events: none;
        }

        .iframe-dock-label {
          display: inline-flex;
          align-items: center;
          align-self: flex-end;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.45);
          font-size: 10.5px;
          pointer-events: none;
          flex-shrink: 0;
        }

        .iframe-dock-count {
          min-width: 1.1em;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.35);
          color: rgba(255, 255, 255, 0.85);
          font-size: 10px;
          font-weight: 600;
          line-height: 1.5;
          text-align: center;
        }

        /* 单条约 38px + gap 5px → 5 条约 210px，超出滚动 */
        .iframe-dock-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 100%;
          max-height: calc(5 * 38px + 4 * 5px);
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          pointer-events: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
        }

        .iframe-dock-list::-webkit-scrollbar {
          width: 4px;
        }

        .iframe-dock-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.22);
          border-radius: 999px;
        }

        .iframe-dock-item {
          display: flex;
          align-items: center;
          gap: 0;
          width: 100%;
          height: 38px;
          min-width: 0;
          box-sizing: border-box;
          padding: 3px 3px 3px 5px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.32);
          animation: dockIn 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          flex-shrink: 0;
        }

        @keyframes dockIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .iframe-dock-main {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          overflow: hidden;
        }

        .iframe-dock-main:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .iframe-dock-main .nav-list-icon {
          flex-shrink: 0;
          border-radius: 6px;
        }

        .iframe-dock-title {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .iframe-dock-close {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.15s;
        }

        .iframe-dock-close:hover {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.15);
        }

        @media (max-width: 768px) {
          .iframe-dock {
            right: calc(10px + var(--safe-right, 0px));
            bottom: calc(10px + var(--safe-bottom, 0px));
            left: calc(10px + var(--safe-left, 0px));
            width: auto;
            max-width: none;
          }

          .iframe-dock-list {
            max-height: min(40vh, 220px);
          }
        }

      `}</style>
    </div>
  );
}
