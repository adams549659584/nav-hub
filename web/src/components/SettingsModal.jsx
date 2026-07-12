import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { DEFAULT_SETTINGS, SEARCH_ENGINES } from '../utils/defaultData';
import WallpaperLibrary from './WallpaperLibrary';
import { changeAdminPassword } from '../utils/api';
import {
  applyWallpaperSelection,
  downloadWallpaperFile,
  normalizeWallpaperSettings,
  updateWallpaperField,
} from '../utils/wallpaper';
import {
  buildBackupPayload,
  buildClearedConfig,
  downloadBackup,
  parseBackupFile,
} from '../utils/backup';
import PasswordInput from './PasswordInput';
import SearchEngineIcon from './SearchEngineIcon';


const SETTINGS_TABS = [
  { id: 'wallpaper', label: '壁纸设置', desc: '壁纸库、模糊与亮度', icon: 'Image' },
  { id: 'site', label: '站点品牌', desc: '标题、描述与 Logo', icon: 'Sparkles' },
  { id: 'layout', label: '布局样式', desc: '网格、图标与搜索引擎', icon: 'LayoutGrid' },
  { id: 'widgets', label: '功能开关', desc: '日历、一言与联想', icon: 'ToggleLeft' },
  { id: 'data', label: '数据', desc: '备份、还原与清空', icon: 'Database' },
  { id: 'account', label: '账号', desc: '修改管理员密码', icon: 'KeyRound' },
];

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  categories = [],
  shortcuts = [],
  onUpdateSettings,
  onRestoreConfig,
  onConfirmRestore,
}) {
  const [activeTab, setActiveTab] = useState('wallpaper');
  /** 移动端：list=设置首页列表，detail=某一分类内容（类 iOS 设置） */
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

  // 仅在设置从关→开时重置手机列表；不要依赖 isMobileViewport
  //（打开壁纸库等全屏层时滚动条变化会触发 matchMedia，误把 detail 打回 list）
  const wasSettingsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasSettingsOpenRef.current) {
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
        setMobileNavMode('list');
      }
    }
    wasSettingsOpenRef.current = isOpen;
  }, [isOpen]);

  const openMobileSection = useCallback((tabId) => {
    setActiveTab(tabId);
    setMobileNavMode('detail');
  }, []);

  const backToMobileList = useCallback(() => {
    if (Date.now() < ignoreSettingsNavUntilRef.current) return;
    setMobileNavMode('list');
  }, []);

  const activeTabMeta = SETTINGS_TABS.find((tab) => tab.id === activeTab) || SETTINGS_TABS[0];

  const [wpLibOpen, setWpLibOpen] = useState(false);
  const [wpLibInstanceKey, setWpLibInstanceKey] = useState(0);
  const [wpPreviewOpen, setWpPreviewOpen] = useState(false);
  /** 壁纸库刚关闭后的短时间内忽略返回/关设置，防止移动端点穿 */
  const ignoreSettingsNavUntilRef = useRef(0);
  const prevWpLibOpenRef = useRef(false);

  // 设置关闭时一并收起壁纸库/预览，避免下次状态残留
  useEffect(() => {
    if (!isOpen) {
      setWpLibOpen(false);
      setWpPreviewOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (prevWpLibOpenRef.current && !wpLibOpen) {
      // 库从开→关：吞掉同一手势落到设置「返回/遮罩」上的残余点击
      ignoreSettingsNavUntilRef.current = Date.now() + 500;
    }
    prevWpLibOpenRef.current = wpLibOpen;
  }, [wpLibOpen]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [backupOk, setBackupOk] = useState('');
  const backupInputRef = useRef(null);

  useEffect(() => {
    if (!wpPreviewOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setWpPreviewOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [wpPreviewOpen]);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    setBackupError('');
    setBackupOk('');
    try {
      const payload = buildBackupPayload({ categories, shortcuts, settings });
      downloadBackup(payload);
      setBackupOk('备份已下载');
    } catch (err) {
      setBackupError(err.message || '导出失败');
    }
  };

  const handleBackupFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setBackupError('');
    setBackupOk('');
    if (!file) return;

    let cfg;
    try {
      cfg = await parseBackupFile(file);
    } catch (err) {
      setBackupError(err.message || '解析失败');
      return;
    }

    const catN = cfg.categories.length;
    const scN = cfg.shortcuts.length;
    const runRestore = () => {
      setBackupBusy(true);
      setBackupError('');
      setBackupOk('');
      Promise.resolve(onRestoreConfig?.(cfg))
        .then(() => {
          setBackupOk(
            `已还原：${catN} 个分类、${scN} 个快捷方式及全局设置`
          );
        })
        .catch((err) => {
          setBackupError(err?.message || '还原失败');
        })
        .finally(() => setBackupBusy(false));
    };

    if (onConfirmRestore) {
      onConfirmRestore({
        title: '从备份还原',
        message: `将用备份全量覆盖当前数据（${catN} 个分类、${scN} 个快捷方式及设置）。此操作不可撤销，建议先导出当前备份。`,
        confirmText: '确认还原',
        onConfirm: runRestore,
      });
    } else {
      runRestore();
    }
  };

  const handleClearData = () => {
    setBackupError('');
    setBackupOk('');
    const cfg = buildClearedConfig(categories, DEFAULT_SETTINGS);
    const runClear = () => {
      setBackupBusy(true);
      setBackupError('');
      setBackupOk('');
      Promise.resolve(onRestoreConfig?.(cfg))
        .then(() => {
          setBackupOk('已清空：仅保留「常用推荐」分类，快捷方式已全部删除，设置已恢复默认');
        })
        .catch((err) => {
          setBackupError(err?.message || '清空失败');
        })
        .finally(() => setBackupBusy(false));
    };

    if (onConfirmRestore) {
      onConfirmRestore({
        title: '清空全部数据',
        message:
          '将删除全部分类与快捷方式（仅保留「常用推荐」空分类），全局设置恢复为默认。此操作不可撤销，建议先导出备份。',
        confirmText: '确认清空',
        onConfirm: runClear,
      });
    } else {
      runClear();
    }
  };

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
    <div
      className="drawer-overlay"
      onClick={() => {
        // 壁纸库/全屏预览打开时，忽略遮罩点击，避免误关整个设置
        if (wpLibOpen || wpPreviewOpen) return;
        if (Date.now() < ignoreSettingsNavUntilRef.current) return;
        onClose();
      }}
    >
      <div className="drawer-content glass-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
        <div className="drawer-header">
          <div className="header-left">
            {isMobileViewport && mobileNavMode === 'detail' ? (
              <>
                {(() => {
                  const TabIcon = Icons[activeTabMeta.icon] || Icons.Settings;
                  return <TabIcon size={18} className="header-leading-icon" />;
                })()}
                <span className="header-title-text">{activeTabMeta.label}</span>
              </>
            ) : (
              <>
                <Icons.Settings size={18} className="header-leading-icon" />
                <span className="header-title-text">全局设置</span>
              </>
            )}
          </div>
          <div className="header-right">
            <button
              className="drawer-close-btn"
              onClick={() => {
                if (Date.now() < ignoreSettingsNavUntilRef.current) return;
                if (isMobileViewport && mobileNavMode === 'detail') {
                  backToMobileList();
                  return;
                }
                onClose();
              }}
              type="button"
              title={isMobileViewport && mobileNavMode === 'detail' ? '返回' : '关闭'}
              aria-label={isMobileViewport && mobileNavMode === 'detail' ? '返回设置列表' : '关闭'}
            >
              <Icons.X size={20} />
            </button>
          </div>
        </div>

        {/* Inner container */}
        <div
          className={`drawer-inner${
            isMobileViewport && mobileNavMode === 'list' ? ' is-mobile-menu' : ''
          }${isMobileViewport && mobileNavMode === 'detail' ? ' is-mobile-detail' : ''}`}
        >
          {/* Desktop: left tabs / Mobile list: section menu */}
          {(!isMobileViewport || mobileNavMode === 'list') && (
            <div className={`drawer-tabs${isMobileViewport ? ' is-mobile-menu-list' : ''}`}>
              {isMobileViewport ? (
                SETTINGS_TABS.map((tab) => {
                  const TabIcon = Icons[tab.icon] || Icons.Settings;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className="settings-menu-item"
                      onClick={() => openMobileSection(tab.id)}
                    >
                      <span className="settings-menu-icon">
                        <TabIcon size={18} />
                      </span>
                      <span className="settings-menu-text">
                        <span className="settings-menu-label">{tab.label}</span>
                        <span className="settings-menu-desc">{tab.desc}</span>
                      </span>
                      <Icons.ChevronRight size={16} className="settings-menu-chevron" />
                    </button>
                  );
                })
              ) : (
                SETTINGS_TABS.map((tab) => {
                  const TabIcon = Icons[tab.icon] || Icons.Settings;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <TabIcon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Content：桌面始终显示；手机仅 detail */}
          {(!isMobileViewport || mobileNavMode === 'detail') && (
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
                    {/* 与壁纸库瓦片一致：右下角全屏预览按钮 */}
                    {!(wp.type === 'color' || (wp.src || '').startsWith('#')) &&
                      (wp.src || wp.thumb) && (
                        <button
                          type="button"
                          className="wp-preview-btn"
                          title="全屏预览"
                          aria-label="全屏预览"
                          onClick={() => setWpPreviewOpen(true)}
                        >
                          <Icons.Maximize2 size={13} />
                        </button>
                      )}
                  </div>
                  <div className="wp-current-meta">
                    <div className="wp-current-title">{wp.title || '未命名壁纸'}</div>
                    <div className="wp-current-source">
                      来源：{wp.source || '—'}
                      {wp.type === 'video' ? ' · 视频' : ''}
                    </div>
                    <div className="wp-current-actions">
                      <button
                        type="button"
                        className="glass-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 固定停在壁纸详情，避免被其它逻辑打回列表
                          setActiveTab('wallpaper');
                          setMobileNavMode('detail');
                          // 推迟到当前点击手势结束，避免同一 tap 落到新开的壁纸库遮罩上立刻关闭
                          setWpLibInstanceKey((key) => key + 1);
                          window.setTimeout(() => setWpLibOpen(true), 50);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
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
                    { key: 'showCalendar', label: '显示顶部时钟' },
                    { key: 'showQuote', label: '显示底部一言' },
                    { key: 'showSuggestions', label: '显示搜索词推荐' },
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

            {activeTab === 'data' && (
              <div className="pane-section animate-fade">
                <h4>备份与还原</h4>
                <p className="site-field-hint">
                  导出包含分类、快捷方式与全局设置的 JSON。还原为全量覆盖；含自定义图标时文件可能偏大。
                </p>
                <div className="backup-actions">
                  <button
                    type="button"
                    className="glass-btn"
                    onClick={handleExportBackup}
                    disabled={backupBusy}
                  >
                    <Icons.Download size={14} />
                    导出备份
                  </button>
                  <button
                    type="button"
                    className="glass-btn"
                    onClick={() => backupInputRef.current?.click()}
                    disabled={backupBusy}
                  >
                    <Icons.Upload size={14} />
                    {backupBusy ? '处理中…' : '从备份还原'}
                  </button>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    onChange={handleBackupFileChange}
                  />
                </div>
                <h4 style={{ marginTop: '24px' }}>清空数据</h4>
                <p className="site-field-hint">
                  删除全部分类与快捷方式，仅保留空的「常用推荐」；壁纸与布局等设置恢复默认。账号密码不受影响。
                </p>
                <div className="backup-actions">
                  <button
                    type="button"
                    className="glass-btn backup-clear-btn"
                    onClick={handleClearData}
                    disabled={backupBusy}
                  >
                    <Icons.Trash2 size={14} />
                    {backupBusy ? '处理中…' : '清空全部数据'}
                  </button>
                </div>
                {backupError && (
                  <p className="account-pwd-error backup-status">{backupError}</p>
                )}
                {backupOk && (
                  <p className="account-pwd-ok backup-status">{backupOk}</p>
                )}
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
          )}

        </div>
      </div>

      
      {wpPreviewOpen && (
        <div
          className="wp-fullscreen-preview"
          role="dialog"
          aria-modal="true"
          aria-label="壁纸全屏预览"
          onClick={(e) => {
            // 点黑边只关预览，勿冒泡到 drawer-overlay 把整个设置关掉
            e.stopPropagation();
            setWpPreviewOpen(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="wp-fullscreen-close"
            onClick={(e) => {
              e.stopPropagation();
              setWpPreviewOpen(false);
            }}
            aria-label="关闭预览"
          >
            <Icons.X size={20} />
          </button>
          <div
            className="wp-fullscreen-stage"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {wp.type === 'color' || (wp.src || '').startsWith('#') ? (
              <div
                className="wp-fullscreen-color"
                style={{ backgroundColor: wp.src || '#111' }}
              />
            ) : wp.type === 'video' && wp.src ? (
              <video
                className="wp-fullscreen-media"
                src={wp.src}
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            ) : wp.src || wp.thumb ? (
              <img
                className="wp-fullscreen-media"
                src={wp.src || wp.thumb}
                alt={wp.title || '壁纸预览'}
              />
            ) : (
              <div className="wp-fullscreen-empty">暂无壁纸</div>
            )}
          </div>
        </div>
      )}

<WallpaperLibrary
        key={wpLibInstanceKey}
        isOpen={wpLibOpen}
        onClose={() => {
          // 同步写入：必须在 setState 之前，否则点穿会先触发设置「返回」
          ignoreSettingsNavUntilRef.current = Date.now() + 600;
          setWpLibOpen(false);
        }}
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
        .backup-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .backup-actions .glass-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .backup-status {
          margin-top: 14px !important;
        }

        .backup-clear-btn {
          color: #fecaca !important;
          border-color: rgba(239, 68, 68, 0.35) !important;
          background: rgba(239, 68, 68, 0.12) !important;
        }

        .backup-clear-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.22) !important;
          border-color: rgba(239, 68, 68, 0.5) !important;
        }

        .wp-current-row {
          display: flex;
          gap: 14px;
          align-items: stretch;
        }
        .wp-current-preview {
          position: relative;
          width: 160px;
          height: 100px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          overflow: hidden;
          padding: 0;
          margin: 0;
          display: block;
          transition: border-color 0.15s, transform 0.15s;
        }

        .wp-current-preview:hover {
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
        }

        /* 与壁纸库 .wp-lib-preview-btn 一致 */
        .wp-preview-btn {
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
          padding: 0;
        }

        .wp-current-preview:hover .wp-preview-btn,
        .wp-preview-btn:focus-visible {
          opacity: 1;
          background: rgba(0, 0, 0, 0.72);
        }

        .wp-preview-btn:hover {
          transform: scale(1.06);
          background: rgba(59, 130, 246, 0.85);
        }

        .wp-preview-btn:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.8);
          outline-offset: 2px;
        }

        .wp-fullscreen-preview {
          position: fixed;
          inset: 0;
          z-index: 400;
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
          animation: fadeIn 0.18s ease;
          cursor: zoom-out;
        }

        .wp-fullscreen-close {
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

        .wp-fullscreen-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .wp-fullscreen-stage {
          position: relative;
          max-width: min(1200px, 100%);
          max-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: default;
        }

        .wp-fullscreen-media {
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

        .wp-fullscreen-color {
          width: min(900px, 92vw);
          height: min(56dvh, 420px);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .wp-fullscreen-empty {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          padding: 48px;
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


        .drawer-header {
          position: relative;
        }

        .header-left,
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          z-index: 1;
        }

        .header-right {
          margin-left: auto;
          flex-shrink: 0;
        }

        .header-leading-icon {
          color: rgba(255, 255, 255, 0.85);
          flex-shrink: 0;
        }

        .header-title-text {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .header-title-center {
          display: none;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          max-width: min(46%, 200px);
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          pointer-events: none;
        }

        .drawer-back-btn {
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

        .drawer-back-btn svg {
          flex-shrink: 0;
          margin-right: -2px;
        }

        .drawer-back-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }

        .drawer-back-btn:active {
          opacity: 0.75;
        }

        .settings-menu-item {
          display: none;
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
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 8px;
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
          color: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .drawer-close-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
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

        @media (max-width: 768px) {
          .drawer-overlay {
            /* 与壁纸库一致：移动端全屏 */
            padding: 0;
          }
          .drawer-content {
            width: 100%;
            max-width: 100%;
            height: 100%;
            border-radius: 0;
          }

          .drawer-inner {
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
          }

          .drawer-inner.is-mobile-menu .drawer-tabs {
            display: flex;
          }

          .drawer-inner.is-mobile-detail .drawer-tabs {
            display: none;
          }

          /* 手机：设置首页列表（非横滑 Tab） */
          .drawer-tabs.is-mobile-menu-list {
            width: 100%;
            max-width: 100%;
            flex: 1 1 auto;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            overflow-x: hidden;
            overflow-y: auto;
            border-right: none;
            border-bottom: none;
            padding: 12px 14px calc(16px + var(--safe-bottom, 0px));
            background: transparent;
            min-height: 0;
            -webkit-overflow-scrolling: touch;
          }

          .drawer-tabs.is-mobile-menu-list .tab-btn {
            display: none;
          }

          .settings-menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 14px 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            color: #fff;
            text-align: left;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s, transform 0.15s;
          }

          .settings-menu-item:active {
            transform: scale(0.98);
            background: rgba(255, 255, 255, 0.1);
          }

          .settings-menu-icon {
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

          .settings-menu-text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .settings-menu-label {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.2;
          }

          .settings-menu-desc {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.3;
          }

          .settings-menu-chevron {
            flex-shrink: 0;
            color: rgba(255, 255, 255, 0.35);
          }

          .drawer-pane {
            flex: 1 1 auto;
            min-height: 0;
            min-width: 0;
            padding: 16px 14px calc(16px + var(--safe-bottom, 0px));
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .drawer-header {
            flex: 0 0 auto;
            padding: calc(12px + var(--safe-top, 0px)) 12px 12px;
            min-height: 48px;
          }

          .wp-current-row {
            flex-direction: column;
          }

          .wp-current-preview {
            width: 100%;
            height: 140px;
          }

          .wp-preview-btn {
            opacity: 1;
            width: 30px;
            height: 30px;
          }

          .wp-fullscreen-media {
            max-height: min(78dvh, calc(100dvh - 100px));
          }


          .select-grid-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
        }


      `}</style>
    </div>
  );
}
