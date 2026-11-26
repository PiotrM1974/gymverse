import {setGeneratorDays} from './helpers/generator-days.js';
import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const programId = `pg_${'b'.repeat(32)}`;
async function seed(page, emptyHistory = false) {
  await page.addInitScript(({ id, emptyHistory }) => {
    if (sessionStorage.getItem('stage10b-fixture')) return;
    sessionStorage.setItem('stage10b-fixture', '1');
    const plans = Array.from({ length: 6 }, (_, index) => ({
      id: `day-${index + 1}`, title: `Dzień ${index + 1} — ${index % 2 ? 'Pull' : 'Push'}`,
      exercises: [{ key: 'bench_flat', variantId: 'default', sets: 3, target: '8-12', restSeconds: 90 }]
    }));
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify(plans));
    localStorage.setItem('gymverse_history', JSON.stringify(emptyHistory ? [] : [{
      id: 'session-polish', planId: 'day-1', planTitle: plans[0].title,
      date: '2026-11-24T10:00:00.000Z', details: [{ id: 'set-1', exerciseId: 'bench_flat', variantId: 'default', setNumber: 1, weight: 60, reps: 8, rir: 2 }]
    }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({
      schemaVersion: 1, activeProfileId: 'polish-profile', profiles: [{ id: 'polish-profile', name: 'Profil próbny',
        attributes: { age: 34, trainingGoal: 'hypertrophy', equipment: ['barbell', 'bench', 'dumbbells', 'machines', 'cables'], restrictions: [] }, data: {},
        planPrograms: { schemaVersion: 1, assignedProgramId: id, programs: [{ id, title: 'Program sześciodniowy', dayPlanIds: plans.map(plan => plan.id) }] }
      }]
    }));
  }, { id: programId, emptyHistory });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-act="startPlan"][data-plan="day-1"]')).toBeVisible();
}

async function capture(page, info, name, shots = true) {
  const out = `outputs/GV-BOLT-STAGE10B-final/${info.project.name}`;
  await mkdir(out, { recursive: true });
  for (const theme of ['light', 'dark']) for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const geometry = await page.evaluate(() => {
      const active = document.querySelector('.view-section.active');
      const controls = [...(active?.querySelectorAll('button,input,select') || [])].filter(node => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden' && node.getBoundingClientRect().width > 0;
      });
      return { scroll: document.documentElement.scrollWidth, width: innerWidth,
        escaped: controls.filter(node => { const box = node.getBoundingClientRect(); return box.left < -1 || box.right > innerWidth + 1; }).map(node => node.textContent?.trim().slice(0, 24) || node.id) };
    });
    expect(geometry.scroll, `${name} ${theme} ${width}`).toBeLessThanOrEqual(geometry.width);
    expect(geometry.escaped, `${name} ${theme} ${width}`).toEqual([]);
    const capture320 = width === 320 && /profile-wizard|generator|program-editor|program-six-days|history/.test(name);
    if (shots && (width === 390 || capture320)) await page.screenshot({ path: `${out}/${name}-${theme}-${width}.png`, fullPage: true, animations: 'disabled', style: '#appHeader{position:absolute!important;top:0!important}' });
  }
}

