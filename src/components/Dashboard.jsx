import React from 'react';
import * as Icons from 'lucide-react';
import ShortcutIcon from './ShortcutIcon';

export default function Dashboard({
  shortcuts,
  activeCategoryId,
  isEditing,
  onDeleteShortcut,
  onEditShortcut,
  onUpdateShortcut,
  onAddShortcutClick,
  settings,
}) {
  const filteredShortcuts = shortcuts.filter(
    (s) => s.categoryId === activeCategoryId
  );

  const getRowHeight = () => {
    switch (settings.iconSize) {
      case 'small': return 82;
      case 'large': return 114;
      default: return 98;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Shortcuts Grid Area */}
      <div
        className="shortcuts-area"
        style={{
          maxWidth: settings.maxWidth === 'none' || !settings.maxWidth ? '100%' : `${settings.maxWidth}px`,
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {/* Shortcuts Grid */}
        <div
          className="shortcuts-grid"
          style={{
            gridTemplateColumns: `repeat(${settings.columns || 6}, minmax(0, 1fr))`,
            gridAutoRows: `${getRowHeight()}px`,
            gap: `${settings.gap || 24}px`,
          }}
        >
          {filteredShortcuts.map((shortcut) => (
            <ShortcutIcon
              key={shortcut.id}
              shortcut={shortcut}
              isEditing={isEditing}
              onDelete={onDeleteShortcut}
              onEditClick={onEditShortcut}
              onUpdate={onUpdateShortcut}
              settings={settings}
            />
          ))}

          {/* Add Shortcut tile (always 1x1) */}
          <div
            className="add-shortcut-tile-wrapper"
            onClick={onAddShortcutClick}
            title="添加快捷方式"
          >
            <div
              className="add-shortcut-tile"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: settings.iconRadius || '16px',
              }}
            >
              <Icons.Plus size={24} />
            </div>
            <span className="add-shortcut-label">添加</span>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          display: flex;
          width: 100%;
          gap: 32px;
          flex: 1;
          align-items: flex-start;
          padding: 0 10px;
        }

        .shortcuts-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .shortcuts-grid {
          display: grid;
          grid-auto-flow: dense;
          align-items: stretch;
          justify-items: stretch;
          width: 100%;
        }

        .add-shortcut-tile-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          width: 100%;
          height: 100%;
          transition: transform 0.2s ease;
        }

        .add-shortcut-tile-wrapper:hover {
          transform: translateY(-4px);
        }

        .add-shortcut-tile {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px dashed rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .add-shortcut-tile-wrapper:hover .add-shortcut-tile {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.6);
          color: #fff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }

        .add-shortcut-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
          white-space: nowrap;
        }


        @media (max-width: 960px) {
          .dashboard-container {
            flex-direction: column;
            align-items: center;
          }

          .widgets-sidebar {
            width: 100%;
            max-width: 560px;
          }

          .shortcuts-area {
            width: 100%;
            max-width: 560px;
          }
        }
      `}</style>
    </div>
  );
}
