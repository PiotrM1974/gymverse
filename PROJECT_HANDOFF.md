# GymNastika 2.0 — project handoff

This is a curated engineering handoff based on the repository’s source, contracts, task records, and reports. It is **not** a transcript or complete export of ChatGPT, Work, or Bolt conversations. No private workout data or credentials belong here.

## Project and architecture

GymNastika is a static, local-first training PWA. `index.html` owns the app shell and boot flow; features are plain JavaScript modules under `src/features/`, reference data and released exercise art are under `src/data/`, local Manrope fonts are under `src/ui/fonts/`, and `sw.js` caches the app shell and released visual assets for offline use. There is no compile/build step. The app stores user data in browser storage, with IndexedDB and localStorage migration paths, profile/program synchronization, Web Locks, backup/import support, and a service worker.

The project uses `package-lock.json`, pinned by `.node-version` to Node 26.13.0. Tests use Vitest and Playwright. `tools/serve-test.mjs` serves the app at the origin root and at the legacy `/gymverse/` mount on loopback. The service worker’s release path and all runtime presentation assets resolve from the current origin root; the production Pages subpath remains supported by relative manifest and app URLs. The release registry retains approval-record paths as provenance metadata; the app does not dereference those paths.

## Decisions recorded in project documents

- GymNastika Signal LIGHT/DARK was approved; Manrope is the app-wide typeface. The UI approval and tokens are in `design/gymnastika-redesign/`.
- The existing plan model supports programs of one to six days. Programs, generator, editor, assignment, and durable drafts use the established model and shared write synchronization; no competing plan model was added.
- Training, history, statistics, progression, backup/import, and historical workout affiliation were integrated in the approved stages. Contracts and task records in `docs/tasks/` are the source of detail.
- ZIP v5 is the current full backup. The importer also supports the historical JSON v4 shape described in `docs/tasks/GV-PHASE0-RELEASE-AND-EXPORT.md`. A synthetic JSON v4 fixture is included; no authentic owner export has been examined.
- Exercise imagery is locally hosted. The published app uses the released 34-record presentation registry and its 136 local WebP files. MuscleMap uses local diagrams and body illustrations with notices under `src/data/anatomy/`.
- E2E fixtures are kept under `tests/fixtures/`. Generated evidence and local work products remain under ignored `outputs/` and are not project dependencies. Some optional asset-building and validation scripts still consume local review material/approval records under `outputs/`; they are not required to install, run, or test the app.

## Current state and completed scope

Functional stages 6.4 through 9 and Premium UI Polish 10A–10C have been accepted for local closure in their documented scope. Stage 11 and 11A prepared a release plan; Stage 11B moved required E2E inputs into the repository and created a local TEST bundle. The 11B targeted units passed 21/21; synthetic historical JSON v4/ZIP v5 E2E passed 4/4 on Edge; fixture-focused E2E passed in separated runs (17/18, followed by 1/1 for the corrected test selector; MuscleMap QA gate 1/1). This is not a full regression. The package contains 206 files and passed static asset checks. A later authorized Netlify Drop attempt briefly hosted it as a password-protected TEST site, but the live app was not opened or tested. No iPhone or offline test is confirmed. The branch is `feature/gymnastika-approved-ui` at `fc6f1778483c3e623003be2479ce786be9baf1ae` at the start of 11B. Per the owner, do not reconcile it with `main` without separate approval.

Read `AGENTS.md`, `PROJECT_MEMORY.md` (local-only), the latest `docs/tasks/GV-BOLT-STAGE11B.md`, and then the narrower stage/contract documents for the task at hand. This handoff summarizes project decisions; it does not override a task-specific approval.

## Known limits and release gates

- Older already-open app tabs may not participate in the current Web Locks protocol. localStorage does not provide a multi-key transaction against unrelated writers. See the synchronization contract and Stage 6.4 record.
- Desktop WebKit is not physical iPhone Safari. Prior WebKit offline emulation failures remain environment-limited unless new evidence points to an app defect.
- No physical iPhone/PWA acceptance has been performed. No authentic historical export was delivered; JSON v4 was tested only with a project-generated synthetic fixture.
- The final full E2E run (454 cases) is intentionally deferred to one release-candidate pass after all accepted-device findings are resolved. Do not repeatedly rerun it.
- The four historical paired-draft PNGs are retained in the owner’s local `outputs/` but are not in this repository because redistribution rights were not established. E2E preview uses the released application imagery instead. Original source files are untouched.
- Production publication remains unapproved. The one-time Netlify Drop staging attempt is documented above and was not tested; further non-GitHub hosting is disallowed. GitHub organization/repository setup, Pages staging, remote branch changes, Git operations, merge, and production deployment require separate owner authorization.

