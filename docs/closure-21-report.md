# GymNastika 2.1 — raport lokalny 24.11.2026

## Wynik i granice zamknięcia

Poprawka zakończenia treningu jest gotowa. Lokalna regresja Edge przechodzi. Etap 2.1 jest technicznie gotowy do lokalnego zamknięcia w zweryfikowanym zakresie Edge. Ostateczna akceptacja właściciela obejmuje opisane ograniczenia Safari oraz zakres oceny wizualnej. Publikacja wymaga osobnej decyzji właściciela. Bolt pozostaje osobnym przyszłym etapem.

## Świeże wyniki

- Unit: 130/130 w 16 plikach (`npm test -- --run`).
- Pełny zwykły zestaw Edge: 136/136, 4 workery, `playwright.core-edge.config.js`. Log: `outputs/GV-CLOSURE-21/full-e2e.log`.
- Dedykowane ilustracje/pilot: 12/12, `playwright.presentation.config.js`.
- Oddzielny nagłówek: 1/1, `playwright.header.config.js --grep header`.
- Razem unikalne E2E Edge: 150/150 w trzech konfiguracjach.
- Końcowy plik `phase0-export-compatibility.spec.js`: 4/4, w tym nowy pobrany wieloprofilowy ZIP i sesja po zamianie; log `outputs/GV-CLOSURE-21/combined-final.log`. Łącznie zwykły katalog ma 137 unikalnych przypadków, wykonanych jako 136 + nowy przypadek; trzech powtórek nie doliczać.
- Dodatkowy izolowany przebieg nowych scenariuszy: 15/15; nie doliczać ponownie do 150.
- WebKit: próba jednego scenariusza zakończenia zatrzymana przed wykonaniem z powodu braku dostępnego pliku wykonywalnego Playwright WebKit. Safari, iOS PWA, zapis w Plikach i odtwarzanie na fizycznym iPhonie nie zostały zweryfikowane w tej sesji.
- `git diff --check`: PASS, ostrzeżenia LF/CRLF zastanych plików.

Wcześniejsze próby ujawniły nadpisywanie atrybutu hidden przez styl przycisku, błędny widok w nowym teście importu i zbyt wąskie oczekiwanie komunikatu błędu. Poprawiono je przed końcowym przebiegiem. Pierwsze równoległe przebiegi współdzieliły katalog artefaktów; końcowy używa osobnego `outputs/GV-CLOSURE-21/full-browser` i zakończył się poprawnie.

## Zmiany w tej sesji

`index.html`: ostatni krok ukrywa wyłącznie nawigacyjny przycisk następnego ćwiczenia i wyróżnia istniejący przycisk „Zakończ i zapisz trening”. Nawigacja wstecz ponownie udostępnia „Dalej/Pomiń”. Zachowano wcześniejsze zakończenie, potwierdzenia pustej/niekompletnej sesji oraz porzucenie. Nie zmieniono funkcji zapisu. Import odmawia przy identycznym ID sesji i różnej treści zamiast po cichu pomijać taki rekord; komunikat nie ujawnia prywatnych wartości.

Testy: dodano `closure-21.spec.js`, `closure-profile-roundtrip.test.js`; zaktualizowano istniejący scenariusz ostatniego kroku w `base-b-regressions.spec.js`. Zachowano wszystkie zastane modyfikacje. Brak zmian modelu danych, integracji Bolt i ilustracji. Nie utworzono commita, merge, push ani deploy. Branch `feature/gymnastika-approved-ui`, HEAD `fc6f177`.

## Macierz §34

Nazwy plików poniżej odnoszą się do `tests/e2e`, chyba że podano unit. PASS oznacza świeżo wykonane dowody w opisanym zakresie, CZĘŚCIOWO oznacza brak bezpośredniego kompletnego scenariusza.

