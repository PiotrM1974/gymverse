# GYMVERSE 2.0 — MASTER PROMPT DLA CODEX DESKTOP (WERSJA 2.8 — SKONSOLIDOWANA)

**Wersja specyfikacji:** 2.8 (po audycie v2.7, 2026-11-20)  
**Status:** kompletna, wersjonowana specyfikacja. **Pierwsze zlecenie (historyczne po wykonaniu i zatwierdzeniu):** wyłącznie `GV-BASE-A`. Zanim je uruchomisz, zastosuj weryfikację jego rzeczywistego statusu (§0.2). Po zakończeniu/akceptacji instrukcja START (§17) jest archiwalna, nie stanowi polecenia ponownego wykonania. Żadne dalsze etapy ani wdrożenia nie są automatycznie autoryzowane; bieżący zakres określa wyłącznie nowe, jawnie zatwierdzone przez właściciela zlecenie i odpowiadający mu plik `docs/tasks/GV-*.md`.  
**Repozytorium:** `PiotrM1974/gymverse` — https://github.com/PiotrM1974/gymverse  
**Gałąź bazowa:** `main`  
**Środowisko pracy deweloperskiej:** Windows 11 / Codex Desktop  
**Docelowa platforma:** Progressive Web App (PWA) na iPhone i Windows 11; hosting frontendowy GitHub Pages  
**Język interfejsu:** polski  
**Zasada nadrzędna:** zachowaj istniejący projekt, plany, historię, pomiary, ustawienia i działanie offline. Nie przebudowuj od zera.

> **Jesteś Codexem pracującym nad istniejącą aplikacją GymVerse.** Przy **pierwszym uruchomieniu z niniejszego pliku**, po uprzedniej weryfikacji według §0.2, że `GV-BASE-A` nie został rozpoczęty ani zakończony, **wykonaj wyłącznie GV-BASE-A**: audyt, testy charakteryzujące stan obecny i dokumentację. Nie naprawiaj jeszcze logiki, nie migruj danych, nie generuj biblioteki grafik ani nie wdrażaj Cloudflare. Zatrzymaj się po raporcie/PR; kolejnym etapem do osobnej zgody jest GV-DOC. **Po zakończeniu GV-BASE-A ten akapit i §17 są historycznym zapisem pierwszego zlecenia, a nie ciągłą instrukcją uruchamiania GV-BASE-A.**

### START — jedno źródło jednorazowego polecenia

**Wyłącznie po sprawdzeniu statusu GV-BASE-A według §0.2**, obowiązuje jednorazowa procedura §17 „PIERWSZE URUCHOMIENIE — tylko GV-BASE-A”. Po zakończeniu etapu nie wracaj do §17 automatycznie. Dla następnych etapów obowiązuje **nowa, jawna zgoda właściciela i właściwy plik `docs/tasks/GV-*.md`**; dokument master zawiera wymagania, a nie automatyczną autoryzację prac. W razie niezgodności przykładów z kontraktami (§2–3, §7–8), nie implementuj przykładu; opisz konflikt w raporcie.

**W ramach jednorazowego GV-BASE-A** nie naprawiaj logiki biznesowej, nie migruj danych, nie publikuj na GitHub Pages i nie uruchamiaj płatnych usług. Po raporcie / PR z `GV-BASE-A` zatrzymaj się.

---

### Rejestr zmian względem v2.7 (informacyjny)

- Status `GV-BASE-A` ustalaj na podstawie faktycznych dowodów; samo istnienie gałęzi, pliku lub PR nie oznacza ukończenia. Przy niedostępnym GitHub nie domniemaj stanu zdalnego.
- Jawne zlecenie właściciela „Wykonaj GV-BASE-A” w bieżącej rozmowie, razem z udostępnionym masterem, jest wystarczającą zgodą na **ten jeden etap**, o ile jego status pozwala na rozpoczęcie. Samo pobranie/otrzymanie pliku nie jest zgodą na jego wykonanie.
- Zapisz niezmienny `BASE_SHA` commita `main` **przed** utworzeniem gałęzi i pierwszymi zmianami. Kontrolę ochrony plików wykonuj względem tego commita, nie względem ruchomej gałęzi `main`.
- Przed i po pracy zbadaj wszystkie rodzaje zmian Git: pliki śledzone, staged/unstaged, dodania, usunięcia, przemianowania i pliki nieśledzone; precyzyjna lista dozwolonych plików znajduje się w §0.2. W raporcie zachowaj dowody i kody zakończenia poleceń.
- Jeżeli repo nie ma dostępu do GitHuba, a lokalnie nie ma śladów rozpoczęcia BASE-A, oznacz „nierozpoczęty lokalnie, niezweryfikowany zdalnie” i przed utworzeniem gałęzi uzyskaj jedno zdanie właściciela potwierdzające brak wcześniejszego rozpoczęcia.
- Przed migracją danych i przyszłymi PR nadal obowiązują wszystkie ustalenia z wersji 2.7: ochrona oryginalnych danych, 31 ćwiczeń i 4 warianty, grafiki anatomiczne, szczegółowa metryka hantli, jednostronne serie, GitHub Pages i Web Push na iPhonie.

---

## 0. Zasady pracy i zakres odpowiedzialności

1. Najpierw pobierz i zbadaj **aktualny stan** repozytorium, bieżący SHA gałęzi `main`, pliki, katalog `img/`, konfigurację GitHub Pages, licencje wykorzystanych zasobów, stan testów i historii commitów. To, co w tej specyfikacji opisano jako „obecny kod”, pochodzi z wcześniejszej inspekcji `index.html` (ok. 2 202 linii, SHA pliku `064663b7916606e4cf5cd0432e25e7a116581161`) i może wymagać korekty po ponownym odczycie.
2. Nie usuwaj, nie resetuj i nie nadpisuj w sposób destrukcyjny: `gymverse_history`, `gymverse_active`, `gymverse_plans`, `gymverse_custom`, `gymverse_body`, `gymverse_last_weights`, ustawień ani pozostałych kluczy użytkownika. **Dane żyjące w Safari/iPhone nie znajdują się w GitHubie** — nie zakładaj, że masz do nich dostęp.
3. Repozytorium jest publiczne. Nigdy nie commituj tokenów, sekretów, prywatnego klucza VAPID, danych produkcyjnych użytkownika ani jego prywatnych kopii historii.
4. Każdy etap realizuj na osobnej gałęzi, kończ testami adekwatnymi do zakresu, dokumentacją i Pull Requestem, o ile masz dostęp. Nie merge'uj do `main`, nie publikuj produkcyjnie i nie wdrażaj infrastruktury wymagającej konta/płatności bez zatwierdzenia. Kolejną gałąź twórz **od bieżącego `main` po zaakceptowanym merge poprzedniej zależności**, nigdy od przestarzałego `main`; jeśli merge nie nastąpił, zgłoś blokadę lub uzgodnij jawnie gałąź bazową PR. Nie tworzyć ukrytego łańcucha gałęzi.
5. Jeśli coś jest nieustalone i wpływa na bezpieczeństwo danych, koszty, poprawność anatomii lub semantykę pomiarów — zgłoś **konkretną decyzję do podjęcia**, z bezpiecznym wariantem domyślnym. Nie zgaduj.
6. Nie deklaruj wykonania obrazów, uruchomienia serwera, testu prawdziwego iPhone'a ani sukcesu push bez faktycznej weryfikacji. Gdy nie masz generatora — przygotuj manifest/briefy i oznacz `pending`. Zdjęcie referencyjne `tri_machine` musi zostać jawnie dostarczone do środowiska Codexa; nie udawaj dostępu do załącznika z innej sesji.
7. **Zatwierdzony harness:** Node.js **26 Active LTS na 2026-11-20** (Node 24 to Maintenance LTS; sprawdź bieżący stan, a dokładny przetestowany patch przypnij w `.node-version` / `.nvmrc` oraz w CI), **Vitest** do testów jednostkowych (`node` dla czystej logiki, `jsdom` dla DOM) i **Playwright** do E2E (Chromium i desktopowy WebKit, jeśli dostępny). Testy E2E uruchamiaj przez lokalny serwer HTTP przypięty **wyłącznie do `127.0.0.1`** (np. niewielki `tools/serve-test.mjs` z Node), z katalogiem głównym ograniczonym do lokalnego checkoutu repo, bez udostępniania plików spoza niego (także przez `..`/symlinki), bez nasłuchiwania na `0.0.0.0` i **nigdy przez `file://`**. Jeśli istnieje aktywny inny serwer testowy, sprawdź jego bind i zakres, zamiast uruchamiać drugi bez kontroli. Desktopowy Playwright WebKit **nie zastępuje Safari iOS ani rzeczywistego testu Web Push**. Przed poprawkami zbuduj nieinwazyjny harness charakteryzujący obecny kod inline w `index.html`, bez zmiany jego działania. Zależności blokuj lockfile i uzasadniaj; `fflate` do ZIP v5 dopiero w GV-DATA. Nie dodawaj Reacta bez potrzeby.
8. Zachowaj polski interfejs, aktualny ciemny motyw (m.in. `#0d0f12`) oraz charakterystyczne limonkowe akcenty GymVerse; zmiany wizualne wprowadzaj ewolucyjnie.
9. Przed migracją i operacją importu udostępnij **wykonany i sprawdzony eksport** użytkownikowi. W przypadku niepowodzenia zapisu nie usuwaj aktywnej sesji ani oryginalnego źródła danych.
10. Wszystkie obliczenia w raporcie, historii, porównaniach i progresji muszą pochodzić ze wspólnej, testowalnej warstwy obliczeniowej. Unikaj duplikowania logiki.
11. Środowisko deweloperskie to Windows 11. Najpierw odczytaj wynik `git ls-files --eol` oraz `git config --get core.autocrlf`; nie wymuszaj `eol=lf` w GV-BASE-A ani nie uruchamiaj `git add --renormalize`. W GV-BASE-A wolno dodać do `.gitattributes` wyłącznie nieinwazyjne oznaczenia typów binarnych (PNG/JPEG/WebP/ZIP) i opisać politykę EOL w dokumentacji. Dopiero w GV-DOC dodaj `docs/spec/GymVerse_2_0_MASTER_PROMPT_v*.md -text`, aby Git nie zmieniał bajtów wersjonowanego mastera na Windows; wcześniej sprawdź rzeczywisty EOL. Nie dopuszczaj masowego diffu 2200-liniowego `index.html`; ewentualną świadomą normalizację zaplanuj jako osobny PR i decyzję właściciela. Dodaj `.gitignore` dla `node_modules/`, `coverage/`, `test-results/`, `playwright-report/`, `.env*` (z wyjątkiem `.env.example`), prywatnych backupów i `artwork/masters/`. Jeżeli obecnie Pages publikuje **root gałęzi**, jawnie odnotuj, że pliki `docs/`, `tests/`, `tools/` mogą być publicznie osiągalne; żadnych sekretów i prywatnych danych w repo. Przejście na publikację artefaktu z GitHub Actions wymaga osobnej zgody właściciela.
12. Przed zapisaniem lub wyciągnięciem danych z iPhone'a poproś użytkownika o kopię i dostęp lokalny. Nigdy nie wysyłaj prawdziwej kopii na publiczny GitHub ani do niezatwierdzonych usług. Lokalny walidator backupu musi zgłaszać tylko anonimowe sumy i anomalie, bez danych sesji i nazw prywatnych ćwiczeń.
13. Nie zgaduj uprawnień do GitHub Pages/Cloudflare, dostępności sprzętu, kosztów czy możliwości narzędzia generacji obrazów. Działania wymagające zmiany ustawień Pages lub rejestracji Cloudflare to **ręczne bramki właściciela**.
14. Docelowo utrzymuj `AGENTS.md` z trwałymi regułami projektu, **dosłowną kopię niniejszego master promptu** pod `docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md` i krótkie pliki `docs/tasks/GV-*.md` z odsyłaczami do odpowiednich sekcji. Utworzenie dokumentacji obowiązuje dopiero w `GV-DOC` po `GV-BASE-A`. **W `AGENTS.md` zapisz hierarchię poleceń:** obowiązuje najnowsze jawne zatwierdzenie użytkownika dla konkretnego etapu oraz jego `docs/tasks/GV-*.md`; normatywny master opisuje *jak*, lecz historyczne START w nagłówku i §17 nie autoryzują ponownego GV-BASE-A. Przy przyszłej wersji v2.9+ utwórz **nową niezmienianą kopię**, pozostaw starsze, zaktualizuj `docs/spec/README.md` i odsyłacz w `AGENTS.md` dopiero w odrębnie zatwierdzonym PR. Nie przeredagowuj mastera ani nie twórz konkurencyjnych streszczeń jako źródeł prawdy. Nie inicjuj całego backlogu w pierwszym PR.

### 0.1. Zakres końcowy i granice autoryzacji

- `GV-BASE-A`: **pierwsze zlecenie (historyczne po akceptacji)** — audyt, minimalny harness, syntetyczne fixture’y, testy charakteryzujące i `docs/current-state.md`; **bez zmian zachowania produkcyjnego** i bez pełnego przepisywania specyfikacji.
- `GV-DOC`: **dopiero po akceptacji A** — osobny, mały PR: `AGENTS.md`, dosłowna wersjonowana kopia master promptu v2.8, indeks i krótkie odsyłacze do zadań; **bez walidatora prywatnego eksportu**, którego jedynym właścicielem jest `GV-DATA`.
- `GV-BASE-B`: **dopiero po akceptacji A oraz DOC** — poprawa zakończenia treningu, obsługi błędów zapisu, draftów, importu i cache.
- `GV-DATA`: migracje, UUID, magazyn danych, rollback opisany bez fałszywej gwarancji i backupy.
- `GV-IMG-META`: zatwierdzenie metadanych 31 ćwiczeń i 4 wariantów, w tym jednostek, stron oraz pochodzenia danych; niezależny PR po DATA, obowiązkowy przed DB. Kryterium: wszystkie 31+4 wpisy mają prawidłowy `loadUnit/executionMode/repsUnit/implementCount/trainedSides`, znane różnice wariantów i testy kompletności manifestu; **nie wymaga gotowych bitmap**.
- `GV-IMG`: grafiki 3D, katalog wizualny, własne ilustracje i UI, po GV-IMG-META.
- `GV-HIST`: wyszukiwanie, korekty i cofanie zmian.
- `GV-DB`: ciężar jednego hantla, powtórzenia na rękę, jednoznaczny tonaż zewnętrzny.
- `GV-TIMER`: trwały lokalny timer i ustawienia przerw.
- `GV-PUSH`: Web Push na zablokowanym iPhonie, serwer Cloudflare i ograniczenia offline.
- `GV-COMP`: porównania sesji; `GV-PROG`: deterministyczna progresja; `GV-RPT`: raporty; `GV-QA`: wydanie.

**Reguła etapowania:** po każdej podfazie/etapie zatrzymaj się i pokaż PR/raport. Sam dokument nie oznacza zgody na kontynuację. W raporcie wolno wpisać „nie dotyczy” zamiast wypełniać sekcje fikcyjnymi informacjami.

### 0.2. Obiektywna weryfikacja statusu GV-BASE-A, zgoda i dowód braku zmian produkcyjnych

**Zgoda na start:** wyraźne polecenie właściciela w bieżącej rozmowie, np. „Wykonaj GV-BASE-A według załączonego master promptu”, jest wystarczającą autoryzacją **wyłącznie GV-BASE-A**. Nie proś po raz drugi o tę samą zgodę, jeśli aktualny stan etapu jest jednoznacznie „nierozpoczęty”. Samo przekazanie dokumentu, prośba o jego napisanie lub audyt **nie jest poleceniem uruchomienia**. Wznowienie istniejącego etapu wymaga jawnego zlecenia kontynuacji; nie traktuj nowego polecenia „wykonaj” jako zezwolenia na tworzenie duplikatu etapu.

