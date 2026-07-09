/** Next integer id from a list of { id } items (max + 1). */
export function nextNumericId(items = []) {
  let max = 0;
  for (const item of items) {
    const n = Number(item?.id);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/** Slug-ish code for a new category. */
export function nextCategoryCode(categories = []) {
  const used = new Set(categories.map((c) => c.code).filter(Boolean));
  let n = 1;
  let code = `cat-${n}`;
  while (used.has(code)) {
    n += 1;
    code = `cat-${n}`;
  }
  return code;
}

export function findCommonCategoryId(categories = []) {
  const common = categories.find((c) => c.code === 'common');
  if (common) return common.id;
  return categories[0]?.id ?? null;
}
