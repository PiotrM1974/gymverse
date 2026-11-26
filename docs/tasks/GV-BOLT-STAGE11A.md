# Etap 11A — inwentaryzacja zestawu wydania

Stan: 2026-11-26. Dokument przygotowuje allowlistę; niczego nie dodano do indeksu Git.

## Werdykt

Zestaw nie jest jeszcze gotowy do commita. Allowlista obejmuje 169 plików, ale część starszych testów E2E wymaga 20 lokalnych plików w `outputs/`, obecnie celowo ignorowanych. Cztery referencyjne PNG mają 1,8–2,2 MB każdy. Przed commitem trzeba bezpiecznie przenieść te syntetyczne fixtures do `tests/fixtures` i odnieść do nich testy albo osobno uzasadnić ich wersjonowanie. Pliki pozostają na dysku.

## Stan Git i zdalny

- Worktree: `backup/worktrees/gv-musclemap-atlas-2d`.
- Lokalna gałąź `feature/gymnastika-approved-ui`, HEAD `fc6f1778483c3e623003be2479ce786be9baf1ae`.
- Rozwinięty status przed nowymi regułami ignore: 6 349 plików (23 modified, 6 326 untracked; w tym 6 074 z `outputs/`).
- Po dodaniu reguł ignore: 24 modified i 156 untracked; status nie zmienia ani nie usuwa plików. Raport Stage 11A powiększa zestaw o 1.
- Remote feature wskazuje na `fc6f177...`; remote `main` to `e5b119251ac442796d399f123420412164a62813`, którego drzewo zawiera już ten feature przez merge PR #10. Porównanie `main...feature` zwróciło 0 commitów naprzód i 0 zmienionych plików; feature jest 3 commity za main w historii. Lokalny `main` nadal wskazuje `7d32975` i jest 16 commitów za `origin/main`; nie synchronizowano go.

## Allowlista przyszłego commita — dokładne ścieżki (169)

Lista obejmuje aktualne zmiany źródeł i testów, dokumentację etapów, uzgodnione źródła Signal i ten manifest. Nie obejmuje lokalnej pamięci ani lokalnych wyników testów.

### Root/PWA/process (5)

- `.gitignore`
- `AGENTS.md`
- `README.md`
- `index.html`
- `sw.js`

### Application source and fonts

- `src/exercise/catalog.js`
- `src/exercise/presentation-extension.schema.json`
- `src/features/anatomy/atlas.css`
- `src/features/anatomy/atlas.js`
- `src/features/backup/import-plan.js`
- `src/features/backup/import-preview.js`
- `src/features/plans/generated-program.js`
- `src/features/plans/generator.js`
- `src/features/plans/history-context.js`
- `src/features/plans/program-drafts.js`
- `src/features/plans/program-editor-ui.js`
- `src/features/plans/program-editor.js`
- `src/features/plans/programs.js`
- `src/features/plans/progression.js`
- `src/features/plans/synchronization.js`
- `src/features/profiles/profile-model.js`
- `src/gv-data.js`
- `src/ui/fonts/manrope-latin-ext-variable.woff2`
- `src/ui/fonts/manrope-latin-variable.woff2`
- `src/ui/fonts/OFL.txt`
- `src/ui/signal.css`

### Automated tests

