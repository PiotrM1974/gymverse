# Etap 7B — historia, statystyki i progresja

Zatwierdzone 25.11.2026 załącznikiem 182969e1-1bee-4d49-bb29-7ac43bdcff05. Bez 7C/8, publikacji i zmian naukowego generatora.

## Projekt i plan
1. Pole docelowej masy tylko dla fat_loss; zmiana widoczności nie usuwa wartości kreatora ani pomiarów ciała.
2. Czysty moduł odczytowy filtruje aktualną historię profilu przez session.planId i bieżące dayPlanIds. Etykieta mówi o historii dni obecnego programu, nie zgaduje historycznego przypisania. Brak ID pozostaje w historii ogólnej.
3. Filtry programu/dnia/ćwiczenia/wariantu w historii; przejścia historia–progres–statystyki i szczegóły sesji. Zapisane RIR każdej serii i liczba zapisanych serii.
4. Zachować wzory statystyk, dodać sumę treningów profilu oraz tekstowy odczyt danych wykresów i powtórzeń. Progresja porównuje dany identyfikator dnia i wariant, bez mieszania różnych planów. Jawna decyzja używa wspólnego zapisu planów.
5. Testy jednostkowe, E2E Edge/WebKit (w tym poprawione 7A), ZIP/JSON, offline, odczyt bez zmian rekordów i zrzuty LIGHT/DARK 320–430.

Status: gotowy do lokalnego zamknięcia po akceptacji właściciela (25.11.2026).

## Wykonane zmiany i źródła
- Historia nadal pochodzi z gymverse_history aktywnego profilu. Żadnej nowej bazy ani migracji prezentacyjnej. Filtry wykonują odczyt; testy porównują cały snapshot przed/po przeglądaniu.
- Kontekst programu: dokładne session.planId w bieżących profile.planPrograms.programs[].dayPlanIds. Nazwa treningu nie bierze udziału w powiązaniu. UI opisuje obecny program, ponieważ stara sesja nie dowodzi przypisania programu w dniu wykonania. Rekordy bez ID lub bez aktualnego programu pozostają w historii ogólnej; odłączenie/usunięcie programu nie kasuje historii.
- Filtry: program, dzień/trening, exerciseId, zapisany variantId albo osobny brak wariantu. Filtry ćwiczenia/wariantu muszą dotyczyć tej samej serii. Podgląd programu ma przejście do historii jego dni. Historia–statystyki–progres–sesja zachowują górną nawigację.
- Szczegóły: zapisane daty/nazwy/długość sesji, obciążenie × powtórzenia, liczba wpisów serii, warianty i RIR każdej serii. Zbiorczy opis RIR pozostaje tylko fallbackiem starych rekordów bez RIR per seria. Ćwiczenia obecnego planu bez wykonanych serii są jawnie opisane jako niezapisane, zachowując dotychczasowe ręczne dodawanie serii.
- Statystyki: istniejące weekStats/streakWeeks, recalcSession/setLoad, metric/e1rm. Liczba treningów oznacza zapisane rekordy sesji (także ręcznie utworzone); serie to prawidłowe zapisane details. Tonaż dla ciężarów to suma weight×reps; dla BW dotychczasowe (bodyAt(date)+dodatkowy ciężar)×reps. e1RM: weight dla reps≤1, inaczej round(weight×(1+reps/30),1). Nie zmieniono wzorów. Rekordy zbiorcze mają etykietę wszystkich wariantów.
- Progres: dotychczasowe wykresy maksymalnego ciężaru, e1RM/dodatkowego obciążenia i tonażu, dodatkowo maksimum powtórzeń. Filtr wariantu, tekstowe wartości wykresów i przejście do zapisanej sesji. Maksima mogą pochodzić z różnych serii — UI to wyjaśnia.
- Istniejący analyzeExerciseProgression bez zmiany reguł. Przed analizą wybierane są serie tego samego planId i wariantu planu. Brak identyfikatora lub inny wariant nie może dostarczać dowodu progresji dla danego dnia. Decyzja pozostaje jawna i nie ustawia ciężaru. Jej zapis przeniesiono z bezpośredniego LS.set na istniejący savePlanChanges ze wspólną synchronizacją. Potwierdzony testem błąd utraty wyświetlanej decyzji po reload naprawiono przez zachowanie istniejących metadanych progressionReview w cleanPlan.
- Generator: fitness odpowiada „Poprawa sprawności”. Pole masy widoczne tylko dla fat_loss; ukrycie i przejścia kroków zachowują wpisaną wartość. gymverse_body oraz attributes.trainingGoal nie są zmieniane. Silnik generator.js bez zmian.
- Ograniczone style Signal, LIGHT/DARK i 320/375/390/430. Cache v47 z modułem history-context.js, bez Premium UI Polish.

