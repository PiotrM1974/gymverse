# GymNastika — mapa etapu 3 do zatwierdzenia

Status: PLAN, bez implementacji. Etap 4 — pełnoekranowy timer — jest wyłączony. Źródło wizualne: zaakceptowany `outputs/GV-BOLT-STAGE1/index.html`; obowiązuje rzeczywisty model i zachowanie `index.html`, `src/gv-base-b.js` oraz aktywny magazyn `src/gv-data.js`. Istniejące zmiany pozostają nienaruszone.

## Granica i układ

Dostosować wyłącznie renderowanie `#setsBody` w `renderStep()` oraz ograniczone style tabeli/wierszy w `src/ui/signal.css`. Każdy wiersz: numer, Poprzednio, ciężar, powtórzenia i przycisk zapisu w poziomie; zachować semantykę tabeli, nagłówki oraz unikalne etykiety i stan dostępny czytnikowi. Aktywny: `.is-current` z niebieską ramką; ukończony: `.completed`. Nie blokować kolejności serii tylko dlatego, że demonstrator Bolt tak robi. Zapewnić dotykowe cele 44 px i brak przecięcia/overflow przy 320/375/390/430 w LIGHT/DARK; miejsce dla „inny plan”, brak danych i oryginalnego ćwiczenia po zamianie, bez ucinania danych. Przy zbyt długiej informacji użyć czytelnego zawijania w obrębie komórki lub dostępnego tekstu dodatkowego, nie ucinać znaczenia.

## Mapa produkcyjnych elementów

| Funkcja | Istniejący punkt podłączenia i wymaganie |
|---|---|
| Numer, zapis i edycja | Zachować indeks `data-i`, `weight_i`, `reps_i`, `btnDone_i`, `data-act=done`, `.input-cell`, `.ready` i `.completed`. `validateRow`, `readRow`, `validSet` i `onDone` pozostają źródłem prawdy. Ukończoną serię można odblokować i ponownie zapisać; stan nie uznaje się za zapisany przed `STORE.transact`. |
| Masa ciała | Zachować `isBW`: puste dodatkowe kg = 0, 0 dozwolone dla masy ciała, dla obciążanego ćwiczenia >0; zakres ciężaru do 1000, całkowite powtórzenia 1–200. Nie kopiować walidacji demonstratora Bolt. |
| Drafty | Zachować `draftQuery`, `scheduleDraftSave`, `flushDraftsForStep`, `pendingDraftSnapshot`, input/focusout/pagehide, `BASE_B.DRAFT_KEY` i status niezapisanych pól. Nie usuwać ani nie rekonstruować wartości podczas samego przestylowania. |
| Poprzednio | `previousSetsFor`: aktywny profil przez jego historię, exerciseId, variantId lub default, numer serii, data, preferencja tego samego planu z jawnym oznaczeniem innego. Zachować `fillprev` i semantykę kliknięcia, brak wartości i rzadkie numery; nie używać demonstracyjnej historii. |
| Warianty i zamiana | Zachować `exAt`, `validVariant`, `swapOpen`, `applySwap`, ID/wariant zapisanej serii, oznaczenie oryginalnego ćwiczenia. Potwierdzenie opisuje czyszczenie draftów niezapisanych; ukończone serie pozostają przypisane do wcześniejszego ćwiczenia. |
| Regulacja | Zachować `lastRow`, `activeRow`, `stepWeight` i `data-act=wstep` dla −5, −2,5, +2,5, +5; `copyPrev`, `fillprev`, kalkulator talerzy `plates`/gryf. Zachować aktualną regułę wyboru aktywnego pola i aktualizację draftu. |
| RIR | `setRir`, `active.rir[step]`, przełączalne 0/1/2/3+, zapis sesji; zamiana czyści RIR zgodnie z obecnym zachowaniem. Nie sprowadzać RIR do danych wizualnych. |
| Liczba serii | `addSet`/`removeSet`, granice 1–12, potwierdzenie usunięcia zapisanej ostatniej serii, transakcyjna aktualizacja draftów. |
| Wznowienie | `active.exercises`, `active.sets`, `active.swaps`, `setCount`, `rir`, drafty oraz istniejący `openWorkout` i `renderStep`; po reload odtworzyć identyczne pola i stan. |
| Bezpieczny zapis | Zachować `sessionMutationBusy`, obsługę błędu magazynu, awaryjny eksport, potwierdzenia zakończenia/porzucenia. Żadnego nowego storage, zmian schematu, formatu kopii ani osobnego stanu treningu. |

Przyciski ±, kopiowanie poprzedniej serii, kalkulator, dodawanie/usuwanie i RIR mogą pozostać widoczne pod wierszami albo znaleźć się w nazwanym, klawiaturowo dostępnym panelu „Opcje serii”. Jeżeli panel zostanie zwinięty, powinien informować o dostępnym RIR, a jego stan nie może zmieniać danych. Zamiana i technika/MuscleMap pozostają dostępne w obecnych miejscach. Istniejące sterowanie odpoczynkiem i timer zostają zachowane; zaakceptowany panel 1m/2m/3m/5m nie zostanie w tym etapie podłączony ani nie zastąpi 30/90/240 s.

## Kroki i bramki

1. Po osobnej akceptacji utworzyć plik zadania etapu 3 zgodny z AGENTS.md i ustalić punkty wycofania bez usuwania zastanych zmian.
2. Przygotować nowy markup i style wyłącznie dla produkcyjnego `view-workout`, zostawiając dotychczasowe identyfikatory, funkcje i obsługę zdarzeń. Nie przenosić React, `localStorage` ani demonstracyjnych rekordów Bolt.
3. Zweryfikować syntetyczne scenariusze: nowe serie i edycja, nieprawidłowe dane, zero dla masy ciała, Enter/focus, ± i kopiowanie, RIR, +/− serii, drafty, reload/wznowienie, profile i warianty, „Poprzednio”, zamiana przed/po zapisanych seriach, awarie zapisu i eksport awaryjny, zakończenie/porzucenie oraz brak podwójnego zapisu. Osobno istniejący timer i offline.
4. LIGHT/DARK i 320/375/390/430, skalowanie tekstu, obsługa dotykowa i czytnik; porównać z zatwierdzonym wzorcem. Kontrola obrazów DÓŁ/GÓRA i MuscleMap bez zmiany ich zasobów.
5. Unit, pełna regresja E2E i dedykowane zestawy. Safari/WebKit i fizyczny iPhone wymagają osobnej weryfikacji; autentyczny eksport legacy nadal bramką publikacji. Nie deklarować zgodności na podstawie Edge.
6. Przed oceną uaktualnić pamięć i opisać wyniki; nie publikować. Wycofanie zmian prezentacji i testów wyłącznie względem uzgodnionego stanu, bez resetu repo, migracji lub usuwania treningów.

## Istotne ryzyka

Zmiana selektorów i rerender może zniszczyć niezapisane pola lub skupić zmiany na złym wierszu; nieprzemyślane ikony mogą stracić etykiety; zapis po zamianie może błędnie zmienić przypisanie wariantu; zerowy ciężar może zostać błędnie odrzucony; pośpieszne kliknięcia mogą być zignorowane podczas asynchronicznej blokady. Testy muszą badać faktycznie zapisane rekordy i widoczne błędy, a nie tylko kolor przycisku. Nie zakładać, że dzisiejsze testy dowodzą nieistnienia wyścigu w produkcji.