- `tests/e2e/anatomy-atlas.spec.js`
- `tests/e2e/approved-workout-layout.spec.js`
- `tests/e2e/atlas-consistency.spec.js`
- `tests/e2e/atlas-image-offline.spec.js`
- `tests/e2e/atlas-layout-hardening.spec.js`
- `tests/e2e/atlas-variant-audit.spec.js`
- `tests/e2e/base-b-regressions.spec.js`
- `tests/e2e/bolt-stage10a-active-set.spec.js`
- `tests/e2e/bolt-stage10a-manrope.spec.js`
- `tests/e2e/bolt-stage10a-panels.spec.js`
- `tests/e2e/bolt-stage10a.spec.js`
- `tests/e2e/bolt-stage10b.spec.js`
- `tests/e2e/bolt-stage2-profile-fix.spec.js`
- `tests/e2e/bolt-stage2.spec.js`
- `tests/e2e/bolt-stage3-closure.spec.js`
- `tests/e2e/bolt-stage3-final.spec.js`
- `tests/e2e/bolt-stage3.spec.js`
- `tests/e2e/bolt-stage4.spec.js`
- `tests/e2e/bolt-stage5.spec.js`
- `tests/e2e/bolt-stage6-welcome-fix.spec.js`
- `tests/e2e/bolt-stage6.spec.js`
- `tests/e2e/bolt-stage62-choices.spec.js`
- `tests/e2e/bolt-stage62.spec.js`
- `tests/e2e/bolt-stage63a-closure.spec.js`
- `tests/e2e/bolt-stage63a.spec.js`
- `tests/e2e/bolt-stage63b.spec.js`
- `tests/e2e/bolt-stage63c-lock.spec.js`
- `tests/e2e/bolt-stage63c.spec.js`
- `tests/e2e/bolt-stage64-synchronization-diagnostic.spec.js`
- `tests/e2e/bolt-stage64b.spec.js`
- `tests/e2e/bolt-stage64d.spec.js`
- `tests/e2e/bolt-stage7a.spec.js`
- `tests/e2e/bolt-stage7b.spec.js`
- `tests/e2e/bolt-stage7c.spec.js`
- `tests/e2e/bolt-stage8.spec.js`
- `tests/e2e/bolt-stage9.spec.js`
- `tests/e2e/closure-21.spec.js`
- `tests/e2e/exercise-illustrations-preview.spec.js`
- `tests/e2e/exercise-images-complete.spec.js`
- `tests/e2e/exercise-images-three.spec.js`
- `tests/e2e/exercise-legacy-image-fallback.spec.js`
- `tests/e2e/exercise-presentation-pilot.spec.js`
- `tests/e2e/gv-data.spec.js`
- `tests/e2e/gv-musclemap-anatomy-review.spec.js`
- `tests/e2e/gv-musclemap-full-catalog.spec.js`
- `tests/e2e/gv-musclemap-highlight-diagnostic.spec.js`
- `tests/e2e/gv-musclemap-highlight-engine.spec.js`
- `tests/e2e/gv-musclemap-highlight-visual.spec.js`
- `tests/e2e/gv-musclemap-qa-gate.spec.js`
- `tests/e2e/header-screenshot-repro.spec.js`
- `tests/e2e/helpers/seed-musclemap-workout.js`
- `tests/e2e/history-volume.spec.js`
- `tests/e2e/phase0-export-compatibility.spec.js`
- `tests/e2e/profiles.spec.js`
- `tests/e2e/session-results-swaps.spec.js`
- `tests/e2e/smart-backup.spec.js`
- `tests/e2e/technique-panels.spec.js`
- `tests/e2e/variant-flow.spec.js`
- `tests/e2e/workout.spec.js`
- `tests/unit/anatomy-atlas.test.js`
- `tests/unit/branding.test.js`
- `tests/unit/closure-profile-roundtrip.test.js`
- `tests/unit/full-catalog-mapping.test.js`
- `tests/unit/generated-program.test.js`
- `tests/unit/gv-data.test.js`
- `tests/unit/highlight-engine.test.js`
- `tests/unit/history-context.test.js`
- `tests/unit/inline-functions.test.js`
- `tests/unit/plan-generator.test.js`
- `tests/unit/plan-programs.test.js`
- `tests/unit/profile-model.test.js`
- `tests/unit/program-assignment.test.js`
- `tests/unit/program-drafts.test.js`
- `tests/unit/program-editor.test.js`
- `tests/unit/progression.test.js`
- `tests/unit/service-worker.test.js`
- `tests/unit/smart-backup.test.js`
- `tests/unit/training-goal.test.js`

### Project tools

- `tools/ace-explore.mjs`
- `tools/build-exercise-images-complete.mjs`
- `tools/build-exercise-images-three.mjs`
- `tools/build-exercise-presentation-release.mjs`
- `tools/compose-exercise-pair.ps1`
- `tools/crawl-ace-exercise-index.mjs`
- `tools/enrich-ace-exercise-index.mjs`
- `tools/fetch-ace-photo.mjs`
- `tools/serve-test.mjs`
- `tools/verify-published-v20.mjs`

### Project documentation