## Setup on a new computer

1. Install Node 26.13.0 (read `.node-version`).
2. In the repository root run `npm ci`.
3. Run unit tests with `npm run test:unit` (or all Vitest tests with `npm test`).
4. Install Playwright browser engines with `npx playwright install chromium webkit`. To run the Edge project where Microsoft Edge is installed, set `PLAYWRIGHT_CHANNEL=msedge` for the Playwright command.
5. Run E2E with `npm run test:e2e`. Playwright starts `tools/serve-test.mjs`; its configured default is loopback port 41900. A direct local app preview can be served with `node tools/serve-test.mjs` (port 41739) and opened at `http://127.0.0.1:41739/`.
6. Read `README.md`, `docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`, the relevant `docs/tasks/GV-*.md`, and associated data contracts. Do not run the full 454-test E2E suite except as the single final release-candidate regression.

## Local TEST staging package

`tools/prepare-staging.mjs` copies only app runtime files to `outputs/GV-STAGE11B-STAGING/site-release/`. It marks the name and app icon title as TEST, uses a separate service-worker cache, validates all 136 released-image hashes and manifest/font/MuscleMap assets, and refuses to overwrite an existing package. `STAGING-README.txt` is included. The 206-file package remains local and intact. A later approved Netlify Drop attempt created a temporary password-protected TEST URL that Netlify reported would expire after about one hour; the live app was not opened or tested, so this is not evidence of an application, iPhone, or offline test. Do not use Netlify or another non-GitHub host for further staging. The upload archive `stage11c-site-release-upload.zip` remains local, is ignored, and is excluded from the commit allowlist.

For a future GitHub-only iPhone test, the recommended isolated origin is a dedicated free GitHub organization controlled from the existing account, with a separate organization Pages site such as `gymnastika-test-org.github.io` at the hostname root. This differs from production `piotrm1974.github.io`. A path such as `/gymverse/test/` on the production host is not isolated. A separately owned domain/subdomain configured on a dedicated Pages repository is an alternative and requires DNS and HTTPS setup. No organization, repository, Pages site, DNS, push, or deploy has been created. Use synthetic data only.

### Physical iPhone checklist

- Open the approved TEST HTTPS hostname in Safari; add it to the Home Screen and verify the `TEST` name/marker. Confirm production still opens separately.
- Load once online, then enable Airplane Mode and relaunch. Check LIGHT/DARK, text fields and keyboard, save a synthetic set, run/skip rest, lock/unlock during rest, go to the next exercise, swap an exercise, and resume the session.
- Create and edit 1-, 3-, and 6-day programs. Visit each day, save, reopen, reorder days, and assign only to the synthetic profile.
- Check history, statistics, and MuscleMap views. Export a synthetic ZIP v5 to Files, import it in a fresh TEST profile/origin, and compare the restored session and history. Never use an owner archive for this synthetic round-trip.
- Record iOS version, Safari/PWA launch mode, network state, pass/fail, and screenshots for any reproduced issue. Test lock/relaunch separately from normal timer completion.

## Next work and resumption

1. Resolve the physical-device checklist with the owner on the separate TEST origin.
2. To supply an authentic historical export, use the old app’s own export/backup action on the iPhone and choose **Save to Files**. Keep the original app and its data installed; do not clear storage, rename/re-encode the file, or import it into the current production app. Attach the file to the project only when ready to share that personal data. Identify its actual format first, preserve its original hash, then test only a copy in an isolated TEST origin/profile and compare dates, sessions, sets, variants, and “Poprzednio”.
3. Fix only reproduced defects. Then run the one controlled full release-candidate regression (unit suite, complete Edge E2E, available desktop WebKit, PWA/offline and asset checks); report any WebKit emulation limitation separately.
4. Recheck the remote base and exact file allowlist only after Git operations are approved. Prepare commit/PR and publication plan for review; merging to `main` may automatically publish GitHub Pages.

When resuming in a new Codex session: use the existing checkout, read `AGENTS.md`, this file, local `PROJECT_MEMORY.md`, and the latest task report; verify branch/status before changes; preserve all local and ignored data; do not create another chat or worktree; do not publish or contact external services without explicit authorization.

## Local pre-release onboarding follow-up — 26 Nov 2026

On the existing branch `release/gymnastika-2.0-2026-11-26` (starting HEAD `95b0f06dda78d7bb6cbcde76515da2d5f3e15b37`), first-run and profile access were adjusted locally. A fresh store still uses the existing four-step profile wizard and restore path; the existing safe onboarding skip is now available directly on the welcome screen. When prior single-user data is found without a profile registry, the existing `legacy-default-profile`/“Mój profil” migration remains intact, and the same profile registry now carries an optional one-time `legacyUpgradePending` notice. Updating that existing profile or dismissing the notice clears the flag through the existing shared profile write transaction. No workout history, plans, settings, or profile IDs are rewritten by dismissing the notice. An existing valid GymNastika 2.0 registry starts normally.

