# Etap 11B — samodzielny zestaw wydania i testów

Data: 2026-11-26. Praca w istniejącym worktree i branchu `feature/gymnastika-approved-ui`, HEAD bazowy `fc6f1778483c3e623003be2479ce786be9baf1ae`. Bez operacji GitHub, commita, merge, rebase, reset, pull, push, wdrożenia, publikacji ani pełnej regresji 454 E2E.

## Wynik

Fixture’y testów potrzebne do uruchamiania z czystego checkoutu przeniesiono pod `tests/fixtures/`; kopie źródłowe pod `outputs/` zachowano. Zaktualizowano ich ścieżki. Asercje nadal sprawdzają rzeczywiste zachowanie i zasoby. Pilot lokalny wykorzystuje oficjalne obrazy aplikacji, nie atrapy. Bundle `outputs/GV-STAGE11B-STAGING/site/` przygotowano lokalnie, bez uploadu.

### Rejestr 20 zależności z raportu 11A

| Pozycje z wykazu 11A | Wykorzystanie | Pochodzenie i decyzja |
|---|---|---|
| 1–3. `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/preview.html`, `preview.css`, `preview.js` | `tests/e2e/exercise-illustrations-preview.spec.js` | Lokalny prototyp przeglądu. Kopie testowe pod `tests/fixtures/exercise-illustrations/`; oryginały zachowane. Względne importy i wskazania do assetów dostosowano. Tekstowe pliki projektu, wersjonowanie bez ograniczeń. |
| 4–7. `reference-art/db_bench-paired-draft.png`, `lat_pulldown_wide-paired-draft.png`, `lat_raise_stand-paired-draft.png`, `leg_press-paired-draft.png` w tym samym katalogu | Były źródłami obrazów w prototypie powyżej | Lokalne szkice preview, ok. 1,8–2,2 MB każdy; prawa do redystrybucji niepotwierdzone. Nie skopiowano do repo. Fixture wskazuje zatwierdzone obrazy wydania z `src/data/exercise-images/selected/`, a test sprawdza ich rzeczywisty rozmiar 768×512. Oryginały lokalne zachowane. |
| 8. `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/presentation-registry.json` | `exercise-presentation-pilot.spec.js`, lokalny pilot w `index.html` i Service Worker | Lokalny kandydat 34 rekordów. Kopia w `tests/fixtures/exercise-presentation-pilot/local-pilot/`; zmieniono wyłącznie ścieżki assetów na release. SHA-256 wszystkich 136 assetów zgodne z release registry. Bez danych właściciela; wersjonowanie jako fixture. |
| 9–12. `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/snapshots/input/atlas.css`, `atlas.js`, `index.html`, `sw.js` | Tryb `input` w obu serwerach pilota dla E2E prezentacji | Historyczne źródłowe snapshoty projektu. Skopiowano bajt w bajt do `tests/fixtures/exercise-presentation-pilot/snapshots/input/`; oryginały zachowane. |
| 13–16. `outputs/GV-LAT-RAISE-MALE-FEMALE/selected/technique/lat_raise_stand__default-male.webp`, `lat_raise_stand__default-female.webp` oraz `selected/thumbnails/lat_raise_stand__default-male.webp`, `lat_raise_stand__default-female.webp` | Rejestr/pilot, Service Worker i asercje E2E | Cztery dokładne duplikaty SHA-256 zasobów `src/data/exercise-images/selected/`; nie kopiowano. Ścieżki skierowano do wersjonowanych zasobów aplikacji. Oryginały zachowane. |
| 17–20. `outputs/GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE/after/exercise-db_bench.png`, `exercise-lat_pulldown_wide.png`, `exercise-lat_raise_stand.png`, `exercise-leg_press.png` | Baseline `tests/e2e/gv-musclemap-anatomy-review.spec.js` | Zrzuty widoków MuscleMap z wcześniejszego porównania. Skopiowano bajt w bajt do `tests/fixtures/musclemap-anatomy-review/before/`; test zachowuje rzeczywiste baseline’y. Projektowe grafiki bez danych użytkownika; wersjonowanie jako fixture. Oryginały zachowane. |

Dodatkowe, spoza listy 20: cztery `silhouette-{female-back,female-front,male-back,male-front}.png` z `outputs/GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE/before/` są wejściem `gv-musclemap-qa-gate.spec.js`. Skopiowano je bajt w bajt do tego samego katalogu fixture. To syntetyczne zrzuty MuscleMap bez treningów użytkownika; nadają się do repo. Oryginały zachowane.