| Wymaganie | Status i dowód |
|---|---|
| Prawidłowy historyczny v4, historyczne daty, jedna sesja | PASS: `phase0-export-compatibility` — original historical JSON v4 exporter output |
| Wiele sesji i podobne daty | PASS: `base-b-regressions` — same timestamp, multiplicity |
| Warianty | PASS: `variant-flow` — plan/trening/historia/ZIP restore; brak wariantu w starym v4 zachowany |
| Zamiany ćwiczeń | PASS: `phase0-export-compatibility` — downloaded multi-profile backup; rzeczywista zamiana bench_flat → db_bench, zapis, pobranie ZIP i porównanie całej historii po restore |
| Dopuszczalne niepełne metadane | PASS: historyczny v4 bez variantId i stabilnych ID; brakujące wartości nie są wymyślane |
| Nieznane ćwiczenie | PASS: `profiles` — legacy v4 merge, zachowany wynik i oznaczenie wymagające mapowania |
| Nieobsługiwana wersja | PASS: `closure-21` — future |
| Uszkodzony / pusty / obcy plik | PASS: `closure-21` — broken / empty / foreign, porównanie stanu |
| Niedopuszczalnie niekompletna seria | PASS: `closure-21` — missing-series; `base-b-regressions` — uninterpretable series |
| Zbyt duży plik | PASS: `closure-21` — oversize, limit 25 MB przed parsowaniem |
| Przerwany import / zapis | PASS: `base-b-regressions` — failed import save rollback; `gv-data` — interrupted migration retry i partial activation |
| Ponowny import | PASS: `profiles` — ponowny v4 bez nowych sesji; `base-b-regressions` — multiplicity |
| Konflikt ID | PASS: `closure-21` — conflicting stable session ID, odmowa i niezmieniona historia |
| Brak miejsca | PASS: `base-b-regressions` — failed save; `gv-data` — quota selector failure |
| Awaria odzyskiwania | PASS: `base-b-regressions` i unit gv-data — failed rollback, jawna niepewność i eksport awaryjny; bez obietnicy bezstratnego cofnięcia |
| Import pusty/istniejący/drugi profil | PASS: `profiles`, `base-b-regressions`; osobne profile i istniejące dane zachowane |
| Brak mieszania historii | PASS: `profiles` — izolacja profili, IndexedDB, auxilia |
| „Poprzednio” po imporcie | PASS: `phase0-export-compatibility` — 75×8, 70×10, 65×12; `variant-flow` — warianty |
| Eksport pustego profilu | PASS modułu: unit `closure-profile-roundtrip`, populated=false; pobranie pustego profilu przez UI nie ma osobnego testu |
| Profil z historią i wiele planów | PASS: unit `closure-profile-roundtrip`, populated=true, porównanie wszystkich kluczy; `profiles` — pobranie i odtworzenie JSON z auxiliami |
| Pełna kopia i wersje | PASS: unit gv-data, `gv-data`, `phase0-export-compatibility` — ZIP v5, historyczny JSON v4, odmowa nieznanych wersji |
| Aktywny trening | PASS: `gv-data` — active fields, restore timer idle; `phase0-export-compatibility` — restored work; unit closure — snapshot active |
| Round-trip na izolowanych danych | PASS: `phase0-export-compatibility` — pobranie pliku, czysty kontekst, restore offline, porównanie historii/planów/ustawień/serii aktywnych; unit closure i gv-data — rejestr profili i auxilia |
| Pełna macierz round-trip wszystkich profili, wariantów, zamian, ustawień jednocześnie | PASS dla historii/planu/profili/ustawień: `phase0-export-compatibility` — downloaded multi-profile backup, dwa profile, high_feet, wynik po zamianie i pełne porównanie kluczy. Auxilia i aktywna sesja mają osobne świeże testy |
| Historyczna zgodność formatu | PASS dla reprezentatywnego pliku w rzeczywistym formacie: oryginalny eksporter `7d32975` wykonany na syntetycznych wejściach. Pochodzenie: `tests/fixtures/phase0/legacy-v4-provenance.json`. To NIE jest eksport właściciela. Test jego prywatnego pliku nie był wykonywany; nie jest potrzebny do dowodu struktury znanego v4. Inne rzeczywiste formaty wymagają dostarczenia przykładu i osobnego adaptera |

## §43 — kontrola końcowa

