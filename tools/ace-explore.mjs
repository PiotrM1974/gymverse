const url = process.argv[2] || 'https://www.acefitness.org/resources/everyone/exercise-library/';
const html = await (await fetch(url)).text();
console.log('url', url, 'bytes', html.length);
for (const pattern of ['View All Exercises', 'Load More', 'pagination', 'exercise-library/', 'page=', 'result']) {
  const at = html.toLowerCase().indexOf(pattern.toLowerCase());
  console.log(pattern, at, at >= 0 ? html.slice(Math.max(0, at - 200), at + 500).replace(/\s+/g, ' ') : '');
}
const links = [...html.matchAll(/href="([^"]+)"/g)].map(x => x[1]);
console.log('exercise links', links.filter(x => /exercise-library\/(?:\d+|page|equipment|body-part|experience)/.test(x)).slice(0, 60));
for (const pattern of ['exercise-post__step', 'exercise-post__meta', 'Body Part:', 'Equipment:', 'Difficulty:', 'exerciseFilter.totalResults']) {
  const at = html.toLowerCase().indexOf(pattern.toLowerCase());
  console.log('DETAIL', pattern, at, at >= 0 ? html.slice(Math.max(0, at - 300), at + 650).replace(/\s+/g, ' ') : '');
}
