import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://www.acefitness.org';
const base = '/resources/everyone/exercise-library/';
const output = resolve('docs/reference/ACE-EXERCISE-INDEX.json');
const decode = value => value.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const exerciseLink = /href="(\/resources\/everyone\/exercise-library\/(\d+)\/[^"]+)"/g;
const failures = [];
async function get(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      return await response.text();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise(resolveWait => setTimeout(resolveWait, 500 * (attempt + 1)));
    }
  }
}
async function parallel(items, count, worker) {
  let next = 0;
  await Promise.all(Array.from({ length: count }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }));
}
const home = await get(origin + base);
const allFilterPaths = [...new Set([...home.matchAll(/href="(\/resources\/everyone\/exercise-library\/(?:body-part|equipment|experience|video)\/[^"]+)"/g)].map(match => match[1]))];
const filters = allFilterPaths.filter(path => !path.startsWith(base + 'video/'));
const entryMap = new Map();
const pages = [];
await parallel(filters, 4, async path => {
  let previous = '';
  for (let page = 1; page <= 20; page += 1) {
    const url = origin + path + (page === 1 ? '' : `?page=${page}`);
    try {
      const html = await get(url);
      const matches = [...html.matchAll(exerciseLink)];
      const unique = [...new Map(matches.map(match => [match[2], match[1]])).entries()];
      const signature = unique.map(([id]) => id).join(',');
      pages.push({ url, entries: unique.length });
      if (!unique.length || signature === previous) break;
      previous = signature;
      for (const [id, href] of unique) {
        const entry = entryMap.get(id) || { aceId: id, url: origin + href, sourceCategories: { bodyPart: [], equipment: [], experience: [] } };
        const category = path.slice(base.length).split('/');
        const group = category[0] === 'body-part' ? 'bodyPart' : category[0];
        if (entry.sourceCategories[group] && !entry.sourceCategories[group].includes(category.slice(1).join('/'))) entry.sourceCategories[group].push(category.slice(1).join('/'));
        entryMap.set(id, entry);
      }
      if (unique.length < 12) break;
    } catch (error) {
      failures.push({ url, error: String(error) });
      break;
    }
  }
});
console.log('Filter pages:', pages.length, 'unique ACE IDs:', entryMap.size, 'listing failures:', failures.length);
const entries = [...entryMap.values()].sort((a,b) => Number(a.aceId) - Number(b.aceId));
await parallel(entries, 5, async entry => {
  try {
    const html = await get(entry.url);
    const field = (name) => {
      const match = html.match(new RegExp(`<div class="exercise-info__term exercise-info__term--${name}">([\\s\\S]*?)<\\/div>\\s*<\\/div>`));
      const dd = match?.[1]?.match(/<dd[^>]*>([\s\S]*?)<\/dd>/);
      return dd ? decode(dd[1]) : null;
    };
    entry.name = decode(html.match(/<h1 class="exercise-hero__title">([\s\S]*?)<\/h1>/)?.[1] || '');
    entry.workingNamePl = null;
    entry.aceBodyPart = field('body-part');
    entry.aceEquipment = field('equipment');
    entry.aceDifficulty = decode(html.match(/exercise-info__lvl-label[^"]*">([\s\S]*?)<\/span>/)?.[1] || '') || null;
    entry.aceExplicitMuscles = null;
    entry.positionSummary = null;
    entry.movementType = null;
    entry.photoCount = new Set([...html.matchAll(new RegExp(`exercise-library\\/large\\/${entry.aceId}-(\\d+)\\.jpg`, 'g'))].map(match => match[1])).size;
    entry.hasVideo = /<video|youtube\.com\/embed|vimeo\.com\/video/.test(html);
    entry.gymnastikaMatch = null;
    entry.reviewStatus = 'metadata-indexed; movement and machine not individually reviewed';
  } catch (error) {
    failures.push({ url: entry.url, error: String(error) });
    entry.reviewStatus = 'unavailable';
  }
});
const result = {
  source: origin + base,
  reviewedOn: '2026-11-22',
  scope: { filtersFound: filters.length, listingPagesRead: pages.length, uniqueIdsFound: entries.length, detailPagesRead: entries.filter(e => e.reviewStatus !== 'unavailable').length, note: 'ACE source metadata indexed by ID. Working Polish names, detailed movement summaries, explicit muscle lists and app matches remain pending individual review.' },
  listingPages: pages.sort((a,b) => a.url.localeCompare(b.url)),
  failures,
  entries
};
await mkdir(resolve('docs/reference'), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log('Detail pages:', result.scope.detailPagesRead, 'failures:', failures.length, 'output:', output);
await import('./enrich-ace-exercise-index.mjs');