## Przebiegi wstępne (historyczne)
Unit:192/192 PASS,24pliki (outputs/GV-BOLT-STAGE7B-final-unit.log). Nowe Edge7/7 przed dodaniem ZIP; ZIP1/1 i regresja decyzji progresji1/1 po poprawce. Końcowe wyniki i osobne ponowienia poniżej. Dwa początkowe błędy testów oczekiwały tekstu „40 kg” zamiast dotychczasowego kompaktowego „40×11”; skorygowano sprawdzanie konkretnych zapisanych liczb. Stare selektory profili wskazują teraz dokładnie górną nawigację (doszły skróty nawigacyjne). Test ZIP używa stabilnych ID serii, aby sprawdzać ich zachowanie; dla starych serii bez ID dotychczasowy eksport generuje identyfikatory i nie jest to nowa migracja7B.

## Pliki zmienione w 7B
index.html; src/features/plans/history-context.js (nowy); src/ui/signal.css; sw.js; tests/unit/history-context.test.js (nowy); tests/unit/branding.test.js; tests/unit/service-worker.test.js; tests/e2e/bolt-stage7b.spec.js (nowy); tests/e2e/profiles.spec.js; tests/e2e/history-volume.spec.js; tests/e2e/session-results-swaps.spec.js; tests/e2e/variant-flow.spec.js; docs/tasks/GV-BOLT-STAGE7B.md (nowy); docs/gymnastika-stage63-data-contract.md; PROJECT_MEMORY.md. Logi/zrzuty/fragment roboczy w outputs/GV-BOLT-STAGE7B* oraz outputs/stage7b-history-ui-fragment.txt.

## Końcowa weryfikacja — 25.11.2026

| Przebieg | Wynik | Log w outputs/ |
| --- | --- | --- |
| npm test, aktualny kod | 192/192 PASS, 24 pliki | GV-BOLT-STAGE7B-final-unit.log |
| Kontrolowany szerszy Edge | 89/90 PASS | GV-BOLT-STAGE7B-final-edge.log |
| Edge: cały 7B, historia i warianty po poprawce | 12/12 PASS | GV-BOLT-STAGE7B-confirm-edge.log |
| Edge: poprawione przygotowanie profili i sesji | 16/16 PASS | GV-BOLT-STAGE7B-fixtures-edge.log |
| Edge: wielokrotne przygotowanie scenariusza zamian | 1/1 PASS | GV-BOLT-STAGE7B-reseed-edge.log |
| Kontrolowany desktop WebKit, bez offline | 40/53 PASS | GV-BOLT-STAGE7B-final-webkit.log |
| WebKit: poprawione profile/sesje i końcowy wygląd | 18/19 PASS | GV-BOLT-STAGE7B-confirm-webkit.log |
| Ostateczne historie/warianty w obu silnikach | Edge 3/3 i WebKit 3/3 PASS | GV-BOLT-STAGE7B-legacy-confirm.log |

