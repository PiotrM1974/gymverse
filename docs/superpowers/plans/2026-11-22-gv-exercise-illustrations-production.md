# GV-EXERCISE-ILLUSTRATIONS-PRODUCTION — Plan

**Cel:** Zachować cztery zatwierdzone wizualnie szkice, przygotować izolowany i responsywny podgląd START/KONIEC z istniejącym MuscleMap oraz opracować dowody techniki, pochodzenia i bezpiecznej obsługi wariantów.

**Architektura:** Nie zmieniać ekranu treningu ani modelu trwałych danych. Dodać statyczny prototyp w katalogu wyników, który importuje istniejący renderer atlasu i renderuje obrazy z niezmienionych plików. Dane prototypu są jawne, statyczne i nie zapisują się do IndexedDB/localStorage.

**Technologie:** istniejący HTML/CSS/JS, obecny atlas ES module, Playwright Edge; bez nowych zależności.

**Specyfikacja:** `docs/tasks/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION.md`.

## Ograniczenia

- Nie zmieniać MASTER PROMPT v2.8, PR #4–#7, anatomii MuscleMap, identyfikatorów ćwiczeń, trwałych danych, eksportów ani produkcyjnej integracji ilustracji.
- Nie generować pozostałych ilustracji; szkice pozostają niezmienione.
- Brak źródła lub pewności techniki/licencji oznacza jawny status UNVERIFIED/PARTIAL, bez zgadywania.
- Testować wyłącznie w lokalnym serwerze 127.0.0.1 i syntetycznym profilu.

## Pliki

- Create: `docs/tasks/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION.md` — kopia zlecenia.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/preview.html` — odizolowany podgląd czterech ilustracji, przełączniki START/KONIEC, statusy, dane mięśni i atlas.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/preview.css` — ciemny shell GymNastika, jasny kadr ilustracji, responsywne kolumny.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/preview.js` — statyczny wybór ćwiczenia i wyświetlanie kadru; bez storage.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/REPORT.md` — raport, technika, licencje, warianty, testy i bramki.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/TECHNIQUE-REVIEW.csv` — szczegółowe wiersze techniki dla czterech pozycji.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/ASSET-REGISTER.csv` — oryginalne SHA/metadane/prawa.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION/screenshots/*` — świeże screenshoty UI.
- Create: `outputs/GV-EXERCISE-ILLUSTRATIONS-PRODUCTION.zip` — pakiet po finalnej weryfikacji.
- Test: `tests/e2e/exercise-illustrations-preview.spec.js` — wybór ćwiczenia, przełączanie pozycji, render atlasu, viewporty, brak zapisów.

## Zadania

1. **Źródła i zasoby:** zweryfikować manifest, stare pliki, hashe, wymiary, historię szkiców, status praw i źródeł; nie edytować PNG.
2. **Analiza techniki:** wierszami przeanalizować katalog i cztery grafiki wobec ACE/NASM; wskazać niejasne fazy i mechanikę; nadać tylko uzasadnione statusy.
3. **Prototyp:** dodać lokalny preview poza runtime; jawnie ustawić znaczenie START/KONIEC dla każdego ćwiczenia; importować aktywny atlas bez zmian anatomii; nie zapisywać stanu.
4. **Regresja UI:** testować przełączniki, cztery atlas mapy, wąskie i mobilne szerokości oraz timer demonstracyjny; świeże screenshoty.
5. **Variant ID:** prześledzić plany, aktywną sesję, wznawianie, historię i eksport/import; porównać opcje A/B/C; bez migracji/zmiany schematu.
6. **Walidacja i wydanie artefaktów:** `npm test`, pełny Edge E2E, diff check, licencje/statusy, ZIP i jego kontrola zawartości.

## Kryteria przeglądu

- Obrazy niezmienione; SHA w rejestrze.
- START/KONIEC czytelne i zgodne z udokumentowaną konwencją albo status nierozstrzygnięty.
- Atlas to istniejący renderer i mapowania.
- Prototyp nie tworzy trwałych rekordów.
- Wszystkie wymagane screenshoty z bieżącego kodu.
- Wyniki Edge nie są przedstawiane jako WebKit/Safari/iPhone.
- Brakujace dowody zostają PARTIAL/BLOCKED/UNTESTED.
