# Etap 7C — integracja procesu treningowego

Zgoda właściciela: załącznik03234898-1512-4a05-94e0-49b3b6b819e9,25.11.2026. Bieżący worktree i feature/gymnastika-approved-ui; bez7C rozszerzeń modelu historii, etapu8, publikacji i backupu katalogu.

## Plan i kryteria
1. Jeden kontrolowany zestaw regresji7B: Edge90 i dostępny WebKit53. Diagnostyka tylko faktycznych niepowodzeń, minimalne poprawki i celowane potwierdzenia; bez ukrywania wyników.
2. Nowy tests/e2e/bolt-stage7c.spec.js: pełny przepływ przez istniejący interfejs od tworzenia dwóch profili o różnych celach przez generator3/6dni, edycję dnia2, zapis/przypisanie, rzeczywiste serie/RIR/przerwę/wznowienie/zamianę/koniec sesji, historię/statystyki/progresję i decyzję. Porównania trwałych rekordów, nie tylko widoków.
3. Eksport produkcyjnym przyciskiem ZIPv5 i przywrócenie w nowym browser context: profile/programy/historia/statystyki/Poprzednio zgodne. Żadnych danych osobistych.
4. Kontekst historii: istniejące session.planId identyfikuje dzień, ale brak zapisanego programId na moment treningu. Jawnie odróżnić obecne powiązanie od niepotwierdzonego historycznego. Test przeniesienia dnia i starszych rekordów bez zgadywania; bez migracji. Osobna propozycja przyszłego kontraktu tylko w dokumentacji.
5. Signal LIGHT/DARK320/375/390/430, jednostkowe i nowe E2E obu silników. Poprawki produkcji tylko przy wykazanym błędzie; bez zmiany reguł naukowych.
6. Raport wyników (każdy przebieg oddzielnie), lista zmian i ograniczenia w tym dokumencie oraz PROJECT_MEMORY.md. Zatrzymanie przed8.

Status: 7C zakończony funkcjonalnie i zweryfikowany; etap7 gotowy do lokalnego zamknięcia po akceptacji właściciela, z poniższymi jawnymi ograniczeniami.

## Weryfikacja regresji 7B
- Edge:89/90 w jednym kontrolowanym przebiegu (outputs/GV-BOLT-STAGE7C-baseline-edge.log). Jedyny błąd timer240s przed rozpoczęciem treningu: fixture czyścił i ustawiał localStorage podczas bootstrapu i trafiał na onboarding. Wspólny start() przeniesiono do jednorazowego addInitScript, zachowując prawdziwe reloady sesji. Po poprawce cały zestaw timera33/33 PASS (GV-BOLT-STAGE7C-timer-edge.log).
- Desktop WebKit2215:52/53 w jednym kontrolowanym przebiegu (GV-BOLT-STAGE7C-baseline-webkit.log). Jedyny błąd starszego testu dziesięciu kroków generatora: przygotowawczy page.reload czekał na load. Fixture przed pierwszą nawigacją i rzeczywista kontrolka gotowości usunęły wyścig. Celowane potwierdzenie Edge1/1+WebKit1/1 PASS (GV-BOLT-STAGE7C-generator-fixture.log).
- Nie było jednego pełnego przebiegu90/90 ani53/53. Wszystkie ich niepowodzenia potwierdzono osobno. Nie zwiększano timeoutów ani nie osłabiano asercji starszych testów. WebKit bez3 scenariuszy offline, zgodnie z wcześniej udokumentowanym zakresem środowiska.

