import { match as pinyinMatch } from 'pinyin-pro';

/**
 * 文本是否命中搜索词：原文包含、全拼、拼音首字母（pinyin-pro）。
 * 例：「知乎」可匹配 zhihu / zh / 知；「哔哩哔哩」可匹配 blbl / bili。
 */
export function textMatchesQuery(text, query) {
  const q = String(query ?? '').trim();
  if (!q) return true;
  const t = String(text ?? '');
  if (!t) return false;

  if (t.toLowerCase().includes(q.toLowerCase())) return true;

  try {
    return pinyinMatch(t, q) != null;
  } catch {
    return false;
  }
}

/** 快捷方式是否命中：名称 / 字母标 / URL 主机名 */
export function shortcutMatchesQuery(shortcut, query) {
  const q = String(query ?? '').trim();
  if (!q) return true;
  if (!shortcut) return false;

  if (textMatchesQuery(shortcut.name, q)) return true;
  if (shortcut.letter && textMatchesQuery(String(shortcut.letter), q)) return true;

  const url = String(shortcut.url || '');
  if (url) {
    const lower = url.toLowerCase();
    if (lower.includes(q.toLowerCase())) return true;
    try {
      const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      if (textMatchesQuery(host, q)) return true;
    } catch {
      /* ignore invalid url */
    }
  }
  return false;
}
