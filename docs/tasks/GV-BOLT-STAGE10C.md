# GymNastika 2.0 — etap 10C: końcowy odbiór wizualny i ergonomiczny

## Zakres

Końcowa kontrola widoków z 10A/10B w LIGHT/DARK oraz przy 320/375/390/430 px, interakcji dotykowej i klawiaturowej, długich polskich etykiet, skali tekstu 200%, ograniczenia ruchu i obszarów bezpiecznych. Etap nie zmieniał logiki treningu, generatora, historii, eksportu ani zatwierdzonej palety Signal, Manrope i ilustracji. Odbiór wizualny pozostaje decyzją właściciela po obejrzeniu galerii.

## Ustalenia i poprawka

Kontrola skali tekstu 200% wykryła na WebKit poziomy overflow w filtrze historii przy szerokości 320 px. Winny był natywny `select`, którego szerokość intrinsic przekraczała kontener. Ograniczono szerokość i wysokość typograficzną samego pola, zachowując natywne opcje oraz pełną nazwę wybranego filtra wyświetlaną pod polem. Kontrola Edge i WebKit po poprawce: 1/1 na silnik.

Uzupełniono kilka syntetycznych fixture’ów E2E, które czyściły magazyn, a następnie otwierały trening/atlas bez profilu, więc pozostawały na onboardingu. Dodano profil i plan do danych przygotowawczych. W istniejącym teście zarządzania profilem zawężono selektory do właściwego panelu. Testy sprawdzają te same zachowania i dane; nie dodano skipów ani nie osłabiono asercji. Jedna poprawka fixture’u sesji oraz końcowy test zarządzania profilem nie uzyskały ponownego potwierdzenia: ponowienia Playwrighta zawisły po komunikacie startowym serwera, bez procesu Node, przeglądarki, katalogu wyników ani raportu.

## Wyniki

- `npm test`: **197/197 PASS**, 24 pliki (świeży przebieg).
- Celowana regresja Edge 10A/10B wraz z treningiem, historią, szkicami, ZIP v5, backupem i zgodnością importu: **59/59 PASS**. Dodatkowo po poprawkach fixture’ów: trening 1/1, layout atlasu 6/6, wariant atlasu 1/1 i układ profilu przy 320 px 1/1 PASS.
- Pełna regresja Edge: **393/454 PASS**; 61 testów nie przeszło w jednym przebiegu. Nie jest to zielona regresja. Niepowodzenia obejmują starsze scenariusze migracji/importu, generatora i eksploracyjnych testów MuscleMap, a także fixture’y wymagające później przygotowanego profilu. Osobne pozytywne przebiegi celowane nie są przedstawiane jako naprawa ani potwierdzenie wszystkich 61 przypadków. Pełny log: `outputs/GV-BOLT-STAGE10C/full-edge-current/`.
- Celowany desktopowy WebKit: **56/59 PASS**. Trzy błędy dotyczą emulowanego offline: powłoka po odłączeniu sieci (`Load failed`), odświeżenie historii/progresji oraz podgląd przywracania ZIP po reloadzie. W zakresie online przechodzą widoki i interakcje, 200% tekst oraz filtr historii. Przyczyny trzech scenariuszy offline nie rozstrzygnięto; ograniczenie emulacji nie jest dowodem błędu ani poprawności aplikacji. WebKit 2215 uruchomiono z istniejącego izolowanego katalogu `outputs/playwright-stage63a`.
- Zrzuty są rzeczywistymi obrazami z Playwrighta i zawierają syntetyczne dane: `outputs/GV-BOLT-STAGE10C/gallery/` (80 obrazów Edge, 80 WebKit; indeks `gallery/GALLERY.md`). Przeglądano powitanie, kreator, generator, edytor, aktywny trening, timer, historię, statystyki, MuscleMap i kopie w obu motywach oraz wąskich szerokościach.

## Pliki etapu 10C