## Nowy scenariusz 7C
- Dwa profile tworzone przez interfejs: dorosły syntetyczny34lata/70kg, cele hypertrophy i fitness, programy3 oraz6dni z rzeczywistego generatora. Początkowa odmowa generowania przy niepodanym wieku była poprawnym zabezpieczeniem; uzupełniono dane testowe.
- Podgląd wszystkich dni, edycja drugiego dnia (jedna seria pierwszego ćwiczenia,8–10powt.,60s), dokładne porównanie pozostałych dni, zapis/reload/ponowny podgląd i świadome przypisanie. Zapis nie rozpoczyna sesji.
- Każdy profil wykonuje2 sesje: pierwsza1seria pierwotnego ćwiczenia oraz1seria zamiennika następnego ćwiczenia, druga1seria pierwotnego ćwiczenia. Niepełne treningi kończone świadomie po potwierdzeniu. Tylko rzeczywiście zapisane serie trafiają do historii; nie udajemy wykonania całego planu.
- Właściwe ćwiczenia/warianty, RIR2 i1, zapis timera60s, reload podczas odpoczynku, automatyczne przejście do drugiego ćwiczenia po pominięciu przerwy, zamiana, stabilne ID serii i zgodność danych aktywnej sesji z historią. Istniejący RIR jest wyborem ćwiczenia; przy końcu sesji trafia do ostatniej serii danego ćwiczenia. Test respektuje ten kontrakt, nie dodaje nowego RIR per seria podczas zapisu każdej serii.
- Każdy profil:2sesje/3serie/30powtórzeń. Pierwszy:40×11 dwukrotnie +20×8=1040kg. Drugi:60×11 dwukrotnie +20×8=1480kg. Porównano totalVolume/totalReps, karty statystyk, wariant wykresu i historię ciężarów. Dwie sesje z11powtórzeniami przekraczają zakres8–10 według dotychczasowego silnika; osobne jawne decyzje40/60kg, bez zmiany planowanych ćwiczeń i historii.
- Pełny eksport przez produkcyjny przycisk, rzeczywiste pobranie ZIPv5, przywrócenie przez import w nowym browser context. Dokładna zgodność historii i planów obu profili, identyfikatorów programów/dni, celów, przypisań, decyzji i statystyk; rozpoczęcie następnej sesji pokazuje odpowiednie Poprzednio40/60kg×11. Puste sesje kontrolne jawnie porzucone bez dopisania historii.
- Nowy test ma jawny limit180s dla całego przepływu:2profile,4sesje,2programy,2decyzje,przegląd8kombinacji rozmiaru/motywu w wielu widokach i ZIP. Nie jest to podniesienie timeoutów nieudanej regresji. Zwykłe oczekiwania kontrolek pozostają domyślne. Dane syntetyczne; nie odczytywano danych użytkownika.

## Wykryta poprawka produkcyjna
Statystyczne canvas chartWeeks/chartBody zachowywały poprzednią szerokość przy zwężeniu ekranu; wykazano elementy wychodzące do391px poza320px. Rozszerzono istniejące max-width:100% z wykresów progresu także na #view-stats canvas. Bez ukrywania overflow całej strony, bez zmiany wzorów/danych/nawigacji/kolorów. Cache powłoki v48, oczekiwania jednostkowe wersji zaktualizowane. Końcowe testy sprawdzają LIGHT/DARK320/375/390/430 w podglądzie, timerze, historii, statystykach i progresie.

## Historyczna przynależność — granica istniejącego kontraktu
Session.planId oznacza dzień/plan. Rekord nie zawiera utrwalonego programu i przypisania z chwili rozpoczęcia treningu. Dotyczy to także nowych sesji: test wie, co przypisano, ale sama przechowana sesja nie jest dowodem historycznego programu. Nie można niezawodnie odróżnić A (ówczesny program) od B (ówczesny plan samodzielny) wyłącznie na podstawie dzisiejszych dayPlanIds. C (stare bezID) pozostaje bez powiązania, D (przeniesiony dzień) otrzymuje tylko bieżącą etykietę.

Test przenosi dzień przez produkcyjny edytor z programu wcześniejszego do obecnego. Historia pozostaje identyczna; etykieta Obecny program zmienia się zgodnie z dzisiejszym stanem, a objaśnienie mówi Nie oznacza historycznego przypisania. Samodzielny plan i rekord bezID nie są łączone po identycznej nazwie. Nie wprowadzono migracji.

Propozycja osobnego, niezaimplementowanego rozszerzenia: opcjonalna niezmienna migawka kontekstu w aktywnej sesji od startu, przenoszona do historii przy zakończeniu (programId/dayId oraz jawny tryb program/standalone; opcjonalna ówczesna nazwa jako opis). Wymaga odrębnego zatwierdzenia kontraktu, walidacji aktywnej sesji/historii/ZIPv5, zgodności starszych klientów i testów przenoszenia/usuwania. Brak metadanych starych sesji pozostaje unknown, bez automatycznego dopisywania przynależności.

## Pliki zmienione w 7C
- src/ui/signal.css — ograniczenie szerokości wykresów statystyk.
- sw.js — cache v48.
- tests/unit/branding.test.js, tests/unit/service-worker.test.js — oczekiwana wersja cache.
- tests/e2e/bolt-stage4.spec.js, tests/e2e/profiles.spec.js — tylko poprawki przygotowania dwóch wykazanych ścieżek regresji.
- tests/e2e/bolt-stage7c.spec.js — nowe pełne przepływy i kontekst historii.
- docs/tasks/GV-BOLT-STAGE7C.md, PROJECT_MEMORY.md — plan, wyniki i handoff.
Artefakty syntetyczne: outputs/GV-BOLT-STAGE7C*.log i outputs/GV-BOLT-STAGE7C/. Pozostałe zmiany Git pochodzą z wcześniejszych etapów i zostały zachowane.