**Status etapu:** zbadaj stan lokalnego Git oraz — jeśli to technicznie dostępne — faktyczne gałęzie, PR, commity, raporty testów i akceptację w GitHub. Nie wnioskuj z samej obecności katalogu czy gałęzi.

1. **Nierozpoczęty i potwierdzony:** brak lokalnych i zdalnych śladów `feature/gv-base-a-tests` lub równoważnego PR/commita, brak zaakceptowanego audytu. Wyraźne polecenie właściciela pozwala rozpocząć §17.
2. **W toku:** istnieje rozpoczęta praca/gałąź/PR, ale nie ma pełnego dowodu zatwierdzenia. Zatrzymaj się i przedstaw stan; nie twórz drugiej gałęzi/PR. Wymagaj wyraźnej instrukcji kontynuacji.
3. **Ukończony i zatwierdzony:** sprawdzony PR/commit z `docs/current-state.md` i testami jest scalony do `main`, raport zawiera zerowy diff plików produkcyjnych i właściciel zaakceptował etap. Nie uruchamiaj §17 ponownie; następny etap to oddzielnie autoryzowany GV-DOC.
4. **Niepewny:** np. tylko plik jest widoczny, PR nie ma potwierdzonego statusu lub istnieją niejednoznaczne lokalne gałęzie. Nie zgaduj. Podaj fakty i poproś właściciela o rozstrzygnięcie.
5. **Nierozpoczęty lokalnie, niezweryfikowany zdalnie:** GitHub jest niedostępny, ale lokalnie nie ma śladów `GV-BASE-A`. Pokaż ten status i poproś właściciela o jednoznaczne potwierdzenie „BASE-A nie był wcześniej rozpoczęty”. Po jego otrzymaniu i przy istniejącym poleceniu wykonania można zacząć lokalnie, zapisując brak zdalnej weryfikacji. Nie deklaruj, że zdalny stan jest czysty i nie twórz PR bez dostępnego GitHuba.

**Stały punkt odniesienia:** przed utworzeniem gałęzi, pierwszym dodaniem pliku i jakąkolwiek operacją modyfikującą zapisz do notatki roboczej aktualne SHA `main` jako `BASE_SHA` (pełne 40 znaków), zweryfikuj lokalne `main` względem zdalnego `origin/main` jeśli sieć działa, a także `git status --porcelain=v1 -uall`. Jeśli checkout zawiera zastane zmiany użytkownika, nie nadpisuj ich: zgłoś je i ustal bezpieczny sposób pracy. Nowa gałąź `feature/gv-base-a-tests` musi powstać od zapisanego commita bazowego. W `docs/current-state.md` umieść `BASE_SHA`, aktualny SHA lokalnego `main`, datę sprawdzenia, status sieci/zdalnej gałęzi oraz pierwotny stan drzewa. Jeśli w trakcie prac `main` się przesunie, **nie** podmieniaj `BASE_SHA`, nie rebase'uj bez odrębnej zgody i nie porównuj dowodu ochrony plików z ruchomym `main`.

**Chronione pliki produkcyjne:** `index.html`, `sw.js`, `manifest.webmanifest`, całe `img/**`, ikony PWA (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) oraz **wszystkie inne istniejące pliki powłoki aplikacji w katalogu głównym**. Nie edytuj, nie dodawaj, nie usuwaj, nie przemianowuj ani nie normalizuj tych zasobów. Rzeczywistą listę rootowych plików powłoki ustal na podstawie `git ls-tree` i odnotuj w `docs/current-state.md`; nie polegaj tylko na przykładowych nazwach ikon.

**Dozwolone pliki w GV-BASE-A:** nowe pliki testowe w `tests/**`, testowy serwer `tools/serve-test.mjs`, `docs/current-state.md`, `package.json`, `package-lock.json`, konfiguracje Vitest/Playwright, `.node-version`/`.nvmrc` (jeden uzgodniony pin), `.gitignore`, `.gitattributes`. Z istniejących plików dopuszcza się **modyfikację tylko `.gitignore` i `.gitattributes`**, bez renormalizacji; dodania w pozostałych wymienionych miejscach są dozwolone. Jeżeli istniejący `package.json` lub inny plik wymaga modyfikacji, zgłoś tę konieczność i uzyskaj osobną zgodę, zamiast uznawać zmianę za automatycznie dozwoloną. **W szczególności niedozwolone w BASE-A są:** dowolne zmiany w plikach runtime, nowe obrazy, `src/**`, pełne `AGENTS.md`, rozdziały `docs/spec/**`, prywatny walidator, pliki `.env`, kopie historii oraz sekrety.

**Obowiązkowy dowód po wykonaniu BASE-A — PowerShell w Windows 11:** poniższy kod jest szkicem wykonywalnego testu; `BASE_SHA` musi pochodzić z rzeczywiście zapisanej wartości sprzed pierwszej zmiany. Nie pobieraj go na nowo z ruchomego `main`. Względem `BASE_SHA` porównaj stan roboczy razem ze zmianami zatwierdzonymi i niezatwierdzonymi (Git diff od commita do working tree), a pliki nieśledzone sprawdź osobno.

```powershell
# W chwili rozpoczynania etapu, PRZED utworzeniem gałęzi i zmianami:
$BaseSha = (git rev-parse refs/heads/main).Trim()
$InitialStatus = git status --porcelain=v1 -uall
# Zapisz BASE_SHA i początkowy status do docs/current-state.md w trakcie audytu.
# Poniżej: wykonuj na koniec z PIERWOTNĄ wartością $BaseSha
# (w nowej sesji PowerShell odczytaj ją z docs/current-state.md).
git diff --no-ext-diff --exit-code "$BaseSha" -- index.html sw.js manifest.webmanifest img/ icon-192.png icon-512.png apple-touch-icon.png
$ProtectedExitCode = $LASTEXITCODE
git diff --no-ext-diff --name-status "$BaseSha" --
$AllChangedExitCode = $LASTEXITCODE
git ls-files --others --exclude-standard
git status --porcelain=v1 -uall
# Inwentaryzacja plików śledzonych na początku: uwzględnij wszystkie inne rootowe assety powłoki.
git ls-tree -r --name-only "$BaseSha"
```

**Interpretacja wyników jest obowiązkowa:**

- `$ProtectedExitCode` musi wynosić **0**, a wydruk kontrolny dla wszystkich innych istniejących plików runtime/ikon również musi wskazywać brak zmian. Nie ograniczaj kontroli do czterech ścieżek z poprzednich wersji promptu.
- Wynik `git diff --name-status "$BaseSha" --` i ewentualnie `git diff --cached --name-status "$BaseSha" --` przejrzyj w całości. Każde `A` musi należeć do jawnej listy dozwolonych nowych plików, każde `M` może dotyczyć jedynie `.gitignore` lub `.gitattributes`. Statusy `D`, `R`, `C`, `T`, `U` są zabronione. Zmiana `.gitattributes` musi dotyczyć wyłącznie deklaracji binarnych, bez automatycznej zmiany końców linii.
- **Untracked nie pojawiają się w `git diff`**: porównaj wynik `git ls-files --others --exclude-standard` oraz `git status --porcelain=v1 -uall` z allowlistą i upewnij się, że w chronionych ścieżkach nie ma nowych plików. Sprawdź również, czy nie powstały prywatne lub niebezpieczne artefakty w plikach ignorowanych przed publikacją.
- Porównaj `git status` na początku i na końcu. Każdą zastaną zmianę oddziel od zmian etapu; nie przypisuj cudzej pracy Codexowi. Zapisz w raporcie **pełny `BASE_SHA`, oba wyniki exit code, wykaz `A/M/D/R`, wynik sprawdzania plików nieśledzonych, listę kontrolowanych rootowych zasobów oraz ewentualne blokery**.
- Jeżeli kontrola nie przechodzi, **nie deklaruj kryterium jako spełnionego i nie składaj PR jako gotowego**. Najpierw usuń wyłącznie własne niepożądane zmiany bez niszczenia danych użytkownika albo przerwij i poproś o decyzję.

Jeśli GitHub Pages publikuje root gałęzi, nowe `docs/`, `tests/` i `tools/` mogą być publicznie widoczne. Nie umieszczaj w nich prywatnych danych, sekretów ani backupów. Różnica względem `main` po przesunięciu tej gałęzi może zawierać cudze zmiany i **nie zastępuje** dowodu względem niezmiennego `BASE_SHA`.

---

## 1. Stan wyjściowy z poprzedniego audytu — zweryfikuj na nowo

- Pliki: `index.html`, `sw.js`, `manifest.webmanifest`; zasadnicza logika JS i CSS znajduje się w `index.html`.
- Dane: `localStorage`; istnieje `gymverse_schema = 2`; format dotychczasowego eksportu JSON ma `version: 4`. To **różne numery**; wydanie aplikacji „2.0” jest jeszcze innym numerem.
- Plany domyślne: `push_a1`, `pull_a1`, `push_a2`, `pull_a2`.
- Katalog `CATALOG_BASE` zawiera dokładnie 31 identyfikatorów wymienionych dalej. 17 unikalnych pozycji występuje w planach domyślnych, 14 kolejnych jest dostępnych przez edytor. Dodatkowe `CUSTOM` powstają lokalnie u użytkownika.
- Starsze mapowanie obrazów używa m.in. `IMG_BY_KEY` i nazw `p1_1`, `pl1_1`, `p2_5`, `p2_6`; zachowaj fallback oraz zgodność z historią.
- Funkcje do weryfikacji: `saveAll`, `saveActive`, `loadState`, `normalizeSession`, `recalcSession`, `setLoad`, `metric`, `e1rm`, `finishWorkout`, `nextStep`, `onDone`, `timerPause`, `renderTimer`, `importData`, `exportData`, `renderHistory`, `histEditSet`, `renderStats`, `updateCharts`, `hintFor`, `renderPlanEditor`.
- Problemy wykryte statycznie: (a) `finishWorkout(true)` pomija ostrzeżenie o niekompletnej sesji, (b) błędy zapisu localStorage nie zawsze blokują przejście do następnego stanu, (c) `importData()` może zmodyfikować własne ćwiczenia przed finalnym potwierdzeniem, (d) import porównuje sesje po dacie, (e) pauza timera nie jest trwale zapisywana, (f) niezatwierdzone pola serii mogą zniknąć przy zmianie kroku, (g) starsze nazwy grafik wymagają zgodności i fallbacku. **(h) nie jest błędem:** `GROUP_BASE` celowo wskazuje jedną statystyczną grupę główną; **zachować**, natomiast mapę pozostałych mięśni dodać osobno.
- **Mapa problem → etap:** (a,b,c,f) `GV-BASE-B`, (d) `GV-DATA`, (e) `GV-TIMER`, (g) `GV-IMG`; (h) reguła kompatybilności dla `GV-IMG/GV-RPT`.
- Braki o znaczeniu wdrożeniowym: dostęp i uprawnienia Git/`gh`, włączony Pages, źródło publikacji, istniejące binarne obrazy, rzeczywista kopia danych (w przeglądarce, nie w repo). W `GV-BASE-A` nie zgaduj tych wartości.
- Zmiany w Service Workerze mają dotyczyć wyłącznie cache GymVerse. Nie kasuj cudzych kluczy/cache na współdzielonym origin.

Zapisz wyniki ponownego audytu w `docs/current-state.md`, z potwierdzeniem lub skorygowaniem powyższych punktów, listą realnych obrazków i faktyczną konfiguracją GitHub Pages.

---

## 2. Bezwzględne reguły danych i kompatybilności

### 2.1. Schematy i identyfikatory

- Wydanie produktu: **GymVerse 2.0**; magazyn docelowo `dataSchemaVersion: 3`, backup `backupFormatVersion: 5`, manifest obrazów `exerciseAssetsVersion: 1`. **Nie myl tych wersji** ze starym `gymverse_schema = 2` i JSON `version: 4`.
- Zachowaj `exerciseId`; nowe `variantId` określa faktyczny wariant sprzętu/techniki, `exerciseInstanceId` pozycję w planie, `set.id` jedno logiczne wykonanie serii (także asymetrycznej).
- Trwałe identyfikatory nowej sesji i nowej serii: `crypto.randomUUID()` (lub równoważny bezpieczny mechanizm). Legacy ID: deterministyczne, zachowujące rozróżnialność dwóch sesji o tej samej dacie; nie tylko timestamp. Jeśli źródło naprawdę nie rozróżnia wpisów, nie usuwaj ich arbitralnie.
- Historyczne RIR, wariant, liczba hantli i konwencja powtórzeń pozostają `unknown`, jeśli nie są znane i nie zostały jawnie potwierdzone.
- Model danych przechowuje **snapshot metadanych wykonania w sesji** (nie wyliczaj historycznych obciążeń z przyszłego stanu katalogu).

### 2.2. Przykłady docelowych sesji — bez sprzeczności

**A. Wyciskanie dwóch hantli jednocześnie (`db_bench`):** `repsUnit = per_set`, więc `implementCount = 2`, `trainedSides = 2` i **mnożnik 2, a nie 4**.

```json
{
  "id": "uuid-sesji",
  "planId": "push_a2",
  "planTitle": "Push A2",
  "startedAt": "2026-11-20T18:00:00.000Z",
  "finishedAt": "2026-11-20T18:52:00.000Z",
  "localDate": "2026-11-20",
  "timeZone": "Europe/Warsaw",
  "status": "completed",
  "details": [{
    "id": "uuid-serii", "exerciseId": "db_bench", "variantId": "default",
    "exerciseInstanceId": "uuid-pozycji-w-planie", "setNumber": 1,
    "weight": 20, "reps": 12, "repsUnit": "per_set",
    "loadUnit": "per_dumbbell", "executionMode": "simultaneous",
    "implementCount": 2, "trainedSides": 2, "rir": null,
    "completedAt": "2026-11-20T18:05:00.000Z"
  }],
  "sourceSchemaVersion": 3
}
```

W tym **nowym** przykładzie nie ma pola `legacyTotals`: historyczny tonaż 20×12=240 dotyczyłby starej metody, natomiast **nowy** `externalVolume` wynosi 480. Starych pól `totalVolume`/`totalReps` nie wolno przepisywać dla rekordów legacy. Przykładowe UUID są symboliczne, nie kopiować do żywych danych.

**B. Seria asymetryczna, jedna logiczna seria o wynikach dwóch stron:**

```json
{
  "id": "uuid-serii-asym", "exerciseId": "hammer_curl",
  "variantId": "default", "setNumber": 1,
  "loadUnit": "per_dumbbell", "executionMode": "alternating",
  "repsUnit": "per_side", "implementCount": 2, "trainedSides": 2,
  "sideResults": [
    {"side": "left",  "weight": 20, "reps": 12},
    {"side": "right", "weight": 18, "reps": 10}
  ]
}
```

**Kontrakt asymetrii i jednostronności:** `sideResults` jest **kanoniczną reprezentacją wszystkich rzeczywistych serii jednostronnych** (np. `lat_raise_cable`) i asymetrycznych; jedna logiczna seria ma **jeden `set.id`** i tablicę 1 lub 2 elementów `sideResults`. Jeśli `sideResults` istnieje, jest **jedynym** źródłem obliczeń obciążenia i powtórzeń; pola wspólne `weight`/`reps` pomijamy albo pozostawiamy `null` w nowej serii asymetrycznej, aby nie dublować. Każda strona `left/right` może wystąpić maksymalnie raz w logicznej serii. Dla ćwiczenia jednostronnego, wykonywanego na obie strony równo, prosty formularz „identyczne wyniki na obie strony” tworzy **dwa** wpisy w `sideResults` w tej samej serii; dla tylko jednej strony powstaje **jeden** wpis. **Nigdy nie zapisuj tych dwóch stron jako dwóch serii**, bo podwoiłoby to liczniki serii, cel tygodniowy i warunki progresji. `externalVolume = 20×12+18×10=420`; liczba serii = 1; `repsTotalMovements = 22`; dla jednostronnych raportuj `repsPerSide`, a `totalReps` legacy zachowaj. Nie nadpisuj starego `totalReps`. Dla starych sesji bez `sideResults` zachowaj oryginalne pola.

