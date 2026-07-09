/** Synthetic sidebar id for "全部" */
export const ALL_CATEGORY_ID = 'all';

export function isAllCategory(id) {
  return id === ALL_CATEGORY_ID || id === 'all';
}

/** Normalize legacy categoryId → categoryIds[] */
export function getCategoryIds(shortcut) {
  if (!shortcut) return [];
  if (Array.isArray(shortcut.categoryIds) && shortcut.categoryIds.length) {
    return shortcut.categoryIds.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  }
  if (shortcut.categoryId != null && shortcut.categoryId !== '') {
    const n = Number(shortcut.categoryId);
    return Number.isFinite(n) && n > 0 ? [n] : [];
  }
  return [];
}

export function shortcutBelongsTo(shortcut, categoryId) {
  if (isAllCategory(categoryId)) return true;
  const ids = getCategoryIds(shortcut);
  const cid = Number(categoryId);
  return ids.includes(cid);
}

export function withCategoryIds(shortcut, categoryIds) {
  const ids = [...new Set((categoryIds || []).map(Number).filter((n) => n > 0))];
  const { categoryId: _drop, ...rest } = shortcut;
  return { ...rest, categoryIds: ids };
}