## Końcowe wyniki
- Jednostkowe:192/192 PASS,24pliki — outputs/GV-BOLT-STAGE7C-final-unit.log.
- Edge po poprawce canvas:10/10 PASS (8testów7B+2testy7C),52s — GV-BOLT-STAGE7C-final-edge.log.
- WebKit pierwszy zestaw końcowy:8/9 PASS — GV-BOLT-STAGE7C-final-webkit.log. Nowy pełny przepływ wykazał wychodzące poza ekran komórki kalendarza przy zmianie szerokości. Kolumny repeat(7,1fr) wraz z kwadratowymi komórkami zachowywały nadmierny rozmiar minimalny. Punktowo dodano repeat(7,minmax(0,1fr)) i min-width:0 dla komórek tylko w statystykach.
- Pełny przepływ WebKit po tej poprawce:1/1 PASS,1,1min — GV-BOLT-STAGE7C-calendar-webkit.log. Zawiera oba profile,3/6dni,4zapisane sesje,2decyzje i realny ZIPrestore.
- Edge na końcowym CSS:3/3 PASS,41s (pełny7C,przeniesienie dnia,układ historii/statystyk/progresu7B) — GV-BOLT-STAGE7C-layout-final-edge.log.
- Końcowe dwa testy7C WebKit razem:2/2 PASS,1,2min — GV-BOLT-STAGE7C-confirmed-webkit.log. Powtórzenie wykonuje także zrzuty z animations:disabled, ponieważ poprzednie złapały początek animacji przezroczystości. Nie jest to zmiana wyglądu aplikacji.
- git diff --check PASS; komunikaty o LF/CRLF dotyczą zastanych plików Windows. Nie wykonywano nowych pełnych audytów poza jednym żądanym zestawem7B na silnik; kolejne przebiegi były celowane w poprawki i nowy scenariusz.

Dowody faktycznych zapisów: outputs/GV-BOLT-STAGE7C/chromium-evidence.json oraz webkit-evidence.json. Zawierają wyłącznie syntetyczne profile/programy/dni/serie/RIR/decyzje i potwierdzenie zgodnego ZIPrestore. Zapisane warianty zamienników mają jawny default; generator może pozostawić brak opcjonalnego variantId przy ćwiczeniu bazowym. Brak ten zachowano w historii i kopii, nie dopisując identyfikatorów w ramach7C; testy7B nadal rozróżniają brak,default i inne jawne warianty. Nie ma nowego modelu ani migracji.

## Decyzja i handoff
Etap7 można lokalnie zamknąć w sprawdzonym zakresie istniejącego kontraktu. Pełny przepływ generator→program→trening→historia→statystyki/progresja oraz ZIPrestore przeszedł w Edge i desktopowym WebKit. Brak otwartego wykazanego błędu blokującego ten przepływ. Poprawiono dwa problemy układu statystyk i przygotowanie dwóch starszych testów. Nowe testy wraz z końcowym CSS mają PASS; osobne przebiegi nie są sumowane jako jeden pełny audyt. Końcowe zrzuty WebKit LIGHT/DARK po zatrzymaniu animacji są czytelne, kalendarz mieści się w kontenerze.

Nie deklarować historycznej identyfikacji programów, gdy rekord jej nie zawiera; propozycja rozszerzenia powyżej nie jest wdrożeniem ani nową zgodą. Nie zmieniono algorytmu generatora, wzorów statystyk, reguł progresji, modelu danych, historii ani mechanizmu synchronizacji. RIR zachowuje dotychczasowy kontrakt wyboru dla ćwiczenia/ostatniej serii.

Nadal niezweryfikowane: fizyczny iPhone/Safari, zakończenie PWA przez iOS, offline WebKit i autentyczny historyczny eksport. JSONv4 sprawdzono na syntetycznych danych w regresji profili. Starsze karty aplikacji mogą omijać Web Locks; localStorage nie jest atomową transakcją wielu kluczy wobec obcych zapisów. Ochrona szkicu dotyczy ostatniego potwierdzonego zapisu, nie gwarantuje ostatniego znaku przed kill ani odporności na ewikcję danych witryny. Premium UI Polish pozostaje wymagany przed publikacją. Bez8, Premium UI Polish, backupu katalogu, subagentów, nowego czatu/worktree, commit/merge/push/deploy/publikacji. Zastane niezacommitowane dane zachowane.