### 2.3. Migracja: brak destrukcji, jawny rollback

1. Odczytaj oryginalne dane bez modyfikacji; dane z iPhone'a nie są w repo.
2. W `GV-DATA` przygotuj lokalny `tools/validate-backup.js` i zaproponuj użytkownikowi **sprawdzony eksport** z urządzenia źródłowego. Walidator wypisuje wyłącznie liczby sesji/serii/planów, nazwy kluczy schematów i kody anomalii; nigdy danych osobowych, ciężarów, nazw własnych ćwiczeń ani pełnych rekordów. Nie commituj rzeczywistej kopii do repozytorium.
3. Zapisz kopię źródłową; transakcyjnie zbuduj nowy magazyn (proponowane IndexedDB, nazwa np. `gymverse-db-v3`), walidując liczbę rekordów i sumy kontrolne.
4. Migruj `gymverse_active` i **draft niezapisanych pól** z `GV-BASE-B`; klucze starych ustawień zachowaj lub mapuj jawnie. W środowisku testowym fixture'y reprezentują v1/v2/v4 oraz częściowo uszkodzone dane.
5. Dopiero po weryfikacji przełącz wskaźnik aktywnego magazynu. Przerwana migracja ma być idempotentna; przerywanie/restart nie zostawia połówkowej aktywnej bazy. Na żądanie użytkownika sprawdź `navigator.storage.persisted()` / `navigator.storage.persist()`, zapisz i pokaż rzeczywisty wynik (`persistent` / `best-effort` / `unsupported`) bez sugerowania, że trwałość jest gwarantowana. Testy obejmują odmowę uprawnienia i brak obsługi API.
6. **Rollback ma granice:** powrót do starego kodu i starego `localStorage` odtworzy tylko stan z chwili migracji; treningi później zapisane wyłącznie do IndexedDB nie będą widoczne w starej aplikacji. Nie obiecuj bezstratnego cofania do wersji 1.x.
7. Nie wymagaj eksportu „v5→v4” jako gwarancji bezstratnego rollbacku: v4 nie ma pól wariantów, asymetrii ani niektórych ustawień. Opcjonalny eksport zgodności v4 może być osobną funkcją **z jawną listą utraconych informacji** i testami; kanoniczną drogą odzyskiwania pełnego stanu jest import ZIP v5 do kompatybilnej wersji.
8. W przypadku nierozstrzygalnych legacy duplikatów zapytaj użytkownika, nie usuwaj arbitralnie rekordów. Zachowaj oryginał do akceptacji migracji i zdefiniuj politykę jego późniejszego usunięcia osobno.

### 2.4. Kopie zapasowe — v5 ZIP, import v4 JSON

- Eksport `gymverse_backup_YYYY-MM-DD.zip`: `manifest.json`, `data.json`, `settings.json`, `checksums.json`, opcjonalnie `custom-media/`. Uwzględnij plany, ćwiczenia własne, pomiary, RIR, historię, cele, kroki obciążenia, **drafty i aktywną sesję** (z bezpiecznym wyborem ich przywracania), lokalne interpretacje historii.
- Waliduj sumy SHA-256, rozmiary po rozpakowaniu, ścieżki i schematy; zapobiegaj ZIP-slip/ZIP-bomb oraz treściom wykonywalnym. Dla ZIP użyj przetestowanej wersji `fflate` albo równoważnej biblioteki z udokumentowaną potrzebą.
- **Eksport na iPhone w standalone PWA:** preferuj `navigator.canShare({files})` + `navigator.share({files})` po bezpośrednim geście użytkownika; alternatywnie link `download` i jasna instrukcja zapisu do Plików. Anulowanie systemowego arkusza nie jest potwierdzonym zapisaniem kopii. Samo wywołanie `share()` nie zawsze dowodzi, że plik trafił w trwałe miejsce — pokazuj instrukcję zweryfikowania pliku w Plikach, i zapisuj datę ostatniej kopii jako potwierdzoną dopiero po świadomej akcji.
- Import `gymverse_backup_*.json` w `version:4` pozostaje obsługiwany; obsługuj `merge` (bez cichego nadpisywania odmiennych sesji) i `full restore` (jawne potwierdzenie, migawka źródła).
- Dwufazowo: **parse/validate/preview bez mutacji** → zgoda → atomowy zapis/przełączenie → weryfikacja; błąd pozostawia poprzedni stan.
- Dedup: UUID dla nowego schematu, dla legacy deterministyczny fingerprint zawartości wraz z multiplicity; jednakowe daty nie implikują duplikatu.
- **Granica backupu a Web Push:** nie eksportuj sekretów Push/VAPID, tokenu instalacji, `pushSubscription`, outboxu, serwerowego `eventId/eventVersion`, `pushStatus` ani poleceń anulowania (również gdy są osadzone w obiekcie timera). Wbudowanych ilustracji nie duplikuj; obrazy użytkownika — tak. Po imporcie na inną instalację odtworzony timer/draft ma `pushStatus = not_configured`, nowe lokalne ID instalacji i **żadnych automatycznie zaplanowanych push**. **Timer po każdym restore (także na tym samym urządzeniu) nigdy nie wraca jako `running`:** stan `idle`, `endsAt = null`, brak lokalnego interwału i brak auto-harmonogramu; jeśli w backupie jest poprawne `remainingMs`, można je wyświetlić jako nieaktywne „zapisane X sekund do ręcznego wznowienia” po decyzji użytkownika, ale nie jako aktywną pauzę i nie jako automatyczny alarm. Nie przepisuj przeszłego ani przyszłego `endsAt` na nową sesję. Draft serii przywracaj oddzielnie i bez utraty danych. Import nie odtwarza poleceń starego outboxu. Przywrócenie na tym samym urządzeniu także nie może wznowić starych rozkazów; serwerowe alarmy starej instalacji wymagają osobnego zarządzania/unregister, jeśli nadal istnieją. Poinformuj użytkownika, że backup nie usuwa już wysłanych powiadomień.
- Użytkownik może pobrać eksport nawet podczas awarii synchronizacji Web Push; backup nigdy nie zależy od Cloudflare.

### 2.5. Potwierdzanie interpretacji starej historii (nowy kreator)

**Problem:** dane legacy zapisują wagę i powtórzenia, ale zwykle nie dokumentują masy per hantel, liczby przyrządów ani tego, czy wynik jest na stronę. Dotyczy to również części nazw ćwiczeń niezwiązanych wyłącznie z hantlami (np. `shoulder_press` i `lat_raise_cable`).

- W `GV-DATA` zdefiniuj osobny magazyn `legacyInterpretations` / `interpretationRules` z referencjami do sesji, ćwiczeń i zakresów dat oraz wersją reguły, źródłem `user_confirmed`, datą potwierdzenia; **nigdy nie zmieniaj oryginalnych `weight/reps/totalVolume/totalReps`**. Kreator musi uwzględniać **niejednoznaczne ćwiczenia legacy `shoulder_press` (maszyna kontra dwa hantle), `tri_overhead` (jeden hantel kontra wyciąg), `front_raise` (dwa hantle jednocześnie kontra naprzemiennie) oraz `lat_raise_cable` (jedna strona kontra obie strony)** — nie tylko nazwy zaczynające się od `db_`.
- UI w `GV-DB`: pokaż liczbę trafień i przedział dat. Pytaj osobno dla ćwiczeń np. `db_bench`: „Czy dla tych wpisów ciężar zawsze oznaczał jeden hantel?”, a dla `shoulder_press`: „Które sesje były wykonywane na maszynie, a które z dwoma hantlami?”. Analogicznie potwierdź liczbę faktycznie wykonanych stron dla `lat_raise_cable` i rodzaj sprzętu dla `tri_overhead`. Oferuj wyłączenie wybranych sesji, podgląd starego i wyliczonego tonażu, cofnięcie reguły i ręczne przypisanie wariantu/trybu tam, gdzie konieczne.
- Zgoda na cały zakres bez podglądu jest zabroniona; reguła stosuje się tylko do jawnie wybranych sesji (lub jednoznacznego zakresu z możliwością wyjątków).
- Nie interpretuj brakującego RIR; nie zgaduj, czy dany zapis `front_raise` był naprzemienny, jeśli użytkownik tego nie potwierdził.
- Raporty `GV-COMP/PROG/RPT` przyjmują przeliczone historyczne metryki wyłącznie z **potwierdzoną** interpretacją i pokazują informację o źródle tej interpretacji.
- Cofnięcie potwierdzenia natychmiast usuwa interpretowane wyniki z porównywalnych zestawień, ale nie usuwa surowych rekordów.

## 3. Jednostki hantli, powtórzenia na rękę i tonaż (ZATWIERDZONE)

### 3.1. Konwencje użytkownika

- Użytkownik **zawsze wpisuje masę jednego hantla**. `20 kg` w ćwiczeniu z hantlami nie oznacza sumy mas.
- W ćwiczeniach naprzemiennych podana liczba powtórzeń jest **na każdą rękę**. `12` to 12 lewą i 12 prawą.
- Jedna naprzemienna seria wykonana obustronnie pozostaje **jedną serią** treningową.
- Ruchy oburącz z dwiema sztukami hantli: `12` oznacza 12 powtórzeń **zestawu jednocześnie** (`per_set`), nie `per_side`.
- W przypadku ćwiczeń wykonywanych tylko jedną stroną nie podwajaj wyniku. Przy różnych ciężarach/powtórzeniach stron używaj `sideResults`.
- `loadUnit`, `executionMode`, `repsUnit`, `implementCount`, `trainedSides` są **obowiązkowymi polami** metadanych katalogu/konkretnego wariantu. Nowy wpis serii zachowuje snapshot tych pól.

### 3.2. Metryki: nie przeliczaj wstecz starych pól

- `legacyVolume` to dotychczasowe `totalVolume`/wynik `setLoad`; dla ćwiczeń z masą ciała zachowaj dotychczasowe `bodyAt(iso)+additionalWeight` razy `reps`. Trzymaj wartości i etykiety bez zmian.
- `externalVolume` to **nowa, odrębna** wielkość sumy mas zewnętrznych przyrządów razy wykonane powtórzenia. Nie jest równoznaczna z pracą mięśni, efektywnym oporem maszyn czy wysiłkiem. Dla `bodyweight` nie doliczaj masy ciała; licz wyłącznie **dodatkowe obciążenie** (`0` jeśli bez dodatkowego ciężaru) i oznacz, że jest to inna interpretacja od legacy.
- `externalVolumeStatus`: `known` | `user_confirmed_legacy` | `unknown`. Dla `unknown` brak liczby, a nie zero. **Legacy klasyfikuj deterministycznie tylko wtedy, gdy sprzęt, jednostka ciężaru oraz sposób liczenia powtórzeń są jednoznaczne w źródle:** sztanga (`BAR`) oraz jednoznaczna maszyna/wyciąg (`MACH`) z wpisanym ciężarem mogą być `known` jako **nominalny ciężar zewnętrzny**, nie twierdzenie o oporze biomechanicznym. **Wyjątek nadrzędny:** `shoulder_press` w starszej historii to `unknown`, ponieważ w rzeczywistości mógł oznaczać maszynę (mnożnik 1) albo dwa hantle (mnożnik 2); nazwa domyślnego wariantu z nowego katalogu nie jest dowodem sposobu wykonania dawnych sesji. `tri_overhead` także pozostaje `unknown`, jeśli nie wiadomo, czy był to jeden hantel, czy lina wyciągu, nawet jeżeli liczbowy mnożnik mógłby wyjść 1. `lat_raise_cable` (jednostronny wyciąg: `ONE/SIDE`) w starej historii **nie jest zwykłym `MACH/PS`** i pozostaje `unknown`, dopóki użytkownik nie potwierdzi, czy wynik oznaczał jedną czy obie strony oraz jak liczył powtórzenia. `front_raise` i pozostałe ćwiczenia hantlowe bez zapisanego wariantu/konwencji pozostają `unknown` do potwierdzenia. **BW** jest `known` tylko gdy `isBW` i istniejący format jednoznacznie określają `weight` jako **dodatkowy ciężar** (zero = świadomie brak dodatkowego ciężaru); w przeciwnym razie `unknown`. Status i reguła interpretacji powinny być ustalane **dla każdej sesji/serii**, nie hurtem po obecnej grupie katalogowej. Brak `known`/`user_confirmed_legacy` wyklucza liczbę z nowego sumarycznego tonażu; pokazuj brakujące dane i udział nieznanych, a nie fałszywe zero.
- Nie zmieniaj oryginalnych `weight`, `reps`, `totalVolume`, `totalReps`. Przeliczone metryki są widokami pochodnymi lub osobnymi polami, z pochodzeniem i wersją obliczeń.
- Szacowane `e1rm` dla hantla wyrażaj **na jeden hantel**; zachowaj wzór Epleya i zaokrąglenie do 0,1 kg. Dla 20×12 = 28,0 kg/hantel. Nie podwajaj 1RM.

### 3.3. Kontrakt funkcji `calculateExternalVolume` — tabela prawdy

**Waliduj metadane i nie mnoż `implementCount × trainedSides`.**

| Tryb | `repsUnit` | Mnożnik / reguła | Przykład |
|---|---|---|---|
| Dwa hantle jednocześnie | `per_set` | `implementCount` (2) | 20×12×2 = **480** |
| Dwa hantle naprzemiennie | `per_side` | `trainedSides` (2) | 20×12×2 = **480** |
| Jedna ręka z jednym hantlem | `per_side` | `trainedSides` (1) | 20×12×1 = **240** |
| Jeden hantel oburącz | `per_set` | `implementCount` (1) | 20×12×1 = **240** |
| Sztanga, maszyna, wyciąg | `per_set` | `implementCount` (1) | 60×10×1 = **600** |
| Własna seria z różnymi stronami | `per_side`, `sideResults` | **suma** `side.weight*side.reps`, bez mnożnika | 20×12 + 18×10 = **420** |
| Masa ciała bez ciężaru dodatkowego | `per_set` | `additionalWeight*reps` = **0** | Zero jest znane, nie unknown |
| Masa ciała z ciężarem dodatkowym | `per_set` | `additionalWeight*reps`; stary `setLoad` osobno | 5×10 = **50** |

Formalnie, gdy brak `sideResults` i metadane są kompletne:

```text
if repsUnit == "per_side": multiplier = trainedSides
else if repsUnit == "per_set": multiplier = implementCount
else: value = unknown
externalVolume = weight × reps × multiplier
```

**Walidacja:** `trainedSides` musi być 1 albo 2; `implementCount` dodatnią liczbą zgodną ze sprzętem. Dla naprzemiennych z jednym hantlem przenoszonym z ręki do ręki (`implementCount=1`, `trainedSides=2`) `per_side` nadal daje mnożnik 2. Dla `sideResults` nie stosować mnożnika; jedno logiczne `set.id` + 1 lub 2 wpisy stron. Brak strony lub nieznany wariant blokują porównanie symetryczne, a nie sam zapis. Dla wariantu unilateralnego w katalogu `trainedSides=1` opisuje jedną stronę *jednego wykonania*, zaś rzeczywiste strony serii wynikają z `sideResults`. Bez porównywalnych metadanych wynik `unknown`.

### 3.4. Pełna mapa wykonania **31/31** pozycji katalogu

Skróty: `PS` = `per_set`, `SIDE` = `per_side`; `SIM` = `simultaneous`, `ALT` = `alternating`, `ONE` = `single_side`, `BIL` = `bilateral_single_implement`, `MACH` = `machine_or_cable`, `BAR` = `barbell`, `BW` = `bodyweight`; `impl`= `implementCount`, `sides`=`trainedSides`. `weight` jest `per_dumbbell` tylko dla pozycji z hantlami; dla pozostałych `displayed_load` (wpisane obciążenie maszynowe/sztangi), a dla ćwiczeń z masą ciała `additional_weight`. Wartości bazowe są **normatywną konwencją nowego interfejsu**, a nie automatyczną interpretacją historii.