Potwierdzone lokalnym zestawem: profile i izolacja; zachowanie gotowych planów; plany ręczne; opcjonalny generator i podgląd; offline; import v4 z wyborem aktywnego profilu/podsumowaniem/deduplikacją; bezpieczna odmowa błędnych danych; historia i Poprzednio; eksport JSON profilu i ZIP wszystkich profili; restore; zamiany i MuscleMap; brak krytycznej regresji w 150 testach Edge; pamięć uaktualniona; brak publikacji.

Baza naukowa i biblioteka: istnieją aktualne `docs/research/SOURCES.md`, `EVIDENCE_MATRIX.md`, `SCIENTIFIC_RULES.md`, `EVIDENCE_LIMITATIONS.md`, `EXERCISE_COVERAGE.md`. Nie powtarzano badań ani audytu. Poprzedni etap utrwalony zgodnie z HANDOFF; nie sprawdzano ponownie zdalnego wydania. Pełnej akceptacji wizualnej wszystkich ekranów nie deklarujemy. Kryteria funkcjonalne §34 mają dowody w tabeli. Nie deklarujemy zgodności niewykonanych środowisk ani wizualnej akceptacji właściciela.

## §44 — raport funkcji i ograniczeń

1. Funkcje: profile, gotowe/ręczne/generowane plany, audyt planu, sugestie progresji, historia, Poprzednio, zamiany, kopie i restore.
2. Profile: opcjonalne parametry, sprzęt, ograniczenia; izolacja danych i auxiliary; do 20 profili.
3. Plany: gotowe, edytor ręczny z dniem/przerwami, opcjonalny generator.
4. Generator: cel/masa docelowa, dni, czas, split, priorytety, sprzęt, ulubione/wykluczenia, zgoda na historię, doświadczenie/powrót, podsumowanie. Bez automatycznego ciężaru.
5. Źródła/reguły: dokumenty research powyżej; heurystyki opisane jako heurystyki.
6. Katalog: 31 ćwiczeń i 4 warianty; ograniczone pokrycie hip hinge/łydek/core. Nie rozszerzano go w tej sesji.
7. Przykłady celów: siła — roboczy zakres 4–6; pozostałe — 8–12; powrót po przerwie — edytowalna heurystyka jednej serii. Braki katalogu są ujawniane. To nie indywidualna recepta treningowa.
8–11. Import: znany JSON v4, profil docelowy, podgląd, duplikaty, konflikt ID, zachowanie nierozpoznanych ćwiczeń; historyczny fixture i Poprzednio przeszły.
12–14. Eksport: JSON jednego profilu z auxiliami; ZIP v5 wszystkich profili i auxilii. Round-trip potwierdzony w wyżej podanym zakresie.
15. Wyniki testów: 130 unit i 150 E2E Edge PASS; zakresy rozpisane powyżej.
16. LIGHT/DARK: sześć zrzutów finalnej akcji przy 320/390/430 px, brak poziomego overflow; przejrzano także obrazy 320 px w obu motywach. Zapisana sesja zachowuje obie serie. Istniejące testy serii obejmują ponadto 375 i 1280 px.
17. Safari/WebKit: niezweryfikowane; brak dostępnego runtime WebKit. Brak świeżego fizycznego iPhone/PWA.
18–20. Git/pamięć/problemy: zachowano worktree i zastane zmiany; pamięć zawiera HANDOFF tej sesji. Niepotwierdzone: Safari/WebKit, fizyczny iPhone i pełna wizualna akceptacja właściciela. Brak osobnego pobrania pustego profilu przez UI (jego kontrakt ma unit round-trip; pobieranie i import profilu w UI potwierdzono dla profilu z danymi).

## Dalsza kolejność

Obie wcześniej zidentyfikowane luki testowe domknięto nowym testem pobranego ZIP wielu profili z sesją po zamianie (4/4 końcowego pliku). Właściciel może zatwierdzić lokalne zamknięcie etapu ze wskazanymi ograniczeniami środowiskowymi i wizualnymi. Nie integrować Bolt. Publikacja pozostaje oddzielną decyzją.
