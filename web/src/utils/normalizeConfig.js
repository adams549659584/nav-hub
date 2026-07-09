/**
 * Normalize import/export JSON to the current schema:
 * - category: { id:number, code, name, icon }
 * - shortcut: { id:number, categoryId:number, name, url, letter?, bgColor?, favicon? }
 * Accepts legacy string ids / payload-style shortcuts.
 */
export function normalizeImportedConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('invalid config');
  }

  const categoriesIn = Array.isArray(raw.categories) ? raw.categories : [];
  const shortcutsIn = Array.isArray(raw.shortcuts) ? raw.shortcuts : [];

  const codeToId = new Map();
  const categories = categoriesIn.map((c, i) => {
    const id = toPositiveInt(c.id) || i + 1;
    const code =
      typeof c.code === 'string' && c.code
        ? c.code
        : typeof c.id === 'string'
          ? c.id
          : `cat-${id}`;
    codeToId.set(code, id);
    // also map old numeric-as-string
    if (c.id != null) codeToId.set(String(c.id), id);
    return {
      id,
      code,
      name: String(c.name || '').trim() || `分类${id}`,
      icon: c.icon || 'Grid',
    };
  });

  // resolve categoryId that may be legacy code string
  const shortcuts = shortcutsIn
    .map((s, i) => {
      let categoryId = toPositiveInt(s.categoryId);
      if (!categoryId && s.categoryId != null) {
        categoryId = codeToId.get(String(s.categoryId)) || 0;
      }
      if (!categoryId) return null;
      const id = toPositiveInt(s.id) || i + 1;
      return {
        id,
        categoryId,
        name: String(s.name || '').trim(),
        url: String(s.url || '').trim(),
        letter: s.letter || '',
        bgColor: s.bgColor || '#3b82f6',
        favicon: s.favicon || '',
      };
    })
    .filter((s) => s && s.name && s.url);

  return {
    categories,
    shortcuts,
    settings: raw.settings && typeof raw.settings === 'object' ? raw.settings : {},
  };
}

function toPositiveInt(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}
