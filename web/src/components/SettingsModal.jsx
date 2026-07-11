import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { SEARCH_ENGINES } from '../utils/defaultData';
import WallpaperLibrary from './WallpaperLibrary';
import { changeAdminPassword } from '../utils/api';
import {
  applyWallpaperSelection,
  downloadWallpaperFile,
  normalizeWallpaperSettings,
  updateWallpaperField,
} from '../utils/wallpaper';
import PasswordInput from './PasswordInput';
import SearchEngineIcon from './SearchEngineIcon';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) {
  const [activeTab, setActiveTab] = useState('wallpaper');
  const [wpLibOpen, setWpLibOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState('');

  if (!isOpen) return null;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdOk('');
    if (newPassword.length < 6) {
      setPwdError('新密码至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('两次输入的新密码不一致');
      return;
    }
    setPwdBusy(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setPwdOk('密码已更新，当前登录仍然有效');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.message || '修改失败');
    } finally {
      setPwdBusy(false);
    }
  };

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
              className={`tab-btn ${activeTab === 'site' ? 'active' : ''}`}
              onClick={() => setActiveTab('site')}
            >
              <Icons.Sparkles size={16} />
              <span>站点品牌</span>
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
            <button
              className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <Icons.KeyRound size={16} />
              <span>账号</span>
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
                        <button
                          type="button"
                          className="glass-btn"
                          onClick={() => downloadWallpaperFile(wp.src, wp.title || 'wallpaper')}
                        >
                          <Icons.Download size={14} />
                          下载
                        </button>
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

            {/* SITE / BRAND PANE */}
            {activeTab === 'site' && (
              <div className="pane-section animate-fade">
                <h4>页面标签标题</h4>
                <p className="site-field-hint">浏览器标签页上显示的文字</p>
                <input
                  type="text"
                  className="glass-input"
                  value={settings.siteTitle ?? ''}
                  maxLength={40}
                  placeholder="导航页"
                  onChange={(e) => updateSetting('siteTitle', e.target.value)}
                />

                <h4 style={{ marginTop: 22 }}>页面描述</h4>
                <p className="site-field-hint">用于 SEO / 分享预览的 meta description</p>
                <textarea
                  className="glass-input site-description-input"
                  value={settings.siteDescription ?? ''}
                  maxLength={160}
                  rows={3}
                  placeholder="一个高颜值、极简、无广告的卡片式导航页。"
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                />

                <h4 style={{ marginTop: 22 }}>侧栏 Logo 文字</h4>
                <p className="site-field-hint">左上角圆形标识内的文字（建议 1～3 个字符）</p>
                <div className="site-logo-row">
                  <input
                    type="text"
                    className="glass-input site-logo-text-input"
                    value={settings.logoText ?? ''}
                    maxLength={4}
                    placeholder="iT"
                    onChange={(e) => updateSetting('logoText', e.target.value)}
                  />
                  <div
                    className="site-logo-preview"
                    style={{
                      background: `linear-gradient(135deg, ${
                        settings.logoBgColor || '#535353'
                      }, ${settings.logoBgColorEnd || settings.logoBgColor || '#000000'})`,
                    }}
                    title="预览"
                  >
                    {(settings.logoText || 'iT').slice(0, 4)}
                  </div>
                </div>

                <h4 style={{ marginTop: 22 }}>侧栏 Logo 背景色</h4>
                <p className="site-field-hint">渐变起止色，可设为相同得到纯色</p>
                <div className="site-color-row">
                  <label className="site-color-field">
                    <span>起始色</span>
                    <input
                      type="color"
                      value={settings.logoBgColor || '#535353'}
                      onChange={(e) => updateSetting('logoBgColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="glass-input site-color-hex"
                      value={settings.logoBgColor || '#535353'}
                      maxLength={7}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) || v === '') {
                          updateSetting('logoBgColor', v || '#535353');
                        } else {
                          updateSetting('logoBgColor', v);
                        }
                      }}
                    />
                  </label>
                  <label className="site-color-field">
                    <span>结束色</span>
                    <input
                      type="color"
                      value={settings.logoBgColorEnd || settings.logoBgColor || '#000000'}
                      onChange={(e) => updateSetting('logoBgColorEnd', e.target.value)}
                    />
                    <input
                      type="text"
                      className="glass-input site-color-hex"
                      value={settings.logoBgColorEnd || settings.logoBgColor || '#000000'}
                      maxLength={7}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        updateSetting('logoBgColorEnd', v);
                      }}
                    />
                  </label>
                </div>
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
                      className={`select-option-btn engine-option-btn ${settings.searchEngine === engine.id ? 'active' : ''}`}
                      onClick={() => updateSetting('searchEngine', engine.id)}
                    >
                      <SearchEngineIcon id={engine.id} size={16} />
                      <span>{engine.name}</span>
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

            {activeTab === 'account' && (
              <div className="pane-section animate-fade">
                <h4>修改管理员密码</h4>
                <p className="site-field-hint">
                  修改后当前会话保持登录；下次请使用新密码。环境变量 ADMIN_PASSWORD 仅用于首次初始化。
                </p>
                <form className="account-pwd-form" onSubmit={handleChangePassword}>
                  <label className="account-pwd-field">
                    <span>当前密码</span>
                    <PasswordInput
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <label className="account-pwd-field">
                    <span>新密码</span>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </label>
                  <label className="account-pwd-field">
                    <span>确认新密码</span>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </label>
                  {pwdError && <p className="account-pwd-error">{pwdError}</p>}
                  {pwdOk && <p className="account-pwd-ok">{pwdOk}</p>}
                  <button
                    type="submit"
                    className="glass-btn account-pwd-submit"
                    disabled={pwdBusy}
                  >
                    {pwdBusy ? '保存中…' : '更新密码'}
                  </button>
                </form>
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

        .site-field-hint {
          margin: -6px 0 10px;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.4);
        }

        .account-pwd-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 320px;
        }

        .account-pwd-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
        }

        .account-pwd-error {
          margin: 0;
          font-size: 12px;
          color: #fca5a5;
        }

        .account-pwd-ok {
          margin: 0;
          font-size: 12px;
          color: #86efac;
        }

        .account-pwd-submit {
          align-self: flex-start;
          margin-top: 4px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-color: transparent;
          color: #fff;
          padding: 8px 16px;
          font-size: 13px;
          cursor: pointer;
        }

        .account-pwd-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .site-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .site-logo-text-input {
          flex: 1;
          max-width: 160px;
        }

        .site-logo-preview {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          white-space: nowrap;
          padding: 0 2px;
        }

        .site-color-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .site-color-field {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.65);
        }

        .site-color-field input[type='color'] {
          width: 36px;
          height: 28px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          background: none;
          cursor: pointer;
        }

        .site-color-hex {
          width: 96px;
          font-size: 12px;
          font-family: ui-monospace, monospace;
        }

        .site-description-input {
          width: 100%;
          resize: vertical;
          min-height: 72px;
          line-height: 1.45;
          font-family: inherit;
        }

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

        .engine-option-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .engine-option-btn svg {
          flex-shrink: 0;
          display: block;
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
