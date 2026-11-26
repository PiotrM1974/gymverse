# Etap 10A — Premium UI Polish najważniejszych ekranów

Autoryzacja: załącznik `a93d1bb0-4a43-4de4-87e5-c3b75195a3d0` oraz późniejsza decyzja właściciela o typografii Manrope, 25.11.2026. Istniejący worktree `backup/worktrees/gv-musclemap-atlas-2d`, gałąź `feature/gymnastika-approved-ui`. Bez 10B, backupu, commit/merge/push/deploy/publikacji.

## Zakres i kierunek

Ekran główny, karty planów, aktywny trening i pełnoekranowy timer. Zachować wszystkie działania, pięć kolumn serii, paletę Signal i dane. Ograniczyć dominację ustawień, dać pierwszeństwo rozpoczęciu/wznowieniu. Wyrównać rytm i typografię kart oraz sterowania. Ostateczny wybór właściciela: Manrope jako dominująca rodzina całej aplikacji, wagi 400/500/600/700, lokalne WOFF2 z polskimi znakami i fallbackiem systemowym. Paleta semantyczna pozostaje bez zmian.

1. Rzeczywiste zrzuty stanu przed zmianą z syntetycznych danych.
2. Prezentacyjne zmiany HTML/CSS, bez modyfikacji logiki treningu.
3. Zrzuty po zmianie, przegląd LIGHT/DARK na 320/375/390/430 px i kontrola geometrii pięciu kolumn.
4. Świeże unit, celowane E2E Edge i desktopowego WebKit, offline oraz dokumentacja.

`GYMNASTIKA_HANDOFF.md` znajduje się w katalogu nadrzędnym GYMVERSE i opisuje historyczny stan z 21.11.2026. `GYMNASTIKA_INTEGRATION_MAP.md` nie znaleziono w dostępnym projekcie; użyto bieżących dokumentów Bolt, zatwierdzeń Signal i rzeczywistego kodu. Zastane zmiany są niezacommitowane i mają pozostać zachowane.

## Wykonanie i ocena wizualna

Zachowano dokładne role kolorów Signal w obu motywach. Ostateczny wybór Manrope zastąpił wcześniejszy systemowy zestaw San Francisco/Segoe UI i Avenir Next Condensed/Bahnschrift. Dwa lokalne pliki zmiennego Manrope v23 WOFF2 (Latin i Latin Extended) oraz licencja SIL OFL 1.1 są w `src/ui/fonts/`. CSS używa wag 400–700, a Service Worker zapisuje fonty w bieżącym `gymverse-v53` (poprzednio v52); font nie wymaga Google Fonts online. Fallback to lokalny krój systemowy. W źródłach Google Fonts `METADATA.pb` potwierdza `latin-ext` oraz zakres wag 200–800, a `OFL.txt` pozwala na osadzanie i dystrybucję z zachowaniem licencji. Ekran główny pokazuje po kompaktowym wyborze profilu bezpośrednio karty treningów; przypisany program, wybór innego sposobu planowania i ustawienia są nadal dostępne niżej lub w zwijanym menu. Karty mają wspólny rytm, pełnej szerokości przycisk, żółtą linię następnego treningu oraz dotychczasowe PUSH/PULL. Cała karta pozostaje obszarem uruchomienia.

W treningu pomniejszono nadmiernie ciężkie nagłówki i ramki. Pięć kolumn serii utrzymuje jeden wiersz od 320 px, aktywna seria pozostaje niebieska, a zatwierdzona ma odrębny stan. Panel odpoczynku jest częścią jednej karty, opcje serii mają uporządkowaną siatkę, RIR mieści cztery odpowiedzi w jednym rzędzie. Ogólny odpoczynek mieści pięć przycisków bez osieroconego „4:00”. Przycisk zamiany i sekcje techniki/MuscleMap pozostają dostępne. Pełnoekranowy timer ma czytelniejsze cyfry i żółty pierścień; nie zmieniono odliczania, automatycznego powrotu ani układu trzech działań.

