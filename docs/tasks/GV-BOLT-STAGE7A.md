# Etap 7A — integracja generatora

Zakres zatwierdzony 2026-11-25. Bez zmiany algorytmu, publikacji i etapów 7B/7C.

## Plan
1. Bazowa regresja Edge finalnego 6.4D: 56/56 PASS (outputs/GV-BOLT-STAGE7A-baseline-edge.log).
2. Adapter wyniku istniejącego generatora do szkicu programu, z zachowaniem migawki źródłowej i odpowiedzi kreatora.
3. Podgląd dni, edycja i zapis przez istniejący edytor/synchronizację; osobne przypisanie.
4. Testy jednostkowe, Edge/WebKit, offline, ZIP i widoki mobilne; aktualizacja pamięci.

## Ograniczenia odziedziczone
Starsze otwarte karty bez wspólnej blokady wymagają zamknięcia/odświeżenia. localStorage nie zapewnia transakcji wielu kluczy; rollback i odczyt kontrolny wykrywają niepewność integralności. Fizyczny iPhone/Safari i historyczny autentyczny eksport niezweryfikowane. Premium UI Polish pozostaje osobnym wymaganiem.

## Implementacja i kontrakt
- Istniejący generator.js i jego reguły pozostają bez zmian. Adapter generated-program.js przenosi oddzielne rekordy 1–6 dni do szkicu createProgramDraft; zachowuje identyfikatory, kolejność, ćwiczenia i parametry. Długie tytuły tracą wyłącznie prefiks „Do sprawdzenia”, aby zachować numer dnia w limicie modelu.
- Cel startowy pochodzi z attributes.trainingGoal (jeśli obsługiwany). Odpowiedź kreatora nie aktualizuje celu profilu. Wszystkie 10 kroków pozostaje dostępnych.
- Podgląd pokazuje tygodniową analizę istniejącego silnika, każdy dzień, warianty/domniemany wariant katalogowy, serie, powtórzenia, rzeczywiste czasy przerw, grupy i sprzęt. Selektor przewija do konkretnego dnia. Zachowano zgodne zamienniki; zmiana zapisuje szkic.
- Pierwsza propozycja jest zachowywana w gymverse_program_drafts_v1 jeszcze przed udostępnieniem podglądu. Edytuj dzień/program używa produkcyjnego edytora. Zapis programu używa commitProgramDraft, tej samej blokady, CAS i odczytu kontrolnego; usuwa tylko właściwy szkic i nie przypisuje programu ani nie uruchamia sesji.
- Opcjonalne generatorAnswers w istniejącym szkicu zachowuje wszystkie odpowiedzi kreatora; walidowane typy/pola, bez funkcji i wyniku analizy w trwałych danych. Wznów działa po zamknięciu karty; Wróć do generatora przywraca odpowiedzi, zachowując poprzedni szkic. Kolejna generacja pozostawia wcześniejszy szkic do jawnego odrzucenia. Pełny ZIP v5 obejmuje rozszerzenie bez zmiany numeru; JSON profilu nadal nie obejmuje szkiców.
- Sześć dni auto to istniejący układ Push/Pull/Legs z dwoma cyklami, a nie jedna zawartość skopiowana sześć razy. Algorytm może powtarzać ćwiczenia pomiędzy odpowiadającymi dniami; nie wprowadzano sztucznego zróżnicowania. FBW może mieć powtarzalny zestaw.

## Poprawki potwierdzone diagnostyką
- Starszy prawidłowy rekord ćwiczenia może nie mieć target. Walidator szkicu akceptuje brak opcjonalnego pola bez modyfikacji rekordu; nadal odrzuca błędny typ. Regresja jednostkowa oraz test profili z rekordem legacy potwierdzają zapis.
- Podgląd pojawia się dopiero po zachowaniu szkicu, bez wyścigu z inicjalizacją edytora.
- Nagłówek podglądu przy 320 px wypychał przycisk zamknięcia. Dodano zawijanie wyłącznie w obrębie tego widoku. Usunięto niepasującą etykietę „Twoje dane” z kart podglądu. Paleta Signal bez zmian; nie wykonano Premium UI Polish.
- Testy wcześniejszego generatora oczekują teraz ekranu programu po zapisie, nadal weryfikują rekordy, blokadę, ustawienia i profile. Polling pustego magazynu traktuje brak gymverse_plans jako pustą listę, zgodnie z produkcją. ZIP porównuje obiekty, ponieważ serializacja kopii porządkuje klucze.