| `exerciseId` | `loadUnit` | `executionMode` | `repsUnit` | impl | sides | Uwagi |
|---|---|---|---|---:|---:|---|
| `bench_flat` | displayed_load | BAR | PS | 1 | 2 | sztanga, masa całkowita |
| `db_incline` | per_dumbbell | SIM | PS | 2 | 2 | dwa hantle |
| `lat_raise_stand` | per_dumbbell | SIM | PS | 2 | 2 | oba ramiona razem |
| `tri_rope` | displayed_load | MACH | PS | 1 | 2 | lina wyciągu |
| `leg_press` | displayed_load | MACH | PS | 1 | 2 | masa wpisana nie jest kalibracją oporu efektywnego |
| `lat_pulldown_wide` | displayed_load | MACH | PS | 1 | 2 | wyciąg |
| `row_v` | displayed_load | MACH | PS | 1 | 2 | wyciąg |
| `rear_delt` | per_dumbbell | SIM | PS | 2 | 2 | odwrotne rozpiętki |
| `biceps_preacher` | displayed_load | MACH | PS | 1 | 2 | maszyna uginania łokci |
| `leg_curl` | displayed_load | MACH | PS | 1 | 2 | maszyna |
| `db_bench` | per_dumbbell | SIM | PS | 2 | 2 | **poprawka błędu z v2.3** |
| `db_fly` | per_dumbbell | SIM | PS | 2 | 2 | skos osobnym wariantem |
| `front_raise` | per_dumbbell | SIM | PS | 2 | 2 | domyślnie obie ręce razem; ALT wymaga osobnego wariantu/ustawienia, nie zgaduj |
| `lat_raise_seated` | per_dumbbell | SIM | PS | 2 | 2 | obie ręce razem |
| `tri_machine` | displayed_load | MACH | PS | 1 | 2 | maszyna tricepsa ze zdjęcia |
| `lat_pulldown_neutral` | displayed_load | MACH | PS | 1 | 2 | uchwyt neutralny |
| `row_straight` | displayed_load | MACH | PS | 1 | 2 | prosty drążek |
| `chest_machine` | displayed_load | MACH | PS | 1 | 2 | maszyna |
| `pec_deck` | displayed_load | MACH | PS | 1 | 2 | butterfly |
| `shoulder_press` | displayed_load | MACH | PS | 1 | 2 | **domyślnie maszyna** |
| `lat_raise_cable` | displayed_load | ONE | SIDE | 1 | 1 | jedna ręka w ruchu; obie strony (jeśli wykonane) w JEDNYM `sideResults` i JEDNYM `set.id`; nie twórz dwóch serii |
| `face_pull` | displayed_load | MACH | PS | 1 | 2 | lina |
| `row_machine` | displayed_load | MACH | PS | 1 | 2 | maszyna |
| `hammer_curl` | per_dumbbell | ALT | SIDE | 2 | 2 | 12 = 12 na każdą rękę |
| `cable_curl` | displayed_load | MACH | PS | 1 | 2 | drążek wyciągu |
| `tri_overhead` | per_dumbbell | BIL | PS | 1 | 2 | **jeden** hantel oburącz |
| `leg_extension` | displayed_load | MACH | PS | 1 | 2 | maszyna |
| `smith_squat` | displayed_load | BAR | PS | 1 | 2 | ciężar wpisany przez użytkownika, bez domyślnego doliczania prowadnicy |
| `pullup` | additional_weight | BW | PS | 1 | 2 | bez ciężaru dodatkowego externalVolume=0 |
| `dips` | additional_weight | BW | PS | 1 | 2 | dodatkowy ciężar odrębny od masy ciała |
| `pushup` | additional_weight | BW | PS | 1 | 2 | dodatkowy ciężar odrębny od masy ciała |

**Warianty nadpisują metadane bazowe** — źródłem prawdy jest snapshot konkretnego wariantu zapisany w serii. Zatwierdź te metadane jako oddzielny podpakiet `GV-IMG-META` przed `GV-DB`, nawet jeśli produkcja 105 bitmap nadal trwa:

| `exerciseId/variantId` | Zmiana sprzętu/trybu | `loadUnit`, `executionMode`, `repsUnit`, impl, sides |
|---|---|---|
| `leg_press/high_feet` | tylko pozycja stóp | displayed_load, MACH, PS, 1, 2 |
| `db_fly/incline` | skos ławki | per_dumbbell, SIM, PS, 2, 2 |
| `shoulder_press/dumbbells` | dwa hantle | per_dumbbell, SIM, PS, 2, 2 |
| `tri_overhead/rope` | lina wyciągu | displayed_load, MACH, PS, 1, 2 |

Jeśli użytkownik wykona inny sposób niż wariant bazowy (np. `front_raise` naprzemiennie), musi jawnie wybrać lub zdefiniować wariant z własnym stabilnym `variantId`, snapshotem metadanych i opisem ruchu. **Nowy wariant użytkownika nie należy automatycznie do 35 zatwierdzonych kompozycji**; bez własnej, właściwej ilustracji wyświetl podpisany placeholder i pozwól dołączyć obraz, nie podszywaj go obrazkiem niewłaściwej techniki. Dla `lat_raise_cable` praca obu stron jest jednym wariantem jednostronnej techniki z dwoma `sideResults`, nie wymaga tworzenia osobnej ilustracji, jeśli pozycja/sprzęt są takie same. Nie stosuj nowej interpretacji do starej historii bez potwierdzenia. **Ćwiczenia własne:** edytor wymaga tych samych metadanych i walidacji, a nie tylko `name/group/bw`.

### 3.5. Rekordy, RIR i progresja

- Dla hantli rekord ciężaru i e1RM podawaj w `kg / hantel`; nie mnoż e1RM ×2. Dla `20 kg × 12`: `28,0 kg/hantel` przy dotychczasowym wzorze.
- RIR historyczne pozostaje na swoim oryginalnym poziomie szczegółowości (np. na ćwiczenie); nie przepisuj go na każdą serię jako fakt.
- Rekomendowany ciężar przy podwyższeniu z 20 na 22 kg oznacza 22 kg **na jeden** hantel, nawet dla dwóch hantli.
- Dla asymetrii `e1RM` i rekordy zapisuj **osobno dla lewej i prawej** (`e1rmLeft`, `e1rmRight`, `bestWeightLeft`, `bestWeightRight`), bez fałszywego wspólnego rekordu. Wskazanie globalnej „strony ograniczającej” w sugestii progresji = **niższa** z dwóch wartości e1RM/osiągniętych progów przy porównywalnych powtórzeniach; to wskazówka, nie trzeci rekord.
- Dla asymetrii zaliczenie warunku progresji wymaga wykonania wszystkich wymaganych serii na **obu stronach** i zgodnej porównywalności. Gdy zarejestrowano tylko jedną stronę, nie podawaj sugestii wzrostu ciężaru „dla obu” bez danych drugiej.
- Tylko wyraźnie potwierdzona interpretacja legacy dopuszcza stary trening do nowych porównań/raportów, bez zmiany źródłowych wpisów.

### 3.6. Ćwiczenia z masą ciała — zerowy tonaż zewnętrzny nie oznacza zerowego treningu

- Dla `pullup`, `dips` i `pushup` z obciążeniem dodatkowym równym 0: `externalVolume=0` i `externalVolumeStatus=known`, **ale trening został wykonany**. Nie ukrywaj takich sesji z rankingów aktywności ani nie oznaczaj ich jako „brak pracy”.
- Do **porównań BW** używaj jako podstawowych miar: liczba zakończonych serii, powtórzenia w każdej serii, maksymalna liczba powtórzeń w serii oraz dodatkowy ciężar (jeżeli występuje). Tonaż legacy z masą ciała pokazuj wyłącznie we własnej definicji i przy historycznej masie rzeczywiście znanej w danej dacie.
- Do **progresji BW** najpierw sprawdzaj zakres i jakość powtórzeń dla porównywalnych serii, dopiero następnie rozważaj dodanie ciężaru, po jawnej konfiguracji kroku, znanym RIR i akceptacji użytkownika. Nie stosuj e1RM od zera kg jako oceny siły dla ćwiczeń nieobciążonych.
- **Raport tygodniowy:** osobno pokaż serie i powtórzenia BW, by `externalVolume=0` nie zaniżało obrazu aktywności. Nie sumuj kilogramów masy ciała z ciężarem maszynowym jako jednej nowej metryki. Test: 3×10 podciągnięć bez obciążenia → 3 serie i 30 powtórzeń, externalVolume=0; porównanie 3×10→3×11 jest postępem powtórzeń.

## 4. Katalog 31 ćwiczeń — manifest i anatomia

Dla każdego ćwiczenia utwórz jeden wpis źródłowy: stabilny `id`, nazwę, `group` (starej statystyki), `equipment`, `primaryMuscles`, `secondaryMuscles`, `defaultVariant`, `techniqueInstructions`, `commonMistakes`, `imageManifest` **oraz pola obciążenia `loadUnit`, `executionMode`, `repsUnit`, `implementCount`, `trainedSides` z §3.4**. Konkretny wariant ma prawo nadpisać te pola; snapshot wykonania jest zapisywany w sesji. Poniższa tabela opisuje anatomię, a §3.4 jednoznacznie opisuje obliczenia; nie dopisuj nowych pozycji do katalogu bez polecenia.

**Legenda:** `G` główne mięśnie (czerwone), `P` pomocnicze o istotnym zaangażowaniu (żółte). Gdy brak istotnej grupy pomocniczej, lista może być pusta. Udział mięśni opisuje jakościową biomechanikę, **nie** wymyślone procenty EMG. Obszary mają być zweryfikowane anatomicznie przed zatwierdzeniem grafik.

### 4.1. Klatka (8)

| ID | Sprzęt i obowiązkowa pozycja | G | P | Widok |
|---|---|---|---|---|
| `bench_flat` | Sztanga, płaska ławka, klasyczne wyciskanie | piersiowy większy | triceps, przedni naramienny | bok/3-4 |
| `db_incline` | Dwa hantle, ławka ok. 30° | piersiowy większy — część obojczykowa | przedni naramienny, triceps | 3-4 |
| `db_bench` | Dwa hantle, ławka płaska | piersiowy większy | triceps, przedni naramienny | 3-4 |
| `db_fly` | Dwa hantle, ławka płaska, lekko zgięte łokcie, rozpiętki | piersiowy większy | przedni naramienny | przód/3-4 |
| `chest_machine` | Maszyna siedząca do poziomego wyciskania klatką | piersiowy większy | triceps, przedni naramienny | bok/3-4 |
| `pec_deck` | Butterfly, siedzące przywodzenie ramion | piersiowy większy | przedni naramienny | przód |
| `dips` | Poręcze równoległe, umiarkowanie pionowy tułów | triceps | piersiowy większy, przedni naramienny | bok/3-4 |
| `pushup` | Klasyczna pompka, prosta linia ciała | piersiowy większy, triceps | przedni naramienny | bok |

### 4.2. Plecy (6)

| ID | Sprzęt i obowiązkowa pozycja | G | P | Widok |
|---|---|---|---|---|
| `lat_pulldown_wide` | Wyciąg górny, szeroki nachwyt do klatki | najszerszy grzbietu, obły większy | biceps, środkowa część pleców | tył/3-4 |
| `lat_pulldown_neutral` | Wyciąg górny, wąski chwyt neutralny | najszerszy grzbietu | biceps, obły większy, mięśnie międzyłopatkowe | tył/3-4 |
| `row_v` | Wyciąg dolny, siedząc, uchwyt V do brzucha | najszerszy, środkowe plecy | biceps, tylny naramienny | bok/3-4 |
| `row_straight` | Wyciąg dolny, siedząc, prosty drążek do brzucha | najszerszy, równoległoboczne, środkowy czworoboczny | biceps, tylny naramienny | bok/3-4 |
| `row_machine` | Maszyna do wiosłowania siedząc | najszerszy, równoległoboczne, środkowy czworoboczny | biceps, tylny naramienny | bok/3-4 |
| `pullup` | Drążek, nachwyt średnio szeroki | najszerszy, obły większy | biceps, mięśnie międzyłopatkowe | tył |

### 4.3. Barki (7)

| ID | Sprzęt i obowiązkowa pozycja | G | P | Widok |
|---|---|---|---|---|
| `lat_raise_stand` | Dwa hantle, unoszenie bokiem na stojąco | boczny naramienny | nadgrzebieniowy, czworoboczny | przód |
| `lat_raise_seated` | Dwa hantle, unoszenie bokiem siedząc | boczny naramienny | nadgrzebieniowy, czworoboczny | przód |
| `front_raise` | Hantle unoszone przed siebie; wariant domyślny dwa hantle | przedni naramienny | część obojczykowa piersiowego większego | bok/3-4 |
| `rear_delt` | Dwa hantle, pochylenie, odwrotne rozpiętki | tylny naramienny | równoległoboczne, środkowy czworoboczny | tył/3-4 |
| `shoulder_press` | Domyślnie siedząca maszyna do wyciskania nad głowę | przedni i boczny naramienny | triceps | przód/3-4 |
| `lat_raise_cable` | Wyciąg dolny, unoszenie jednego ramienia bokiem | boczny naramienny | nadgrzebieniowy, czworoboczny | przód/3-4 |
| `face_pull` | Wyciąg z liną, przyciągnięcie do twarzy i rotacja zewnętrzna | tylny naramienny, mięśnie środkowych pleców | rotatory zewnętrzne barku | 3-4 |

### 4.4. Biceps (3)

| ID | Sprzęt i obowiązkowa pozycja | G | P | Widok |
|---|---|---|---|---|
| `biceps_preacher` | Maszyna modlitewnik do **uginania** łokci | biceps, ramienny | ramienno-promieniowy | bok |
| `hammer_curl` | Dwa hantle, chwyt neutralny, domyślnie naprzemiennie; powtórzenia na rękę | ramienny, ramienno-promieniowy | biceps | przód/3-4 |
| `cable_curl` | Wyciąg dolny, drążek do uginania łokci | biceps, ramienny | ramienno-promieniowy | przód |

### 4.5. Triceps (3)

| ID | Sprzęt i obowiązkowa pozycja | G | P | Widok |
|---|---|---|---|---|
| `tri_rope` | Wyciąg górny, lina, prostowanie przedramion w dół | triceps (trzy głowy) | brak istotnej grupy do kolorowania | bok/3-4 |
| `tri_machine` | **Siedząca, obciążana talerzami maszyna do prostowania łokci z podparciem górnych części ramion — dokładnie typ z dostarczonej przez użytkownika fotografii** | triceps | brak istotnej grupy do kolorowania | bok/3-4 |
| `tri_overhead` | Domyślnie jeden hantel trzymany oburącz, prostowanie znad głowy | triceps, szczególnie głowa długa | brak istotnej grupy do kolorowania | bok/3-4 |

**Bezwzględne dla `tri_machine`:** nie zastępuj urządzenia maszyną do uginania bicepsów, maszyną do dipów ani wyciągiem z liną. Widać siedzisko, podpórkę pod ramiona, uchwyty/dźwignie i obciążenie talerzowe. Popraw wyświetlaną nazwę na „Prostowanie przedramion na maszynie do tricepsa”, zachowując ID `tri_machine`. Referencyjna fotografia została przesłana w rozmowie użytkownika z ChatGPT; **Codex musi otrzymać ją osobno jako plik albo poprosić o załączenie**. Sama ścieżka z innej sesji nie jest gwarancją dostępności.

### 4.6. Nogi (4)

| ID | Sprzęt i obowiązkowa pozycja | G | P | Widok |
|---|---|---|---|---|
| `leg_press` | Suwnica pod kątem ok. 45°, stopy pośrodku platformy | czworogłowe, pośladkowe wielkie | przywodziciele | bok |
| `leg_curl` | Uginanie nóg leżąc, wałek nad tylną częścią podudzi | kulszowo-goleniowe | brzuchaty łydki | bok |
| `leg_extension` | Prostowanie nóg siedząc | czworogłowe | brak istotnej grupy do kolorowania | bok |
| `smith_squat` | Przysiad ze sztangą w prowadnicy Smitha | czworogłowe, pośladkowe wielkie | przywodziciele | bok/3-4 |

