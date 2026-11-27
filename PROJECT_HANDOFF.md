## GitHub Pages v62 — gotowość wydania, 27.11.2026

Baza wydania: main 38731a7f4ac78fd1fc9e3325bf36ce80630a240a (produkcyjne v59). Właściciel autoryzował publikację na GitHub. Wydanie obejmuje trzy zestawy zmian opisane niżej, bez pozostałych pomysłów z planu. App version 2.0.3, shell cache v62.

Kontrola aktualizacji wykryła niezgodność przy pierwszym przeładowaniu: worker v59 podawał stary moduł historii do nowego HTML, przez co ekran startowy przerwał renderowanie. Zmienione arkusz i moduł mają teraz adresy z wersją, precache zawiera te same adresy. Ponowienie v59 → v62 w tym samym originie /gymverse/ przeszło także offline. Porównanie syntetycznych rekordów potwierdziło zachowanie profilu, planów, historii, ustawień i trwałego szkicu. Nie zmieniono schematu, manifestu ani cyklu aktywacji service workera.

Przed publikacją: jednostkowe 222/222, Chromium 9/9 celowanych, desktopowy WebKit 5/5 celowanych, osobny test aktualizacji Chromium z otwartą kartą v59. Brak pełnej regresji E2E i testu fizycznego iPhone'a.

## Lokalny start następnego treningu i nawigacja — 27.11.2026

Aktywny program pokazuje następny dostępny dzień według obecnej kolejności i ostatniej zapisanej sesji tego programu z tego samego profilu. Przycisk rozpoczyna sesję w jednym kroku. Gdy sesja już trwa, na stronie głównej pierwszeństwo ma wznowienie. Szybki start używa wspólnej blokady, sprawdza aktualny program, plany i historię, a transakcja odmawia nadpisania sesji rozpoczętej w drugiej karcie. Bez zmian schematu danych. Cache lokalnego kandydata: v62.

Główne zakładki korzystają z górnej nawigacji. Podgląd programu wraca do ekranu, z którego go otwarto, a historia otwarta z programu ma powrót do niego. Kafelki tworzenia i edycji mają identyczną szerokość i wysokość. Pomiar przy 320, 375 i 390 px w LIGHT/DARK. Zrzuty w lokalnym outputs/GV-HOME-QUICK-START.

Testy: jednostkowe 222/222, Chromium 16/16 + 3/3 zależnych, desktopowy WebKit 3/3. Po drobnych korektach oznaczenia i rozmiaru kafelków przeszły osobne ponowienia Chromium 2/2 i 1/1. Zmiany lokalne, bez publikacji.

## Lokalne poprawki po audycie graficznym — 27.11.2026

Rozgrzewka używa koloru tekstowego Signal z odpowiedniego motywu. Filtry Historii są domyślnie zwinięte, z podsumowaniem aktywnych kryteriów. Podgląd generatora wybiera dzień jednym zestawem przycisków, a pełną nazwę, grafik i czas pokazuje przy ćwiczeniach wybranego dnia. Statystyki tygodnia odmieniają liczbę treningów i serii. Zaktualizowano cache PWA do v61. W worktree nadal jest lokalna poprawka przywracania domyślnych planów.

Weryfikacja: jednostkowe 221/221, Chromium 2/2 wizualne (13 widoków LIGHT/DARK przy 320/375/390/430 px) i 6/6 na zależnych ścieżkach, desktopowy WebKit 2/2 Historia. Zrzuty w lokalnej galerii outputs/GV-GRAPHICS-POLISH. Bez publikacji.

## Lokalna poprawka przywracania planów — 27.11.2026

Po usunięciu programu z domyślnym dniem funkcja „Przywróć domyślne plany” mogła zapisać cztery plany, ale wyświetlić tylko trzy. Przywrócenie usuwa teraz oznaczenia archiwum wyłącznie dla przywróconych domyślnych dni w tej samej transakcji co zapis planów. Pozostałe rekordy archiwalne, historia i inne profile są zachowane. Zmiana oznaczenia w drugiej karcie blokuje zapis ze starej migawki. Cache lokalnej poprawki: v60. Produkcyjne 2.0.3 pozostaje na v59.

Test regresyjny odtworzył błąd (3 zamiast 4). Po poprawce: 221/221 jednostkowych, Chromium 5/5 i desktopowy WebKit 3/3. Sprawdzono localStorage, IndexedDB, odświeżenie, wycofanie po odmowie zapisu oraz offline w Chromium. Poprawka lokalna, bez commita i publikacji.