To osobne przebiegi, nie jeden pełny PASS. Wszystkie pierwotne niepowodzenia mają pozytywne potwierdzenie po poprawce. Nowe scenariusze 7B: Edge 8/8 (w tym offline), WebKit 7/7; poprawione 7A 12/12 w każdym silniku. Regresja obejmuje generator 1–6 dni, szkice, wspólną blokadę dwóch kart w localStorage/IndexedDB, odmowę starej migawki, rollback/integrityUncertain, ZIP v5, profile/migrację, syntetyczny JSON v4, sesje, RIR, timer i warianty/MuscleMap. Przeglądanie historii/statystyk porównuje pełny snapshot przed/po; próbka 5 sesji/6 serii daje 2208 kg, sesja 40×11 + 40×11 daje 880 kg, RIR2 i RIR0 pozostają odrębne.

Przyczyny i poprawki testów:
- Edge: stary test wariantów po wyczyszczeniu profilu próbował otwierać edytor za ekranem powitalnym. Teraz przechodzi rzeczywistą konfigurację profilu.
- WebKit: 12 niepowodzeń zatrzymało się na wstępnym page.reload oczekującym load, jedno dostało pustą historię po ustawianiu fixture podczas bootstrapu. Dane ustawiane są teraz jednorazowo przed pierwszą nawigacją; gotowość sprawdzają rzeczywiste kontrolki. Nie dodano arbitralnych opóźnień ani większych timeoutów.
- Pierwsza poprawka history-volume zmieniła tylko nawigację i nie usunęła przygotowania danych po bootstrapie; dlatego test ponownie nie przeszedł (18/19). Ostatecznie przeniesiono fixture do addInitScript i potwierdzono go w obu silnikach (6/6 razem).
- Wspólny seed sesji obsługuje wielokrotne przygotowanie różnych ćwiczeń w jednym teście przez osobne identyfikatory; nie resetuje danych podczas testowanego wznowienia. Rzeczywiste reload/resume oraz porównania zapisanych rekordów zachowano.
- Nie zmieniano produkcyjnej logiki z powodu tych błędów środowiska/przygotowania. Rzeczywistą poprawką aplikacji jest zachowanie zatwierdzonej progressionReview po reload; potwierdzenie po reload PASS w Edge i WebKit. Ograniczona korekta nagłówków wyników/progresji usuwa nieczytelne nakładanie liter.

## Zrzuty i ocena
Rzeczywiste zrzuty syntetycznych danych: outputs/GV-BOLT-STAGE7B/{chromium,webkit}-{history,stats,charts}-{light,dark}.png oraz osobne history-card-light/dark.png. Końcowe zrzuty po korekcie nagłówków; sprawdzono historie LIGHT/DARK, statystyki i progres, test układu w obu silnikach potwierdził brak przewijania poziomego 320/375/390/430. Signal i górna nawigacja zachowane. To kontrola funkcjonalna i czytelności, nie Premium UI Polish.

## Decyzja i ograniczenia
Etap7B gotowy do lokalnego zamknięcia po akceptacji właściciela. Bez nowych baz, zmiany wzorów statystyk ani reguł naukowych generatora/progresji. Brak ID nie pozwala zgadywać programu; bieżące członkostwo dnia nie dowodzi historycznego przypisania programu. Brak wariantu jest odrębny od wariantu podstawowego. Szacowane 1RM nie jest pomiarem. Zbiorcze rekordy obejmują wszystkie warianty (jawna etykieta).

Nadal niezweryfikowane: fizyczny iPhone/Safari, zakończenie PWA przez iOS, offline desktopowego WebKit, autentyczny historyczny eksport. Syntetyczny JSONv4 oraz ZIPv5 sprawdzone. Starsze karty aplikacji nie respektujące wspólnej blokady pozostają poza ochroną; localStorage nie zapewnia atomowej transakcji wielu kluczy wobec obcych zapisów. Pozostają ograniczenia ostatniego potwierdzonego zapisu szkicu i ewikcji danych witryny. Premium UI Polish wymagany przed publikacją. Bez 7C/8, backupu projektu, subagentów, nowego czatu/worktree, commit/merge/push/deploy/publikacji. Zastane niezacommitowane dane zachowane.
