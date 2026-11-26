# GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT — plan

**Cel:** lokalnie uruchomić rzeczywistą kartę treningową `lat_raise_stand/default` z techniką i miniaturą dla dwóch sylwetek oraz istniejącym atlasem, zachowując zgodność starego manifestu i offline.

**Podejście:** oddzielić nowy, wersjonowany kontrakt prezentacji od starego manifestu obrazów; użyć walidowanego, niezatwierdzonego rejestru wyłącznie w pilotowym trybie loopback. Atlas pozostaje źródłem MuscleMap. Kandydacki Service Worker dołącza precyzyjnie wymienione pliki tylko po jawnym lokalnym włączeniu; zwykły worker nie dostaje tych zasobów.

**Pliki:** nowe `src/exercise/presentation-contract.js` i schema v1; kandydacki rejestr w `outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/`; integracja istniejącego `index.html` i kompatybilnego `src/features/anatomy/atlas.js`; minimalne warunkowe zmiany `sw.js`; testy Vitest, Playwright i worker harness; lokalny serwer testowy z montowaniem `/gymverse/`; dowody i raport w katalogu etapu.

## Kolejność

1. Zapis wejściowych diffów i hashy (gotowe w `outputs/.../logs/INPUT-STATE.json`) oraz kopii wejściowych `index.html`/`sw.js` (gotowe w `snapshots/input/`).
2. Testy kontraktu/resolvera: kompatybilność starego manifestu, wersja, sylwetka, powiązanie atlasu, błędne/brakujące ścieżki, stan kandydacki i blokada hostów publicznych; następnie minimalny moduł i schema.
3. Test rzeczywistego UI karty: lokalna bramka, jedno źródło sylwetki, kadry z planszy, miniatury, synchroniczny atlas, przejścia na inne ćwiczenia, błędy zasobu i niezmienność storage; następnie integracja.
4. Testy warunkowego precache i aktualizacji: zwykły worker bez kandydata, jawny worker lokalny z czterema WebP i zależnościami; test przerwanego instalowania, zachowania poprzedniego workera i restartu offline na tym samym originie.
5. Pełne testy jednostkowe i regresja Edge, dostępny WebKit, rzeczywiste zrzuty 375/390/430 px i wąskiej karty desktopowej; kontrola hashy, raport, sumy i ZIP. Safari/iPhone oraz publikacja pozostają osobnymi bramkami.

## Przegląd ryzyk

- Przestarzałe/odrzucone assety nie mogą zostać podstawione pod aktualną sylwetkę.
- Cache starego workera nie może zostać nadpisany przez HTML nowego wydania przed atomowym precache.
- Cache i zasoby muszą działać pod bazą `/gymverse/`.
- Zmiana prezentacji nie może zapisywać preferencji ani modyfikować pełnego stanu syntetycznej sesji.
- Rozszerzenie nie może przejść jako zatwierdzony kontrakt manifestu ani aktywować się poza loopback.

## Odbiór

Każdy nowy test najpierw ma wykazać brak wymaganego zachowania, następnie być zielony po najmniejszej implementacji. Końcowe wyniki są osobne dla kontraktu, starej zgodności, rzeczywistej karty, offline/aktualizacji, danych, jakości techniki i praw do publikacji. Bez commitów i publikacji.