Zrzuty sprzed zmian: `outputs/GV-BOLT-STAGE10A/before/chromium/`. Zrzuty po zmianach: `outputs/GV-BOLT-STAGE10A/after/chromium/` i `outputs/GV-BOLT-STAGE10A/after/webkit/`. W każdym zestawie są home LIGHT/DARK 390, karty planów, trening LIGHT/DARK 390, trening DARK 320, opcje treningu i timer LIGHT/DARK. Rzeczywiste obrazy wykonano na syntetycznych planach, bez danych użytkownika.

Po decyzji o Manrope wykonano osobną serię 36 zrzutów na silnik: `outputs/GV-BOLT-STAGE10A/manrope/{chromium,webkit}/`, obejmującą ekran główny, statystyki, progres, historię, rozwinięty profil, generator, edytor programu, trening i timer; LIGHT/DARK przy 320 i 390 px. Dodatkowe kontrole geometrii obejmują 375 i 430 px. Po ręcznym obejrzeniu reprezentatywnych kadrów nie widać kolizji ani uciętych napisów; dłuższe etykiety w wąskich przyciskach mogą zawijać się na dwie linie bez ucięcia.

## Weryfikacja

### Końcowe poprawki ergonomii (po akceptacji Manrope i znacznika serii)

„Opcje serii” i nowe „Ustawienia przerw” są domyślnie zwiniętymi sekcjami `details` z widoczną strzałką i fokusem klawiatury. Pierwsza zawiera dotychczasowe sterowanie ciężarem, kopiowanie poprzednich wyników, kalkulator, zmianę liczby serii i RIR. Druga zawiera niezmienione przyciski przerwy ogólnej. Cztery szybkie czasy przerwy bieżącego ćwiczenia oraz bieżący czas pozostają widoczne bezpośrednio pod seriami. Zwijanie nie usuwa elementów ani nie odtwarza formularza; stan pól i drafty pozostają w istniejącym mechanizmie. Dopuszczona przez dotychczasowy model wartość ćwiczenia 90 s, niewystępująca w czterech szybkich przyciskach, zachowuje pierwszeństwo przed przerwą ogólną i zasila timer. Zmieniono tylko układ widoku; logiki timera, zapisu i modelu nie zmieniano. Cache Service Workera podniesiono do `gymverse-v53`, aby nowy układ był precache'owany przy aktualizacji PWA.

- Zrzuty Edge z syntetycznej sesji: `outputs/GV-BOLT-STAGE10A/panels/chromium/collapsed-{light,dark}-390.png` i `expanded-dark-390.png`. Odpowiedniki desktopowego WebKit znajdują się w `panels/webkit/`.
- Test `bolt-stage10a-panels.spec.js`: start z oboma panelami zamkniętymi, otwieranie klawiaturą i kliknięciem, wszystkie kontrolki, brak utraty wpisów po zwinięciu i przeładowaniu, RIR, timer, pierwszeństwo czasu ćwiczenia oraz LIGHT/DARK 320/375/390/430 px bez poziomego przewijania. Końcowy przebieg łącznie z `bolt-stage10a-manrope.spec.js`: **10/10 PASS** Edge + desktop WebKit po zmianie cache na v53. Edge `bolt-stage10a.spec.js`: **2/2 PASS**, w tym zapis treningu bez sieci. Świeże `npm test`: **197/197 PASS**.
- Regresje po zmianie: `bolt-stage3.spec.js` z nowymi panelami **40/40 PASS** Edge + WebKit; `bolt-stage4.spec.js` **66/66 PASS** w szerszym przebiegu, w tym naturalny koniec timera, błędy zapisu, zamiany, RIR i drafty; po korektach historycznych fixture/testu `bolt-stage3-closure.spec.js` **10/10 PASS**; celowany test programowego kopiowania i regulacji ciężaru **2/2 PASS**; pełny przepływ 7C oraz historyczny kontekst 9 **4/4 PASS**; pilot atlasu techniki **1/1 PASS** w Edge. Wcześniejsze przerwania testów dotyczyły starego fixture usuwającego profil, oczekiwania tekstu „zapas 2” po aktualizacji UI do „RIR 2” oraz ścieżki kreatora nowego profilu; nie wykazały regresji aplikacji.

