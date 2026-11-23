# GV-BRAND-GYMNASTIKA — kontrolowany rebranding

## Cel i autoryzacja

Zaktualizować widoczną nazwę istniejącej aplikacji GymVerse na GymNastika. To zmiana prezentacji istniejącej PWA, nie nowy produkt ani źródło danych. Autoryzacja właściciela z 2026-11-21 obejmuje implementację na osobnej gałęzi opartej na `feature/gv-image-manifest-contract`, testy, commit, push i stacked PR; nie obejmuje merge ani wdrożenia.

## Zakres

- Audyt i minimalna aktualizacja widocznych nazw: tytuł dokumentu, nagłówek, metadane iOS oraz teksty potwierdzające dotyczące danych.
- Manifest PWA: `name` i `short_name` równe `GymNastika`, opis `Dziennik treningowy — plany, treningi, historia i postępy`.
- Test regresji widocznej marki i niezmienionej tożsamości instalacji PWA.
- Dokumentacja decyzji i niniejsze zadanie.

## Niezmienniki

- Zachowaj origin i adres GitHub Pages `https://piotrm1974.github.io/gymverse/`.
- Zachowaj `start_url: "./"`, `scope: "./"`, brak manifestowego `id`, ikony i identyfikację istniejącej instalacji.
- Zachowaj klucze `gymverse_*`, IndexedDB, object stores, formaty kopii z `app: "gymverse"`, API i komunikaty techniczne, nazwę cache `gymverse-v6`, stabilne ID ćwiczeń i semantykę danych.
- Nie migruj danych ani nie zmieniaj Service Workera poza minimalną zmianą, która uruchomi odświeżenie kopii powłoki i manifestu.
- Master Prompt v2.8 pozostaje niezmiennym, historycznym snapshotem pod nazwą GymVerse.
- Używaj wyłącznie syntetycznych danych. Nie generuj ilustracji w tym etapie.

## Poza zakresem

Zmiana originu lub ścieżki Pages, ikon/logo, motywu, UX poza nazwą, migracje, rebranding nazw technicznych, zmiany PR #4–#6, merge, deployment i generowanie ilustracji.

## Weryfikacja

Uruchom `npm test`, `npm run test:e2e`, `node tools/validate-image-manifest.mjs` i `git diff --check`. Testy E2E używają lokalnego serwera ograniczonego do `127.0.0.1`. Potwierdź zachowanie historii, planów, aktywnego treningu i eksportu/importu przez syntetyczne scenariusze. Nie deklaruj, że iOS natychmiast zmieni nazwę istniejącej ikony PWA; nie zalecaj reinstalacji.