## Testy — stan bieżący
- Baseline końcowego 6.4D: Edge 56/56 PASS, jeden przebieg.
- Końcowe jednostkowe: 188/188 PASS, 23 pliki (outputs/GV-BOLT-STAGE7A-final-unit.log).
- Celowane nowe ścieżki Edge: 7/7; następny przebieg integracyjny 23/24, jedyny błąd był porównaniem kolejności kluczy JSON testu ZIP. Po poprawce ZIP 1/1. Layout 320 px poprawiony i potwierdzony 1/1 we wszystkich 8 kombinacjach szerokości/motywu.
- Końcowa kontrolowana regresja Edge: **68/68 PASS**, jeden przebieg, 4,4 min, bez retry. Pliki: bolt-stage64b, bolt-stage64d, bolt-stage7a, profiles, smart-backup. Log outputs/GV-BOLT-STAGE7A-final-edge.log. Obejmuje offline, ZIP, historię/sesję/RIR, migracje, aktywną pracę, szkice i wygląd.
- Desktop WebKit2215: **31/35 PASS** w przebiegu (5,3 min), w tym wszystkie 12/12 nowych7A i 12/12 szkiców6.4D. Cztery starsze testy profili zatrzymały się na przygotowawczym reloadzie po ręcznym czyszczeniu localStorage (jeden przy domcontentloaded, trzy przy load), przed sprawdzaną operacją. Nie był to błąd zapisu ani deadlock wspólnej blokady. Punktowo zmieniono fixture: dane legacy przez addInitScript z jednorazowym znacznikiem przed pierwszą nawigacją; czysty onboarding wykorzystuje nowy, pusty kontekst Playwright bez zbędnego czyszczenia i reloadu. Pozostawiono rzeczywiste późniejsze reloady oraz wszystkie asercje danych. Bez zwiększania timeoutów i skip.
- Ponowienie czterech zmienionych testów na obu silnikach: **8/8 PASS** (Edge4,WebKit4), 50,3s; outputs/GV-BOLT-STAGE7A-profile-fixture-final.log. Każdy z35 przypadków WebKit ma PASS po poprawce, ale **nie jest to jeden przebieg35/35**. Produkcja nie zmieniła się po pełnym Edge68/68; poprawiono wyłącznie przygotowanie tych4 testów.
- node --check trzech modułów i git diff --check PASS. Baseline i wszystkie końcowe testy używały wyłącznie syntetycznych danych oraz istniejącego silnika WebKit z outputs/playwright-stage63a. Brak deklaracji fizycznego Safari/iPhone.

## Zmienione pliki w 7A
index.html; src/features/plans/generated-program.js (nowy); src/features/plans/program-editor-ui.js; src/features/plans/program-drafts.js; src/ui/signal.css; sw.js (cache v46); tests/unit/generated-program.test.js (nowy); tests/unit/program-drafts.test.js; tests/unit/branding.test.js; tests/unit/service-worker.test.js; tests/e2e/bolt-stage7a.spec.js (nowy); tests/e2e/profiles.spec.js; docs/gymnastika-stage63-data-contract.md; docs/tasks/GV-BOLT-STAGE7A.md (nowy); docs/tasks/GV-BOLT-STAGE64.md; PROJECT_MEMORY.md. Artefakty/logi: outputs/GV-BOLT-STAGE7A*.

## Dowody i decyzja końcowa
Dwa konteksty stron jednego browser context współdzielą magazyn. W nowych testach drugą kartą utrzymano Web Lock, wykazano oczekiwanie zapisu pierwszej oraz brak rekordów programu przed zwolnieniem. Po poprawnym zapisie pierwszej druga odmówiła zapisu starej migawki; rekordy planów i profili pozostały identyczne z zatwierdzonymi. Oba magazyny przeszły, a po operacjach brak pozostałych blokad. Testy awarii porównują rekordy przed i po rollbacku, ponowienie oraz blokadę integrityUncertain. Testy ZIP porównują całe obiekty szkicu/odpowiedzi/dni; smart merge zachowuje nowszy lokalny szkic i zgłasza konflikt. Edycja drugiego dnia zmienia wyłącznie jego rekord, a zamknięcie karty bez unload nie usuwa potwierdzonego szkicu.

Rzeczywiste zrzuty: outputs/GV-BOLT-STAGE7A/generator-card-light.png i generator-card-dark.png (kontrolki kreatora); chromium-preview-3.png, chromium-preview-6.png, chromium-edit-day2.png oraz odpowiedniki webkit. Obejrzano LIGHT/DARK kreatora i mobilny podgląd; funkcjonalne testy wszystkich8 kombinacji szerokości/motywu PASS. Nie jest to Premium UI Polish.

**Decyzja: 7A gotowy do lokalnego zamknięcia i akceptacji właściciela.** Nie rozpoczęto7B/7C, nie wykonano backupu projektu, commit/merge/push/deploy ani publikacji; zachowano zastane zmiany.

Ograniczenia: powtarzalne cykle zgodne z istniejącym algorytmem, braki mapowania katalogu jawnie pokazywane przez generator; brak oceny naukowej na nowo. Trwałość ostatniego potwierdzonego zapisu (nie gwarancja ostatniego znaku przy kill), możliwość ewikcji/skasowania danych witryny,100 szkiców/5mln znaków, pozostawienie poprzednich propozycji do jawnego odrzucenia. Stare karty poza blokadą, localStorage bez atomowości wielu kluczy wobec obcego klienta. Fizyczny iPhone/iOS kill, WebKit offline i autentyczny historyczny eksport pozostają niezweryfikowane. Premium UI Polish obowiązkowy przed publikacją.