Ograniczenie: zbiór dopuszczonych czasów zapisanych w modelu ćwiczenia pozostaje bez zmian (`30, 60, 90, 120, 180, 240, 300` sekund). Testowa wartość 75 s została prawidłowo odrzucona przez istniejącą walidację; końcowy test użył dopuszczonej wartości 90 s, której nie ma w czterech szybkich przyciskach. Desktop WebKit nie potwierdza zachowania fizycznego Safari/iPhone, a jego wcześniejszy błąd przy emulowanym offline nadal ogranicza weryfikację offline w tym silniku.

### Subtelny znacznik aktywnej serii (po decyzji właściciela)

W aktywnym wierszu usunięto prostokątną ramkę i osobny obrys desktopowy. Pozostał pasek 3 px przy numerze serii, lekko niebieska powierzchnia komórek (5% LIGHT, 9% DARK) i kolor numeru. Tło zmienia się przez 180 ms, bez zmiany geometrii; `prefers-reduced-motion` wyłącza przejście. Fokus klawiatury pól i przycisków ma osobny, wyraźny obrys 3 px. Klasa `is-current` oraz zapis serii, timer, RIR, szkice i zamiana ćwiczeń zachowują dotychczasowy kod. Tekst liczby ćwiczeń na kartach, w podglądzie i edytorze używa odmiany `1 ćwiczenie`, `2–4 ćwiczenia`, pozostałe `ćwiczeń` z wyjątkiem 12–14.

- Zrzuty porównawcze z tą samą syntetyczną kartą: `outputs/GV-BOLT-STAGE10A/active-set/before/workout-{light,dark}-390.png` i `outputs/GV-BOLT-STAGE10A/active-set/after/chromium/comparison-{light,dark}-390.png`. Kontrolny DARK 320 px: `after/chromium/first-dark-320.png`.
- Nowy E2E `bolt-stage10a-active-set.spec.js` i regresja `bolt-stage3.spec.js`: **42/42 PASS** razem w Edge i desktopowym WebKit. Obejmują oba motywy i szerokości 320/375/390/430, pięć poziomych kolumn, brak przewijania poziomego, fokus i reduced motion, zapis/ukończenie, następny wiersz po pominięciu odpoczynku, następne ćwiczenie, edycję ukończonej serii, brak timera po ostatniej serii oraz brak fałszywego ukończenia przy błędzie zapisu. Starsze testy sprawdzają też RIR, kopiowanie poprzednich danych, regulację ciężaru, kalkulator, szkice i zamiany.
- Wcześniejszy przebieg Edge wykrył jedynie asynchroniczną zmianę koloru numeru względem paska przy przełączeniu motywu; przejście pozostawiono tylko dla tła. Po tej poprawce celowane **3/3 PASS**, następnie wspólny przebieg **42/42 PASS**.

### Ostateczna typografia Manrope (po decyzji właściciela)

