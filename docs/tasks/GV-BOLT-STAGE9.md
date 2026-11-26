# Etap 9 — historyczny kontekst programu sesji

Autoryzacja: załącznik a63be183-1827-4c4a-a5ea-d820b795003a, 25.11.2026. Ten sam worktree i gałąź `feature/gymnastika-approved-ui`. Bez Premium UI Polish, backupu katalogu, commit/merge/push/deploy/publikacji.

## Kontrakt i plan

Opcjonalne pole `sessionContext` wewnątrz istniejących rekordów `gymverse_active` i `gymverse_history`. Nowy zapis ma `kind: "program"` lub `"standalone"`, `profileId`, `dayPlanId`. Wariant programowy zawiera stabilny `programId`, `programTitle` i `dayNumber` z chwili startu. Brak pola w starszej sesji oznacza nieustaloną przynależność; nie wyprowadza się jej z obecnych `dayPlanIds`. `planId` i `planTitle` pozostają bez zmiany. Program źródłowy jest wskazywany jawnie przez start dnia z podglądu programu; ogólna karta planu jest samodzielnym wejściem. Zapis nowej sesji używa dotychczasowego `saveActive`; koniec treningu kopiuje kontekst do istniejącej transakcji historii. Kopia ZIP v5 przenosi pole wewnątrz dotychczasowych rekordów, bez nowej wersji formatu.

1. Test jednostkowy: przechwycenie kontekstu programu/samodzielnego dnia, walidacja i historyczny filtr, także po zmianie/usunięciu programu oraz rekord legacy.
2. Minimalna implementacja: funkcje kontekstu w `history-context.js`, jawne wejście z programu, start i zakończenie sesji, zachowanie przy normalizacji, walidacja ZIP.
3. E2E na współdzielonym lokalnym magazynie: rzeczywiste starty, serie/RIR/zamiana/wznowienie, zmiany programów, historia, dwa profile, ZIP v5 i JSON v4, odmowa zapisu. Porównanie rekordów przed i po.
4. Regresja jednostkowa, celowane Edge i desktopowy WebKit, kontrola LIGHT/DARK 320–430 px dla zmienionego przycisku i etykiety, aktualizacja pamięci i raport.

Ograniczenia: starsze karty aplikacji mogą nie zachować nowych metadanych podczas zapisu; localStorage nie gwarantuje wielokluczowej atomowości wobec obcych zapisów. Fizyczny Safari/iPhone i autentyczny historyczny eksport pozostają poza lokalnym dowodem.

## Wynik końcowy — 25.11.2026

Wdrożono opcjonalne `sessionContext` w istniejących rekordach aktywnej sesji i historii. Nowa sesja rozpoczęta przyciskiem konkretnego dnia w podglądzie programu zapisuje `kind: program`, stabilne ID profilu/programu/dnia, nazwę programu i numer dnia z chwili startu. Start z ogólnej karty planu zapisuje `kind: standalone`. Starszy rekord bez pola jest `unknown`; nie przypisuje się go do programu według dzisiejszej organizacji. Historia pokazuje historyczny i obecny kontekst osobno, a filtr programu używa tylko historycznie zapisanego ID. Wzory statystyk i progresja nie zostały zmienione.

Przed startem z podglądu aplikacja uzyskuje istniejący Web Lock, odświeża migawkę i porównuje surowy rejestr profili oraz plany z chwilą otwarcia podglądu. Zmiana w drugiej karcie odrzuca start z komunikatem. Ponowienie po odświeżeniu podglądu zapisuje aktualny kontekst, co potwierdza zwolnienie blokady. Zakończenie kopiuje kontekst do istniejącej transakcji historii. Normalizacja i walidacja kopii przenoszą opcjonalne pole; nie zmieniono numeru ZIP v5 ani JSON v4. Import starszych danych bez pola pozostaje poprawny. Inteligentny import zachowuje pole i sygnalizuje konflikt dla tego samego ID sesji o innej zawartości.

Świeże testy jednostkowe **197/197 PASS** (24 pliki). Kontrolowany zestaw Edge: **8/8 PASS**; identyczny desktopowy WebKit: **8/8 PASS**. Zestaw obejmował nowy E2E etapu 9, dawny test przeniesienia dnia, pełny przepływ generatora dwóch profili z ZIP v5 oraz ekran kopii. Dodatkowy E2E trwałości kontekstu przez RIR/zamianę/reload/zakończenie: Edge **1/1**, WebKit **1/1 PASS**. Nowe E2E porównują zapisane rekordy, sprawdzają usunięty program, odrębność sesji samodzielnej/legacy, wspólny magazyn dwóch kart i odmowę startu ze starej migawki. LIGHT/DARK na 320/375/390/430 px bez poziomego przewijania dla zmienionego widoku. Test jednostkowy ZIP v5 sprawdza roundtrip aktywnej sesji i historii, poprawny brak pola w starszej kopii oraz odrzucenie niespójnego ID dnia; JSON v4 i wieloprofilowe ZIP mają istniejącą regresję E2E w zestawie 7C/8.

Pliki etapu 9: `index.html`, `src/features/plans/history-context.js`, `src/gv-data.js`, `sw.js` (cache v50), `tests/unit/history-context.test.js`, `tests/unit/gv-data.test.js`, `tests/unit/smart-backup.test.js`, `tests/e2e/bolt-stage9.spec.js`, `tests/e2e/bolt-stage7c.spec.js`, asercje wersji cache w `tests/unit/branding.test.js`, `tests/unit/service-worker.test.js`, `tests/e2e/atlas-image-offline.spec.js`, `tests/e2e/exercise-images-complete.spec.js`, `tests/e2e/gv-data.spec.js`, `tests/e2e/gv-musclemap-qa-gate.spec.js`, niniejszy dokument i `PROJECT_MEMORY.md`. Są to pliki z niezacommitowanego worktree, w którym istnieją też wcześniejsze zmiany.

Ograniczenia: sesje sprzed etapu 9 pozostają bez wiarygodnego programu historycznego. Starsza otwarta karta nie używa nowego pola ani bieżącej blokady; localStorage nie jest atomową transakcją wielokluczową wobec obcych zapisów. Testy wykonano na syntetycznych danych i desktopowym WebKit, bez fizycznego iPhone/Safari ani autentycznego archiwalnego eksportu użytkownika. Zgłoszony w etapie 8 odczyt fizycznego ZIP offline w desktopowym WebKit pozostaje odrębnie niepotwierdzony. Premium UI Polish i publikacja wymagają osobnych decyzji. Bez migracji starszej historii, backupu katalogu, nowego czatu/worktree/subagentów, commit/merge/push/deploy.

**Decyzja:** etap 9 jest gotowy do lokalnego zamknięcia w sprawdzonym zakresie; bez zgody właściciela nie rozpoczynać Premium UI Polish ani publikacji.