# PR #14 final corrections — 26 November 2026

Current candidate supersedes previous 2.0.3 notes: profile switching is exclusively in Settings; home has a read-only active profile name. An open profile form blocks switching, and profile writes compare the UI registry snapshot inside the existing data lock. First-start bootstrap remains supported.

Deleted programs now record optional planPrograms.archivedDayPlanIds in the existing per-profile registry. Day records remain available to history/drafts but are excluded from ordinary lists and new attachments. Live references have priority; active sessions block deletion. ZIP v5/profile export preserve the field, smart merge retains it and rejects stale program resurrection, and JSON v4 replacement cannot destroy retained archive records. No automatic migration or new storage system. App version 2.0.3; cache v59.

Unit tests 221/221. Targeted Chromium/WebKit failures were diagnosed and their affected cases passed subsequent runs; exact separate results and limitations in [release report](docs/tasks/GV-RELEASE-203.md#końcowe-poprawki-pr-14--wykonanie-26112026). Home and Settings screenshots updated; approved art and other screenshots retained. No full E2E regression, physical iPhone or authentic legacy export verification. Existing old orphan days cannot be inferred safely and are not retroactively migrated. Older tabs may ignore archive metadata; localStorage atomicity limits remain.

Authorized: commit and push these corrections to release/gymnastika-2.0.3, update PR #14 only. No merge/main push/deployment. Preserve unrelated local design boards and ignored PROJECT_MEMORY.md/outputs.

---

# Current candidate — GymNastika 2.0.3 (26 November 2026)

This section supersedes the historical release/authorization notes below. PR #13 is merged; verified production main is 94a7511a047f9d421a10fcc24b217bde5789c6ab (2.0.2). Current release branch: release/gymnastika-2.0.3, based on that main. Owner authorizes commit/push of this branch and a new PR only; no main push, merge, deployment or new installation.

The accepted UX/3D cards/artwork are retained. Explicitly approved release corrections preserve selected weekdays when reducing the count, remove deletion from program preview, expose existing profile-wide rest/bar preferences in Settings and show version 2.0.3. Existing storage/schema, training logic and PWA identity remain unchanged; shell cache v58.

Fresh verification: unit 216/216; one targeted Chromium 52/52; separate desktop WebKit 9/9. Full historical E2E suite, physical iPhone and authentic legacy export are not certified. Some old 10-step wizard tests still need alignment before a full run. Keep unrelated local design boards. No automatic publication after this task. [Release scope, full file list, test evidence and limitations](docs/tasks/GV-RELEASE-203.md). [Actual synthetic screenshots](docs/releases/2.0.3/README.md).

---

## Owner acceptance — 2026-11-26

The owner accepted the presented local UX/visual changes, including the stronger 3D cards, random equipment/colour variants and shared LIGHT/DARK backgrounds. Local visual review is complete. This does not authorize a new commit/push, PR update, merge or deployment. Physical iPhone and authentic legacy-export verification remain open.

## Latest local visual refinement — 2026-11-26

Approved 3D equipment covers replace rejected SVGs. Random existing program/plan IDs seed stable equipment/colour variants and eight soft card tints; canonical-order collision handling, no storage writes/schema changes. Six WebP assets are precached. Raised card edges/shadows support LIGHT/DARK and reduced motion. Exercise thumbnails remain exact. New evidence: unit216/216; Chromium6/6 after correcting a premature DOM read in the offline test; desktop WebKit3/3; final raised-card Chromium2/2. No physical iPhone, commit, PR update or deployment. See docs/tasks/GV-UX-ORGANIZATION.md and src/ui/program-art/README.md for limits/provenance.

# Local UX continuation after PR #13 — 2026-11-26

The owner requested a local UI/organization refinement, supplied a visual reference, distinguished equipment artwork on program cards from exact exercise thumbnails, and requested a shared LIGHT/DARK background. These changes are **uncommitted and not pushed**. PR #13 at 5e8e9e6b6e6440d2d428cddfd842eb826ffc4312 does not contain them. Existing worktree and branch retained; no merge, deployment or installation.

Implemented settings/backup relocation, central program and durable draft management, bounded day stepper, separate save-then-edit route, supplied palette, approved exercise thumbnails and local raster 3D equipment illustrations. No storage schema, generator algorithm or historical identity changes. Unit 213/213; focused Chromium 34/35 then 11/11 after correcting a test's wait; interaction/visual and art runs are separately recorded. WebKit 10/11 then the one corrected profile-switch test 1/1. These are not a full green regression. See [scope, exact evidence, files and limitations](docs/tasks/GV-UX-ORGANIZATION.md).

Preserve all unrelated untracked design boards. Physical iPhone and genuine legacy export remain open. Old-tab synchronization and non-atomic localStorage limits remain. Owner accepted the local UX and visual result on 2026-11-26; do not update PR or publish automatically.

---

# GymNastika 2.0 — project handoff

## Current release candidate — GymNastika 2.0.2 (26 Nov 2026)

This section supersedes historical release/authorization status below. Production is 2.0.1 at main be447d4f2a77ea6ca027196404b572d919c82e84, verified against GitHub on 26 Nov 2026. Accepted generator/editor/synchronization fixes are prepared on release/gymnastika-2.0.2-2026-11-26, created directly from the same current origin/main in the existing worktree, preserving unrelated files. The owner authorizes a commit, push of this branch and a new PR titled “GymNastika 2.0.2 — generator i synchronizacja”; **merge and deployment are not authorized**.

Before the additional home-screen request, no further production-code changes were needed during finalization. The subsequently authorized home-screen work is included below. Prior evidence remains: 213/213 unit tests, 33/33 focused Chromium, seven dependent editor cases, 4/4 IndexedDB refusal cases and 1/1 workout/progression/ZIP integration (separate runs). After creating the release branch, three focused Chromium cases passed in one run (10.1 s): combined generated save rollback/retry, assignment-only refusal/retry for an already saved generated program, and returning to answers/cancelling without changing the saved program. The latter two are added regressions; all compare actual persisted records.

Save and assignment in the automatic generator are one operation: on a recoverable failure, rollback retains the draft and prior program; retry retains the generated ID. A previously saved unassigned program supports separate assignment from its preview. On assignment failure the existing message says “Nie zapisano przypisania. Spróbuj ponownie.”, the program remains visible, and retry neither duplicates it nor changes its days. This is not a claim that the generator intentionally leaves a half-saved program. Uncertain integrity still blocks writes.

GitHub Pages configuration verified through authenticated API: legacy build from main at /; only the dynamic pages-build-deployment workflow exists. Pushing this release branch does not update the configured production source. Cache remains gymverse-v57; the additional authorized home-screen runtime changes are described below. No full454, installations, physical iPhone or WebKit checks during finalization. Preserve the old-tab/localStorage limits in the [repair report](docs/tasks/GV-GENERATOR-EDITOR-REPAIR.md). Await owner approval before any merge/publication.


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

## Included 2.0.2 home-screen correction

The owner additionally approved one home card per program. The active profile’s planPrograms/dayPlanIds exclusively determine membership; the assigned program is first with an “Aktywny” badge. Remaining programs have compact cards, and standalone records are in their own section without name/weekday grouping. The old duplicate assignment panel is removed. Program cards open the day list; exercises and the start action appear only after selecting a day. The generator and manual editor share this presentation. No day records are removed or migrated. startable() and nextPlanId() remain byte-equivalent (ignoring line endings) to production 2.0.1.

A targeted test exposed an incompatible old freshness check in startWorkout(): it still read removed raw snapshot fields after preview snapshots became semantic. Program starts now use the same relevant-program/day snapshot check as assignment, under the existing Web Lock, preserving actual program/day history context. Unrelated day changes do not block a start; changes to the selected program/day do. No timer, history schema, generator algorithm or backup format changes.

Verification after this addition: npm test **213/213 PASS**; one targeted Chromium run **25/25 PASS** (1.5 min), covering home cards, generated 1–6 days, manual 1/3/6 days, saved-program assignment retry, deletion, profiles, stale start, session/RIR/timer/resume, progression and ZIP integration. After the final standalone display simplification, only the four relevant card/layout cases were repeated: **4/4 PASS** (5.5 s). Prior 3/3 finalization checks and the accepted earlier results remain separate evidence, not one combined full regression. Screenshots at 390 px, LIGHT/DARK: outputs/GV-20202-HOME/{home,program,day-two}-{light,dark}-390.png and standalone-dark-390.png (local, ignored). Mobile checks include 320/375/390 px. No WebKit/physical-device claims.

The final allowlist contains **30 files**: the 22 repair files plus signal.css, home-program-cards.spec.js and six dependent test files whose navigation now uses the program card/explicit day choice. Test fixture readiness checks use the actual initialized application rather than a hidden backup-menu control. Documentation and local private memory are updated; private memory, outputs and unrelated design boards are not staged. The PR remains for owner acceptance only; do not merge or deploy.

## Local generator/editor and write-conflict repair — 26 Nov 2026

Local repair on production 2.0.1 separates the four-step automatic generator from the manual 1–6 day editor. Generated preview is read-only; explicit save and assignment share one operation and a stable draft/program identity. Failed regeneration retains the prior draft, including recovery of older drafts. The generator algorithm, Signal/Manrope and existing data model remain intact.

Whole-array/registry comparisons and JSON property-order comparisons caused false conflicts. Stable-ID merging and semantic freshness checks preserve independent edits while rejecting stale edits to the same data. A real synthetic IndexedDB history overwrite was reproduced and fixed: UI history freshness is now checked under the shared lock before deletion, even if the runtime cache has already refreshed. Program removal preserves day records/history; durable draft references prevent unsafe day deletion. Runtime writes serialize inside the existing data store; IndexedDB uses transactions, while localStorage still relies on lock/rollback/readback and is not natively multi-key atomic. integrityUncertain continues to block unsafe writes. Old tabs may not honor current locks.

Final synthetic checks: units **213/213**; one Chromium generator/editor + Stage 7A run **33/33**; seven dependent editor cases passed; four IndexedDB failure tests **4/4** after correcting the backup-menu fixture; final two-profile workout/progression/ZIP integration **1/1**. These are separate runs, not one full regression. Cache **gymverse-v57**, including the new plan-merge module, was verified offline in Chromium. No full454, Edge, WebKit, physical iPhone or authentic owner-export verification in this task.

See [full repair report](docs/tasks/GV-GENERATOR-EDITOR-REPAIR.md) for causes, deletion audit, exact file list, screenshots and test qualifications. No installs, commit, push, merge or deployment. Preserve unrelated design boards and local data. Await owner acceptance.

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

## Lokalny follow-up UX po publikacji — 26 listopada 2026

Lokalna poprawka opisana w docs/tasks/GV-POST-PRODUCTION-UX.md obejmuje ekran główny, menu kopii, odpoczynek w widoku treningu oraz dwie statystyki życia historii. Zapisane dane, aktywne profile, treningi i istniejące ZIP v5/JSON v4 pozostają w dotychczasowym magazynie i przepływach. Pomocnik statystyk pomija puste sesje i liczy tony przez dotychczasowe setLoad. Test E2E potwierdza rozdzielenie dwóch syntetycznych profili i odświeżenie po zmianach historii.

Zrzut wykrył .home-action[hidden] regression; selektor CSS i test regresyjny naprawiają przyciski, które nie powinny być widoczne. Fixture profili w nowym teście został zabezpieczony przed reseedowaniem przy reload. Cache SW wynosi gymverse-v56; SW nie przejmuje aktualnie otwartych stron i nie usuwa localStorage/IndexedDB.

Testy: npm run test:unit 200/200; Chromium celowane 6/6 (nowy UX 5/5, history-volume 1/1), włącznie z responsive 320/375/390/430 LIGHT/DARK i offline shell w Chromium. Pełne 454 E2E nie były uruchamiane; WebKit, rzeczywisty iPhone/Safari ani pełny import round-trip ZIP nie były częścią tej weryfikacji. Zrzuty ignorowane przez Git: outputs/GV-POST-PRODUCTION-UX/.

Właściciel zatwierdził przygotowanie aktualizacji GymNastika 2.0.1. Commit aplikacji 1ce648139b04bedb7cfa4ceac7428b3f2f48c593 na gałęzi release/gymnastika-2.0.1-2026-11-26 został wypchnięty, a PR #12 do main jest otwarty. PR ma 16 zmienionych plików i po odświeżeniu GitHub zgłosił mergeable=true. Scalenia ani deploy nie wykonano; produkcja pozostaje bez zmian. Nieśledzone alternatywne plansze Signal zachowano.

Final background/visual check: 2/2 Chromium, 13 views in both themes and 320/375/390/430 px. Local gallery: outputs/GV-UX-ORGANIZATION/index.html. Ready for visual review only; no publication.

Local visual correction 2026-11-26: stronger raised-card treatment requested by the owner (9px side, bevel and stronger shadow). Chromium showcase2/2 PASS across320–430px LIGHT/DARK; latest screenshots14-raised-cards-light/dark-390. Presentation only; no publication.