The home profile row exposes **Edytuj profil** and **Dodaj profil** beside the active profile selector. Editing reuses the existing wizard, prefills saved fields, and updates the same ID; cancel leaves persisted state unchanged. A unit regression confirms the assigned-program reference and profile snapshot survive the update. The upgrade welcome is not an IndexedDB migration: storage migration remains an explicit separate operation, and no claim of automatic IndexedDB transfer should be made.

Verification on synthetic data: unit suite **199/199 PASS**; focused Chromium **5/5 PASS** and Microsoft Edge **5/5 PASS**, including first run, one-time legacy notice, dismissal and reload, edit/cancel/save without duplication, valid 2.0 registry, 320/390 px LIGHT/DARK overflow, keyboard activation, and the existing IndexedDB profile-isolation/switch test. No 454-case full E2E run. Desktop WebKit was unavailable (`webkit-2215/Playwright.exe` absent); it was not tested. Requested Chromium was installed in an isolated temporary cache at `C:\temp\gymnastika-playwright-browsers`; ask the owner before installing any further browser/tool/dependency. The three synthetic screenshots are local ignored outputs under `outputs/GV-ONBOARDING-REVIEW-2026-11-26/`.

Only the local source/docs/test tree changed. No user data was opened, no PR #11 update or GitHub operation occurred, and no commit, push, merge, or publication was made. Preserve the unrelated untracked design boards. Physical iPhone/Safari and authentic historical owner export remain unverified release gates.

## Aktualizacja wydania 26.11.2026

Właściciel autoryzował przygotowanie wydania GymNastika 2.0 na GitHub. Produkcyjny `main` został potwierdzony jako `e5b119251ac442796d399f123420412164a62813`; świeży snapshot, ZIP i Git bundle są zapisane oraz zweryfikowane poza worktree. Oddzielna gałąź `release/gymnastika-2.0-2026-11-26` bazuje dokładnie na tym SHA. Drzewo `origin/main` jest identyczne z bazowym `feature` (`fc6f177`), mimo trzech dodatkowych commitów w pierwszej linii historii; te commity przejrzano i nie ma zmian plików do nadpisania.

Allowlista 11A+11B nadal wynosi 191 plików. Dokładnie te pliki są przygotowane lokalnie; 12 niezatwierdzonych alternatywnych boardów pozostało poza indeksem. `outputs/`, prywatna pamięć i archiwum uploadu stagingu nie są częścią wydania. Nie wykonano pełnej regresji 454 E2E. Świeży unit suite: 197/197; lokalny smoke test HTML, manifestu, Service Workera, fontu, ikony i MuscleMap: 200 dla wszystkich żądanych plików. WebKit/Edge E2E i fizyczny iPhone nie zostały uruchomione w tym przebiegu.

Przed zmianą produkcji właściciel musi potwierdzić osobny eksport danych treningowych ze starej aplikacji na iPhonie. Do czasu potwierdzenia nie wolno scalać PR ani wdrażać na Pages. Zachować dokładny SHA i instrukcję rollbacku; nie przepisywać historii.

### Stan kontroli GitHub 26.11.2026

Gałąź `release/gymnastika-2.0-2026-11-26` została wypchnięta i PR [#11](https://github.com/PiotrM1974/gymverse/pull/11) jest otwarty jako Draft; commit aplikacji `37da783c7a89fe33747b942fa7fcf3c7a2d33ba2`; aktualny HEAD gałęzi (po commicie dokumentacyjnym) `2212db73ac97dbf5d04511ab2789c677c19906ba`. GitHub raportuje PR mergeable, ale nie ma statusów CI. Repo nie zawiera własnych workflowów w `.github/workflows`; GitHub API pokazuje aktywny, dynamiczny workflow `pages-build-deployment`. Ostatni przebieg tego workflow (#45352133258) zakończył się sukcesem na obecnym `main` SHA `e5b119251ac442796d399f123420412164a62813`. Dotychczasowy adres produkcyjny zwraca 200. Zatem scalenie do `main` uruchomi wbudowane GitHub Pages. PR nie został scalony.

Właściciel nie potwierdził jeszcze osobnego eksportu danych treningowych na iPhonie. To blokuje merge/deploy; nie uznawać PR ani testów lokalnych za zakończenie publikacji. Ostatni krok wymaga potwierdzenia właściciela, następnie kontroli pełnej regresji raz na release candidate i dopiero wtedy osobnej decyzji o scaleniu.
