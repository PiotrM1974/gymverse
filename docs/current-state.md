# GymVerse — audyt stanu bazowego (GV-BASE-A)

## Zakres i punkt odniesienia

- Data audytu: 2026-11-20 (Europe/Warsaw).
- Repozytorium: `PiotrM1974/gymverse`, klon `backup/gymverse-2026-11-20`.
- `BASE_SHA`: `dd479a5e9726d12726581e570790b95bfdc50457`.
- SHA lokalnego `main` na początku pracy: taki sam jak powyżej; `origin/main` również wskazywał ten SHA.
- Początkowy `git status --porcelain=v1 -uall`: pusty.
- Etap: potwierdzony jako nierozpoczęty przed tą pracą: lokalnie istniała tylko gałąź `main`; GitHub API zwróciło wyłącznie `main` i brak PR-ów dla repozytorium.
- Gałąź robocza: `feature/gv-base-a-tests`, utworzona od `BASE_SHA` w osobnym worktree. Kopia backupowa pozostała nietknięta.

## Repozytorium, hostowanie i pliki

- Aplikacja to statyczne PWA w języku polskim. UI, style, dane domyślnych planów i logika są w `index.html`; osobne pliki to `sw.js`, `manifest.webmanifest`, ikony i `img/`.
- Rootowe pliki powłoki w `BASE_SHA`: `README.md`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `index.html`, `manifest.webmanifest`, `sw.js`; katalog `img/` ma 21 śledzonych obrazów. Nie ma bundlera, `src/`, testów, CI ani licencji w root.
- Repozytorium GitHub jest publiczne, domyślna gałąź `main`, `has_pages=true`. Odczyt konfiguracji `/pages` przez dostępną integrację GitHub został odrzucony jako niedozwolony endpoint; źródło publikacji Pages i dostępność strony nie zostały zatem potwierdzone.
- `git config --get core.autocrlf`: `true`. `git ls-files --eol`: `index.html`, `sw.js`, `manifest.webmanifest` są LF w indeksie i CRLF w working tree; README ma LF; obrazy mają atrybut `-text`. Żadna z tych istniejących treści nie została zmodyfikowana ani znormalizowana.
- Środowisko: Node `v26.13.0`, npm `11.20.0`, Git dostępny; `gh` nie jest zainstalowany. Przypięcie Node w etapie: `.node-version` = `26.13.0`.

## Aplikacja i zachowanie danych

- Dane są przechowywane przez wrapper `LS` w `localStorage`; nie ma serwera aplikacyjnego ani IndexedDB.
- Odczytane klucze: `gymverse_schema`, `gymverse_history`, `gymverse_active`, `gymverse_plans`, `gymverse_custom`, `gymverse_body`, `gymverse_last_weights`, `gymverse_rest`, `gymverse_bar`, `gymverse_last_backup`, `gymverse_deload_until`, `gymverse_deload_start`, `gymverse_deload_snooze`, `gymverse_goal`, `gymverse_history_backup_v1`.
- Schemat historii ustawiany przez kod: wersja 2. Eksport JSON zawiera `app: "gymverse"`, `version: 4`, `exportedAt`, `history`, `lastWeights`, `body`, `plans`, `custom`.
- Zapisana sesja historii: `date`, `planId`, `planTitle`, `totalVolume`, `totalReps`, `details`; opcjonalnie `durationMin`, `rir`. Każdy element `details`: `exerciseId`, `exerciseName`, `setNumber`, `weight`, `reps`, `date`.
- Aktywny trening: `planId`, `step`, `sets`, `startedAt`, `timerEndAt`, `swaps`, `setCount`, `rir`. Zatwierdzona seria w pamięci sesji ma `step`, `key`, `name`, `setNumber`, `weight`, `reps`, `date`; `finishWorkout` mapuje ją do historycznego kształtu `details`.
- Nieobecne w odczytanym modelu legacy: `variantId`, typ sprzętu, `side`, `sideResults`, osobne pole obciążenia własnego ciała, liczba przyrządów i sposób liczenia powtórzeń. `isBW` jest klasyfikacją runtime z listy ćwiczeń (`pullup`, `dips`, `pushup`), nie polem sesji. Nie odczytywano prywatnych danych ani eksportów użytkownika.
- Helpery potwierdzone w bieżącym kodzie inline: `e1rm` (const arrow), `isBW` (const arrow), `setLoad` (const arrow), `metric` (const arrow), `normalizeSession` (function), `weekStart` (function). `recalcSession` również jest function i wylicza `totalVolume`/`totalReps`; nie jest osobnym zapisanym rekordem.
- Obecne, zaobserwowane semantyki: Epley do szacunku 1RM (`r<=1` zwraca ciężar), `setLoad` mnoży ciężar przez powtórzenia, a dla BW używa pomiaru masy ciała plus obciążenie; `metric` dla BW zwraca `w*1000+r`; `weekStart` wyznacza poniedziałek lokalnego tygodnia; normalizacja odrzuca serie z niepoprawnym ciężarem/powtórzeniami i zaokrągla powtórzenia.

