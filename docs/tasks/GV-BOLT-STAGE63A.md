# GV-BOLT-STAGE63A — trwały cel treningowy

Zakres zatwierdzony przez właściciela: opcjonalne profile.attributes.trainingGoal, cztery wartości oraz świadome null; kreator profilu, ochrona starszych danych i kopii. Nie obejmuje planPrograms ani przypisania planów. Premium UI Polish pozostaje obowiązkowy przed publikacją.

Implementacja: brak pola pozostaje brakiem, null oznacza jawne wyczyszczenie, cztery dozwolone wartości są walidowane. Edycja pomijająca pole zachowuje poprzednią wartość. Import ZIP dla tego samego identyfikatora uzupełnia nieobecny cel; różne jawne wartości są konfliktem i zachowują lokalną wartość. Generator nie zapisuje celu profilu; nazwy wartości przygotowują przyszły adapter.

Weryfikacja i ograniczenia: szczegóły oraz aktualny status znajdują się w PROJECT_MEMORY.md. Wymagana odrębna zgoda na etap 6.3B i publikację; wsteczny zapis przez starsze wersje może usuwać pole.

Świeże wyniki: 144/144 unit, Edge 12/12 nowych i 47/47 regresyjnych; WebKit nie wystartował z powodu braku Playwright.exe. Potwierdzono rzeczywiste odtworzenie i scalanie ZIP utworzonego funkcją produkcyjną. Wymaga uzupełnienia ścieżka eksportu ZIP z przycisku dla celu, interfejs pojedynczego profilu z celem, cel przy JSON v4 i przy błędzie importu, a także WebKit/iPhone. Szczegóły i handoff: PROJECT_MEMORY.md. Nie ogłaszać pełnego zamknięcia.

## Kontrola końcowa 24.11.2026

Zweryfikowano rzeczywisty eksport ZIP przez przycisk, odtworzenie w pustej instalacji, wybór w edycji i ponowny eksport dla `recomposition`, braku celu i jawnego `null`. Odrębnie: eksport/import profilu formatu `gymverse-profile` v1, syntetyczny JSON v4 w trybie łączenia i pełnego odtworzenia, scenariusze konfliktów, anulowania, powtórzenia i błędu zapisu, brak migracji przy otwieraniu oraz izolację profili, historii i planów. Testy: 144/144 jednostkowych; Edge 28/28 + dodatkowa izolacja 1/1; desktopowy WebKit 26/26 + dwa późniejsze przypadki 2/2 + izolacja 1/1. Wyłącznie syntetyczne dane. Kod produkcyjny nie był zmieniany podczas kontroli. Technicznie można zamknąć lokalnie w sprawdzonym zakresie, po ocenie właściciela.

Starszy klient może przy zapisie usunąć `trainingGoal`; nie potwierdzono zgodności zapisu starych wersji. Fizyczny iPhone/Safari, autentyczny historyczny eksport i wcześniejszy znany problem testowego przełączania WebKit offline pozostają niezweryfikowane. Premium UI Polish pozostaje obowiązkowy przed publikacją. 6.3B/6.3C wymagają osobnej zgody.