Wykryto dodatkowe, nieujęte w wykazie 11A zależności: lokalny Service Worker pilot miał jeszcze 132 ścieżki obrazów (12 w grupie THREE i 120 COMPLETE) pod `outputs/`. Wszystkie 136 assetów wynikowego rejestru oraz te ścieżki wskazują na lokalne, wydane obrazy `src/data/exercise-images/selected/`; wartości SHA-256 z rejestru i bajtów plików potwierdzają tożsamość. W unit testach, schemacie walidacji i ścieżce lokalnego pilota przeniesiono oczekiwane ścieżki na wydany katalog/fixture. Pilot pozostaje wyłącznie loopback + jawny query flag.

Bilans oryginalnych 20: 12 plików wejściowych przeniesiono (3 podglądu + rejestr + 4 snapshoty + 4 PNG baseline), 4 WebP wykorzystują już wersjonowane odpowiedniki SHA-256, a 4 duże szkice pozostały lokalne i nie są już wymagane przez test po przepięciu podglądu na zatwierdzone obrazy. Cztery dodatkowe baseline silhouette zostały również przeniesione. Łącznie 16 repozytoryjnych fixtures dodano.

### Pliki utworzone lub zmienione w Stage 11B

Nowe wymagane test fixtures (16 plików):

- `tests/fixtures/exercise-illustrations/preview.html`
- `tests/fixtures/exercise-illustrations/preview.css`
- `tests/fixtures/exercise-illustrations/preview.js`
- `tests/fixtures/exercise-presentation-pilot/local-pilot/presentation-registry.json`
- `tests/fixtures/exercise-presentation-pilot/snapshots/input/atlas.css`
- `tests/fixtures/exercise-presentation-pilot/snapshots/input/atlas.js`
- `tests/fixtures/exercise-presentation-pilot/snapshots/input/index.html`
- `tests/fixtures/exercise-presentation-pilot/snapshots/input/sw.js`
- `tests/fixtures/musclemap-anatomy-review/before/exercise-db_bench.png`
- `tests/fixtures/musclemap-anatomy-review/before/exercise-lat_pulldown_wide.png`
- `tests/fixtures/musclemap-anatomy-review/before/exercise-lat_raise_stand.png`
- `tests/fixtures/musclemap-anatomy-review/before/exercise-leg_press.png`
- `tests/fixtures/musclemap-anatomy-review/before/silhouette-female-back.png`
- `tests/fixtures/musclemap-anatomy-review/before/silhouette-female-front.png`
- `tests/fixtures/musclemap-anatomy-review/before/silhouette-male-back.png`
- `tests/fixtures/musclemap-anatomy-review/before/silhouette-male-front.png`

Zmienione źródła/testy: `index.html`, `src/exercise/presentation-contract.js`, `src/exercise/presentation-extension.schema.json`, `sw.js`, `tests/e2e/exercise-illustrations-preview.spec.js`, `tests/e2e/exercise-presentation-pilot.spec.js`, `tests/e2e/gv-musclemap-anatomy-review.spec.js`, `tests/e2e/gv-musclemap-qa-gate.spec.js`, `tests/unit/exercise-presentation-contract.test.js`, `tests/unit/service-worker.test.js`, `tools/serve-test.mjs`, `tools/serve-presentation-pilot.mjs`. `PROJECT_HANDOFF.md` i `tools/prepare-staging.mjs` dodają przenośną dokumentację i lokalny builder. Wcześniejsze niezacommitowane zmiany pozostają zachowane.

Aktualizacja allowlisty: 169 ścieżek Stage 11A + 22 nowe pozycje Stage 11B = **191 kandydatów do przyszłego commita**. Do bazowej listy dopisz dokładnie 16 fixtures powyżej, `PROJECT_HANDOFF.md`, niniejszy raport, `tools/prepare-staging.mjs`, `src/exercise/presentation-contract.js`, `tests/unit/exercise-presentation-contract.test.js` i `tools/serve-presentation-pilot.mjs`. Pozostałe zmienione ścieżki były już na liście 11A. Stan roboczy ma 203 wpisy; pozostałe 12 to niezatwierdzone alternatywne projekty/boardy pod `design/gymnastika-redesign/` i są wyłączone z tej allowlisty. Nie dodawać `outputs/`, `.atlas-import-tmp/`, logów, raportów Playwright, trace, runtime przeglądarki, prywatnego `PROJECT_MEMORY.md` ani czterech szkiców PNG o niepotwierdzonych prawach. Obecny `.gitignore` już wyklucza lokalne wyniki i pamięć, plików nie usuwano.