## Pliki etapu i charakter testów

- `tests/unit/inline-functions.test.js`: bezpośrednia charakterystyka funkcji wyciętych z aktualnego inline JavaScript; produkcyjny plik HTML nie jest instrumentowany ani zmieniany.
- `tests/fixtures/`: wyłącznie fikcyjne przykłady pustego stanu, aktywnej sesji, historii v2 i kopii JSON v4.
- `tests/e2e/workout.spec.js`: ścieżka startu planu, zapis serii, zakończenia, odświeżenia i importu fixture v4.
- `tools/serve-test.mjs`: serwer testowy wiąże wyłącznie `127.0.0.1:41739`, ogranicza odczyt do realnej ścieżki checkoutu i odrzuca traversal oraz symlinki wychodzące poza checkout.
- `package.json`, `package-lock.json`, `vitest.config.js`, `playwright.config.js`: przypięty, minimalny harness Vitest/Playwright.
- Nie zmieniono semantyki, interfejsu, service workera ani danych treningowych. Znane usterki z testów będą oznaczone jako reprodukcje, nie jako naprawione zachowanie.

## Wyniki testów i kontrola ochrony

- `node --version`: `v26.13.0`; wersja przypięta w `.node-version`.
- `npm test`: PASS, 1 plik testowy, 7/7 testów. Testy obejmują parsowanie inline JS oraz zachowanie `e1rm`, `isBW`, `setLoad`, `metric`, `weekStart`, `normalizeSession`.
- `npm run test:e2e -- --project=chromium`: nieukończone. Playwright uruchamia własny serwer, ale health-check E2E nie uzyskał odpowiedzi w tym sandboxie. Port `4173` był zajęty przy pierwszej próbie; proces/portu nie dało się wiarygodnie zidentyfikować, bo CIM zwrócił odmowę dostępu. Po zmianie na `41739` runner nadal zawisł przed rozpoczęciem testu. Nie zaliczono E2E.
- `npx playwright install chromium`: archiwum Chromium (ok. 149 MB) pobrano; instalator nie zakończył się w rozsądnym czasie. Pliki Chromium pojawiły się w lokalnym katalogu Playwright i `npx playwright install --list` wskazał `chromium-1194`. To nie jest wynik testu przeglądarkowego.
- WebKit: nie zainstalowano ani nie uruchomiono; Safari/iOS nie testowano.
- `npm audit --omit=dev`: 0 podatności w produkcyjnych zależnościach (brak produkcyjnych zależności). Pełny `npm audit` nie uzyskał dostępu do endpointu rejestru npm (`ENOTFOUND`), więc status podatności przypiętych zależności developerskich jest niezweryfikowany. Przy `npm install` npm zgłosił 3 advisories w zależnościach developerskich; nie aktualizowano ich poza zakresem audytu.
- Weryfikacja na `BASE_SHA` `dd479a5e9726d12726581e570790b95bfdc50457`: `git diff --name-status` kod wyjścia 0 (brak zmian śledzonych); `git diff --exit-code BASE_SHA -- index.html sw.js manifest.webmanifest apple-touch-icon.png icon-192.png icon-512.png img` kod wyjścia 0 (brak zmian chronionych); początkowy `git status --porcelain=v1 -uall` był pusty.
- Lista nowych plików (wtedy nieśledzonych): `.gitattributes`, `.gitignore`, `.node-version`, `docs/current-state.md`, `package-lock.json`, `package.json`, `playwright.config.js`, `tests/e2e/workout.spec.js`, `tests/fixtures/active-session.json`, `tests/fixtures/backup-v4.json`, `tests/fixtures/empty-state.json`, `tests/fixtures/history-v2-fragment.json`, `tests/unit/inline-functions.test.js`, `tools/serve-test.mjs`, `vitest.config.js`. Pełna lista jest dozwolona przez §0.2; pliki rootowe powłoki są niezmienione. Syntetyczne fixtures są fikcyjne.
- Ostateczne kontrole po stagingu: `git diff --name-status BASE_SHA` wykazał 15 nowych plików (`A`), bez `M/D/R`; allowlista §0.2 zaliczona. `git diff --exit-code BASE_SHA --` dla chronionych plików zwrócił 0; `git ls-files --others --exclude-standard` pusty po stagingu. `git diff --cached --check` zwrócił 0. `git ls-tree BASE_SHA` potwierdził, że pliki powłoki w root pozostały bez zmian.

