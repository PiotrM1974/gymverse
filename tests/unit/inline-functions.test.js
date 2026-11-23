import { readFileSync } from 'node:fs';
import { runInNewContext, Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { EXERCISE_VARIANTS } from '../../src/exercise/catalog.js';
import { EXERCISE_ATLAS_MAP } from '../../src/data/anatomy/atlas-data.js';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

function declaration(source, name) {
  const start = source.indexOf(name);
  if (start < 0) throw new Error(`Missing inline declaration: ${name}`);
  if (name.startsWith('const ')) {
    const end = source.indexOf('\n', start);
    return source.slice(start, end < 0 ? source.length : end).trim();
  }
  const brace = source.indexOf('{', start);
  if (brace < 0) throw new Error(`Missing function body: ${name}`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = brace; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unclosed inline declaration: ${name}`);
}

function evaluate(name, prelude, expression) {
  const code = `${prelude}\n${declaration(html, name)}\n${expression}`;
  return runInNewContext(code, { Date, Math, Number, String, Object, Array, Set, isFinite });
}

describe('inline helpers characterize current behavior', () => {
  it('resolves all four catalog variant pairs and rejects assignment to another exercise', () => {
    const prelude = `const VARIANTS = ${JSON.stringify(EXERCISE_VARIANTS)}; const CATALOG = Object.fromEntries(VARIANTS.map(v => [v.exerciseId, v.exerciseId])); const variantFor = (key, variantId) => VARIANTS.find(v => v.exerciseId === key && v.variantId === variantId);`;
    for (const variant of EXERCISE_VARIANTS) {
      expect(evaluate('const validVariant', prelude, `validVariant('${variant.exerciseId}', '${variant.variantId}')`)).toBe(true);
      expect(EXERCISE_ATLAS_MAP[`${variant.exerciseId}/${variant.variantId}`]).toBeTruthy();
      const other = EXERCISE_VARIANTS.find(v => v.exerciseId !== variant.exerciseId);
      expect(evaluate('const validVariant', prelude, `validVariant('${other.exerciseId}', '${variant.variantId}')`)).toBe(false);
    }
  });

  it('cleanPlan keeps an optional variant on its exercise and leaves legacy entries without one', () => {
    const prelude = `const CATALOG = { leg_press: 'Suwnica' }; const safeImg = () => null;`;
    const result = evaluate('function cleanPlan', prelude, `JSON.stringify(cleanPlan({ id: 'synthetic', title: 'Plan', exercises: [
      { key: 'leg_press', sets: 3, target: '8-10', variantId: 'high_feet' },
      { key: 'leg_press', sets: 2, target: '12-15' }
    ] }))`);
    expect(JSON.parse(result).exercises).toEqual([
      { key: 'leg_press', sets: 3, target: '8-10', variantId: 'high_feet' },
      { key: 'leg_press', sets: 2, target: '12-15' }
    ]);
  });

  it('the current inline application script parses without changing the HTML', () => {
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
    expect(script).toBeTruthy();
    expect(() => new Script(script)).not.toThrow();
  });

  it('e1rm is an inline const arrow function using the Epley estimate rounded to 0.1 kg', () => {
    expect(evaluate('const e1rm', '', 'e1rm(60, 10)')).toBe(80);
    expect(evaluate('const e1rm', '', 'e1rm(60, 1)')).toBe(60);
  });

  it('isBW reads the current bodyweight exercise set', () => {
    expect(evaluate('const isBW', 'const BW = new Set(["pullup", "dips", "pushup"]);', 'isBW("pullup")')).toBe(true);
    expect(evaluate('const isBW', 'const BW = new Set(["pullup", "dips", "pushup"]);', 'isBW("bench_flat")')).toBe(false);
  });

  it('setLoad counts added bodyweight plus external load for bodyweight movements', () => {
    const prelude = 'const BW = new Set(["pullup", "dips", "pushup"]); const isBW = k => BW.has(k); const bodyAt = () => 70;';
    expect(evaluate('const setLoad', prelude, 'setLoad("pullup", 5, 8, "2026-01-05")')).toBe(600);
    expect(evaluate('const setLoad', prelude, 'setLoad("bench_flat", 40, 8, "2026-01-05")')).toBe(320);
  });

  it('recalcSession keeps legacy volume distinct from the sum of entered weights', () => {
    const prelude = 'const BW = new Set(); const body = []; const isBW = () => false; const bodyAt = () => 0; '
      + declaration(html, 'const setLoad');
    const cases = [
      { details: [{ exerciseId: 'leg_press', variantId: 'high_feet', weight: 85, reps: 10 }], volume: 850, reps: 10 },
      { details: [
        { exerciseId: 'leg_press', variantId: 'high_feet', weight: 85, reps: 10 },
        { exerciseId: 'leg_press', variantId: 'default', weight: 80, reps: 8 }
      ], volume: 1490, reps: 18 },
      { details: [], volume: 0, reps: 0 }
    ];
    for (const { details, volume, reps } of cases) {
      const session = JSON.parse(evaluate('function recalcSession', prelude,
        `const s = ${JSON.stringify({ date: '2026-01-05T10:00:00Z', details, totalVolume: -1, totalReps: -1 })}; recalcSession(s); JSON.stringify(s)`));
      expect(session.totalVolume).toBe(volume);
      expect(session.totalReps).toBe(reps);
      expect(session.details).toEqual(details);
    }
  });

  it('metric uses Epley for loaded lifts and weight-times-1000-plus-reps for bodyweight lifts', () => {
    const prelude = 'const BW = new Set(["pullup"]); const isBW = k => BW.has(k); const e1rm = (w, r) => r <= 1 ? w : Math.round((w * (1 + r / 30)) * 10) / 10;';
    expect(evaluate('const metric', prelude, 'metric("bench_flat", 60, 10)')).toBe(80);
    expect(evaluate('const metric', prelude, 'metric("pullup", 5, 8)')).toBe(5008);
  });

  it('weekStart returns Monday at local midnight', () => {
    const result = evaluate('function weekStart', '', 'weekStart(new Date(2026, 0, 7, 15)).toISOString()');
    expect(result).toBe(new Date(2026, 0, 5).toISOString());
  });

  it('normalizeSession filters invalid sets, rounds reps and preserves the v2 legacy session shape', () => {
    const prelude = `
      const ID_MAP = {}; const CATALOG = { bench_flat: 'Wyciskanie testowe' }; const PLANS = [];
      const getPlan = () => null; const isBW = k => ['pullup','dips','pushup'].includes(k);
      const setLoad = (key,w,r) => w*r; const recalcSession = s => { s.totalVolume=s.details.reduce((a,d)=>a+setLoad(d.exerciseId,d.weight,d.reps),0); s.totalReps=s.details.reduce((a,d)=>a+d.reps,0); };
    `;
    const output = evaluate('function normalizeSession', prelude, `JSON.stringify(normalizeSession({date:'2026-01-05T10:00:00Z',planId:'push_a1',planTitle:'Push A1',details:[{exerciseId:'bench_flat',weight:40,reps:7.6,setNumber:1},{exerciseId:'bench_flat',weight:-2,reps:8}]}))`);
    const session = JSON.parse(output);
    expect(session.details).toHaveLength(1);
    expect(session.details[0]).toMatchObject({ exerciseId: 'bench_flat', weight: 40, reps: 8, setNumber: 1 });
    expect(session).toMatchObject({ planId: 'push_a1', totalVolume: 320, totalReps: 8 });
    expect(session.details[0]).not.toHaveProperty('sideResults');
  });
});