test('profile onboarding and remaining plan views use Signal layouts', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await expect(page.locator('#stage6Welcome')).toBeVisible();
  await capture(page, info, 'welcome');
  await page.locator('[data-act="stage6CreateProfile"]').click();
  await expect(page.locator('#profileWizard')).toBeVisible();
  await capture(page, info, 'profile-wizard');
  await page.locator('#newProfileName').fill('Profil próbny');
  for (const step of [2, 3, 4]) {
    await page.locator('[data-act="profileNext"]').click();
    await expect(page.locator(`[data-profile-step="${step}"]`)).toBeVisible();
    await capture(page, info, `profile-wizard-step-${step}`);
  }

  const populated = await page.context().newPage();
  await seed(populated);
  populated.setDefaultTimeout(5000);
  const before = await populated.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  await populated.locator('[data-act="stage6OpenChoices"]').first().click();
  await capture(populated, info, 'plan-choices');
  await populated.locator('#view-plan-choices [data-act="stage6Ready"]').click();
  await capture(populated, info, 'library');
  await populated.locator(`#stage6PlanList [data-act="programPreview"][data-id="${programId}"]`).click();
  await expect(populated.locator('#programPreviewBody [data-act="programDay"]')).toHaveCount(6);
  await capture(populated, info, 'program-six-days');
  await populated.locator('#programPreviewBody [data-act="programDay"][data-id="day-2"]').click();
  await expect(populated.locator('#programSelectedDay')).toContainText('Dzień 2');
  await populated.locator('[data-act="programEdit"]').click();
  await capture(populated, info, 'program-editor');
  await expect(populated.locator('[data-program-action="retry"]')).toHaveCount(0);
  await populated.locator('[data-program-action="select"][data-id="day-2"]').click();
  await expect(populated.locator('[data-program-action="select"][data-id="day-2"]')).toHaveAttribute('aria-pressed', 'true');
  await populated.reload({ waitUntil: 'domcontentloaded' });
  await expect(populated.locator('[data-act="startPlan"][data-plan="day-1"]')).toBeVisible();
  await populated.locator('[data-act="editPlans"]').first().click();
  await populated.locator('.generator-wizard-shell > summary').click();
  await expect(populated.locator('#generatorGoal')).toBeVisible();
  await capture(populated, info, 'generator');
  await populated.reload({ waitUntil: 'domcontentloaded' });
  await expect(populated.locator('[data-act="startPlan"][data-plan="day-1"]')).toBeVisible();
  await populated.locator('[data-act="openStorage"]').click();
  await capture(populated, info, 'backup');
  const after = await populated.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  for (const key of ['gymverse_plans', 'gymverse_history']) expect(after[key]).toBe(before[key]);
  await populated.close();
});

test('history, statistics and progression remain readable and keyboard operable', async ({ page }, info) => {
  test.setTimeout(120000);
  await seed(page);
  const before = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  await page.locator('.header-nav [data-view="view-history"]').click();
  await expect(page.locator('.hist-card')).toHaveCount(1);
  await expect(page.locator('#historyAddPanel')).not.toHaveAttribute('open','');
  await capture(page, info, 'history');
  await page.locator('#historyAddPanel > summary').click();
  await expect(page.locator('#histNewPlan')).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  await page.screenshot({path:`outputs/GV-BOLT-STAGE10B-final/${info.project.name}/history-add-open-390.png`,fullPage:true,animations:'disabled'});
  await page.locator('#historyAddPanel > summary').click();
  await expect(page.locator('#histNewPlan')).toBeHidden();
  await page.locator('.hist-head').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hist-head')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.hist-body')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.locator('.hist-head')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.header-nav [data-view="view-stats"]').click();
  await capture(page, info, 'statistics');
  await page.locator('.header-nav [data-view="view-charts"]').click();
  await capture(page, info, 'progression');
  await page.locator('#view-charts .pill[data-range="week"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#view-charts .pill[data-range="week"]')).toHaveClass(/active/);
  const after = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  for (const key of ['gymverse_plans', 'gymverse_history', 'gymverse_profiles_v1']) expect(after[key]).toBe(before[key]);
});

test('approved MuscleMap remains readable in the active workout', async ({ page }, info) => {
  await seed(page);
  await page.locator('[data-act="startPlan"][data-plan="day-1"]').click();
  await page.locator('.exercise-hero > summary').click();
  for (let step = 0; step < 5 && await page.locator('#anatomyAtlas').evaluate(node => node.hidden); step++) {
    await page.locator('#btnNextStep').click();
  }
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await expect(page.locator('#anatomyAtlas')).toBeVisible();
  await capture(page, info, 'musclemap');
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.locator('#anatomyAtlas').screenshot({ path: `outputs/GV-BOLT-STAGE10B/${info.project.name}/musclemap-detail-${theme}-390.png`, animations: 'disabled', style: '#appHeader{visibility:hidden!important}' });
  }
  const state = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  expect(JSON.parse(state.gymverse_history)).toHaveLength(1);
});

