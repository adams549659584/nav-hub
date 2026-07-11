/** 备份文件格式版本（元数据，写库时剥离） */
export const BACKUP_VERSION = 1;

/**
 * 清空后的最小配置：仅保留「常用推荐」分类，无快捷方式，设置由调用方填默认值。
 * @param {{ id?: number, code?: string, name?: string, icon?: string }[]} [categories]
 * @param {Record<string, unknown>} [defaultSettings]
 */
export function buildClearedConfig(categories = [], defaultSettings = {}) {
  const common = (Array.isArray(categories) ? categories : []).find(
    (c) => c?.code === 'common'
  );
  return {
    categories: [
      {
        id: common?.id ?? 1,
        code: 'common',
        name: common?.name || '常用推荐',
        icon: common?.icon || 'Home',
      },
    ],
    shortcuts: [],
    settings:
      defaultSettings && typeof defaultSettings === 'object' && !Array.isArray(defaultSettings)
        ? { ...defaultSettings }
        : {},
  };
}

/**
 * @param {{ categories: unknown[], shortcuts: unknown[], settings: Record<string, unknown> }} data
 */
export function buildBackupPayload({ categories, shortcuts, settings }) {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    categories: Array.isArray(categories) ? categories : [],
    shortcuts: Array.isArray(shortcuts) ? shortcuts : [],
    settings: settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {},
  };
}

/**
 * 校验并解析备份对象；通过后返回可写库的 SiteConfig 形状。
 * @param {unknown} raw
 * @returns {{ categories: unknown[], shortcuts: unknown[], settings: Record<string, unknown> }}
 */
export function parseBackupData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('备份文件格式无效：根节点须为对象');
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);
  if (!Array.isArray(obj.categories)) {
    throw new Error('备份文件缺少 categories 数组');
  }
  if (!Array.isArray(obj.shortcuts)) {
    throw new Error('备份文件缺少 shortcuts 数组');
  }
  if (!obj.settings || typeof obj.settings !== 'object' || Array.isArray(obj.settings)) {
    throw new Error('备份文件缺少 settings 对象');
  }
  return {
    categories: obj.categories,
    shortcuts: obj.shortcuts,
    settings: /** @type {Record<string, unknown>} */ (obj.settings),
  };
}

/**
 * @param {File} file
 */
export async function parseBackupFile(file) {
  if (!file) throw new Error('未选择文件');
  let text;
  try {
    text = await file.text();
  } catch {
    throw new Error('无法读取文件');
  }
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('不是合法的 JSON 文件');
  }
  return parseBackupData(raw);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function backupFilename(date = new Date()) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return `nav-hub-backup-${y}${m}${d}-${h}${min}.json`;
}

/**
 * 触发浏览器下载备份 JSON
 */
export function downloadBackup(payload, filename = backupFilename()) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