## Kontynuacja GV-BASE-A — E2E i zależności

- Zachowany `BASE_SHA`: `dd479a5e9726d12726581e570790b95bfdc50457`; wcześniejszy commit pozostaje `bb22befc7b7c779eed1643cc2a60d4629e899327`. Pracowano dalej na tej samej gałęzi `feature/gv-base-a-tests`.
- Diagnoza loopback: `tools/serve-test.mjs` poprawnie wypisał `Test server listening at http://127.0.0.1:41739` i ograniczony root checkoutu. `Invoke-WebRequest` z sandboxowego PowerShella zwrócił „Została podjęta próba uzyskania dostępu do gniazda w sposób zabroniony przez przypisane do niego uprawnienia dostępu.” E2E uruchomione w tym samym kontekście z uprawnieniem do loopback poprawnie przeszło health-check i rozpoczęło Chromium. Zatem wcześniejszy health-check wynikał z izolacji socketów pomiędzy kontekstami procesu; w pierwszym teście konfiguracja ponadto próbowała użyć portu 41739, gdy osobno uruchomiony serwer już go zajmował (`EADDRINUSE`). Żadnego obcego procesu nie zatrzymano. Testowy serwer wiąże `127.0.0.1`, nie `0.0.0.0`.
- `npm run test:e2e -- --project=chromium` z `PLAYWRIGHT_CHANNEL=msedge`, uruchomione w jednym kontekście loopback: **PASS, 1/1** (Edge z silnikiem Chromium, test startu planu, zapis serii, zakończenie, reload, historia i import fikcyjnego v4). Początkowe próby testu ujawniły dwa błędy selektorów; poprawiono wyłącznie `tests/e2e/workout.spec.js`.
- `npm test` po poprawkach: **PASS, 7/7**.
- Chromium bundled Playwright nie był kompletny: instalator pobrał archiwum, ale nie utworzył `headless_shell.exe`. Dlatego E2E uruchomiono z zainstalowanym Microsoft Edge poprzez opcjonalne `PLAYWRIGHT_CHANNEL=msedge`; domyślny Playwright Chromium pozostaje skonfigurowany.
- WebKit nie jest dostępny w cache Playwright (`npx playwright install --list` wyświetlał wyłącznie `chromium_headless_shell-1194`); nie uruchomiono projektu WebKit. Nie oznacza to testu Safari/iOS.
- `npm audit --json` (z dostępem do rejestru, bez zmian w pakietach) zgłosił trzy podatne pakiety: `vitest@3.2.4` — **critical** (advisories GHSA-5xrq-8626-4rwp; zakres `<3.2.6`, oraz GHSA-82fw-gwwq-j7x9); `tinypool@1.1.1` — **critical** (GHSA-5gmw-xhrv-c9v3 oraz GHSA-85c8-ppgw-ccpr; zakresy `<=2.1.0` i `<2.1.2`); `@vitest/mocker@3.2.4` — **moderate** (GHSA-82fw-gwwq-j7x9 i GHSA-qxg6-89mg-rqv8; zakresy `<4.1.11` i `<4.1.12`). npm wskazuje Vitest `3.2.7` jako nie-majorową naprawę; pakietów nie aktualizowano bez akceptacji.
- GitHub: repozytorium publiczne i odczytane przez integrację; lokalny remote wskazuje na `https://github.com/PiotrM1974/gymverse`. `git credential.helper=manager`, ale bezinteraktywne sprawdzenie poświadczeń zwróciło brak lokalnego loginu. Nie zapisano ani nie wyświetlono sekretów. Push/PR wymagają lokalnego logowania GitHub.