- `npm test`: **197/197 PASS**, 24 pliki, na aktualnym kodzie.
- `bolt-stage10a-manrope.spec.js`: Edge **2/2 PASS**, desktop WebKit **2/2 PASS**. Test sprawdza załadowanie wag 400 i 700 z polskimi znakami, dominującą rodzinę CSS, dziewięć widoków × dwa motywy × cztery szerokości, brak poziomego przewijania i elementów sterujących wychodzących poza ekran. Oba WOFF2 w cache v52 mają status 200 i podpis `wOF2`.
- Edge: przeładowanie PWA przy odciętej sieci, załadowanie Manrope 600 z polskimi znakami i użycie ekranu planów PASS. Kontrola poprzedniego 10A oraz układu treningu po zmianie: **3/3 PASS**.
- Desktop WebKit: typografia, układ i obecność fontów w CacheStorage PASS. Znany błąd emulacji offline w Playwright WebKit (`WebKit encountered an internal error` / `TypeError: Load failed`) pozostaje ograniczeniem testu przeładowania offline; nie potwierdza ani nie obala zachowania Safari na iPhonie.
- Źródła licencji i metadanych: `https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt`, `https://github.com/google/fonts/blob/main/ofl/manrope/METADATA.pb`.

### Poprzedni przebieg przed decyzją o Manrope

- `npm test`: **197/197 PASS**, 24 pliki.
- Edge, kontrolowany zestaw widoków etapów 2–4, techniki/MuscleMap i nowego 10A: **62/63 PASS**. Jedyne zatrzymanie było w starszym teście, który usuwał profil przed kliknięciem planu; aplikacja prawidłowo pokazała onboarding. Fixture zmieniono na rzeczywiste utworzenie profilu. Celowane ponowienie: **1/1 PASS**. Końcowy plik 10A: **2/2 PASS**, w tym offline.
- Desktopowy WebKit, ten sam zestaw: **62/63 PASS**. Jedyny błąd to `page.reload: WebKit encountered an internal error` po `context.setOffline(true)`; celowane ponowienie dało ten sam wynik. Dodatkowy test potwierdził obecność `index.html` i `src/ui/signal.css` w `gymverse-v51` oraz kontrolę strony przez Service Worker, lecz `fetch` w offline zakończył się `TypeError: Load failed` w WebKit. Ten test pozostaje aktywny i nie jest zaliczony. Edge w identycznym scenariuszu odczytał oba pliki i zapisał serię. Desktopowe WebKit online: nowy widok, szerokości 320/375/390/430, seria, timer, nawigacja i technika/MuscleMap PASS.
- Test 10A porównuje geometrię pięciu komórek wiersza, brak poziomego przewijania, rozmiary przycisków, zapisany rekord serii i oba motywy. Poprzednie testy serii/timera sprawdzają przeładowanie, błędy zapisu, RIR, zamianę i automatyczne przejście.

Pliki zmienione w 10A: `index.html`, `src/ui/signal.css`, `sw.js` (cache v51), `tests/e2e/bolt-stage10a.spec.js`, `tests/e2e/approved-workout-layout.spec.js`, oczekiwania wersji cache w `tests/unit/branding.test.js`, `tests/unit/service-worker.test.js`, `tests/e2e/atlas-image-offline.spec.js`, `tests/e2e/exercise-images-complete.spec.js`, `tests/e2e/gv-data.spec.js`, `tests/e2e/gv-musclemap-qa-gate.spec.js`, `PROJECT_MEMORY.md` i ten dokument. Zastane niepowiązane pliki w worktree zachowano.

## Ograniczenia i następny zakres

Etap 10B pozostaje osobnym, nieautoryzowanym zakresem przyszłych zmian wizualnych. Manrope obejmuje już typografię widoków biblioteki/edytora, generatora, historii, statystyk, kopii i profilu; ich pełny Premium UI Polish pozostaje do późniejszej decyzji. Weryfikacja offline na desktopowym WebKit przez Playwright pozostaje nieudana z powodu zachowania silnika przy wymuszeniu offline; nie stanowi dowodu awarii PWA na iPhonie ani dowodu jego zgodności. Nadal nie zweryfikowano fizycznego Safari, autentycznego historycznego eksportu i zachowania po zakończeniu PWA przez iOS. Nie zmieniano modelu, generatora, historii, ZIP v5, JSON v4, RIR, timera, zamian, ilustracji ani mapowań. Bez 10B, backupu, nowego czatu/worktree/subagentów, commit/merge/push/deploy/publikacji.