### Pliki nadal wymagane lokalnie

- Zestawienie 11A wymienia cztery duże szkice PNG i oryginały snapshotów / pilotów w `outputs/`. Po przeniesieniu testy aplikacji nie zależą od nich; zachowano wszystkie.
- Narzędzia eksploracyjne i generatory obrazów (`tools/build-exercise-images-*.mjs`, `tools/build-exercise-presentation-release.mjs`, ACE research tools) nadal odczytują lokalne review/źródła w `outputs/`. Są opcjonalne i nie są potrzebne do instalacji zależności, uruchamiania aplikacji ani testów; nie są częścią działającego runtime. Przy czystym checkoutcie nie uruchamiać ich bez ich osobnych wejść.
- `PROJECT_MEMORY.md` pozostaje lokalny i ignorowany zgodnie z wymaganiem właściciela.

Poza aplikacją i testami, opcjonalne narzędzia odtwarzające warsztat ilustracji wymagają historycznych źródeł, recenzji i rekordów zgody pozostających w lokalnym `outputs/`; nie wchodzą do zestawu samodzielnego runtime/testów. `release-registry.json` zawiera też historyczne ścieżki do aktów zatwierdzenia jako metadane pochodzenia. Aplikacja ich nie otwiera ani nie pobiera; narzędzia walidujące/odtwarzające warsztat mogą ich wymagać. Odtworzenie tych warsztatów na innym komputerze wymaga osobnej dostawy materiałów źródłowych i potwierdzenia praw.

## Samodzielność projektu

Runtime aplikacji, PWA, katalog ćwiczeń, 34 rekordy wydania i 136 obrazów, MuscleMap, Manrope/OFL, `package-lock.json`, `tests/fixtures/`, testy, `tools/serve-test.mjs` i dokumentacja są w repozytorium. Setup i wznowienie opisuje `PROJECT_HANDOFF.md`. Wymagane środowisko: Node 26.13.0 (`.node-version`), `npm ci`, `npm run test:unit`, `npm run test:e2e`; Playwright potrzebuje pobranego silnika Chromium i WebKit albo lokalnego Edge przez `PLAYWRIGHT_CHANNEL=msedge`. Bez pełnego checkoutu ani plików prywatnych `outputs/` aplikacja i wszystkie repozytoryjne testy mają swoje wejścia. Generowane dowody nadal trafiają do ignorowanego `outputs/`.

## Historyczny eksport

Importer obsługuje historyczny JSON v4 oraz ZIP v5; format JSON v4 ma inne, starsze pola i nie zawiera wszystkich informacji obecnego modelu. Projektowy syntetyczny plik wyeksportowano przez funkcję oryginalnej historycznej rewizji; pochodzi z `tests/fixtures/phase0/legacy-7d32975-v4-synthetic.json`. Nie wykonano testu na danych właściciela. Weryfikacja autentyczna pozostaje otwarta do dostarczenia pliku. Importować tylko kopię na osobnym originie/profilu i porównać historię, serie, warianty i „Poprzednio”; zachować oryginał i jego hash, nie importować do produkcyjnego magazynu.

## TEST staging

Uruchom `node tools/prepare-staging.mjs`. Skrypt tworzy nowy, ignorowany katalog `outputs/GV-STAGE11B-STAGING/site-release/`, odmawia nadpisania istniejącego pakietu, kopiuje runtime `index.html`, Service Worker, manifest, ikony, `src/` i `img/`, oznacza kopię jako TEST oraz zmienia jej cache na `gymnastika-staging-test-v1`. Waliduje wszystkie zasoby z Service Worker shell, 136 sum SHA-256 wydanych WebP, ikony manifestu, lokalne fonty i cztery sylwetki MuscleMap. Wynik z końcowego uruchomienia: po wygenerowaniu jeszcze do potwierdzenia; manifest ma `scope`=`./`. Cała aplikacja pracuje na root-relative/relative ścieżkach i Service Workerze, bez wymogu `/gymverse/` prefix.

To przygotowany upload payload, nie wdrożenie. Nie hostowano ani nie wysłano go do Netlify czy innej usługi. Po osobnej zgodzie umieścić zawartość `site-release/` w root nowej, dedykowanej domeny HTTPS (oddzielny origin od produkcji), nie w produkcyjnym podkatalogu. Przygotować syntetyczne dane. Ikona/aplikacja i cache wskazują TEST; localStorage i IndexedDB rozdziela inny origin.

