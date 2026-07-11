import React from 'react';

function tileTextColor(bgColor) {
  if (!bgColor) return '#fff';
  const clean = bgColor.toLowerCase().trim();
  if (clean === '#ffffff' || clean === '#fff' || clean === 'white') return '#1e293b';
  return '#fff';
}

/** 列表用站点图标：favicon 或字母色块（命令面板 / 搜索建议共用） */
export default function ShortcutListIcon({ shortcut, size = 28 }) {
  const style = { width: size, height: size };
  if (shortcut?.favicon) {
    return (
      <span className="nav-list-icon" style={style}>
        <img src={shortcut.favicon} alt="" className="nav-list-icon-img" />
      </span>
    );
  }
  return (
    <span
      className="nav-list-icon nav-list-icon-letter"
      style={{
        ...style,
        backgroundColor: shortcut?.bgColor || 'rgba(255,255,255,0.12)',
        color: tileTextColor(shortcut?.bgColor),
      }}
    >
      {shortcut?.letter || (shortcut?.name || '?').charAt(0)}
    </span>
  );
}

/** 列表行样式：搜索下拉与命令面板共用 class 名 */
export const NAV_LIST_ITEM_STYLES = `
  .nav-list-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
  }

  .nav-list-icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .nav-list-icon-letter {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
  }

  .nav-list-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    text-align: left;
    cursor: pointer;
    transition: background 0.12s ease;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  /* 只用 is-active，避免键盘选中 A 而鼠标仍悬停 B 时出现「双选中」 */
  .nav-list-item.is-active {
    background: rgba(59, 130, 246, 0.22);
    color: #fff;
  }

  .nav-list-item-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 10px;
  }

  .nav-list-item-title {
    font-size: 13.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    max-width: 45%;
  }

  .nav-list-item-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  }

  .nav-list-section-title {
    padding: 8px 10px 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
  }

  .nav-list-action-icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.85);
  }
`;