- `docs/backup-import-contract.md`
- `docs/backup-import-report.md`
- `docs/bolt-stage3-connection-plan.md`
- `docs/bolt-stage5-plan.md`
- `docs/bolt-stage6-plan.md`
- `docs/bolt-stage63c-plan.md`
- `docs/closure-21-report.md`
- `docs/gymnastika-stage63-data-contract.md`
- `docs/reference/ACE-EXERCISE-INDEX.json`
- `docs/reference/FITCRON-VISUAL-REFERENCE.md`
- `docs/reports/GV-MUSCLEMAP-ATLAS-2D-REPORT.md`
- `docs/research/DATA_PROVENANCE.md`
- `docs/research/EVIDENCE_LIMITATIONS.md`
- `docs/research/EVIDENCE_MATRIX.md`
- `docs/research/EXERCISE_COVERAGE.md`
- `docs/research/RESEARCH_CHANGELOG.md`
- `docs/research/SCIENTIFIC_RULES.md`
- `docs/research/SOURCES.md`
- `docs/superpowers/plans/2026-11-22-gv-exercise-illustrations-production.md`
- `docs/superpowers/plans/2026-11-22-gv-exercise-presentation-contract-and-pilot.md`
- `docs/tasks/GV-BOLT-STAGE1.md`
- `docs/tasks/GV-BOLT-STAGE10A.md`
- `docs/tasks/GV-BOLT-STAGE10B.md`
- `docs/tasks/GV-BOLT-STAGE10C.md`
- `docs/tasks/GV-BOLT-STAGE11A.md`
- `docs/tasks/GV-BOLT-STAGE2.md`
- `docs/tasks/GV-BOLT-STAGE3.md`
- `docs/tasks/GV-BOLT-STAGE4.md`
- `docs/tasks/GV-BOLT-STAGE5.md`
- `docs/tasks/GV-BOLT-STAGE6.md`
- `docs/tasks/GV-BOLT-STAGE63A.md`
- `docs/tasks/GV-BOLT-STAGE63B.md`
- `docs/tasks/GV-BOLT-STAGE63C.md`
- `docs/tasks/GV-BOLT-STAGE64.md`
- `docs/tasks/GV-BOLT-STAGE7A.md`
- `docs/tasks/GV-BOLT-STAGE7B.md`
- `docs/tasks/GV-BOLT-STAGE7C.md`
- `docs/tasks/GV-BOLT-STAGE8.md`
- `docs/tasks/GV-BOLT-STAGE9.md`
- `docs/tasks/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION.md`
- `docs/tasks/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT.md`
- `docs/tasks/GV-EXERCISE-VISUAL-UNIFICATION-AND-UI-HARDENING.md`
- `docs/tasks/GV-FULL-BACKUP-IMPORT.md`
- `docs/tasks/GV-MUSCLEMAP-ANATOMY-REVIEW.md`
- `docs/tasks/GV-MUSCLEMAP-ATLAS-2D.md`
- `docs/tasks/GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE.md`
- `docs/tasks/GV-MUSCLEMAP-HIGHLIGHT-ENGINE.md`
- `docs/tasks/GV-PWA-EXERCISE-ATLAS-CONSISTENCY-AND-OFFLINE-RECOVERY.md`

### Approved Signal design references (7)

- `design/gymnastika-redesign/README.md`
- `design/gymnastika-redesign/approvals.md`
- `design/gymnastika-redesign/decisions.md`
- `design/gymnastika-redesign/design-handoff.md`
- `design/gymnastika-redesign/screen-inventory.md`
- `design/gymnastika-redesign/implementation-instruction.md`
- `design/gymnastika-redesign/design-system/signal-tokens.md`

## Lokalne fixtures wymagane przez część testów — 20 ścieżek, nie są allowlistą publikacji

Testy odwołują się do tych ścieżek. Cztery `reference-art/*.png` ważą po ok. 1,8–2,2 MB; nie proponuję publikować ich jako ciężkich binariów. Pozostałe są małymi syntetycznymi/wersjonowanymi snapshotami. Wszystkie pozostają lokalne w `outputs/`. Rehoming do `tests/fixtures` z zachowaniem asercji jest warunkiem odtwarzalnej regresji z czystego checkoutu.

- `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/preview.html`
- `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/preview.css`
- `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/preview.js`
- `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/reference-art/db_bench-paired-draft.png`
- `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/reference-art/lat_pulldown_wide-paired-draft.png`
- `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/reference-art/lat_raise_stand-paired-draft.png`
- `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/reference-art/leg_press-paired-draft.png`
- `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/presentation-registry.json`
- `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/snapshots/input/atlas.css`
- `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/snapshots/input/atlas.js`
- `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/snapshots/input/index.html`
- `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/snapshots/input/sw.js`
- `outputs/GV-LAT-RAISE-MALE-FEMALE/selected/technique/lat_raise_stand__default-female.webp`
- `outputs/GV-LAT-RAISE-MALE-FEMALE/selected/technique/lat_raise_stand__default-male.webp`
- `outputs/GV-LAT-RAISE-MALE-FEMALE/selected/thumbnails/lat_raise_stand__default-female.webp`
- `outputs/GV-LAT-RAISE-MALE-FEMALE/selected/thumbnails/lat_raise_stand__default-male.webp`
- `outputs/GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE/after/exercise-db_bench.png`
- `outputs/GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE/after/exercise-lat_pulldown_wide.png`
- `outputs/GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE/after/exercise-lat_raise_stand.png`
- `outputs/GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE/after/exercise-leg_press.png`

## Klasyfikacja i ignore

