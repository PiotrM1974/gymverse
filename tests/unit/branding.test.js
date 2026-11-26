import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../../manifest.webmanifest', import.meta.url), 'utf8'));
const serviceWorker = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');

describe('GymNastika rebrand compatibility', () => {
  it('uses GymNastika in the visible app and PWA labels', () => {
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-title" content="GymNastika">');
    expect(indexHtml).toContain('<title>GymNastika</title>');
    expect(indexHtml).toContain('class="logo" data-act="view" data-view="view-plans" aria-label="GymNastika — Plany">GYM<span>NASTIKA</span></button>');
    expect(manifest.name).toBe('GymNastika');
    expect(manifest.short_name).toBe('GymNastika');
    expect(manifest.description).toBe('Dziennik treningowy — plany, treningi, historia i postępy');
    expect(indexHtml).toContain('Zamknij pozostałe okna GymNastika');
    expect(indexHtml).toContain('zastąpi obecne dane GymNastika');
    expect(indexHtml).not.toContain('content="GymVerse"');
    expect(indexHtml).not.toContain('>GYM<span>VERSE</span>');
  });

  it('preserves the installed PWA identity and legacy data contract', () => {
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest).not.toHaveProperty('id');
    expect(manifest.icons.map(icon => icon.src)).toEqual(['icon-192.png', 'icon-512.png']);
    for (const key of ['gymverse_history', 'gymverse_active', 'gymverse_plans', 'gymverse_custom', 'gymverse_schema']) {
      expect(indexHtml).toContain(key);
    }
    expect(indexHtml).toContain("app: 'gymverse'");
    expect(indexHtml).toContain('GymVerseBaseB');
    expect(serviceWorker).toContain("const CACHE = LOCAL_PRESENTATION_PILOT ? 'gymverse-v36-presentation-pilot' : 'gymverse-v55'");
    expect(serviceWorker).toContain('GYMVERSE_COUNT_APP_CLIENTS');
    expect(serviceWorker).toContain("'manifest.webmanifest'");
  });
});
