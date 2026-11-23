const PRIORITY = { neutral: 0, secondary: 1, primary: 2 };

export function resolveHighlightMode(requested, support = { color: true, multiply: true }) {
  if (requested === 'refined' && support.color) return requested;
  if (requested === 'texture-aware' && support.multiply) return requested;
  return 'original';
}

export function sortMusclePaths(paths, roleFor) {
  return paths.map((path, index) => ({ path, index, rank: PRIORITY[roleFor(path)] ?? 0 }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(item => item.path);
}