Na dysku pozostawiono również wcześniejszy, roboczy build `outputs/GV-STAGE11B-STAGING/site/`; nie był końcowo walidowany po późniejszej aktualizacji źródeł. Do przyszłego ręcznego testu przeznaczony jest wyłącznie `site-release/`.

## Testy Stage 11B

Pełnych 454 E2E nie uruchamiano. Jednostkowy Service Worker + kontrakt prezentacji: **21/21 PASS**. Syntetyczny JSON v4 i ZIP v5: **4/4 Edge PASS**. E2E preview ilustracji + pilot + MuscleMap: pierwsze 17/18 (jedyny błąd w filtrze odpowiedzi testu), po poprawie samej identyfikacji URL przypadek **1/1 PASS**. Osobny QA gate MuscleMap po dodaniu baseline: **1/1 PASS**. Są to celowane przebiegi, nie jeden pełny zielony przebieg. E2E wykonano na Edge przez Playwright project Chromium z `PLAYWRIGHT_CHANNEL=msedge`; cache Playwright ma WebKit 2215, ale nie Chromium.

Pierwsza próba na domyślnym porcie 41900 nie wystartowała: `EADDRINUSE`; obcego procesu nie zatrzymano. Środowisko blokowało żądania loopback mimo startu serwera, więc E2E uruchomiono na portach 41903–41909 z zezwoleniem na lokalne połączenia. Jest to ograniczenie środowiska. WebKit i offline WebKit nie były częścią tej weryfikacji.

## Otwarte bramki wydania

- Test fizycznego iPhone’a: instalacja, offline, formularze/klawiatura, seria/timer i blokada ekranu, przejście/zamiana/wznowienie ćwiczenia, generator/edytor, historia/statystyki/MuscleMap, eksport ZIP v5 do Plików i odtworzenie kopii syntetycznej. Brak testu fizycznego do tej pory.
- Dostarczenie prawdziwego historycznego JSON v4 (lub innego rzeczywistego formatu eksportu starszej aplikacji) i izolowany import/test bez użycia produkcyjnych danych.
- Pojedynczy kontrolowany release-candidate full E2E 454 przed wydaniem; desktopowy WebKit i znane ograniczenia emulacji offline raportować oddzielnie.
- Końcowy przegląd plików, zaufanych licencji/treści i allowlisty, synchronizacja z aktualnym `main` tylko po osobnej zgodzie, przyszły commit/PR/merge/Pages tylko po odrębnej zgodzie. Stage 11B nie wykonuje tych czynności.

## Decyzja

Zakres przygotowania 11B jest wykonany lokalnie: fixtures są wersjonowalne i sprawdzone celowanymi testami, handoff jest gotowy do repo, a odizolowany payload TEST przechodzi kontrolę zasobów. Projekt można odtworzyć na nowym komputerze z repozytorium, `package-lock.json` i wymaganym silnikiem Playwright. Czystego klonu nie tworzono; fizyczny iPhone, autentyczny historyczny eksport, pojedynczy pełny przebieg 454 E2E i osobna zgoda na GitHub/produkcję pozostają otwarte.

## Uzupełnienie 26.11.2026 — zamknięcie próby stagingu i trasa GitHub

Późniejsza, osobno zatwierdzona próba Stage 11C przesłała wyłącznie zawartość `outputs/GV-STAGE11B-STAGING/site-release/` do Netlify Drop. Serwis potwierdził tymczasową stronę TEST pod osobnym, hasłem chronionym originem, z wygaśnięciem po około godzinie. Nie uruchomiono aplikacji pod tym adresem, nie sprawdzono jej zasobów ani magazynu, nie wykonano testu na iPhonie ani offline. Nie uznawać tego za test aplikacji. Zgodnie z późniejszą decyzją właściciela nie używać dalej Netlify ani innych hostów poza GitHub. Lokalny `site-release/` pozostał zachowany. Nie odczytywano ponownie strony Netlify.

Próba wytworzyła lokalny `stage11c-site-release-upload.zip` z zawartości `site-release/`; plik pozostawiono na dysku, wyłączono z allowlisty i dodano do `.gitignore`. Nie jest kandydatem do commita.

Ponowna kontrola listy z 11A + delta 11B potwierdziła **191 kandydatów**, wszystkie ścieżki istnieją, brak duplikatów, `outputs/`, pamięci prywatnej, `.zip` i znanych lokalnych wyników testów. Cztery duże szkice reference PNG i dodatkowe alternatywne boardy nadal są poza listą; fixture’y wymagane przez repo są pod `tests/fixtures/`. Lista jest kandydatem do ręcznej akceptacji, nie została staged; przed commitem pozostaje przegląd diffów i ponowna kontrola po ewentualnych poprawkach.

