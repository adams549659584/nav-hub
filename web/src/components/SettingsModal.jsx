import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { SEARCH_ENGINES } from '../utils/defaultData';
import WallpaperLibrary from './WallpaperLibrary';
import {
  applyWallpaperSelection,
  normalizeWallpaperSettings,
  updateWallpaperField,
} from '../utils/wallpaper';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) {
  const [activeTab, setActiveTab] = useState('wallpaper');
  const [wpLibOpen, setWpLibOpen] = useState(false);

  if (!isOpen) return null;

  const normalized = normalizeWallpaperSettings(settings);
  const wp = normalized.wallpaper;

  const updateSetting = (key, value) => {
    if (key === 'bgBlur') {
      onUpdateSettings(updateWallpaperField(settings, { blur: value }));
      return;
    }
    if (key === 'bgBrightness') {
      onUpdateSettings(updateWallpaperField(settings, { brightness: value }));
      return;
    }
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="header-title">
            <Icons.Settings size={18} />
            <span>全局设置</span>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <Icons.X size={20} />
          </button>
        </div>

        {/* Inner container */}
        <div className="drawer-inner">
          {/* Tab Sidebar */}
          <div className="drawer-tabs">
            <button
              className={`tab-btn ${activeTab === 'wallpaper' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallpaper')}
            >
              <Icons.Image size={16} />
              <span>壁纸设置</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
              onClick={() => setActiveTab('layout')}
            >
              <Icons.LayoutGrid size={16} />
              <span>布局样式</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'widgets' ? 'active' : ''}`}
              onClick={() => setActiveTab('widgets')}
            >
              <Icons.ToggleLeft size={16} />
              <span>功能开关</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="drawer-pane">
            {/* WALLPAPER PANE */}
            {activeTab === 'wallpaper' && (
              <div className="pane-section animate-fade">
                <h4>当前壁纸</h4>
                <div className="wp-current-row">
                  <div
                    className="wp-current-preview"
                    style={
                      wp.type === 'color' || (wp.src || '').startsWith('#')
                        ? { backgroundColor: wp.src }
                        : {
                            backgroundImage: `url(${wp.thumb || wp.src})`,
                            backgroundColor: '#111',
                          }
                    }
                  >
                    {wp.type === 'video' && (
                      <span className="wp-current-video">
                        <Icons.Play size={14} /> 动态
                      </span>
                    )}
                  </div>
                  <div className="wp-current-meta">
                    <div className="wp-current-title">{wp.title || '未命名壁纸'}</div>
                    <div className="wp-current-source">
                      来源：{wp.source || '—'}
                      {wp.type === 'video' ? ' · 视频' : ''}
                    </div>
                    <div className="wp-current-actions">
                      <button type="button" className="glass-btn" onClick={() => setWpLibOpen(true)}>
                        <Icons.Images size={14} />
                        更换壁纸
                      </button>
                      {wp.src && wp.type !== 'color' && !(wp.src || '').startsWith('data:') && (
                        <a
                          className="glass-btn"
                          href={wp.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Icons.Download size={14} />
                          下载
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <h4 style={{ marginTop: '24px' }}>视觉效果</h4>
                <div className="setting-slider-group">
                  <div className="slider-item">
                    <div className="slider-label">
                      <span>遮罩浓度</span>
                      <span>{Math.round((wp.mask ?? 0.15) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={Math.round((wp.mask ?? 0.15) * 100)}
                      onChange={(e) =>
                        onUpdateSettings(
                          updateWallpaperField(settings, { mask: parseInt(e.target.value, 10) / 100 })
                        )
                      }
                      className="setting-range"
                    />
                  </div>
                  <div className="slider-item" style={{ marginTop: '14px' }}>
                    <div className="slider-label">
                      <span>背景模糊</span>
                      <span>{wp.blur ?? settings.bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={wp.blur ?? settings.bgBlur ?? 0}
                      onChange={(e) => updateSetting('bgBlur', parseInt(e.target.value, 10))}
                      className="setting-range"
                    />
                  </div>
                  <div className="slider-item" style={{ marginTop: '14px' }}>
                    <div className="slider-label">
                      <span>背景亮度</span>
                      <span>{wp.brightness ?? settings.bgBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={wp.brightness ?? settings.bgBrightness ?? 80}
                      onChange={(e) => updateSetting('bgBrightness', parseInt(e.target.value, 10))}
                      className="setting-range"
                    />
                  </div>
                </div>

                {wp.source === 'bing' && (
                  <label className="wp-auto-daily" style={{ marginTop: 20 }}>
                    <input
                      type="checkbox"
                      checked={!!wp.autoDaily}
                      onChange={(e) =>
                        onUpdateSettings(
                          updateWallpaperField(settings, { autoDaily: e.target.checked })
                        )
                      }
                    />
                    <span>自动使用必应每日壁纸（打开页面时刷新）</span>
                  </label>
                )}
              </div>
            )}

            {/* LAYOUT PANE */}
            {activeTab === 'layout' && (
              <div className="pane-section animate-fade">
                <h4>图标形状 (圆角)</h4>
                <div className="select-buttons-row">
                  {[
                    { radius: '0px', label: '直角' },
                    { radius: '8px', label: '小圆角' },
                    { radius: '16px', label: '中圆角' },
                    { radius: '20px', label: '大圆角' },
                    { radius: '50%', label: '圆形' }
                  ].map((shape) => (
                    <button
                      key={shape.radius}
                      className={`select-option-btn ${settings.iconRadius === shape.radius ? 'active' : ''}`}
                      onClick={() => updateSetting('iconRadius', shape.radius)}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>

                 <h4 style={{ marginTop: '20px' }}>网格列数</h4>
                <div className="slider-item">
                  <div className="slider-label">
                    <span>主网格列数</span>
                    <span>{settings.columns || 6} 列</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    value={settings.columns || 6}
                    onChange={(e) => updateSetting('columns', parseInt(e.target.value))}
                    className="setting-range"
                  />
                </div>

                <h4 style={{ marginTop: '20px' }}>图标间距</h4>
                <div className="slider-item">
                  <div className="slider-label">
                    <span>间距大小</span>
                    <span>{settings.gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="64"
                    value={settings.gap}
                    onChange={(e) => updateSetting('gap', parseInt(e.target.value))}
                    className="setting-range"
                  />
                </div>

                <h4 style={{ marginTop: '20px' }}>布局最大宽度</h4>
                <div className="slider-item">
                  <div className="slider-label">
                    <span>最大宽度</span>
                    <span>{settings.maxWidth === 'none' || !settings.maxWidth ? '不限 (满屏)' : `${settings.maxWidth}px`}</span>
                  </div>
                  <input
                    type="range"
                    min="600"
                    max="1600"
                    step="50"
                    value={settings.maxWidth === 'none' || !settings.maxWidth ? 1600 : settings.maxWidth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateSetting('maxWidth', val === 1600 ? 'none' : val);
                    }}
                    className="setting-range"
                  />
                  <div className="range-presets-row">
                    {[
                      { value: 960, label: '窄版 (960px)' },
                      { value: 1200, label: '中等 (1200px)' },
                      { value: 1440, label: '宽版 (1440px)' },
                      { value: 1600, label: '不限 (满屏)' }
                    ].map((p) => {
                      const isActive = (p.value === 1600 && (settings.maxWidth === 'none' || !settings.maxWidth)) || (settings.maxWidth === p.value);
                      return (
                        <button
                          key={p.value}
                          type="button"
                          className={`range-preset-pill ${isActive ? 'active' : ''}`}
                          onClick={() => updateSetting('maxWidth', p.value === 1600 ? 'none' : p.value)}
                        >
                          {p.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <h4 style={{ marginTop: '20px' }}>默认搜索引擎</h4>
                <div className="select-buttons-row select-grid-2">
                  {SEARCH_ENGINES.map((engine) => (
                    <button
                      key={engine.id}
                      className={`select-option-btn ${settings.searchEngine === engine.id ? 'active' : ''}`}
                      onClick={() => updateSetting('searchEngine', engine.id)}
                    >
                      {engine.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FEATURES PANE */}
            {activeTab === 'widgets' && (
              <div className="pane-section animate-fade">
                <h4>功能开关</h4>
                <div className="toggle-list">
                  {[
                    { key: 'showCalendar', label: '显示顶部时钟 (Show Top Clock)' },
                    { key: 'showQuote', label: '显示底部一言 (Show Bottom Quote)' },
                    { key: 'showSuggestions', label: '显示搜索词推荐 (Show Search Suggestions)' }
                  ].map((item) => (
                    <div key={item.key} className="toggle-row">
                      <span>{item.label}</span>
                      <button
                        className={`toggle-switch ${settings[item.key] !== false ? 'on' : 'off'}`}
                        onClick={() => updateSetting(item.key, settings[item.key] !== false ? false : true)}
                      >
                        <div className="switch-handle" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <WallpaperLibrary
        isOpen={wpLibOpen}
        onClose={() => setWpLibOpen(false)}
        current={wp}
        onSelect={(item) => onUpdateSettings(applyWallpaperSelection(settings, item))}
        onApplyCustom={(url) =>
          onUpdateSettings(
            applyWallpaperSelection(settings, {
              id: 'custom-url',
              source: 'custom',
              type: 'image',
              src: url,
              thumb: url,
              title: '自定义 URL',
            })
          )
        }
      />

      <style>{`
        .wp-current-row {
          display: flex;
          gap: 14px;
          align-items: stretch;
        }
        .wp-current-preview {
          width: 160px;
          height: 90px;
          border-radius: 10px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        .wp-current-video {
          position: absolute;
          left: 8px;
          bottom: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          background: rgba(0,0,0,0.55);
          color: #fff;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .wp-current-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .wp-current-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wp-current-source {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
        }
        .wp-current-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
        }
        .wp-current-actions .glass-btn {
          text-decoration: none;
          font-size: 12px;
          padding: 6px 10px;
        }
        .wp-auto-daily {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
        }
        .wp-auto-daily input { accent-color: #3b82f6; }

        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          justify-content: flex-end;
          z-index: 100;
          animation: fadeIn 0.25s ease;
        }

        .drawer-content {
          width: 580px;
          height: 100%;
          border-radius: 16px 0 0 16px;
          border-right: none;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .drawer-close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
        }

        .drawer-close-btn:hover {
          color: white;
        }

        .drawer-inner {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .drawer-tabs {
          width: 140px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 20px 8px;
          background: rgba(0, 0, 0, 0.15);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          width: 100%;
          padding: 10px 12px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          text-align: left;
        }

        .tab-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .tab-btn.active {
          color: white;
          background: rgba(59, 130, 246, 0.25);
          font-weight: 500;
        }

        .drawer-pane {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .pane-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
          border-left: 3px solid #3b82f6;
          padding-left: 8px;
        }

        .setting-slider-group {
          display: flex;
          flex-direction: column;
        }

        .slider-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .range-presets-row {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          gap: 6px;
        }

        .range-preset-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
        }

        .range-preset-pill:hover {
          color: white;
          background: rgba(255, 255, 255, 0.12);
        }

        .range-preset-pill.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.35);
        }

        .setting-range {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
        }

        .setting-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          transition: transform 0.1s;
        }

        .setting-range::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        /* Select Button configs */
        .select-buttons-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .select-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .select-option-btn {
          flex: 1;
          min-width: 60px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          padding: 8px 12px;
          font-size: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .select-option-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .select-option-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          font-weight: 500;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
        }

        /* Switch toggles */
        .toggle-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
        }

        .toggle-switch {
          width: 44px;
          height: 22px;
          border-radius: 11px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background-color 0.25s;
          padding: 2px;
        }

        .toggle-switch.on {
          background: #10b981;
        }

        .toggle-switch.off {
          background: rgba(255, 255, 255, 0.2);
        }

        .switch-handle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .toggle-switch.on .switch-handle {
          transform: translateX(22px);
        }

        .toggle-switch.off .switch-handle {
          transform: translateX(0);
        }

        .animate-fade {
          animation: fadeIn 0.25s ease;
        }
      `}</style>
    </div>
  );
}
