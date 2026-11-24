# GV-PHASE0-RELEASE-AND-EXPORT

## Zakres i bramka publikacji

Autoryzacja: polecenie właściciela „Kompleksowy rozwój aplikacji”, wersja 2.1, 24.11.2026, §3–3.2.
Stan: przygotowanie lokalne zakończone; publikacja i dalsza rozbudowa oczekują na wyraźną zgodę.
Identyfikator wydania: **2026.11.24-session-ui-v20**, cache **gymverse-v20**. Dokładną rewizję wskazuje lokalny commit zawierający ten dokument.
Istniejący worktree gv-musclemap-atlas-2d, gałąź feature/gymnastika-approved-ui. Bez nowej gałęzi, worktree i subagentów.

## Opis wydania

- Zatwierdzony interfejs Signal i karta techniki z obiema pozycjami oraz podpisami (zawiera wcześniejszy lokalny commit 39a3a1d).
- Czytelny przycisk „Zrobione” i pole daty na telefonie; podświetlenie pierwszej niezakończonej serii.
- „Poprzednio” dobierane według ćwiczenia, wariantu i numeru serii, z pierwszeństwem tego samego planu. Brak danych nie tworzy fikcyjnych wyników.
- Zamiana ćwiczenia tylko w bieżącej sesji zachowuje zapisane serie i ich tożsamość, bez zmiany definicji planu.
- Miniatury zamienników dostępne offline. Zatwierdzone ilustracje i przestrzeń kluczy danych pozostają zachowane.
- Szczegóły pięciu poprawek oraz zrzuty: [zadanie](GV-SESSION-RESULTS-AND-SWAPS.md).

Nie obejmuje profili, generatora ani nowych migracji. Zastane zmiany AGENTS.md, README.md, src/exercise/catalog.js oraz nieśledzone eksperymenty nie są częścią commita. PROJECT_MEMORY.md pozostaje lokalną pamięcią pracy.

## Rzeczywisty stary eksport

24.11.2026 publiczne index.html, sw.js i src/gv-data.js porównano bajtowo z origin/main **4fa087b54446736ffeaf846a0da1d801d3c3e19a**: zgodne. Publiczny cache to v18. GitHub Pages workflow **45247808634** dla tej rewizji zakończył się success. Jest to stan przed publikacją niniejszego wydania.

| Format | Implementacja | Zawartość i ograniczenia |
| --- | --- | --- |
| ZIP v5 — obecna pełna kopia | index.html: exportData; src/gv-data.js: createBackupV5 | manifest.json, data.json, settings.json, checksums.json; opcjonalne własne media. Jawna lista kluczy obejmuje historię, plany, własne ćwiczenia, aktywny trening, szkice, pomiary, ostatnie ciężary i ustawienia treningowe. Nie jest kopią całego profilu przeglądarki. |
| JSON v4 — historyczny eksporter | index.html: exportData w rewizji 7d32975ec834903bf96987218bafdd67b8e0f9cf | app, version, exportedAt, history, lastWeights, body, plans, custom. Ta wersja nie eksportowała aktywnej sesji ani pełnych ustawień. Nie można odzyskać z niej nieobecnych pól. Obecny awaryjny JSON może mieć dodatkowy storageSnapshot. |
| CSV | index.html: eksport CSV | Tabela zapisanych serii, dat, planów, ćwiczeń, wariantów, ciężarów, powtórzeń i szacowanego 1RM. Nie jest pełną kopią ani formatem odtworzenia aplikacji. |

Eksport ZIP wykonuje STORE.flush() i odczytuje STORE.storage, czyli aktywny magazyn danych. Test przełączył go na IndexedDB, zmienił wynik z 75 na 67,5 kg wyłącznie tam, pozostawiając 75 kg w localStorage. Pobrany przez UI plik po imporcie offline zawierał prawidłowe 67,5 kg. Nie wystarcza więc założenie, że eksport jest zwykłym zrzutem localStorage.

### Pochodzenie fixtures i zgodność

Wszystkie dane są syntetyczne, bez odczytu danych właściciela.

- tools/capture-public-export.mjs otwiera świeży kontekst Edge na prawdziwej publicznej stronie, sprawdza hash HTML, zapisuje syntetyczną serię i pobiera plik przez rzeczywisty eksport UI. Wyłączone canShare wybiera obsługiwaną ścieżkę pobrania zamiast systemowego okna udostępniania.
- tests/fixtures/phase0/public-4fa087b-v5-synthetic.zip: 1492 bajty, SHA256 **4d783d2acfe840ee9ddce5244d9d21c2788db5f56e63225bb857c2e2c18cdbb6** — pełny hash jest w provenance.json (normatywne źródło sumy).
- tools/capture-legacy-v4-fixture.mjs uruchamia oryginalną funkcję eksportu z historycznej rewizji, na syntetycznych danych i przechwyconym dostarczeniu pliku. Wynik: legacy-7d32975-v4-synthetic.json, pochodzenie w legacy-v4-provenance.json. Nie jest ręcznie odtworzonym schematem.
- tests/e2e/phase0-export-compatibility.spec.js: import prawdziwego ZIP v5, import oryginalnego JSON v4 oraz eksport z IndexedDB i odtworzenie offline w czystym kontekście.
- Potwierdzono historię, warianty, plany, pomiary, ustawienia odpoczynku i sztangi, zapisane serie aktywnej sesji oraz wartości „Poprzednio”. Odtwarzanie celowo zeruje koniec timera. Brak variantId w dawnym JSON pozostaje brakiem pola; nie dopisuje się rzekomych historycznych wariantów.