test('empty history and statistics provide honest mobile states', async ({ page }, info) => {
  await seed(page, true);
  for (const [view, label] of [['history', 'empty-history'], ['stats', 'empty-statistics'], ['charts', 'empty-progression']]) {
    await page.locator(`.header-nav [data-view="view-${view}"]`).click();
    await capture(page, info, label);
  }
  await expect(page.locator('#historyList')).toContainText('Brak zapisanych');
  expect(JSON.parse((await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_history)).toEqual([]);
});

test('all ten generator steps and real proposal stay usable at mobile widths', async ({ page }, info) => {
  test.setTimeout(120000);
  await seed(page);
  const before = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  await page.locator('[data-act="editPlans"]').first().click();
  await page.locator('.generator-wizard-shell > summary').click();
  for (let step = 1; step <= 10; step++) {
    await expect(page.locator('.generator-wizard > p').first()).toContainText(`Krok ${step} z 10`);
    await capture(page, info, `generator-step-${step}`, step === 1 || step === 10);
    if (step === 2) await setGeneratorDays(page,3);
    if (step < 10) await page.locator('[data-act="generatorNext"]').click();
  }
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview')).toBeVisible();
  await expect(page.locator('#generatorPreview .program-day-tabs button')).toHaveCount(3);
  await expect(page.locator('#generatorPreview .program-day-tabs [aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('#generatorPreview [id^="generated-day-"]')).toHaveCount(1);
  await expect(page.locator('#toast')).not.toHaveClass(/show/);
  await capture(page, info, 'generator-preview');
  await page.locator('#generatorPreview .program-day-tabs [data-act="generatedDay"][data-index="1"]').click();
  await expect(page.locator('#generatorPreview .program-day-tabs button[data-index="1"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#generatorPreview #generated-day-1')).toBeVisible();
  await expect(page.locator('#generatorPreview #generated-day-0')).toHaveCount(0);
  await expect(page.locator('#generatorPreview [data-preview-exercise]').first()).toContainText('Serie:');
  for (const theme of ['light','dark']) {
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
    await page.screenshot({path:`outputs/GV-BOLT-STAGE10B-final/${info.project.name}/generator-three-day-day2-${theme}-390.png`,fullPage:true,animations:'disabled'});
  }
  await page.locator('#generatorPreview [data-act="editGeneratorAnswers"]').click();
  await page.locator('[data-act="generatorGoStep"][data-step="2"]').click();
  await setGeneratorDays(page,6);
  for(let step=3;step<=10;step++)await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview .program-day-tabs button')).toHaveCount(6);
  await expect(page.locator('#generatorPreview [id^="generated-day-"]')).toHaveCount(1);
  await page.setViewportSize({width:320,height:844});
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({path:`outputs/GV-BOLT-STAGE10B-final/${info.project.name}/generator-six-day-dark-320.png`,fullPage:true,animations:'disabled',style:'#toast{display:none!important}'});
  const after = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  for (const key of ['gymverse_plans', 'gymverse_history']) expect(after[key]).toBe(before[key]);
});

test('core mobile views remain horizontally contained with 200 percent root text scale', async ({ page }) => {
  test.setTimeout(60000);
  await seed(page);
  await page.setViewportSize({ width: 320, height: 844 });
  const scaleAndCheck = async label => {
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const geometry = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      selects: [...document.querySelectorAll('#historyScope select')].map(node => ({
        aria: node.getAttribute('aria-label'),
        value: node.value,
        rect: Math.round(node.getBoundingClientRect().width),
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        fontSize: getComputedStyle(node).fontSize,
        boxSizing: getComputedStyle(node).boxSizing,
        textOverflow: getComputedStyle(node).textOverflow
      })),
      offenders: [...document.querySelectorAll('body *')].map(node => ({
        tag: node.tagName,
        id: node.id,
        className: typeof node.className === 'string' ? node.className : '',
        text: node.textContent?.trim().slice(0, 48),
        left: Math.round(node.getBoundingClientRect().left),
        right: Math.round(node.getBoundingClientRect().right),
        width: Math.round(node.getBoundingClientRect().width),
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth
      })).filter(node => node.left < -1 || node.right > innerWidth + 1 || node.scrollWidth > node.clientWidth + 1).slice(0, 12)
    }));
    expect(geometry.scroll, `${label}: ${JSON.stringify(geometry)}`).toBeLessThanOrEqual(geometry.width);
  };
  await scaleAndCheck('home');

  await page.locator('[data-act="editPlans"]').first().click();
  await page.locator('.generator-wizard-shell > summary').click();
  await scaleAndCheck('generator');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-act="stage6OpenChoices"]').first().click();
  await page.locator('#view-plan-choices [data-act="stage6Ready"]').click();
  await page.locator(`#stage6PlanList [data-act="programPreview"][data-id="${programId}"]`).click();
  await page.locator('[data-act="programEdit"]').click();
  await scaleAndCheck('program editor');

  await page.locator('.header-nav [data-view="view-history"]').click();
  await scaleAndCheck('history');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-act="startPlan"][data-plan="day-1"]')).toBeVisible();
  await scaleAndCheck('home after reload');
  await page.locator('[data-act="startPlan"][data-plan="day-1"]').click();
  await scaleAndCheck('active workout');
});