- Produkcja: `src/ui/signal.css` — ograniczenie overflow pola historii przy dużej skali tekstu.
- E2E: `tests/e2e/bolt-stage10a.spec.js`, `tests/e2e/bolt-stage10b.spec.js`, `tests/e2e/workout.spec.js`, `tests/e2e/atlas-consistency.spec.js`, `tests/e2e/atlas-image-offline.spec.js`, `tests/e2e/atlas-layout-hardening.spec.js`, `tests/e2e/atlas-variant-audit.spec.js`, `tests/e2e/base-b-regressions.spec.js`, `tests/e2e/bolt-stage2-profile-fix.spec.js`, `tests/e2e/session-results-swaps.spec.js`.
- Dowody: `outputs/GV-BOLT-STAGE10C/gallery/`, wyniki Playwright pod `outputs/GV-BOLT-STAGE10C/`.

## Ograniczenia i rekomendacja

Galeria i sprawdzony zestaw docelowy są gotowe do oceny właściciela. Nie deklaruje się pełnej regresji zielonej ani końcowej akceptacji wizualnej przed obejrzeniem zrzutów. Desktopowy WebKit nie potwierdza Safari na fizycznym iPhonie; iPhone/iOS, w tym ubijanie PWA, nie były testowane. Trzy scenariusze offline WebKit pozostają nierozstrzygnięte. Autentyczny historyczny eksport właściciela nie był testowany. Starsze karty mogą nie honorować Web Locks, a `localStorage` nie zapewnia atomowości wielu kluczy wobec obcych zapisów.

Rekomendacja: etap 10C jest gotowy do **lokalnej oceny wizualnej w zakresie galerii i testów celowanych**, nie do bezwarunkowego zamknięcia całej regresji. Przed publikacją konieczne są decyzja właściciela po obejrzeniu galerii oraz osobne rozstrzygnięcie nierozwiązanych scenariuszy offline i pełnej regresji. Nie rozpoczęto kolejnego etapu ani publikacji.

## 25.11.2026 — Domknięcie przyczyn regresji

### Przyczyny 61 wcześniejszych niepowodzeń

Analiza raportu i śladów 393/454 rozdzieliła je na: **15** ścisłych selektorów dopasowujących kilka widocznych przycisków; **2** testy oczekujące poprzedniego komunikatu o błędzie zapisu; **7** testów generatora oczekujących treści wszystkich dni zamiast jednej wybranej sekcji; **10** testów pilota/ilustracji używających niewłaściwego punktu serwera lub brakującej trasy i fixture’u; **17** przypadków pustego/brakującego profilu, planu albo zwiniętego formularza; **10** rzeczywistych pomiarów przycisku kończenia serii o wysokości 43 px wobec wymaganych 44 px. Suma: 61.

Naprawiono jeden potwierdzony problem produktu: minimalna wysokość przycisku serii wzrosła z 43 do 44 px w `src/ui/signal.css`. Pozostałe poprawki dotyczą testów: zawężenie selektorów, uaktualnienie tekstu do obecnego komunikatu bez zmiany asercji integralności, interakcje z wybranym dniem zgodne z bieżącym widokiem generatora, syntetyczny profil/plan do testów MuscleMap, poprawne otwieranie formularza historii oraz obsługa tras pilota przez ograniczony serwer `tools/serve-test.mjs`. Testy zachowują asercje danych, nie dodano skipów.

### Środowisko i świeże wyniki