Zgodność dotyczy sprawdzonych formatów i scenariuszy. Nie jest deklaracją obsługi wszystkich nieznanych dawnych kopii ani przyszłego modelu wieloprofilowego.

## Wyniki kontroli 24.11.2026

| Kontrola | Wynik |
| --- | --- |
| Pełny aktualny katalog roboczy: npm test | 92/92 PASS, 12 plików |
| Pełna regresja Edge: playwright.core-edge.config.js | 108/108 PASS, w tym trzy nowe testy eksportu; outputs/GV-PHASE0-RELEASE/full-regression.txt |
| Oddzielny snapshot wyłącznie plików przygotowanych do commita: unit | 79/79 PASS, 9 plików |
| Ten sam snapshot: Edge core | 77/77 PASS, 10 plików; test-results/.last-run.json: passed, failedTests: [] |
| Ten sam snapshot: ilustracje/offline | 4/4 PASS |
| Walidator wydania ilustracji w snapshot | PASS: 34 wpisy, 68 plansz i 68 miniatur, sumy plików zgodne |
| git diff --cached --check | PASS |
| Safari/WebKit i fizyczny iPhone | NIEZWERYFIKOWANE; wynik Edge przy szerokości iPhone nie jest testem Safari |

Mniejsza liczba testów w snapshot wynika z wyłączenia nieśledzonych testów dawnych eksperymentów, a nie z pominięcia testów wydania. Snapshot to zwykła lokalna kopia indeksu Git, bez nowego worktree/repozytorium.

Kontrola czystej zawartości wykryła zależność testu od nieśledzonego pilota oraz konwersję LF/CRLF w dokumentach objętych hashami. Test używa teraz śledzonego rejestru wydania, a .gitattributes zachowuje oryginalne bajty dwóch dokumentów zgody. Nie zmieniono obrazów ani treści zgód. Nowy test odtworzenia synchronizuje się z automatycznym przeładowaniem po imporcie, eliminując wyścig samego testu.

## Publikacja — dopiero po zgodzie

1. Ponownie sprawdzić zdalny main, reguły gałęzi i zakres różnicy. Punktem odniesienia jest 4fa087b; jeśli zmienił się zdalny kod, ocenić nową różnicę przed scaleniem.
2. Wysłać istniejącą feature/gymnastika-approved-ui i przygotować PR do main z samym gotowym zakresem. Nie scalać historycznych, niezwiązanych PR #5–#7. Nie dołączać nieśledzonych eksperymentów.
3. Sprawdzić wymagane kontrole i diff, następnie scalić zatwierdzony zakres. Nie omijać zabezpieczeń. Przy obecnej kontroli main nie był chroniony; brak reguły nie zastępuje przeglądu zakresu.
4. Poczekać na sukces dynamicznego workflow GitHub Pages dla nowej rewizji main. Repozytorium nie zawiera własnego workflow wdrożenia; dotychczasowa ścieżka to Pages z main.
5. Sprawdzić publiczny HTML, sw.js/cache v20 i zasoby. W odizolowanej przeglądarce na danych syntetycznych sprawdzić start/wznowienie, zapis serii, poprzednie wyniki, zamianę, historię, eksport i odtworzenie oraz offline po ponownym otwarciu.
6. Zapisać publiczny SHA, workflow i wynik w PROJECT_MEMORY.md. Dopiero po zakończeniu fazy 0 przejść do dalszego zakresu wersji 2.1: źródła naukowe, katalog, model/migracja, profile, plany, generator, import/eksport i integracja.

## Wycofanie

Znany działający punkt odniesienia: **4fa087b54446736ffeaf846a0da1d801d3c3e19a**, publiczny cache v18. Wycofanie to nowy commit przywracający aplikację i jej zasoby z tej rewizji; bez resetu/force-push i bez kasowania danych przeglądarki. Nadać cache nowy numer wyższy niż v20, aby zainstalowane PWA mogły jednoznacznie pobrać rollback. Zachować tożsamość PWA i klucze magazynu. Przed cofnięciem zakończyć lub wyeksportować aktywny trening; stary interfejs nie musi poprawnie edytować nowych sesji z zamianami. Zachować kopię ZIP v5, która ma ten sam format co dotychczas. Po wdrożeniu rollbacku ponownie sprawdzić Pages, eksport/import i offline. Nie uznawać samego cofnięcia kodu za potwierdzenie odzyskania danych.

## Następna wymagana decyzja

„Czy zatwierdzasz publikację obecnej wersji GymNastika przed rozpoczęciem kolejnego etapu?”

Do odpowiedzi nie wykonywać push, merge, publikacji ani rozpoczynać profili i generatora. Odmowa nie oznacza automatycznej zgody na dużą przebudowę wyłącznie lokalną.