Najprostsza przyszła ścieżka iPhone TEST wyłącznie przez GitHub: po osobnej zgodzie utworzyć osobną, bezpłatną organizację GitHub kontrolowaną z istniejącego konta oraz dedykowane repo `gymnastika-test-org.github.io`; ręcznie opublikować zatwierdzony payload na Pages root organizacji. Origin `https://gymnastika-test-org.github.io/` będzie odrębny od produkcyjnego `https://piotrm1974.github.io/gymverse/`; nie używać `piotrm1974.github.io/gymverse/test`, bo ścieżka nie izoluje localStorage ani IndexedDB. Wariant bez organizacji nie daje izolacji na tym samym hoście. Alternatywnie użyć osobnego repo Pages z własną domeną/subdomeną właściciela i skonfigurować DNS oraz HTTPS. Żadnego repo, organizacji, Pages, DNS, push ani deploy nie utworzono.

Pełnego E2E 454 nie uruchamiano. Kolejność dalszych czynności: zaakceptować manifest/commita; przygotować i zweryfikować odizolowany GitHub Pages origin; wykonać checklistę fizycznego iPhone’a wyłącznie na danych syntetycznych; rozstrzygnąć autentyczny eksport po dostarczeniu jego kopii; po poprawkach uruchomić jeden końcowy przebieg regresji; oddzielnie uzyskać zgodę na commit/push, merge do `main` (który uruchamia GitHub Pages) i publikację produkcyjną.

## Uzupełnienie 26.11.2026 — onboarding i szybki dostęp do profili

W lokalnej gałęzi wydania `release/gymnastika-2.0-2026-11-26` poprawiono pierwszy start i dostęp do profili. Przy pustym magazynie pozostaje obecny kreator czteroetapowy, przywracanie kopii i dotychczasowy bezpieczny mechanizm pominięcia; dodano widoczny przycisk „Pomiń na razie”. Zmiana nie tworzy nowego kreatora.

Przy starych danych bez rejestru profili nadal powstaje ten sam `legacy-default-profile` o nazwie „Mój profil”, z dotychczasowym snapshotem danych. Do istniejącego rejestru wprowadzono opcjonalną flagę `legacyUpgradePending` (bez zmiany numeru schematu i bez osobnego magazynu). Jednorazowa karta „Witaj ponownie w GymNastika!” pozwala otworzyć edycję tego samego profilu albo kontynuować bez zmian. Zamknięcie komunikatu zapisuje wyłącznie flagę przez istniejącą transakcję profili i wspólną blokadę; edycja używa tego samego kreatora i stabilnego ID. Anulowanie nie zapisuje zmian. Test jednostkowy potwierdza zachowanie przypisanego programu podczas edycji profilu. To nie jest migracja IndexedDB; pozostaje oddzielną, jawną operacją.

Na ekranie głównym przy selektorze aktywnego profilu widoczne są teraz „Edytuj profil” i „Dodaj profil”; przełączanie nadal używa istniejącego selektora i mechanizmu.

Celowane testy z danymi syntetycznymi: `npm run test:unit` **199/199 PASS**; cztery nowe scenariusze onboarding/profil oraz jeden istniejący test izolacji profilu po migracji: Playwright Chromium **5/5 PASS**, Microsoft Edge **5/5 PASS**. Weryfikacja UI obejmuje LIGHT/DARK przy 320 i 390 px, brak poziomego przewijania oraz aktywację z klawiatury. Pełnych 454 E2E nie uruchamiano. Desktopowy WebKit nie uruchomił się: oczekiwany `Playwright.exe` był niedostępny; brak testu WebKit nie oznacza błędu aplikacji. Chromium Playwright zainstalowano na wyraźną prośbę właściciela do tymczasowego cache `C:\temp\gymnastika-playwright-browsers`; przed instalacją jakiegokolwiek innego silnika lub zależności należy poprosić właściciela o zgodę.

Rzeczywiste zrzuty z syntetycznego uruchomienia: `outputs/GV-ONBOARDING-REVIEW-2026-11-26/01-first-run-new-user.png`, `02-first-run-upgrade.png`, `03-home-profile-access.png`. Pozostają lokalnymi, ignorowanymi wynikami i nie wchodzą do commita. Nie użyto danych właściciela, nie zmieniono PR #11 ani GitHub, nie wykonano commit/push/merge/deploy.