| Grupa | Liczba | Decyzja |
|---|---:|---|
| Zmodyfikowane pliki kodu/PWA/testów/narzędzi | 24 (w tym `.gitignore`) | Kandydaci allowlisty; przejrzeć diff przed stagingiem |
| Nowe źródła `src/` | 16 | Włączyć; WOFF2 są lokalnymi zasobami aplikacji |
| Testy `tests/` łącznie | 78 | Włączyć; zachować asercje, najpierw przenieść fixtures |
| Dokumentacja `docs/` i ten manifest | 48 | Włączyć; kontrakty, raporty i dokumenty etapów |
| Narzędzia `tools/` łącznie | 10 | Włączyć po sprawdzeniu lokalnych ścieżek i sekretów |
| Zatwierdzone teksty Signal | 7 | Włączyć wyłącznie wskazane teksty |
| Inne design boardy i warianty | 12 tekstowych + 74 PNG | Pominąć: historyczne prototypy/alternatywy i zrzuty |
| Nieśledzone `outputs/` | 6 074 | Pominąć: raporty, zrzuty, trace, ZIP, runtime WebKit i lokalne źródła; nie czytano archiwów |
| `.atlas-import-tmp/` | 6 | Pominąć: trace/cache/zrzuty tymczasowe |
| `outputs-smart-backup-*.log` | 14 | Pominąć: lokalne logi; payloadów nie przeglądano |
| `PROJECT_MEMORY.md` | 1 | Pamięć lokalna; nie publikować w repo |
| `playwright.header.config.js` | 1 | Konfiguracja diagnostyczna na stałym porcie; nie publikować |
| Duże binaria | w `outputs/` i PNG designu | Nie commitować, zwłaszcza ZIP/runtime przeglądarki i duże podglądy |

Nie znaleziono typowych wzorców tokenów w wcześniej przeszukanych plikach poza `outputs/`. To nie jest audyt zawartości ignorowanych archiwów; pozostają wykluczone.

Dodano reguły `.gitignore`: `/PROJECT_MEMORY.md`, `/outputs/`, `/outputs-smart-backup-*.log`, `/.atlas-import-tmp/`, `/playwright.header.config.js`, `/design/gymnastika-redesign/**/*.png`. Ignorowanie nie usuwa plików. Dwa już śledzone pliki approval w `outputs/` pozostają śledzone.

## GitHub Pages i działania automatyczne

Repo jest publiczne, domyślna gałąź `main`; `main` i feature nie są chronione, brak wymaganych status checks. Zdalna feature = lokalny HEAD. Ostatnie Actions pokazują wbudowany dynamiczny Pages: `build` (Jekyll) i `deploy`, sukces dla main SHA `e5b119...` 24.11.2026. W repo nie ma `.github/workflows`. Push feature nie wdraża. Merge nowego commita do main uruchomi automatyczne Pages. Endpoint ustawień Pages nie był dostępny przez dozwolony odczyt connectora; dokładna konfiguracja source nie została odczytana bezpośrednio. Historia repo opisuje Pages z `main` i katalogu głównego.

## Następna kolejność

1. Bezpiecznie przenieść test fixtures bez osłabiania asercji; rozstrzygnąć kompresję czterech dużych PNG.
2. Wykonać testy fizycznego iPhone’a i zapisać wyniki; poprawki tylko po uzasadnieniu.
3. Po otrzymaniu autentycznego ZIP v5 testować jego kopię w nowym originie/magazynie, bez produkcyjnego importu.
4. Przed wydaniem odświeżyć lokalny obraz remote main i ponownie przejrzeć allowlistę; nie dodawać całych katalogów.
5. Wykonać jeden końcowy przebieg testów, kontrolę sekretów i plików binarnych.
6. Po akceptacji przygotować commit/PR, skontrolować dokładny diff i spodziewane wdrożenie Pages po merge.
7. Publikacja i rollback wyłącznie po osobnej zgodzie.

Nie wykonano żadnej operacji zapisu na GitHubie, stagingu ani publikacji.

## Uzupełnienie allowlisty — Stage 11B

Do bazowej allowlisty 169 ścieżek należy dopisać 22 pozycje: 16 fixtures, `PROJECT_HANDOFF.md`, `docs/tasks/GV-BOLT-STAGE11B.md`, `tools/prepare-staging.mjs`, `src/exercise/presentation-contract.js`, `tests/unit/exercise-presentation-contract.test.js` i `tools/serve-presentation-pilot.mjs`. Suma przyszłych kandydatów: 191. Pozostałych 12 wpisów Git to alternatywne, niezatwierdzone design boardy z `design/gymnastika-redesign/`; pozostają poza allowlistą. Pakiet pod `outputs/GV-STAGE11B-STAGING/` i `PROJECT_MEMORY.md` pozostają wykluczone.