- Port domyślny 41900 był zajęty (`EADDRINUSE`), a odczyt identyfikatora procesu nie był dostępny dla środowiska. Nie zamykano nieznanego procesu; testy użyły wolnego portu 41901.
- Standardowa ścieżka Playwright nie miała `chromium_headless_shell`; Edge uruchomiono jako kanał `msedge`. WebKit 2215 pochodzi z istniejącego katalogu `C:/Users/lordd/Documents/ChatGPT/GYMVERSE/outputs/playwright-stage63a`. Testy E2E wymagały dopuszczenia połączenia lokalnego.
- `npm test`: **197/197 PASS**.
- Jeden pełny Edge na aktualnym kodzie: **453/454 PASS** w 21,1 min. Jedyny timeout wskazał nieistniejącą akcję `cancelGeneratedPreview` po zmianie interfejsu generatora. Test zaktualizowano do bieżącej drogi „Wróć do generatora” → krok 1 → „Anuluj”; celowane potwierdzenie Edge **1/1 PASS**. Zgodnie z późniejszą decyzją właściciela pełnego przebiegu nie powtarzano. Raport: `outputs/GV-BOLT-STAGE10C/final-edge-current/`.
- Celowane WebKit zmienionych ścieżek: **52/57 PASS**. Cztery niepowodzenia w testach offline kończą się błędem silnika `WebKit encountered an internal error` przy nawigacji/reloadzie odłączonej strony (dwa testy pilota, profil i historia). Są zgodne ze znanym ograniczeniem emulacji offline WebKit i nie dowodzą błędu aplikacji ani poprawnego działania offline. Pozostały test audytu MuscleMap zatrzymał się na przycisku wyboru, który był w DOM, lecz WebKit nie uznał go za stabilny do kliknięcia. Pierwsze i trzecie testy anatomii przeszły; odpowiedni audit Edge przeszedł 1/1. Po optymalizacji fixture’a (bez zmiany mapowań/asercji) ponowienie WebKit nadal kończyło się timeoutem stabilności; nie wykonywano dalszych powtórzeń.
- Testy po poprawkach fixture’ów: historia/układ Edge **10/10**, mapowanie anatomii Edge **3/3**, pozostałe celowane MuscleMap Edge **7/7**, pilot i obrazy Edge **13/14**, następnie test `pagehide` po nawigacji samego pochodzenia **1/1**; poprawiony anulowany preview Edge **1/1**. Pełny Edge potwierdził później piloty, sesje i pozostałe przypadki.

### Pliki zmienione dla domknięcia 10C

- Produkt/serwer testowy: `src/ui/signal.css`, `tools/serve-test.mjs`.
- Fixture danych: `tests/e2e/helpers/seed-musclemap-workout.js`.
- Testy: `tests/e2e/bolt-stage2-profile-fix.spec.js`, `bolt-stage62.spec.js`, `bolt-stage63a.spec.js`, `bolt-stage63a-closure.spec.js`, `bolt-stage63b.spec.js`, `bolt-stage63c.spec.js`, `bolt-stage7a.spec.js`, `bolt-stage7c.spec.js`, `closure-21.spec.js`, `exercise-images-three.spec.js`, `exercise-legacy-image-fallback.spec.js`, `exercise-presentation-pilot.spec.js`, `gv-data.spec.js`, `gv-musclemap-anatomy-review.spec.js`, `gv-musclemap-full-catalog.spec.js`, `gv-musclemap-highlight-diagnostic.spec.js`, `gv-musclemap-highlight-engine.spec.js`, `gv-musclemap-highlight-visual.spec.js`, `gv-musclemap-qa-gate.spec.js`, `header-screenshot-repro.spec.js`, `profiles.spec.js`, `session-results-swaps.spec.js`.

### Decyzja i ograniczenia

Rekomenduję **lokalne zamknięcie 10C w sprawdzonym zakresie**, bez deklarowania pełnego zielonego przebiegu: jedyny błąd pełnego Edge to nieaktualny test, którego poprawiona wersja przeszła celowanie 1/1. Przed publikacją właściciel zleci jednorazową pełną regresję już po pozostałych pracach, zgodnie z aktualną decyzją.

Ryzyka pozostające: cztery testy offline WebKit nierozstrzygnięte z powodu wewnętrznego błędu silnika; osobny audyt mapowania w WebKit nadal timeoutuje, podczas gdy Edge przechodzi; fizyczny iPhone/Safari/iOS niezweryfikowane; autentyczny historyczny eksport właściciela nie był użyty. Starsze karty mogą nie honorować Web Locks; wielokluczowy zapis `localStorage` nie jest transakcyjny wobec obcych zapisów. Galeria pozostaje syntetyczna. Bez publikacji, commit, merge, push ani deploy.