### 4.7. Dodatkowe 4 warianty — nie nowe ID bazowych ćwiczeń

| `exerciseId` | `variantId` | Wymagane różnice |
|---|---|---|
| `leg_press` | `high_feet` | Stopy wyżej na platformie, bez wymyślania procentowego udziału mięśni |
| `db_fly` | `incline` | Lekki dodatni skos ławki |
| `shoulder_press` | `dumbbells` | Dwa hantle zamiast maszyny, zapis kg/hantel |
| `tri_overhead` | `rope` | Lina na wyciągu zamiast jednego hantla |

Domyślny plan PUSH A2 ma już wariant suwnicy ze stopami wyżej (stara nazwa grafiki `p2_6`): nowe wystąpienie planu otrzymuje `variantId=high_feet`; w niepewnej historii nie zmieniaj go arbitralnie. Dla `db_fly` i `tri_overhead` historyczna nazwa dopuszcza kilka technik; brak jawnego wariantu oznacz jako nieustalony przy zaawansowanych porównaniach.

### 4.8. Ćwiczenia własne

- Własne ID i historia zostają zachowane. Pozwól dodać/edytować nazwę, sprzęt, główne i pomocnicze mięśnie, technikę i obraz **oraz**: `loadUnit`, `executionMode`, `repsUnit`, `implementCount`, `trainedSides`, stronę i wariant. Domyślną wartością nieustalonych pól jest `unknown`, a nie wymyślony mnożnik.
- Obsłuż PNG/JPEG/WebP, przetwórz do bezpiecznego formatu rastrowego, usuń metadane, ustal limity rozmiaru i wymiarów; unikaj niesprawdzanego SVG i wykonywalnej zawartości.
- Jeśli brak obrazu, użyj jawnego placeholdera (nie przypisuj przypadkowej ilustracji innego ćwiczenia).
- Własne obrazy włącz do backupu ZIP, ale nie do publicznego repozytorium bez zgody użytkownika.
- Obecna statystyczna grupa `GROUP_BASE` pozostaje jedną grupą na ćwiczenie — **to zamierzona funkcja**, nie błąd. Lista dodatkowych mięśni jest odrębną metadaną opisową i **nie podwaja liczby serii**.
- Dla kategorii „Brzuch” nie ma obecnie żadnego z 31 bazowych ćwiczeń: **zostaw pustą kategorię z komunikatem**, nie wymyślaj nowych ćwiczeń.

---

## 5. Produkcja ilustracji 3D — dokładny kontrakt

### 5.1. Styl zatwierdzony

- Półrealistyczna, spójna ilustracja 3D o charakterze medyczno-sportowym; anatomicznie poprawna proporcja postaci, sprzętu, chwytu, toru ruchu i ustawienia tułowia.
- Tło ciemne odpowiadające aplikacji (`#0d0f12`), sylwetka neutralna/grafitowa (`#737E8C`).
- **Mięśnie główne:** czerwony `#F04438`; **istotne mięśnie pomocnicze:** żółty `#F3B544`. Inne mięśnie neutralne. Dodaj tekstową legendę w interfejsie — nie polegaj wyłącznie na kolorze.
- Nie generuj nazw i podpisów wewnątrz bitmapy; interfejs wyświetla polskie nazwy, podpisy i legendę. Dodaj **alt teksty** zależne od ćwiczenia i widoku, np. „Wyciskanie hantli na ławce płaskiej — technika wykonania”; dla mapy mięśni wymień główne i pomocnicze mięśnie tekstowo. Oznaczenie kolorem nie może być jedyną formą informacji.
- Preferuj tę samą spójną sylwetkę i sprzęt względem ujęć; widok kamery dobieraj z tabeli.
- **Żadnych twierdzeń o dokładnych procentach aktywacji EMG**. Jeśli biomechanika nie jest jednoznaczna, pokaż grupy jakościowo.

### 5.2. Wyjściowe assety na wariant

- `technique`: czytelna postać wykonująca ruch na właściwym sprzęcie, bez nakładki mięśniowej.
- `muscles`: identyczne wykonanie/pozycja i nałożone zatwierdzone kolorowanie mięśni (nie losowo na nowo wygenerowana postać).
- `thumbnail`: 256×256 WebP pochodzący z grafiki techniki, wyraźny na małym ekranie.
- Bazowy master: PNG ok. 1024×1024; WebP główny ok. 768×768, docelowo do 200 KB; miniatura do 40 KB, o ile czytelność zostaje zachowana. **Nie commituj masowych PNG-masters do zwykłego Gita:** przechowuj w prywatnym katalogu zewnętrznym albo Git LFS po ocenie limitów/akceptacji; w publicznym repo tylko zoptymalizowane WebP, zatwierdzony manifest, prompty i bezpieczne referencje. Nie umieszczaj prywatnego zdjęcia `tri_machine` w publicznym repo bez zgody.
- 31 ćwiczeń podstawowych + 4 warianty = 35 zestawów kompozycji × 3 assety = **105 plików wyjściowych**. Nie myl tego z 105 niezależnymi promptami obrazowymi.

### 5.3. Nazewnictwo i manifest

Rekomendowane adresy (dostosuj do `base` GitHub Pages):

```
public/img/exercises/technique/<exerciseId>__<variantId>.webp
public/img/exercises/muscles/<exerciseId>__<variantId>.webp
public/img/exercises/thumbnails/<exerciseId>__<variantId>.webp
```

Przykład: `technique/tri_machine__default.webp`. Osobny manifest przechowuje pary ID i ścieżki. Obsłuż stare nazwy `img/p1_1.jpg`, `img/pl1_1.jpg`, `img/p2_5.jpg` itd. jako **fallback** po audycie, nie usuwaj plików przed weryfikacją.

### 5.4. Proces zatwierdzania

1. Najpierw dokładne prompty/briefy do 5 reprezentatywnych obrazów: `db_bench`, `lat_pulldown_wide`, `lat_raise_stand`, `tri_machine` (na podstawie referencji użytkownika), `leg_press`.
2. Wykonaj 5 ilustracji próbnych tylko wtedy, gdy masz autentyczne narzędzie graficzne; w przeciwnym razie zapisz manifest i briefy ze statusem `pending`.
3. Zatwierdź styl i anatomię z użytkownikiem. Dopiero po zgodzie produkuj resztę.
4. Każdy wariant otrzymuje status `draft` → `review` → `approved` albo `rejected` z powodem. `approved` wymaga kontroli sprzętu, pozycji, koloru, poprawnego ID i wyświetlenia na ekranie telefonu.
5. Nie wstawiaj fikcyjnych plików graficznych ani nie oznaczaj ilustracji jako wygenerowanych, jeśli nie istnieją.
6. Dla `tri_machine` odwzoruj **typ i funkcję maszyny z referencji**, bez kopiowania identyfikowalnej osoby czy cudzego zdjęcia.

### 5.5. UI biblioteki

- Wizualny katalog wszystkich 31 ćwiczeń + własne: wyszukiwarka polskich nazw, filtry partii (Klatka, Plecy, Barki, Biceps, Triceps, Nogi, Brzuch, Inne), filtry sprzętu, „tylko ćwiczenia z moich planów”. Puste kategorie pozostają puste.
- Karty: miniatura, nazwa, główne mięśnie, sprzęt, podgląd, „Dodaj do planu”.
- Szczegóły: `Technika / Mięśnie`, widok obrazu, opis ruchu w 3 krokach, częste błędy, warianty, przycisk dodania.
- Edytor planów: zastąp sam tekstowy wybór wygodnym katalogiem, zachowaj obsługę kolejności, serii, powtórzeń i tworzenia planów.
- Trening aktywny: pokaż właściwy wariant obrazu; przy przejściu do innego ćwiczenia obraz musi się zmieniać. Nigdy nie pokazuj starej ilustracji jako nowego ćwiczenia.
- Offline: miniatury po przygotowaniu biblioteki dostępne bez sieci; opcja „Pobierz wszystkie ilustracje offline” z postępem i możliwością sprawdzenia kompletności cache. Nie uzależniaj treningu od obrazów. Testuj odświeżanie stron i wariantów; w razie błędu grafiki nie pokazuj obrazka innego ćwiczenia.
- Przy współdzielonej grafice kilku wariantów użyj wyraźnie poprawnego oznaczenia tylko tam, gdzie różnice nie wpływają na sprzęt i pozę; preferuj osobne obrazy.

---

## 6. Historia i korekty (GV-HIST)

1. Wyszukiwanie po nazwie ćwiczenia, planie i przedziale dat; filtry nie zmieniają danych.
2. Edycja sesji: data, ciężar, powtórzenia, opis ćwiczenia/wybrany wariant, RIR tylko gdy rzeczywiście istnieje lub zostanie podany przez użytkownika.
3. Dodawanie/usuwanie serii z walidacją, bez zmiany pozostałych serii.
4. Trwały dziennik **ostatnich 30 operacji korekcyjnych** (edycja/dodanie/usunięcie), możliwość cofnięcia po ponownym otwarciu; zapobieganie przypadkowym wielokrotnym cofnięciom.
5. Po korekcie w tym etapie przelicz **dotychczasową metrykę legacy** oraz dotychczasowe rekordy i podsumowania; nie implementuj z wyprzedzeniem `externalVolume`, którego kontrakt jest wdrażany w `GV-DB`. Po GV-DB/COMP/PROG/RPT centralny mechanizm invalidacji musi odświeżać również nowe metryki i raporty; nie pozostawiaj niespójnych cache.
6. W przypadku usunięcia całej sesji: potwierdzenie i możliwość cofnięcia. Nie usuwaj planu ani katalogu przy usuwaniu historycznej sesji.
7. Rekord wyznaczaj ponownie po usunięciu sesji rekordowej.

Akceptacja: korekta serii sztangi 20×10 na 22×10 zmienia jej tonaż legacy z 200 na 220; cofnięcie przywraca dokładnie poprzedni stan. Zmiana planu nie modyfikuje archiwalnych sesji.

---

## 7. Timer lokalny i przypomnienia (GV-TIMER)

### 7.1. Model stanów — tylko lokalny timer (bez aktywacji Web Push w GV-TIMER)

```json
{
  "status": "paused",
  "workoutId": "uuid-sesji",
  "exerciseInstanceId": "uuid-pozycji",
  "durationMs": 120000,
  "remainingMs": 75000,
  "startedAt": null,
  "endsAt": null,
  "completedNotified": false
}
```

- `running`: czas według `endsAt - Date.now()`, nie liczby tyknięć `setInterval`.
- `paused`: zapisz trwale pozostały czas; reload zachowuje stan i 75 s, nie wznawia sam.
- `idle`: timer wyłączony; przycisk `+30 s` jest **nieaktywny** i nie tworzy żadnego czasu ani alarmu. Test: kliknięcie (także wymuszone programowo) nie zmienia stanu.
- Timer lokalny i draft wejściowy są eksportowane w kopii v5, a ich starsze odpowiedniki migrowane. **GV-TIMER nie tworzy jeszcze outboxu i nie wysyła komend sieciowych**. GV-PUSH dodaje do timera lokalne pola `eventId`, `eventVersion`, `pushStatus`, `lastServerConfirmedVersion`, `lastSyncAt` oraz osobny trwały outbox; po restore wszelkie pola powiadomień mają zostać wyzerowane zgodnie z §2.4. Zakończenie/porzucenie treningu po wdrożeniu GV-PUSH nie usuwa wpisu anulowania, dopóki nie ma potwierdzenia serwera.
- Domyślny czas: indywidualny ćwiczenia → globalny → automat. Automat 180 s dla `COMPOUND`, 90 s dla pozostałych, jak w aktualnym GymVerse. RIR, ćwiczenie i wariant nie wpływają ukrycie na timer.
- Dźwięk i wibracja mogą być blokowane przez urządzenie. Lokalne przerwy działają offline; brak serwera oznacza brak potwierdzenia powiadomienia przy zablokowanym iPhonie.
- W GV-TIMER UI pokazuje wyłącznie stan lokalny i ewentualnie statyczne „powiadomienia w tle niedostępne — wdrożenie w GV-PUSH”; **dopiero GV-PUSH** rozdziela stan odliczania od `pushStatus`: `not_configured`, `scheduled`, `schedule_pending`, `cancel_pending`, `cancelled`, `failed`.

### 7.2. Harmonogram i limity iOS

- Na zablokowanym iPhonie nie uruchamiaj alarmów przez JS timera w tle. Powiadomienia wymagają Home Screen PWA, zgody i serwerowego Web Push. Nie ma gwarancji dostarczenia co do sekundy, a przy braku internetu nie ma gwarancji anulowania starego alarmu.
- **Rozróżniaj potwierdzony harmonogram serwera i lokalny timer**. Pauza offline zmienia lokalne odliczanie natychmiast, ale status `cancel_pending` pokazuje uczciwe ryzyko stale zaplanowanego push.

## 8. Web Push — GitHub Pages + Cloudflare (GV-PUSH, wymagane)

### 8.1. Zakres, architektura i twarde ograniczenia

- Frontend **GitHub Pages**, backend harmonogramu **Cloudflare Workers + Durable Objects Alarms**, klasyczny **Web Push + VAPID** z widocznym powiadomieniem. Nie planuj funkcji na GitHub Actions, `setTimeout` w tle iPhone'a ani samym `localStorage`.
- iPhone: zgodny iOS (Web Push w Home Screen PWA od 16.4), aplikacja dodana do ekranu początkowego, zgoda udzielona po bezpośrednim geście; wymagany **faktyczny test na zablokowanym urządzeniu**. Tryby Focus iOS i sieć mogą opóźniać/wyciszać widoczność; nie gwarantuj dokładnego czasu otrzymania.
- Użyj **jednego Service Workera** odpowiadającego za cache + `push` + `notificationclick`; w klasycznym trybie WebKit **każdy otrzymany push prowadzi do widocznego `showNotification()`**, także na ścieżce błędu parsowania. Nie implementuj cichego odrzucania duplikatów przez Service Workera, bo WebKit nakłada sankcje na cichy push. **Deduplikacja, odrzucanie anulowanych i przeterminowanych zdarzeń zachodzą przed wysyłką na serwerze**. Jeżeli przyjdzie push mimo anulowania offline, pokaż widoczne powiadomienie; nie udawaj gwarancji jego uniknięcia.
- Rozwiązanie deklaratywnego Web Push jest osobnym standardem: nie wprowadzaj go automatycznie zamiast klasycznego modelu bez testów kompatybilności. Sprawdź aktualne dokumentacje przed uruchomieniem produkcyjnym.
- Durable Object ma **jeden alarm na obiekt**: dla pojedynczej instalacji trzymaj listę zdarzeń w magazynie DO, ustaw najbliższy alarm, po wykonaniu przelicz następny. Nie nadpisuj przypadkowo innych alarmów. Sprawdź bieżącą politykę rozliczeń i limity Cloudflare; bez zgody nie aktywuj płatnych funkcji.

### 8.1a. Web Push — konkretna implementacja kryptograficzna

- Wykorzystaj bibliotekę zgodną z Cloudflare Workers i **Web Crypto / WebCrypto** (kandydat do audytu: [`@block65/webcrypto-web-push`](https://github.com/block65/webcrypto-web-push)); przed wyborem sprawdź aktualną wersję, licencję, utrzymanie, interfejs i działanie `aes128gcm` (RFC 8291) + VAPID (RFC 8292) na prawdziwym Workerze. Alternatywa do porównania: [`@daaku/webpush`](https://jsr.io/@daaku/webpush). Nie zakładaj bez testu, że paczka `web-push` wymagająca Node Crypto działa w Workerze; `nodejs_compat` może pomóc, ale wymaga jawnego testu i uzasadnienia.
- Kontrakt wysyłki: szyfrowanie `aes128gcm`, poprawna identyfikacja VAPID, `TTL` obowiązkowe, `Urgency` jawne lub domyślne `normal`, obsługa statusów `201/202`, błędów `404/410` (wycofanie subskrypcji) i przejściowych `429/5xx`, bez logowania pełnych endpointów i kluczy.
- Testy integracyjne: rzeczywista subskrypcja Home Screen PWA na iPhonie, jeden test widocznego powiadomienia, test anulowania przed wysyłką, test wygasania TTL oraz kontrola odpowiedzi Apple Push Service. Nie raportuj przyjęcia przez push service jako gwarancji dostarczenia użytkownikowi.

### 8.2. Minimalny model serwerowy i prywatność

Dane dozwolone po stronie backendu: `installationId`, `pushSubscription`, `eventId`, `eventType`, `dueAt`, `eventVersion`, `expiresAt`, status zadania i minimalna diagnostyka dostarczenia. Żadnych planów, ciężarów, powtórzeń, pomiarów, historii ani kopii. Usuń wygasłe subskrypcje i dane niepotrzebne według udokumentowanej retencji.

- Uwierzytelnienie instalacji: losowy sekret lub inny silny dowód posiadania rejestracji, po stronie serwera bezpieczny weryfikator; autoryzacja wszystkich operacji na własnych zdarzeniach. CORS nie jest autoryzacją. Sekretów instalacji nie umieszczaj w backupie, tokenów nie loguj.
- Prywatny VAPID wyłącznie w sekretach Cloudflare; publiczny klucz może być w kliencie. **JWT VAPID:** `aud` to origin push service, `exp` w granicach RFC 8292 (≤24 h), podpis `ES256` na P-256. **Wymaganie projektu dla produkcji:** ustaw poprawny `sub` jako osiągalny kontakt właściciela w postaci `mailto:` lub `https:` (właściciel podaje i zatwierdza wartość przed GV-PUSH; brak kontaktu blokuje wdrożenie produkcyjne, nie GV-BASE-A). **RFC 8292 formalnie uznaje `sub` za opcjonalny (`MAY`)**, ale część usług może weryfikować go ściślej. Test bez `sub` wolno wykonywać tylko jako wyraźnie oznaczony test zgodności w środowisku testowym, nie jako domyślną ścieżkę produkcyjną; nie zakładaj sukcesu ani porażki bez wyników z realnej usługi. Nie wymyślaj adresu. HTTPS, kontrola origin, rate limiting, walidacja timestampów i danych, idempotency keys, ochrona przed atakami replay i zgadywaniem identyfikatorów.
- Powiadomienie zawiera minimalny neutralny tekst (np. „Przerwa treningowa zakończona”), bez informacji o obciążeniach czy zdrowiu.

### 8.3. API — stabilny kontrakt

| Metoda | Endpoint | Funkcja |
|---|---|---|
| POST | `/v1/installations` | Zarejestruj instalację (na żądanie użytkownika) |
| PUT | `/v1/installations/push-subscription` | Subskrypcja/rotacja Web Push |
| POST | `/v1/notifications/test` | Wyślij widoczny testowy push |
| PUT | `/v1/timers/{eventId}` | Utwórz lub aktualizuj termin z `eventVersion` |
| DELETE | `/v1/timers/{eventId}` | Anuluj termin przez wersjonowane polecenie |
| PUT | `/v1/reminders` | Ustaw przypomnienia (osobne zgody) |
| DELETE | `/v1/installations` | Usuń instalację, tokeny, subskrypcje, alarmy |

`PUT`/`DELETE` zwracają identyfikator i zatwierdzoną wersję, status oraz czas serwerowy. `POST` testowy nie jest wysyłany automatycznie i wymaga gestu/zgody. Na serwerze utrzymuj „tombstone” dla anulowanych wersji przez skończony okres (np. do wygaśnięcia + retencja), aby opóźniony stary `PUT` nie wskrzesił alarmu.

### 8.4. Outbox i scenariusze sieciowe — **ważne: niemożliwy gwarantowany cancel offline**

- **W GV-PUSH (nie GV-TIMER)** klient tworzy i zapisuje **trwały outbox** niezależny od aktywnego timera: `{commandId, eventId, eventVersion, operation, issuedAt, nextRetryAt, attempts, state}`; może być w IndexedDB, a przed migracją bezpiecznie w namespacowanym magazynie. Wspieraj `PUT`, `DELETE`, rejestrację i synchronizację subskrypcji. Wznawiaj wysyłanie przy `online`, wznowieniu ekranu i nowym uruchomieniu, z ograniczonym exponential backoff i jitter.
- Lokalna pauza/koniec treningu działają natychmiast, **nawet offline**, ale polecenie anulowania otrzymuje `cancel_pending`. UI mówi: „Nie udało się jeszcze anulować powiadomienia w tle; może nadejść stary alarm”. Nie można zagwarantować braku alarmu, jeśli klient jest offline, a serwer już go zaplanował.
- Serwer odrzuca starsze `eventVersion` nawet przy wyścigach i ponowieniach. Zdarzenie po `expiresAt` nie jest wysyłane. Początkowe ustawienie dla krótkiego timera: `expiresAt = dueAt + 60 s` (termin kontroli na serwerze aplikacji). **W każdym żądaniu wysyłającym powiadomienie z serwera aplikacji do push service wymagany jest nagłówek HTTP `TTL` zgodnie z RFC 8030**; dla timera ustaw **konfigurowalne domyślne `TTL: 60` sekund** i `Urgency: normal` (np. dłuższe TTL dla odrębnie uzgodnionych przypomnień). Wartość TTL liczy się od **przyjęcia wiadomości przez push service**, a `expiresAt` kontroluje, czy serwer GymVerse w ogóle ma jeszcze wysyłać zdarzenie. Przetestuj różne opóźnienia na prawdziwym urządzeniu i udokumentuj kompromis między spóźnionym a niedostarczonym alarmem. Ani TTL, ani `expiresAt` nie odwołuje już wysłanego lub dostarczonego powiadomienia i nie gwarantuje anulowania offline. Testuj obecność nagłówka, przyjęcie przez usługę, wygaśnięcie i błędy.
- **Nie gwarantuj dokładnie-jednorazowego dostarczenia** (end-to-end). Deduplikuj **wywołania wysyłkowe po stronie serwera** według `eventId/eventVersion` i atomowo oznaczaj fazę wysyłki; loguj `scheduled`, `send_attempted`, `push_service_accepted`, `failed`, a nie „delivered” bez prawdziwego potwierdzenia urządzenia.
- W scenariuszu offline/anulowania bardzo krótkiego timera deklaracja „nigdy nie przyjdzie fałszywe powiadomienie” jest technicznie niewykonalna. Uczciwie oznacz jako **znane ograniczenie produktu**, nie fałszuj testów.
- Wstępne wdrożenie wymaga zgody właściciela na utworzenie konfiguracji Cloudflare, sekretów VAPID, route worker i ustawienia limitów wydatków.

### 8.5. Testy serwerowe i manualne iPhone

1. Home Screen PWA, udzielona zgoda, ręczny test widocznego push na **zablokowanym iPhonie**.
2. Timer 120 s — prawidłowe `dueAt` i odnotowanie realnego czasu przyjęcia przez push service i odbioru na telefonie, bez obietnicy co do sekundy.
3. Pauza online po 45 s / nowy termin 75 s — brak wysłania starej wersji zdarzenia.
4. `+30 s` i anulowanie online — brak serwerowego wysłania nieaktywnego eventu.
5. Pauza/offline — trwały `cancel_pending`, ponowienie po powrocie sieci i **test potwierdzający znane ryzyko** wysłania starego alarmu podczas braku kontaktu.
6. Opóźnione `PUT`, wersjonowane `DELETE`, powtarzane i równoległe żądania — brak przywrócenia anulowanej wersji.
7. Worker nie pomija cicho push po jego odbiorze; test fallback powiadomienia przy błędnym payloadzie.
8. Wygasła subskrypcja, odmowa uprawnień, brak internetu i zmiana domeny/manifestu nie blokują lokalnego treningu. Dodatkowo test HTTP **konfigurowalnego** `TTL: 60` / `Urgency: normal`, poprawnego JWT VAPID (`aud/exp/ES256`, **zatwierdzony `sub` wymagany w produkcji**), szyfrowania `aes128gcm`, 404/410 i obsługi 429/5xx. 
9. Wyrejestrowanie urządzenia usuwa subskrypcję oraz alarmy; brak tajnych danych w publicznym repo.

Bramka GV-PUSH: status `verified_on_device` dopiero po realnym teście. Bez iPhone'a lub konta Cloudflare oznacz `blocked` i przygotuj test plan, nie ogłaszaj gotowego Web Push.

**Źródła techniczne do weryfikacji na dzień wykonania:**
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://webkit.org/blog/12945/meet-web-push/
- https://webkit.org/blog/16535/meet-declarative-web-push/
- https://developers.cloudflare.com/durable-objects/api/alarms/
- https://developers.cloudflare.com/durable-objects/platform/pricing/

## 9. Porównania treningów (GV-COMP)

- Znajdź poprzednią sesję tego samego planu i odrębnie możliwość manualnego wyboru dowolnych dwóch sesji.
- Porównuj: liczbę serii, liczbę powtórzeń, maksymalny zapisany ciężar, tonaż z określonej metryki, szacowane 1RM, RIR (jeśli jest), czas (jeśli jest).
- Porównanie ćwiczenia wymaga zgodnego `exerciseId` i porównywalnego `variantId`, typu sprzętu i jednostki obciążenia. Nieuzgodnione zamienniki/nieznane warianty pokazuj jako „nieporównywalne”.
- Różna liczba serii jest pokazywana explicite, aby tonaż nie sugerował fikcyjnego wzrostu siły.
- Brak historii → „Pierwszy zapisany trening — brak porównania”.
- Brak RIR → „Brak danych”, nigdy `0`.
- Nie łącz szeregu legacy tonażu z nowym zewnętrznym tonażem bez wspólnej definicji i pełnych metadanych.

Test referencyjny sztangi/maszyny: 20 kg × (8,8,8) → 20 kg × (9,9,9): 24→27 powtórzeń, 480→540 kg tonażu, +60 kg, +12,5%, maksymalny ciężar bez zmian.

---

## 10. Automatyczna progresja (GV-PROG)

### 10.1. Algorytm v1 — double progression

Dla celu `3 × 8–10`:

1. Wykorzystaj dwie ostatnie **ukończone i porównywalne** sesje tego samego ćwiczenia i wariantu.
2. Wszystkie wymagane serie robocze w obu sesjach mają osiągnąć górny limit (`10`). Upewnij się, że obciążenia są porównywalne i nie jest to schemat piramidalny / częściowe powtórzenia.
3. Jeśli warunek spełniono dwukrotnie, **rozważ** zwiększenie ciężaru o skonfigurowany minimalny dostępny krok. Nie zmieniaj samodzielnie planu/historycznych obciążeń.
4. Jeśli RIR=0, nie podpowiadaj automatycznego zwiększenia.
5. Przy znanym RIR 1–3 można wygenerować konkretną propozycję po spełnieniu reszty warunków. Przy braku RIR wyświetl „warunek powtórzeń osiągnięty, potwierdź zapas” zamiast wymyślać RIR.
6. Przy deloadzie nie sugeruj zwiększeń. Jeśli wyniki są gorsze, pokaż trend bez automatycznej rekomendacji podwyższenia.
7. Brak zdefiniowanego skoku kg → sugestia jakościowa bez wymyślonej wartości.
8. Ciężar hantlowy i jego przyrost wyrażaj w `kg/hantel`; dla ruchów naprzemiennych domyślnie powtórzenia są na rękę; progresję asymetryczną uzależniaj od obu stron.
9. Historia rekomendacji może przechowywać status „zaakceptowano/odrzucono”; samo odrzucenie nie nadpisuje programu.

Przykład: 20 kg na hantel × (10/10/10) w dwóch kolejnych sesjach, skonfigurowany skok 2 kg/hantel, RIR 2 → „Rozważ 22 kg na hantel”.

### 10.2. Testy

- Jedna udana sesja nie generuje wzrostu.
- `10/10/8` nie generuje wzrostu.
- Brak RIR nie jest interpretowany jako RIR 2.
- RIR 0 blokuje automatyczną propozycję.
- Zmiana wariantu lub typu sprzętu odcina nieporównywalną historię.
- Progresja oburęczna wymaga kryterium na obie strony.
- Odrzucenie rekomendacji nie zmienia historii i planu.
- Wartości rekomendacji nie są mnożone ×2.

---

## 11. Raporty tygodniowe (GV-RPT)

- Tydzień od poniedziałku 00:00 do następnego poniedziałku 00:00 w lokalnej strefie, z uwzględnieniem daty sesji; domyślna strefa użytkownika `Europe/Warsaw`, ale nie zakładaj, że wszystkie stare daty mają zapisaną strefę. Dla starych danych nie wymyślaj `timeZone`.
- Liczba sesji, serii, powtórzeń, tonaż z **wyraźnie określonej metryki**, rekordy, czas (jeśli dostępny), porównanie z poprzednim tygodniem i rozkład na partie według **jednej** głównej grupy statystycznej `GROUP_BASE`.
- Mięśnie pomocnicze z map anatomicznych są informacyjne: nie naliczaj serii ponownie do nich bez osobno zdefiniowanej metody.
- Dwie sesje jednego dnia liczą się osobno.
- Pusty poprzedni tydzień → „Brak podstawy porównania” (nie dziel przez zero).
- Edycja historycznej sesji przelicza raport tego tygodnia i pozostałe zależności.
- Pokaż wybór tygodnia, wykresy, czytelny polski opis oraz eksport/udostępnienie tekstowe.
- Wszystkie raporty dostępne offline.

Testy: przejście miesiąca i roku, zmiana czasu letni/zimowy, puste tygodnie, dwa treningi jednego dnia, zmiana po korekcie historii, brak mieszania różnych definicji tonażu.

---

## 12. GitHub Pages i PWA (GV-QA)

- Potwierdź, czy GitHub Pages jest włączone, jaki jest rzeczywisty adres i **źródło publikacji** (branch/folder albo GitHub Actions). Dla standardowego Project Pages spodziewana baza to `https://piotrm1974.github.io/gymverse/`, ale wymaga sprawdzenia. **Przełączenie źródła Pages na Actions jest ręczną decyzją właściciela i bramką wdrożeniową.** Nie zmieniaj konfiguracji bez zgody.
- Gdy używasz Vite, skonfiguruj `base: '/gymverse/'` dla standardowej strony projektu, chyba że faktyczna konfiguracja Pages wymaga innej bazy.
- Manifest PWA ma poprawne `id`, `start_url`, `scope`, `display: standalone`, `lang: pl`, ikony 192/512 i aktualne kolory. Stabilne ID ma umożliwić kontynuację instalacji PWA.
- **Jeden** właściwy Service Worker w zakresie aplikacji: offline, cache obrazów, aktualizacje, `push`, `notificationclick`; nie rejestruj konkurencyjnych workerów w tym samym scope.
- Cache czyść tylko dla własnego prefiksu GymVerse. Namespacing obejmuje również IndexedDB (`gymverse-db-*`), storage i kanały komunikacji; `*.github.io` może współdzielić origin z innymi projektami. Instalacja offline nie jest kompletna, dopóki nie pobrano wymaganych zasobów; pokaż stan przygotowania.
- Nie aktualizuj strony automatycznie w środku aktywnej sesji. Można wyświetlić komunikat „Nowa wersja — zaktualizuj po treningu”.
- Nie uzależniaj podstawowego treningu od sieci ani od Cloudflare. Jeżeli GitHub Pages publikuje **bezpośrednio `main` z katalogu `/`**, zwróć uwagę, że pliki `docs/`, `tests/`, `tools/` i inne pliki statyczne także mogą być publicznie dostępne pod adresem witryny; **publiczne repo już ujawnia ich treści niezależnie od Pages**. Nie zapisuj w nich prywatnych danych. Docelowy build do katalogu `dist/` i deployment Actions dopiero po jawnej zgodzie właściciela.
- Użyj GitHub Actions do testów, builda i wdrożenia, po zatwierdzeniu PR. Sekrety dostępne tylko w odpowiednich sekretach środowisk, nigdy w JS frontendowym.
- Zadbaj o README z uruchomieniem lokalnym na Windows 11, budowaniem, GitHub Pages, Cloudflare, backupami, aktualizacją i testami na iPhone. Dokumentuj wymagane ręczne kroki: źródło Pages, domena/baza, utworzenie Cloudflare i sekrety VAPID, uprawnienia GitHub oraz instalacja PWA.

**Uwaga:** nie obiecuj bezwarunkowej trwałości danych przeglądarki; import/eksport użytkownika jest wymaganym zabezpieczeniem. Użycie IndexedDB nie tworzy samo w sobie synchronizacji między iPhone i Windows.

---

## 13. Architektura docelowa i utrzymanie instrukcji

**Nie wykonuj refaktoryzacji big-bang.** Najpierw testy, potem stopniowe wydzielanie czystej logiki bez zmiany zachowania.

```text
gymverse/
├── AGENTS.md                          # trwałe zasady: dane, testy, gałęzie, brak zgadywania
├── docs/
│   ├── current-state.md
│   ├── spec/                          # jeden kanoniczny dokument; bez parafraz źródła prawdy
│   │   ├── README.md                  # indeks/odsyłacz
│   │   └── GymVerse_2_0_MASTER_PROMPT_v2_8.md  # kopia 1:1, utworzona dopiero w GV-DOC
│   └── tasks/
│       ├── GV-BASE-A.md
│       ├── GV-BASE-B.md
│       └── ...
├── index.html                         # zachowany, refaktoryzowany etapami
├── src/
│   ├── main.js
│   ├── data/{schema,storage,migrations,validation,backup}.js
│   ├── exercise/{catalog,anatomy,variants,imageResolver}.js
│   ├── workout/{session,calculations,timer,progression}.js
│   ├── features/{history,comparison,weeklyReport,reminders,planEditor}.js
│   ├── ui/{exerciseLibrary,exerciseDetails,workoutView,reportView}.js
│   └── styles/main.css
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── img/exercises/{technique,muscles,thumbnails}/
├── cloudflare/worker/
├── tests/{fixtures,unit,integration,e2e}/
├── tools/validate-backup.js            # lokalnie: anonimowe statystyki, bez danych użytkownika
├── .github/workflows/
├── .gitattributes
├── .gitignore                           # node_modules/, coverage/, test-results/, playwright-report/, .env*, backupy i prywatne master PNG
├── package.json
├── package-lock.json
└── vite.config.js                       # dopiero gdy zostanie świadomie dodany Vite
```

**W repo nie trzymaj źródłowych master PNG w zwykłym Git.** Dopuszczalny prywatny storage poza repo lub LFS dopiero po sprawdzeniu dostępności, rozmiarów i zgody. W publicznym repo przechowuj wynikowe WebP i manifest.

**Prompt workflow:** ten plik jest **wersjonowaną, normatywną master spec**. W `GV-BASE-A` nie twórz `AGENTS.md`, `docs/spec/` ani nie przepisuj wymagań. **Jeśli źródłowy plik v2.8 jest dostępny w katalogu lokalnym**, w `docs/current-state.md` zapisz jego faktyczną ścieżkę i SHA-256 (w razie braku pliku wpisz „nieudostępniony”, nie twórz fikcyjnego hash). Dopiero w `GV-DOC` skopiuj oryginalne bajty do `docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`, użyj `.gitattributes` z `docs/spec/GymVerse_2_0_MASTER_PROMPT_v*.md -text`, sprawdź SHA-256 **źródła i pliku po zapisie/checkout**. `AGENTS.md` zawiera trwałe zasady i hierarchię: **nowe jawnie zatwierdzone zadanie + odpowiadający mu `docs/tasks/GV-*.md` wskazuje aktualny etap; master określa kontrakty; §17 i nagłówek to historyczne pierwsze zlecenie**. Jeżeli brak nowej zgody, STOP. Przy wydaniu v2.9+ nie nadpisuj pliku v2.8: utwórz nowy plik i dopiero po zatwierdzeniu aktualizuj indeks/pointer. Nie twórz konkurencyjnych treści.

## 14. Harmonogram, zależności, gałęzie i drobne PR fundamentu

| Kolejność | Etap | Gałąź robocza | Zależności | Kryterium |
|---|---|---|---|---|
| 0a | `GV-BASE-A` | `feature/gv-base-a-tests` | aktualny `main` | tylko audyt, minimalne testy i dokumentacja stanu; **bez zmiany logiki** |
| 0b | `GV-DOC` | `docs/gv-master-spec` | zaakceptowany/merged BASE-A | dosłowna, binarnie identyczna kopia spec v2.8 + `AGENTS.md` i odsyłacze, bez kodu produkcyjnego |
| 0c | `GV-BASE-B` | `feature/gv-base-b-fixes` | zaakceptowany/merged GV-DOC | naprawy sesji, draftu, importu i zapisu |
| 1 | `GV-DATA` | `feature/gv-storage-backup` | BASE-B | migracje, interpretacje legacy, backup v4/v5, walidator lokalny |
| 2a | `GV-IMG-META` | `feature/gv-exercise-meta` | DATA | **31+4** metadanych sprzętu, sposobu wykonywania, stron, wariantów i anatomii |
| 2b | `GV-IMG` | `feature/gv-exercise-library` | IMG-META | zatwierdzone grafiki i UI; może przebiegać równolegle z HIST po merge metadanych |
| 3 | `GV-HIST` | `feature/gv-history` | DATA | historia i undo, przeliczenia legacy |
| 4 | `GV-DB` | `feature/gv-dumbbell-metrics` | DATA, HIST, IMG-META | ciężar jednego hantla, sideResults, tonaż nowy i legacy |
| 5 | `GV-TIMER` | `feature/gv-timer` | BASE-B, DATA | **wyłącznie** lokalny timer, trwała pauza |
| 6 | `GV-PUSH` | `feature/gv-webpush` | TIMER | trwały outbox, Cloudflare, Web Push, realny iPhone |
| 7 | `GV-COMP` | `feature/gv-comparison` | HIST, DB | porównywalne sesje |
| 8 | `GV-PROG` | `feature/gv-progression` | COMP, DB | double progression |
| 9 | `GV-RPT` | `feature/gv-weekly-report` | HIST, DB, COMP | raporty, porównywalna metryka |
| 10 | `GV-QA` | `release/gymverse-2.0` | wszystkie | regresje, Pages, iPhone, obrazy |

**Zasady gałęzi:** nowa gałąź powstaje od `main` **po zaakceptowanym merge zależności**. Jeżeli zależności nie zostały scalone, wstrzymaj lub uzyskaj zgodę na jawny stacked PR. Nie merge'uj samodzielnie. Oddzielone `GV-IMG-META` pozwala wykonać `GV-DB` **bez czekania na produkcję 105 assetów**.

### 14.1. GV-BASE-A — pierwsze zlecenie (po wykonaniu wyłącznie historyczne): mały PR z audytem i testami zachowania

- `BASE-A-01` — sprawdź lokalny klon, sieć, `git`, `gh`, status `main`, faktyczne uprawnienia i konfigurację Pages, pliki `img/`; nie przypisuj fałszywych uprawnień. **Przed zmianami i utworzeniem gałęzi utrwal `BASE_SHA` z lokalnego `main` oraz początkowy status repo, zgodnie z §0.2.** Gdy GitHub jest niedostępny, zastosuj stan „nierozpoczęty lokalnie, niezweryfikowany zdalnie”; nie fabrykuj dowodu zdalnego.
- `BASE-A-02` — odczytaj bieżący SHA, lokalne zmiany, mapę funkcji, aktualne klucze danych, EOL `git ls-files --eol`. Udokumentuj w `docs/current-state.md` **faktyczny kształt historycznej sesji, serii i aktywnego treningu** (listę pól i ich typów; czy istnieją w source: `isBW`, typ sprzętu, `variantId`, `side`, `sideResults`, osobno zapisane obciążenie BW, RIR, liczba przyrządów i sposób liczenia powtórzeń; pola niewystępujące zaznacz jako brakujące). Rozróżnij helpery obliczeniowe w kodzie od pól przechowywanych w backupie. Użyj wyłącznie kodu i syntetycznych przykładów, bez odczytu prywatnej historii z iPhone’a bez zgody. **Bez tagu „stabilny” bez rzeczywistego potwierdzenia**.
- `BASE-A-03` — użyj Node 26 Active LTS (przypnij faktycznie uruchomioną wersję), `Vitest` i minimalnego harness do **charakteryzowania aktualnego kodu inline** (`setLoad`, `e1rm`, `metric`, `normalizeSession`, `weekStart`, `isBW` **po potwierdzeniu ich obecności w bieżącym kodzie**); nie zmieniaj semantyki ani nie wydzielaj całego monolitu. Wpisz zweryfikowaną listę funkcji i ich rodzaj (`function`, `const`, metoda) w `docs/current-state.md`.
- `BASE-A-04` — minimalne **syntetyczne** fixture’y obejmujące pusty stan, aktywną sesję, fragmenty historii schematu v2 i JSON backup v4. Każda zmienna użyta w fixturach jest fikcyjna; nigdy nie dodawaj prawdziwego eksportu użytkownika.
- `BASE-A-05` — minimalne E2E (Playwright Chromium, desktopowy WebKit gdy możliwy) przez `http://127.0.0.1:<port>` z testowym serwerem przypiętym wyłącznie do loopback (`127.0.0.1`) i katalogu checkoutu repo (bez traversal/symlink poza repo), nie `file://`: start planu, zapis serii, zakończenie, odświeżenie, import. Znane błędy opisuj testami reprodukcyjnymi/`xfail` z uzasadnieniem i planem naprawy w BASE-B — **nie nazywaj ich zaliczonymi naprawami**.
- `BASE-A-06` — zachowaj oryginalne CRLF/LF; w `.gitattributes` dodaj co najwyżej deklaracje `binary` dla bitmap/ZIP, żadnego `eol=lf` ani masowej renormalizacji. Uzupełnij `.gitignore` o `node_modules/`, `coverage/`, `test-results/`, `playwright-report/`, `.env*` (z wyjątkiem `.env.example`) oraz prywatne eksporty i masters. **Obowiązkowy dowód braku zmian plików chronionych (§0.2):** użyj dokładnej procedury z §0.2 opartej na pierwotnym, niezmiennym `BASE_SHA` (nie na ruchomym `main`), sprawdź `git diff --exit-code` dla chronionych zasobów i pełny `git diff --name-status`, a także pliki nieśledzone i wszystkie pozostałe rootowe pliki powłoki. Dołącz do raportu kody wyjścia, pełną listę zmian i wynik walidacji allowlisty. Odrzuć PR, jeżeli zmieniono, usunięto, przemianowano lub dodano plik produkcyjny; dozwolone pliki testów/narzędzi/dokumentacji nie są automatycznie błędem.
- `BASE-A-07` — uruchom testy, opisz komendy, ograniczenia i regresje; dołącz `docs/current-state.md` wraz z rzeczywistym wynikiem kontroli braku zmian produkcyjnych z BASE-A-06. **Nie twórz jeszcze `AGENTS.md`, rozdziałów `docs/spec` ani walidatora prywatnego backupu**: dokumenty mastera należą do `GV-DOC`, a walidator wyłącznie do `GV-DATA`. Brak pobierania binariów Playwright z sieci lub brak uprawnień do ich instalacji zgłoś jako bloker testu, nie jako zaliczenie.
- `BASE-A-08` — przygotuj PR albo diff/commity, raport i **STOP**. Nie naprawiaj jeszcze błędów i nie wdrażaj usług.

### 14.1a. GV-DOC — osobny PR dokumentacji, tylko po akceptacji BASE-A

- Skopiuj udostępniony przez właściciela **oryginalny plik master prompt v2.8 bajt po bajcie** do `docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`. Źródłowy plik musi być faktycznie dostępny w znanym katalogu lokalnym (np. właściciel dołącza lub wskazuje plik z dysku Windows); samo wklejenie promptu w czacie nie daje gwarancji dostępu do identycznych bajtów. Przed kopiowaniem dodaj do `.gitattributes` wąską regułę `docs/spec/GymVerse_2_0_MASTER_PROMPT_v*.md -text`, bez zmiany globalnej polityki EOL. Porównaj SHA-256 źródła/kopii przed commitem i po ponownym odczycie z checkout; jeśli dostęp do źródła jest niemożliwy, zgłoś blokadę, **nie rekonstruuj z pamięci**.
- Dodaj krótki `AGENTS.md`: ochrona danych, testy, zakaz merge/deploy bez zgody, jeden **aktualny** master spec jako źródło normatywne, a **§17 i nagłówek START jako historyczne pierwsze zlecenie**. Aktualny etap wolno uruchomić wyłącznie na podstawie nowej wyraźnej zgody użytkownika i odpowiadającego `docs/tasks/GV-*.md`. Nie traktuj skopiowanego mastera jako polecenia odtworzenia BASE-A. Starsze wersje mastera zachowuj jako archiwalne snapshoty. Bez duplikowania setek wymagań.
- Dodaj indeks `docs/spec/README.md` wskazujący **konkretny numer bieżącej normatywnej wersji v2.8** oraz politykę niezmiennych snapshotów (przy v2.9+ utwórz nową kopię, nie edytuj v2.8, aktualizuj wskaźnik tylko po zgodzie). Dodaj `docs/tasks/GV-BASE-B.md` jako krótki odsyłacz do §14.2 i §0, ale nie oznaczaj go jako zatwierdzonego do uruchomienia, dopóki użytkownik nie wyrazi zgody. Nie twórz pustych „wypełnionych z głowy” specyfikacji.
- Dokumentacyjny PR ma **zero zmian logiki produkcyjnej**; raport i STOP przed BASE-B.

### 14.2. GV-BASE-B — wyłącznie po zaakceptowaniu i scaleniu GV-BASE-A oraz GV-DOC; PR poprawek

- `BASE-B-01` — `finishWorkout` sprawdza kompletność dla każdej ścieżki; **niekompletne** = liczba faktycznie zatwierdzonych serii < suma wymaganych serii po uwzględnieniu ręcznych zmian `setCount`. Pominięte ćwiczenie liczy się do wymaganych serii, nie jest automatycznie oznaczone jako wykonane. Gdy wykonano więcej serii niż plan, pokazuj nadmiar oddzielnie, nie wyliczaj ujemnego braku. Przy `0` serii zachowaj dotychczasowe semantyczne zachowanie po potwierdzeniu albo zaproponuj zmianę jako oddzielną decyzję (nie wymyślaj treningu). Wyświetl `X/Y`.
- `BASE-B-02` — stan trwałego zapisu: zapis do storage, odczyt zwrotny / kontrola integralności, dopiero potem uznanie sukcesu. Jeśli `QuotaExceededError` albo zapis nie jest możliwy: **nie przechodź do następnego stanu, nie kasuj aktywnej sesji**, wyświetl błąd i zaoferuj **awaryjny eksport JSON** bieżącego stanu w pamięci. Nie obiecuj uratowania danych po zamknięciu przed udanym eksportem.
- `BASE-B-03` — **jednoznaczna polityka draftu:** każda zmiana w polach wagi/powtórzeń zachowuje robocze wartości w osobnym namespacowanym kluczu (np. `gymverse_draft_v1`, z `planId/step/setNumber/timestamp`), z debouncem i zapisem na opuszczeniu pola/kroku; przy powrocie/odświeżeniu automatycznie przywróć niezatwierdzone wartości z komunikatem „Wpis niezatwierdzony”. Zatwierdzenie serii usuwa powiązany draft; porzucenie sesji po potwierdzeniu usuwa jej draft. Draft musi wejść do backupu v5 i migracji DATA.
- `BASE-B-04` — `importData` nie modyfikuje `CUSTOM`, planów ani historii **przed** zatwierdzeniem przez użytkownika i udanym zapisem. Minimalna naprawa jeszcze przed pełnym silnikiem importu DATA; w razie błędu brak częściowych zmian.
- `BASE-B-05` — `sw.js`: kasuj wyłącznie cache prefiksu `gymverse-`; nie wymuszaj reloadu aktywnego treningu; zweryfikuj krytyczne zasoby offline i fallback starych zdjęć. Nie wdrażaj jeszcze push bez konfiguracji.
- `BASE-B-06` — uruchom testy BASE-A + nowe pozytywne regresje. W raporcie pokaż, które wcześniej „expected failing” zostały naprawione.

### 14.3. Kolejność decyzji właściciela

1. **Pierwsza bramka decyzyjna:** zatwierdzenie GV-BASE-A po udokumentowanym raporcie i zweryfikowanych wynikach testów; po akceptacji wpis jest historyczny.
2. Po merge A: zgoda na oddzielny `GV-DOC` (dosłowna spec + krótkie stałe reguły).
3. Po merge DOC: zgoda na GV-BASE-B.
4. Po merge BASE-B: zgoda na GV-DATA i wymagane rzeczywiste lokalne backupy.
5. Przed wdrożeniem GitHub Actions: właściciel potwierdza source Pages (przełączenie to osobna zgoda); jeśli obecnie jest źródło `main`/root, traktuj `docs/`, `tests/`, `tools/` jako potencjalnie publicznie dostępne artefakty i nie umieszczaj tam żadnych prywatnych danych.
6. Przed GV-PUSH produkcyjnym: właściciel potwierdza konto Cloudflare, koszty/limity, poprawny osiągalny kontakt `sub` VAPID oraz bezpieczne przechowywanie sekretów.
7. Przed zatwierdzeniem GV-IMG: użytkownik dostarcza referencję `tri_machine`, akceptuje pięć obrazów próbnych i ich anatomię.

## 15. Matryca testów i kryteria wydania

### 15.1. Regressions — obowiązkowe

1. Wszystkie 4 plany domyślne i wszystkie plany własne zostają zachowane.
2. Istniejące serie, ciężary, powtórzenia, pomiary i historia nie ulegają destrukcyjnej zmianie.
3. Aktywny trening i niezatwierdzony draft przetrwają odświeżenie/zamknięcie PWA w normalnym scenariuszu trwałego storage; awaria zapisu musi być jawna.
4. Kończenie niekompletnego treningu: 9 z 12 serii → widoczna decyzja użytkownika, niezależnie od przycisku.
5. Import starego JSON v4 i nowego ZIP v5 → zgodne dane, brak przypadkowych duplikatów.
6. Uszkodzony import, błąd zapisu i przerwana migracja → poprzedni stan bez zmian.
7. Wszystkie 31 ID katalogowe i 4 warianty mają manifest, obrazy/placeholder o właściwym ID; po produkcji wszystkie 35 zatwierdzone grafiki z 3 widokami, 105 plików.
8. `tri_machine` zgodny z referencją maszyny do tricepsa, nie maszyny do bicepsa.
9. Ciężar hantla to jeden hantel; naprzemienne powtórzenia to liczba **na rękę**; jednostronne dwie strony to **jedna logiczna seria z `sideResults`**, a nie dwie serie.
10. `db_bench` 20×12, dwa hantle → externalVolume 480, 1RM z 20 kg; młotkowe 20×12/rękę → 480; jedna strona 20×12 → 240; sztanga 60×10 → 600; `sideResults` 20×12 + 18×10 → 420 i osobne e1RM/rekord lewej/prawej (28,0 i 24,0 kg/hantel); BW 3×10→3×11 = progres powtórzeń mimo externalVolume=0.
11. Historia i raporty nie mieszają legacy volume z nową metryką bez oznaczenia. Test klasyfikacji historycznej: jednoznaczne `bench_flat` = `known` jako nominalny ciężar; `shoulder_press` bez wariantu = `unknown` (maszyna lub hantle); `lat_raise_cable` bez liczby wykonanych stron = `unknown`; `tri_overhead` bez identyfikacji sprzętu = `unknown`. Dopiero jawne potwierdzenie w kreatorze może nadać `user_confirmed_legacy`; cofnięcie potwierdzenia przywraca `unknown` bez modyfikacji surowych danych.
12. Pauza timera 75 s, reload → dalej 75 s w pauzie; `+30` → 105 s; brak podwójnych sygnałów.
13. Cloudflare: wysyłka `aes128gcm` + VAPID (z zatwierdzonym produkcyjnym `sub`) + obowiązkowy, konfigurowalny `TTL` (domyślnie `60`) i `Urgency: normal` dla timerów; start, pauza, zmiana i anulowanie **online** nie wysyłają starej wersji alarmu; w scenariuszu **offline-cancel** poprawny outbox/status i jawny test możliwego spóźnionego push (bez obiecywania niemożliwej gwarancji); faktyczny test zablokowanego iPhone.
14. Porównanie 480→540 przy 20 kg × (8/8/8) i 20 kg × (9/9/9) = +60 kg, +12,5%.
15. Progresja nie podwyższa ciężaru po jednej sesji, przy niekompletnym zakresie, RIR=0 lub aktywnym deloadzie; odrzucenie niczego nie nadpisuje.
16. Raport: poniedziałek–niedziela, przejście roku, DST, dwa treningi dziennie, brak dzielenia przez 0.
17. PWA działa po pierwszym przygotowaniu offline; na GitHub Pages brak 404 pod bazą `/gymverse/` lub rzeczywistą konfiguracją domeny.
18. GitHub Actions wykonuje testy; brak sekretów w repo; `main` i produkcja bez zmian bez akceptacji. Dodatkowe bramki etapowe: `GV-BASE-A` ma **zerowy diff chronionych plików (§0.2)** względem zapisanego `BASE_SHA`, kompletny audyt `git diff --name-status` i kontrolę plików nieśledzonych; `GV-DOC` ma **identyczny SHA-256** źródłowego i skopiowanego mastera v2.8, regułę `-text` i zapis w `AGENTS.md`, że historyczny §17 nie autoryzuje ponownego GV-BASE-A.

### 15.2. Kontrola grafik

Dla każdego z 35 wariantów wymagana checklista: poprawne ID; poprawny sprzęt; poprawna pozycja i chwyt; poprawny ruch; odpowiednie czerwone i żółte mięśnie; brak błędów anatomicznych; czytelność na iPhonie; trzy faktycznie istniejące pliki; poprawne ścieżki; offline po pobraniu; `approved` potwierdzony przez człowieka.

### 15.3. Wydanie

Nie ogłaszaj GymVerse 2.0 jako ukończonego, jeśli:
- któraś migracja pozostaje nieweryfikowalna,
- historyczne dane ulegają utracie,
- grafiki są wygenerowane tylko „na papierze”,
- push nie był sprawdzony na prawdziwym zablokowanym iPhonie (wówczas odnotuj blokadę),
- nie przeszły testy regresji lub GitHub Pages nie działa.

---

## 16. Oczekiwany format odpowiedzi po KAŻDYM etapie

Po ukończeniu etapów zwracaj zwięzły, ale kompletny raport w następującej strukturze:

1. **Stan bazowy**: SHA, aktualna gałąź, co sprawdzono.
2. **Zmiany w kodzie**: lista plików i zwięzłe uzasadnienie.
3. **Wykonane testy**: komendy, liczba testów, sukcesy, błędy.
4. **Bezpieczeństwo danych**: co zostało sprawdzone i czy występuje ryzyko utraty danych.
5. **Zgodność PWA/iPhone**: co sprawdzono rzeczywiście, a co czeka na test; w niepowiązanym etapie podaj „nie dotyczy”.
6. **Grafiki**: liczby `pending/review/approved/rejected` **lub „nie dotyczy” w etapie niezwiązanym z obrazami**; nigdy nie udawaj, że obraz istnieje.
7. **PR/commit**: link albo SHA, jeśli rzeczywiście utworzony.
8. **Ryzyka i pytania blokujące**: tylko realne, konkretne kwestie.
9. **Kryteria odbioru**: zaliczone / niezaliczone / niezweryfikowane.
10. **Następny etap**: propozycja, ale bez automatycznego rozpoczęcia.

---

## 17. PIERWSZE URUCHOMIENIE — tylko GV-BASE-A (jednorazowa instrukcja historyczna po jego zakończeniu)

**Ta procedura dotyczy wyłącznie pierwszego uruchomienia mastera po potwierdzeniu według §0.2, że GV-BASE-A nie został rozpoczęty ani wykonany. Jawne polecenie użytkownika „Wykonaj GV-BASE-A” w bieżącej rozmowie stanowi zgodę na jego uruchomienie; samo przekazanie pliku nie stanowi takiej zgody.** Po zakończeniu GV-BASE-A treść §17 jest wyłącznie zapisem historycznym. Nie autoryzuje GV-DOC, GV-BASE-B ani żadnego późniejszego etapu. Wykonaj poniższe kroki w kolejności tylko w pierwszym zleceniu; szczegółowe kryteria są w §14.1.

1. **Najpierw ustal status GV-BASE-A zgodnie z §0.2.** Jeżeli etap jest w toku, ukończony lub niepewny, **nie kontynuuj automatycznie**. Tylko jeśli nie rozpoczęto go wcześniej i masz zgodę właściciela, zweryfikuj bieżący SHA `main`, stan i lokalizację klonu repozytorium `PiotrM1974/gymverse`, status drzewa roboczego, `git`, `gh`, dostęp do sieci, możliwość wykonania PR i rzeczywistą konfigurację GitHub Pages. Jeśli brakuje narzędzi/uprawnień, zgłoś blokadę; **nie deklaruj wykonanego działania bez dowodu**. Nie nadpisuj zmian użytkownika.
2. Sprawdź `git ls-files --eol`, rzeczywiste `img/`, `index.html`, `sw.js`, `manifest.webmanifest`, klucze storage, wersje schematów i zgłaszane błędy. **Sprawdź pola rzeczywiście zapisywane w legacy sesjach/seriach oraz oddziel je od helperów wyliczanych w runtime (BASE-A-02).** Zapisz wynik w `docs/current-state.md`.
3. Zapisz `BASE_SHA` sprzed utworzenia gałęzi zgodnie z §0.2, a następnie utwórz `feature/gv-base-a-tests` z tego dokładnie commita `main`. Użyj minimalnego harness **Node 26 Active LTS (pin rzeczywistego patcha) + Vitest + Playwright**; jeśli brakuje Node, uprawnień do instalacji lub możliwości pobrania przeglądarek Playwright z sieci, zgłoś blokadę danej czynności/testu, nie zmieniaj systemu użytkownika bez uzgodnienia. Pisząc testy, nie zmieniaj zachowania kodu produkcyjnego. Testy E2E uruchom przez serwer HTTP **127.0.0.1, dostęp tylko do katalogu checkoutu repo**, nigdy przez `file://`; Playwright WebKit nie zastępuje Safari iOS.
4. Przygotuj mały zestaw syntetycznych fixture’ów i testy **charakteryzujące zastane zachowanie**. Znane bugi oznacz jawnie jako reprodukcyjne/oczekujące na BASE-B. Dodaj `.gitignore` oraz co najwyżej `binary` w `.gitattributes`, bez globalnego wymuszenia LF i bez masowego diffu monolitu.
5. Uruchom rzeczywiście dostępne testy, podaj komendy i wyniki, listę niezweryfikowanych testów oraz blokery. **Udokumentuj zerowy diff chronionych plików (§0.2)** względem utrwalonego `BASE_SHA`, pełną listę statusów zmian (`A/M/D/R/...`), kontrolę rootowych ikon i wszystkich nowych plików nieśledzonych. Pokaż rzeczywiste polecenia i wyniki, zamiast powoływać się na przesuwający się `main`. **Nie twórz jeszcze `AGENTS.md`, całego `docs/spec/`, prywatnego walidatora, migracji lub napraw** — odłóż je do osobnych GV-DOC/BASE-B/DATA.
6. Przygotuj PR, jeśli są uprawnienia; jeśli nie, przedstaw diff/commity i instrukcję. Zakończ raportem wg §16. **ZATRZYMAJ SIĘ.** Poproś o zatwierdzenie GV-BASE-A i osobne rozpoczęcie GV-DOC.

**Koniec JEDNORAZOWEJ instrukcji GV-BASE-A. Po jej wykonaniu nowy etap wymaga odrębnej, jawnej zgody użytkownika i właściwego zadania `docs/tasks/GV-*.md`. Samo ponowne przeczytanie pliku master nie autoryzuje żadnego działania.**

---

## Aneks A — kontrola zgodności przed wydaniem (informacyjna; normatywne reguły są wyłącznie w §2, §3 i §8)

- Zidentyfikuj i zgłoś każdy przypadek konfliktu wymagań między danymi legacy i nowymi metrykami, zamiast zmieniać dane w tle.
- Nie implementuj „cichego push” na iOS. Po stronie klienta `push` klasyczne zawsze daje widoczne `showNotification`, dedup/cancel odbywają się po stronie serwera przed wysyłką.
- Test „anulowanie podczas offline” **nie może** oczekiwać technicznie niemożliwego braku push; sprawdza poprawność outboxu, jawne ostrzeżenie i późniejsze anulowanie przy odzyskaniu łączności.
- Zadbaj o rozróżnienie `per_set`, `per_side`, `implementCount`, `trainedSides` we wszystkich 31 pozycjach i czterech wariantach, własnych ćwiczeniach i snapshotach historii.
- Nie pomijaj walidacji wszystkich zdjęć oraz atrybutów `alt` w UI; kategoria „Brzuch” domyślnie jest pusta.
- Migracja nie jest równoznaczna z bezstratnym rollbackiem do starej wersji. Pełne dane utrzymuj w backupie v5.
- Import backupu **nigdy nie aktywuje starych eventId/pushStatus/outboxu** na nowej instalacji.
- Jednostronne ćwiczenia używają `sideResults` w jednej logicznej serii; dopiero nowo zatwierdzony wariant użytkownika może zmienić sposób wykonania.
- Nagłówek `TTL` jest obowiązkowy w Web Push; w razie braku sieci nie istnieje gwarancja odwołania już zaplanowanego alarmu.

## Aneks B — źródła / bieżąca weryfikacja dokumentacji przy wdrożeniu

- WebKit iOS Home Screen Web Push: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- WebKit — klasyczne powiadomienia muszą być widoczne: https://webkit.org/blog/12945/meet-web-push/
- WebKit — Declarative Web Push (odrębny model): https://webkit.org/blog/16535/meet-declarative-web-push/
- Apple — Web Push bez Apple Developer Program: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- Cloudflare DO Alarms (jeden najbliższy alarm na Durable Object): https://developers.cloudflare.com/durable-objects/api/alarms/
- Cloudflare DO Pricing: https://developers.cloudflare.com/durable-objects/platform/pricing/
- Node.js Release WG (26 Active LTS vs 24 Maintenance LTS na 2026-11-20): https://github.com/nodejs/Release
- RFC 8030 — `TTL` obowiązkowe, `Urgency` opcjonalne: https://www.rfc-editor.org/rfc/rfc8030.html
- RFC 8292 — VAPID JWT, `sub` opcjonalny w standardzie (`MAY`), lecz wymagany w **naszej** konfiguracji produkcyjnej po zatwierdzeniu kontaktu: https://www.rfc-editor.org/rfc/rfc8292.html
- Web Crypto w Cloudflare Workers: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
- Przykładowa biblioteka WebCrypto Web Push dla Cloudflare: https://github.com/block65/webcrypto-web-push

**Zweryfikuj aktualne wymagania usług ponownie bezpośrednio przed ich użyciem; nie traktuj stron internetowych jako bezwarunkowego zapewnienia cen, dokładności czasu lub dostępności funkcji.**

