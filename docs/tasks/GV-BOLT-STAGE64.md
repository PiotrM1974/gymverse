# Etap 6.4 — wielodniowy edytor programów

## Aktualny status — 25.11.2026 — 6.4D gotowy do lokalnej akceptacji

Właściciel zatwierdził 6.4A oraz następnie 6.4B załącznikiem e8a49d92-a192-40e0-9883-5f8620a1c91f. 6.4B zaakceptowany przez właściciela. Końcowa kontrola 6.4C: Edge 73/73, desktop WebKit 71/71 i unit 173/173 PASS; rekomendowane lokalne zamknięcie 6.4. Następnie za zgodą właściciela wdrożono 6.4D: trwałe szkice, wznowienie/odrzucenie i ZIP v5; końcowe wyniki oraz ograniczenia na końcu dokumentu. Wcześniejsze wpisy poniżej stanowią historię prac. Końcowe wyniki na końcu dokumentu. Etap 7 nie rozpoczęty.

Właściciel wcześniej zatwierdził 6.3C, a w bieżącym zleceniu wyłącznie wspólną synchronizację 6.4A. Edytor 1–6 dni nie jest objęty tą zgodą. Późniejsza zgoda będzie wymagana przed budową edytora. Nie rozpoczynać etapu 7, nie publikować ani nie wykonywać commitów.

Stan: implementacja synchronizacji 6.4A lokalnie do weryfikacji. Istniejący edytor zapisywał pojedyncze zmiany przez `savePlanChanges`, bez blokady Web Locks używanej przy przypisywaniu. Zmiana do wspólnego blokowania i kontroli świeżości została dodana poniżej. Nie przedstawiać etapu jako ukończonego przed wymaganymi testami dwóch kart i regresją.

Na początku etapu test diagnostyczny `tests/e2e/bolt-stage64-synchronization-diagnostic.spec.js` na syntetycznym profilu wykazywał, że edycja dnia mogła zapisać się podczas trzymania blokady przypisania w drugiej karcie (Edge 1/1, desktopowy WebKit 1/1). Nie wykazał utraty danych. Diagnostyka została następnie uzupełniona o oczekiwanie na nową wspólną blokadę oraz porównanie danych przed i po zwolnieniu. Jej nowy wynik nie jest jeszcze dostępny. Jednostkowe 167/167. Nie dodano produkcyjnego edytora; testów edytora 6.4 ani zrzutów nie wykonano.

## Etap 6.4A — lokalna implementacja do weryfikacji (25.11.2026)

Właściciel autoryzował wyłącznie wspólną synchronizację 6.4A. Zmieniono `index.html` i `sw.js`, dodano `src/features/plans/synchronization.js` i objęto mechanizmem `commitProgramProfile` w `programs.js`: edytor planów, generator zapisujący przez `savePlanChanges`, przypisanie programu, zapisy profili i importy zmieniające plany lub rejestr profili korzystają z wyłącznej blokady `gymnastika-plan-program-data`. Moduł blokady dodano do powłoki offline i testu jej instalacji. Edytor odświeża magazyn po uzyskaniu blokady i porównuje plany z migawką, na której oparto zmianę; nieaktualną zmianę odrzuca bez zapisu. Sprawdza również aktywny profil, powiązania dni przy usuwaniu i katalog ćwiczeń własnych. Przypisanie zachowuje kontrolę migawki i odczyt zwrotny 6.3C. Import ZIP porównuje źródłową migawkę przed odtworzeniem pod tą samą blokadą; awaria scalania wycofuje zmiany w jej obrębie. JSON v4 oraz import zastępujący plany sprawdzają wersję planów/rejestru pod blokadą. Uzupełniono test diagnostyczny, aby weryfikował rzeczywiście zapisany stan przed i po zwolnieniu blokady, nazwę blokady w `bolt-stage63c-lock.spec.js` i testy modułu programów.

Weryfikacja: `npm test` PASS, 167/167; `git diff --check` i `node --check` dla modułów synchronizacji PASS. Uruchomienia Playwright dla Edge i desktopowego WebKit nie uzyskały wyniku testów; procesy zatrzymywały się po uruchomieniu serwera przed raportem testowym i zostały przerwane po 30 sekundach. Nie potwierdzono E2E dla tej zmiany, w tym scenariuszy równoczesnych edycji, IndexedDB, importu i rollbacku. Nie wykonywano regresji pełnego edytora ani zrzutów UI. Z tego powodu etap 6.4A pozostaje **do weryfikacji**, a synchronizacja nie jest jeszcze zatwierdzona jako wystarczająca do rozpoczęcia edytora wielodniowego.

Ograniczenia: Web Locks serializuje wyłącznie aktualne karty korzystające z tej samej nazwy blokady. Starsze wersje aplikacji ani procesy nieuczestniczące w tym mechanizmie nie są chronione. IndexedDB zapewnia atomowość transakcji magazynu i kontrolę revision; localStorage korzysta z blokady kart i istniejącego readback/rollback, ale nie oferuje transakcji wielokluczowej wobec starszych lub obcych zapisujących. Nie zmieniano formatu kopii, historii, sesji, draftów, RIR, generatora ani UI. Brak nowego interfejsu wielodniowego.

## Wyniki diagnostyki E2E i końcowej weryfikacji — 25.11.2026

Przyczyna wcześniejszego braku wyników: Playwright startował poprawnie lokalny serwer na 127.0.0.1:41900 (konfiguracja testowa: port 41900, webServer timeout 10 s), ale ograniczenia środowiska blokowały połączenie z loopbackiem. Nie było listenera ani pozostawionego procesu na tym porcie przed diagnozą. Po uruchomieniu E2E z dozwolonym dostępem do loopbacku minimalny smoke aplikacji przeszedł 1/1 (420 ms), pojedyncza edycja planu 1/1 (1,2 s), a podstawowy test dwóch kart synchronizacji przeszedł. To nie był dowód błędu aplikacji ani konflikt portu. Nie wydłużano timeoutów.

Zakres Edge: świeży zestaw 65 testów, jeden worker, bez retry, zakończył się 64/65 PASS w 2,6 min. Wszystkie 14 testów 6.4A w pliku diagnostycznym zaliczyły się, w tym: wspólny zapis między kartami, konflikty nieaktualnych migawek dla tego samego i różnych dni, brak zapisu do danych przy konflikcie, przypisanie oczekujące na blokadę, usunięcie grupy przy otwartym podglądzie, zmiana profilu, IndexedDB w dwóch kartach, awaria zapisu i retry, podwójna awaria/ostrzeżenie integralności, brak Web Locks, zwolnienie blokady przy zamknięciu karty oraz import ZIP v5 czekający na blokadę. Dodatkowe testy bolt-stage63c-lock, bolt-stage63c, profiles i smart-backup: 50/51 zaliczone. Pozostały test migracji profilu zgłosił SOURCE_CHANGED_DURING_MIGRATION; test czekał dotąd tylko na wczesne udostępnienie harnessu, a nie na zakończenie bootstrapu. Dodano oczekiwanie na widoczność przycisku migracji, co synchronizuje test z gotowością aplikacji. Powtórne uruchomienie tego jednego testu po zmianie nie dostarczyło wyniku i zostało ręcznie przerwane po braku wyjścia procesu; nie uznawać poprawki testowej ani migracji za zweryfikowane. W pierwotnym zestawie aplikacja bezpiecznie odmówiła migracji nieaktualnej migawki; nie ma dowodu na utratę danych.

Wykryto i poprawiono rzeczywistą ścieżkę błędu w zapisie planu: przy awarii zapisu oraz rollbacku aplikacja mogła pokazać zwykły komunikat o niepowodzeniu, choć odczyt nie potwierdzał stanu poprzedniego. Teraz po niepewnym stanie danych wyświetla ostrzeżenie integralności i blokuje dalsze zapisy. Celowany E2E dla awarii zapisu, rollbacku, retry i nieudanego rollbacku przeszedł 2/2. Nie dodano konkurencyjnego mechanizmu blokad.

Unit: świeże npm test PASS 167/167. node --check dla programs.js i synchronization.js, git diff --check oraz lista 65 testów PASS. Generator/profil i ZIP: pełny przebieg zawierał PASS generatorów, zmian profilu, kopii, pełnego ZIP, retry importu i zachowania sesji/RIR/draftów; wyjątkiem pozostaje wspomniana migracja.

WebKit: uruchomienie nie wystartowało, bo brakuje binarium %LOCALAPPDATA%\ms-playwright\webkit-2215\Playwright.exe. Playwright zwrócił błąd braku wykonywalnego WebKit; nie jest to wynik testów aplikacji. Nie instalowano przeglądarki. Fizyczny iPhone/Safari nie był testowany.

Synchronizacja została dowiedziona przez rekordy magazynu współdzielone przez dwie karty, również IndexedDB: druga operacja czekała na tę samą blokadę, a po zwolnieniu następował zapis; zapis oparty na starej migawce był odrzucany, a wcześniej zatwierdzone rekordy pozostawały. Osobno potwierdzono testami brak uszkodzenia rekordów planów w konfliktach, skuteczny rollback po awarii zapisu i blokadę przy niepewnym rollbacku. Historia, aktywna sesja, RIR i drafty były zachowane w celowanych scenariuszach przypisania/ZIP. To dowód w syntetycznych danych E2E, nie test rzeczywistych danych właściciela.

Decyzja: 6.4A NIE jest jeszcze gotowy do lokalnego zamknięcia: jeden test migracji po zmianie synchronizacji testu nie ma wyniku, a WebKit jest niedostępny. Zaimplementowana synchronizacja przeszła własny zestaw E2E i Edge’ową kontrolę zapisanych rekordów; pozostałe ograniczenia wymagają odnotowania i uzupełnienia przed decyzją o zamknięciu. Bez 6.4B, edytora wielodniowego, publikacji, commit, merge, push ani deploy. Premium UI Polish pozostaje wymagany przed publikacją; autentyczny historyczny eksport oraz fizyczny iPhone/Safari są nadal niezweryfikowane.

## Finalna weryfikacja 6.4A — 25.11.2026 — GOTOWY DO LOKALNEGO ZAMKNIĘCIA

Ten wpis zastępuje wcześniejszy status niepotwierdzonej migracji i niedostępnego WebKit. Kod produkcyjny nie wymagał dalszych zmian. Przycisk migrateDataButton staje się dostępny po loadState i STORE.flush; test czeka na ten rzeczywisty sygnał, bez opóźnienia czasowego. SOURCE_CHANGED_DURING_MIGRATION prawidłowo odrzuca źródło zmienione po preview. Migracja uruchomiona po inicjalizacji przeszła w Edge i WebKit, z kontrolą zachowania historii, planu i izolacji dwóch profili.

WebKit 2215 istnieje w C:/Users/lordd/Documents/ChatGPT/GYMVERSE/outputs/playwright-stage63a. Ustawienie PLAYWRIGHT_BROWSERS_PATH na ten katalog przywróciło działanie; instalacja nie była potrzebna. Wcześniejszy brak silnika wynikał z domyślnej ścieżki. Ponowienie Edge z uprawnieniem do loopbacku usunęło wcześniejsze zatrzymanie przed raportem.

Świeże wyniki: unit 167/167. Celowana regresja trzech plików (synchronizacja 6.4A, blokady 6.3C, profile; bez offline): Edge 33/33, WebKit 32/33 w pierwszym przebiegu. Jedyny błąd WebKit był wyjątkiem testu podczas przeładowania po utworzeniu profilu: chwilowo brak harnessu. Poprawiono polling przez optional chaining; ponowienie całego scenariusza migracji w obu silnikach 2/2 PASS. Dodatkowo starszy test historii IndexedDB wykrył nieaktualny fixture: pusty rejestr profili i zapis przed bootstrapem. Poprawiono seedEditableState, aby czekał na gotowość i odtwarzał syntetyczny profil legacy. Wszystkie cztery korzystające z niego scenariusze awarii IndexedDB: Edge 4/4, WebKit 4/4 PASS. Bez pomijania testów i bez wydłużania timeoutów. Łącznie potwierdzono 37 unikalnych scenariuszy na każdy silnik w opisanych przebiegach; nie jest to jeden przebieg 74/74. Przerwany szerszy przebieg gv-data nie stanowi pełnej regresji tego pliku.

Potwierdzono współdzielony magazyn dwóch kart w localStorage i IndexedDB, odrzucenie starej migawki bez nadpisania pierwszego zapisu, zwalnianie Web Locks także po zamknięciu karty, retry po awarii, integrityUncertain i blokadę dalszych zapisów, zachowanie historii/sesji/RIR/draftów, generator i edytor dnia oraz ZIP merge pod wspólną blokadą. Dane syntetyczne, porównywane zapisane rekordy. Logi: outputs/GV-BOLT-STAGE64-final-targeted.log, outputs/GV-BOLT-STAGE64-final-recheck.log, outputs/GV-BOLT-STAGE64-final-fixtures.log; wcześniejsza próba diagnostyczna outputs/GV-BOLT-STAGE64-final-verification.log zachowana.

Decyzja A: etap 6.4A jest gotowy do lokalnego zamknięcia; technicznie można przejść do 6.4B po zgodzie właściciela. Implementacji 6.4B nie rozpoczęto. Zmiany tej kontroli: tests/e2e/profiles.spec.js, tests/e2e/gv-data.spec.js, dokument etapu i PROJECT_MEMORY.md oraz logi. Bez zmian produkcji/UI, backupu, commit, merge, push i deploy.

Ograniczenia pozostają: starsze karty niekorzystające ze wspólnej blokady nie są chronione; localStorage nie zapewnia atomowych transakcji wielokluczowych względem obcych zapisów. Desktopowy WebKit nie potwierdza Safari na fizycznym iPhonie. Offline WebKit nie był zakresem tej końcowej kontroli; autentyczny historyczny eksport i Premium UI Polish pozostają otwarte przed publikacją.

## START 6.4B — zgoda właściciela 25.11.2026

Właściciel zatwierdził lokalne zamknięcie 6.4A i implementację wyłącznie produkcyjnego edytora programów 1–6 dni. Specyfikacja: załącznik e8a49d92-a192-40e0-9883-5f8620a1c91f/Wklejony tekst.txt. Praca w istniejącym worktree, feature/gymnastika-approved-ui. Bez subagentów, backupu, commit/merge/push/deploy i etapu 7.

Projekt wykonawczy: ekran programu z przeglądem tygodnia, wyborem dnia po stabilnym ID i pełną listą ćwiczeń; szkic obejmuje nazwę, uporządkowane dayPlanIds oraz rekordy dni. Istniejący edytor pojedynczego dnia ma pracować na szkicu bez utrwalania przed zatwierdzeniem całego programu. Zapis pod wspólną blokadą 6.4A porównuje źródłowe plany/rejestr/katalog, sprawdza profil i aktywną sesję, waliduje referencje, zapisuje komplet rekordów i metadanych, kontroluje readback/rollback oraz integrityUncertain. Konflikt pozostawia szkic. Odłączenie zachowuje zapisany rekord dnia. Przypisanie pozostaje osobną istniejącą akcją.

Plan implementacji i kontroli:
1. Moduł szkicu/commit przy istniejących programs.js i synchronization.js; jednostkowe testy 1/3/6 dni, referencji, profili, starych migawek i awarii.
2. Integracja index.html z istniejącym edytorem dnia, lokalny stan szkicu, nawigacja/przegląd, dodawanie/dołączanie/kolejność/odłączanie, reużycie walidacji i katalogu.
3. Ograniczone style Signal LIGHT/DARK w signal.css; aktualizacja powłoki offline. Wzór: PlanDayTabs, PlanDayDetails, PlanDayPreview, EditorScreen z project-bolt-sb1-uhhvesnu.zip, bez React i danych demo.
4. E2E na syntetycznych danych: wymagane scenariusze zlecenia, obie bazy, dwie karty, awarie, kopie, profile, zapisane rekordy. Edge i WebKit z istniejącego katalogu playwright-stage63a; lokalny loopback wymaga odpowiedniego uruchomienia.
5. Zrzuty i kontrola 320/375/390/430 LIGHT/DARK, podgląd 3/6 dni i edycja dnia. Świeża odpowiednia regresja i raport lokalnego zamknięcia, aktualizacja pamięci.

Stan: rozpoczęto analizę i plan; produkcyjny edytor 6.4B nie jest jeszcze zaimplementowany ani zweryfikowany.

## Końcowy raport 6.4B — 25.11.2026

Edytor obsługuje program 1–6 dni, nazwy, przegląd, przełączanie, dodawanie, dołączanie istniejącego dnia, kolejność i odłączanie. Odłączenie nie kasuje zapisanego dnia; stabilne ID pozostają. Istniejący edytor dnia zmienia szkic, używając rzeczywistego katalogu, wariantów, kolejności, serii, powtórzeń i odpoczynku. Zapis całego programu nie przypisuje go automatycznie ani nie uruchamia treningu. Przypisanie jest osobną operacją. Bez nowego schematu, migracji przy otwarciu, React ani zmiany algorytmu generatora.

Zapis korzysta z istniejącej blokady gymnastika-plan-program-data, odświeża migawkę po jej uzyskaniu, sprawdza plany/rejestr/aktywny profil i sesję oraz ewentualny katalog własny. Nieaktualne dane są odrzucane z komunikatem bez nadpisania. Store.transact i odczyt zwrotny potwierdzają zapis. Bezpieczna awaria zachowuje szkic do ponowienia; niepewna integralność wywołuje ostrzeżenie i blokuje kolejne zapisy. Test dwóch kart sprawdza kolejkę navigator.locks i niezmieniony magazyn przed zwolnieniem blokady; konflikt porównuje rzeczywiste zapisane rekordy.

### Wyniki

- Świeże unit 173/173 PASS, 21 plików: outputs/GV-BOLT-STAGE64B-unit-final.log.
- Końcowy pełny zestaw edytora: Edge 20/20, desktop WebKit 20/20, razem 40/40 PASS w 3,9 min: outputs/GV-BOLT-STAGE64B-editor-confirmed.log. Bez retry i skip.
- Edge offline 1/1 PASS: profile, generator, helper i otwarcie nowego edytora z cache: outputs/GV-BOLT-STAGE64B-offline.log.
- Szerszy przebieg obu silników 129/134 PASS: outputs/GV-BOLT-STAGE64B-final.log. Pięć niepowodzeń: fixture rollbacku (2), przedwczesny reload generatora (1), oczekiwanie na pełne load zamiast gotowości (1), natychmiastowa asercja profilu po imporcie (1). Poprawiono fixture rzeczywiście nieudanego rollbacku oraz oczekiwanie na rzeczywisty stan, bez arbitralnych opóźnień i zmiany oczekiwań. Celowane ponowienie 11/12 PASS, następnie generator 2/2 PASS: outputs/GV-BOLT-STAGE64B-recheck.log i outputs/GV-BOLT-STAGE64B-generator-confirmed.log. Wszystkie 98 starszych par test/silnik w czterech plikach regresji mają PASS w tych przebiegach; nie przedstawiać jako jednego pełnego 98/98.
- Generator: tytuł widoczny jeszcze w podglądzie nie potwierdzał asynchronicznego zapisu. Test czeka teraz na zamknięcie podglądu i rzeczywiste rekordy przed reloadem; produkcyjny algorytm bez zmian.
- Nowy zestaw obejmuje 22 kategorie zlecenia: 1/3/6 dni, ponowne otwarcie, podgląd/edycję/kolejność/dołączanie/odłączanie/nazwy, osobne przypisanie, brak startu treningu, dwa profile, historię/sesję/RIR/drafty, dwie karty, konflikty, write/rollback/retry/integrityUncertain, pełny ZIP v5 i inteligentny import, starsze samodzielne dni, reload, motywy i szerokości. Sprawdzano zapisane rekordy syntetyczne w IndexedDB i localStorage, bez użycia danych właściciela.
- node --check nowych modułów i git diff --check PASS; ostrzeżenia LF/CRLF istniejącego checkoutu.

WebKit 2215 wykorzystany z istniejącego outputs/playwright-stage63a, bez instalacji. Lokalny loopback wymaga dozwolonego dostępu środowiska. Nie zwiększano timeoutów. Trace wyłączono wobec problemów zapisu śladu przy niepowodzeniach; zachowano logi i zrzuty.

### Zrzuty i pliki

Zrzuty: outputs/GV-BOLT-STAGE64B/three-days-light.png, three-days-dark.png oraz {chromium|webkit}-{light|dark}-{320|375|390|430}-{six-days|edit-day}.png. Sprawdzono brak poziomego przepełnienia w obu silnikach oraz czytelność reprezentatywnych zrzutów. Scoped style Signal, duże pola dotykowe. Premium UI Polish pozostaje osobnym etapem.

Zmienione pliki 6.4B; pozostałe zastane zmiany zachowane:

- index.html
- src/features/plans/program-editor.js (nowy)
- src/features/plans/program-editor-ui.js (nowy)
- src/ui/signal.css
- sw.js (cache v43 i nowe moduły)
- tests/unit/program-editor.test.js (nowy)
- tests/unit/branding.test.js
- tests/unit/service-worker.test.js
- tests/unit/inline-functions.test.js
- tests/e2e/bolt-stage64b.spec.js (nowy)
- tests/e2e/bolt-stage63c.spec.js
- tests/e2e/bolt-stage63c-lock.spec.js
- tests/e2e/profiles.spec.js
- tests/e2e/smart-backup.spec.js
- docs/tasks/GV-BOLT-STAGE64.md
- PROJECT_MEMORY.md
- Logi i zrzuty outputs/GV-BOLT-STAGE64B*.

### Decyzja i ograniczenia

6.4B gotowy do lokalnego zamknięcia po akceptacji właściciela. Szkic istnieje w pamięci strony: bezpieczna odmowa zapisu zachowuje go, lecz reload nie odzyskuje niezapisanego szkicu. Zapisany program przetrwa reload. Aktywna sesja konserwatywnie blokuje zapis programu. Starsze karty poza wspólną blokadą pozostają poza jej ochroną; localStorage nie daje atomowej transakcji wielokluczowej wobec starych/obcych klientów, pozostają blokada, readback/rollback i blokowanie przy niepewności. Fizyczny iPhone/Safari, WebKit offline i autentyczny historyczny eksport niezweryfikowane. Premium UI Polish nadal obowiązkowy przed publikacją. Bez backupu, subagentów, commit, merge, push, deploy i publikacji. Etap 7 nie rozpoczęty.
## START 6.4C — 25.11.2026

Właściciel zaakceptował funkcjonalne 6.4B i autoryzował końcową kontrolę oraz prostą ochronę niezapisanego formularza bez zmiany modelu. Zakres: jeden pełny przebieg Edge pięciu plików poprzedniej regresji (również offline i wszystkie wcześniejsze niepowodzenia), końcowy WebKit, zrzuty i ocena ryzyka szkiców. Bez etapu 7.

Rekomendacja przed wdrożeniem: teraz ostrzeżenie beforeunload i potwierdzenie odrzucenia przy opuszczeniu edytora; trwałe wznowienie po ponownym uruchomieniu PWA jako osobno zatwierdzany kontrakt. Istniejący gymverse_draft_v1 w src/gv-base-b.js jest ściśle walidowanym szkicem wpisu serii (planId/sessionId/step/setNumber/weight/reps), nie szkicem programu. Nie rozszerzono go ani nie dodano nowego klucza czy bazy.

Proponowany przyszły zakres trwałego szkicu: rekord w istniejącym store, powiązany z profileId i programId (osobny identyfikator dla nowego programu), źródłowa migawka/revision, wersja szkicu i właściciel operacji. Jawne Wznów/Odrzuć, zapis i usuwanie pod wspólną blokadą z porównaniem wersji; żadnego automatycznego przenoszenia szkicu między profilami ani nadpisywania nowszej wersji przez drugą kartę. Przy wznowieniu nie wolno aktualizować bazowej migawki do bieżącej bez rozstrzygnięcia konfliktu. Wymaga także określenia retencji, zakresu ZIP i zachowania importu; to istotne rozszerzenie kontraktu danych wymagające osobnej zgody. Nie zaimplementowano go w 6.4C.

Dodana mała ochrona: porównanie szkicu z początkowym stanem, beforeunload tylko przy zmianach/nowym programie/zapisie, potwierdzenie opuszczenia całego edytora, zachowanie formularza po odmowie i odrzucenie po zgodzie, blokada wyjścia podczas zapisu. Przejście między dniem i programem nie odrzuca szkicu. Cache v44 aktualizuje powłokę. Przeglądarka decyduje, czy wyświetlić natywny dialog; systemowe ubicie procesu lub zamknięcie mobilnej PWA może go ominąć. Nie jest to trwałe odzyskiwanie szkicu.

Test ochrony przed zmianą produkcyjną wykazał brak obsługi beforeunload (RED). Po poprawce 2/2 Edge/WebKit PASS dla anulowania zdarzenia beforeunload oraz potwierdzenia wyjścia i zachowania magazynu. Końcowa regresja trwa; wynik poniżej po zakończeniu.

## WYNIK KOŃCOWY 6.4C — 25.11.2026

Rekomendacja: lokalnie zamknąć etap 6.4 w zatwierdzonym zakresie funkcjonalnym i prostej ochrony formularza. Trwałe odzyskiwanie niezapisanego programu po restarcie PWA pozostaje osobnym, niewdrożonym rozszerzeniem wymagającym zgody. Nie traktować ostrzeżenia jako autosave.

Świeże wyniki na końcowym kodzie:

- Edge: jeden pełny kontrolowany przebieg 73/73 PASS (4,0 min), bez retry i wykluczeń. Pliki bolt-stage64b, bolt-stage63c, bolt-stage63c-lock, profiles, smart-backup; wszystkie wcześniejsze niepowodzenia uwzględnione, również offline. Log outputs/GV-BOLT-STAGE64C-edge-full.log.
- Desktop WebKit: 71/71 PASS (5,7 min), te same pięć plików z wyłączeniem dwóch testów offline (jak w poprzednim zakresie WebKit), bez retry. Wszystkie wcześniejsze niepowodzenia uwzględnione. Log outputs/GV-BOLT-STAGE64C-webkit.log. Nie jest to potwierdzenie fizycznego Safari/iPhone.
- Jednostkowe: 173/173 PASS, 21 plików; outputs/GV-BOLT-STAGE64C-unit.log. node --check nowego modułu oraz git diff --check PASS.
- Ochrona szkicu: dwie nowe próby na każdy silnik w powyższych zestawach: odmowa opuszczenia zachowuje szkic, świadome odrzucenie nie zmienia magazynu; istniejący niezmieniony program nie ostrzega, edycja dnia ostrzega, udany zapis wyłącza ostrzeżenie. Sprawdzono anulowalny beforeunload i rzeczywiste dialogi potwierdzenia nawigacji.
- Dodatkowa pojedyncza próba natywnego beforeunload w Edge PASS: anulowanie rzeczywistego reloadu zachowało wpisaną nazwę. Log outputs/GV-BOLT-STAGE64C-native-reload-confirmed.log. Wstępna próba z odrębnym uproszczonym fixture nie dotarła do formularza; powtórzenie z kanonicznym syntetycznym fixture zakończone sukcesem. Nie był to nieudany test natywnego dialogu ani wykazany błąd aplikacji.

Potwierdzono aktualnym przebiegiem: 1/3/6 dni, zawartość wszystkich dni, parametry i kolejność ćwiczeń, zachowanie innych rekordów, zapis i ponowne otwarcie, kolejność/dołączanie/odłączanie, osobne przypisanie, profile i trainingGoal, historia/sesja/RIR/drafty, rzeczywisty współdzielony magazyn i blokada dwóch kart, odrzucanie starej migawki, błędy/rollback/retry/integrityUncertain, ZIP v5, inteligentny import i zgodność starszych danych, brak poziomego przepełnienia 320/375/390/430 LIGHT/DARK. Nie zmieniano algorytmu generatora.

Świeże rzeczywiste zrzuty outputs/GV-BOLT-STAGE64C: three-days-light.png, three-days-dark.png; {chromium|webkit}-{light|dark}-{320|375|390|430}-six-days.png i -edit-day.png. Edycja dotyczy teraz drugiego dnia. Obejrzano reprezentatywne LIGHT/DARK, pełny przegląd 3/6 dni oraz edycję dnia przy 320 px; zachowana paleta Signal. Bez Premium UI Polish.

Zmiany tego etapu: index.html (ochrona switchView), src/features/plans/program-editor-ui.js (wykrywanie zmian, beforeunload, potwierdzenie wyjścia), sw.js (v44), tests/unit/branding.test.js i service-worker.test.js (cache), tests/e2e/bolt-stage64b.spec.js (ochrona, świeże zrzuty drugiego dnia), PROJECT_MEMORY.md, ten dokument oraz logi/zrzuty. Nie dodano trwałego schematu szkiców ani konkurencyjnego magazynu. Zastane zmiany zachowano.

Ograniczenia: systemowe ubicie mobilnej PWA może ominąć beforeunload i utracić niezapisany szkic. Trwałe wznowienie/odrzucenie po restarcie, retencja i konflikty zapisów roboczych nie zostały wdrożone. Starsze karty poza wspólną blokadą oraz brak wielokluczowej atomowości localStorage pozostają. Fizyczny iPhone/Safari, WebKit offline i autentyczny historyczny eksport niezweryfikowane; Premium UI Polish nadal wymagany przed publikacją.

Proponowany zakres etapu 7 po osobnej zgodzie: integracja rzeczywistego generatora z programami wielodniowymi, podgląd dni, jawny zapis całego programu i osobne przypisanie, regresja profili/synchronizacji/kopii. Nie rozpoczęto implementacji 7. Bez nowego czatu/worktree/subagentów/backupów/commit/merge/push/deploy/publikacji.

## START 6.4D — trwałe szkice, zgoda właściciela 25.11.2026

Zakres: opcjonalny gymverse_program_drafts_v1 w istniejącym store (bez nowej bazy/backendu/modelu planów), rekordy id/profileId/programId/revision oraz pełny szkic/wybrany dzień/katalog własny/bazowa migawka. CAS i zapis/usuwanie pod istniejącą blokadą, usunięcie właściwego szkicu razem z zatwierdzeniem programu. Zapis podczas edycji, stan zapisu i błąd widoczne, Wznów/Odrzuć przy wejściu. Full ZIP v5 obejmuje opcjonalny klucz; walidacja struktury, restoreDrafts i merge zachowują bezpieczeństwo. Per-profile export nie może ujawniać cudzych szkiców. Stary szkic nie aktualizuje swojej bazowej migawki automatycznie. Selektor w przeglądzie ma jednoznacznie pokazać wybrany dzień. Testy modułu, E2E obu silników, wznowienie po zamknięciu strony bez beforeunload, dane syntetyczne. Bez etapu 7, subagentów, backupu, commit/merge/push/deploy.

## 6.4D — kontrakt wdrożenia

Szkice są opcjonalnym kluczem gymverse_program_drafts_v1 (version:1, items) w istniejącym runtime store, obsługiwanym przez localStorage/IndexedDB. Nie utworzono drugiej bazy ani alternatywnych zapisanych planów. Rekord ma UUID id, losowy token revision, draft.profileId/programId, pełną roboczą treść dni, wybrany dzień, katalog własny i jego bazę. Bazowa migawka rejestru jest ograniczona do metadanych właściciela (bez historii i danych pozostałych profili); zapis porównuje metadane aktywnego profilu i źródłowe plany, a nie pomocnicze kopie profile.data zmieniające się przy przełączeniu profilu/kopii.

Autosave jest uruchamiany przy zmianach formularza, operacjach dni i ćwiczeń, również input nazwy i zakresu powtórzeń wewnątrz edytora dnia. Kolejka zapisuje migawki w kolejności zdarzeń; komunikat Szkic zachowany pojawia się po opróżnieniu kolejki i odczycie zwrotnym. Nie opiera się na beforeunload. Przed zatwierdzeniem programu kolejka jest opróżniana. Operacje szkicu i finalny zapis używają tej samej blokady gymnastika-plan-program-data bez zagnieżdżonego uzyskiwania blokady. CAS porównuje token konkretnego szkicu; starsza karta nie może nadpisać ani usunąć nowszej wersji, także po usunięciu rekordu. Zatwierdzenie programu usuwa właściwy szkic w tej samej transakcji store. Niepewny rollback/readback ustawia integrityUncertain; błąd jest widoczny, ponowienie jawne, starsza migawka nie jest automatycznie aktualizowana.

Otwarcie danego programu lub tworzenia nowego pokazuje znalezione pasujące szkice profilu i akcje Wznów edycję/Odrzuć szkic. Dla nowych programów można też utworzyć niezależny kolejny szkic. Opuścić edytor można z zachowaniem szkicu; jawne Odrzuć usuwa tylko konkretny rekord po kontroli wersji. Nie ma automatycznego nadpisania zapisanego programu. Zmiana profilu zachowuje globalną kolekcję, lecz UI wybiera tylko rekordy właściciela; usunięcie profilu usuwa jego rekordy razem z aktualizacją profili. Eksport pojedynczego profilu JSON pozostaje bez szkiców; pełny ZIP obejmuje wszystkie.

ZIP v5: nowy klucz opcjonalny na allowliście, walidacja struktury/rozmiaru/identyfikatorów/dni/katalogu, licznik draftów uwzględnia szkice programów. Pełne przywracanie respektuje restoreDrafts; stare kopie bez klucza nadal są poprawne. Inteligentny import zachowuje lokalny rekord przy konflikcie tego samego ID, sygnalizuje konflikt i dołącza inne rekordy pasujące do obecnych profili. Nie zmieniono numeru formatu. Starszy klient może odrzucić ZIP zawierający nieznany opcjonalny klucz; do odtwarzania takich kopii używać tej lub nowszej wersji.

Selektor dni: pełny przegląd nie zaznacza pojedynczego przycisku; dotknięcie dnia przełącza do jego szczegółów. Nie jest dekoracją. Zachowano Signal i układ, bez Premium UI Polish.

W diagnostyce poprawiono bootstrap/switch/export profilu, aby oddzielić nowy globalny klucz od danych pojedynczego profilu. Naprawiono też odłączanie wybranego dnia: wybór pozostałego dnia następuje przed autosave. Poprawki testowe dotyczyły typu Blob dla API ZIP, oczekiwania na ukończenie usunięcia i selektora widocznego przycisku biblioteki; nie obniżano oczekiwań.

Ograniczenia: trwałość oznacza ostatni potwierdzony zapis, nie gwarancję zapisu znaku w chwili natychmiastowego ubicia procesu. Usunięcie danych witryny, tryb prywatny/ewikcja lub pełny magazyn mogą uniemożliwić odzyskanie; status błędu nie udaje zapisu. Walidacja ogranicza kolekcję do 100 szkiców/5 mln znaków JSON i 1–6 dni. Nie ma automatycznej retencji. Aktualny klient wymaga Web Locks. Starsze karty poza blokadą i ograniczenia wielokluczowej transakcyjności localStorage pozostają; IndexedDB korzysta z istniejącej atomowej transakcji i revision. Fizyczny iPhone/iOS kill i autentyczny historyczny eksport nie były weryfikowane; zamknięcie strony bez beforeunload jest testem zastępczym. Etap 7 nie rozpoczęty.

## WYNIK KOŃCOWY 6.4D — 25.11.2026

Decyzja: 6.4D gotowy do lokalnego zamknięcia i akceptacji właściciela. Dodano automatyczne trwałe szkice bez nowej bazy/backendu, odzyskiwanie i jawne odrzucanie, CAS/snapshot checks pod wspólną blokadą, integrację pełnego ZIP v5 i prawidłowy wybór dnia. Zapisane programy nie są automatycznie zmieniane przez wznowienie.

Wyniki i pochodzenie dowodów:

- Świeże jednostkowe 180/180 PASS, 22 pliki: outputs/GV-BOLT-STAGE64D-unit-final.log.
- Nowy plik bolt-stage64d: wszystkie 12 scenariuszy na każdy silnik potwierdzone w przebiegach końcowych (Edge 12/12, desktop WebKit 12/12, nie pojedynczy przebieg 24/24). Dziesięć scenariuszy w confirmed.log, eksport drugiej karty w export-import-final.log, ekran recovery i odrzucenie w recovery-ui.log. Obejmują 1/3/6 dni, nowy/istniejący program, reload i zamknięcie strony bez beforeunload, wybrany dzień, edycję bez blur, IndexedDB/localStorage, izolację profili, stale program/draft, retry, ZIP, selektor i responsywność odzyskiwania.
- Szerszy zestaw czterech plików (bolt-stage64b/64d, profiles, smart-backup), oba silniki: 100/104 PASS. Jeden błąd nowego autosave po odłączeniu dnia poprawiono (wybrany dzień aktualizowany przed zapisem). Trzy timeouty WebKit były w przygotowaniu strony przy reloadzie. Log outputs/GV-BOLT-STAGE64D-regression.log.
- Celowany przebieg po poprawkach: 35/38 PASS, Edge 19/19, WebKit 16/19. Wszystkie nowe scenariusze szkiców, poprawka odłączania i profile PASS; trzy pozostałe timeouty nadal dotyczyły reloadu w fixture inteligentnego importu, nawet przy oczekiwaniu DOMContentLoaded. Log outputs/GV-BOLT-STAGE64D-confirmed.log. Fixture smart-backup zmieniono na dane inicjalizowane przed pierwszym uruchomieniem strony (addInitScript z markerem), z rzeczywistym sygnałem gotowości. Bez arbitralnych opóźnień i zwiększania limitów.
- Końcowy zestaw pełnego eksportu z drugiej karty oraz wszystkich sześciu układów inteligentnego importu: 14/14 PASS (Edge 7/7, WebKit 7/7), outputs/GV-BOLT-STAGE64D-export-import-final.log. Wszystkie wcześniejsze niepowodzenia mają potwierdzone poprawki; nie deklarować pojedynczego pełnego zielonego audytu 104/104.
- Test rzeczywistego ZIP ze starszej karty najpierw wykazał eksport nieaktualnego cache. exportData odświeża teraz store przed budowaniem kopii. Potwierdzono zawartość pobranego ZIP, nie tylko komunikat. Wcześniejszy RED i niezależny PASS offline Edge 1/1 w outputs/GV-BOLT-STAGE64D-export-offline.log.
- Ekran recovery LIGHT/DARK, 320/375/390/430 i jego Odrzuć: Edge/WebKit 2/2 PASS; outputs/GV-BOLT-STAGE64D-recovery-ui.log. Edytor i przegląd również przeszły wszystkie osiem kombinacji szerokości/motywu na silnik w szerszym przebiegu. Świeże zrzuty w outputs/GV-BOLT-STAGE64D (zrzuty szerszego przebiegu zostały początkowo zapisane pod wcześniejszą ścieżką C i skopiowane do D jako artefakty testowe; nie wykonano backupu projektu). Obejrzano LIGHT 320 przeglądu i DARK 320 odzyskiwania. Bez poziomego przewijania.
- node --check nowych modułów i git diff --check PASS. Bez skip/retry testów; WebKit offline poza zakresem.

Zmienione pliki w 6.4D:

1. index.html — odświeżenie magazynu przed pełnym eksportem.
2. src/features/plans/program-drafts.js — nowy moduł trwałych szkiców i walidacji.
3. src/features/plans/program-editor.js — migawka metadanych właściciela i atomowe zakończenie szkicu.
4. src/features/plans/program-editor-ui.js — autosave, status, recovery, ponowienie/odrzucenie, selektor dni.
5. src/gv-data.js — opcjonalny klucz ZIP, walidacja/licznik/przywracanie.
6. src/features/profiles/profile-model.js — izolacja klucza globalnego i sprzątanie szkiców usuwanego profilu.
7. src/features/backup/import-plan.js — bezpieczne scalanie szkiców bez zastępowania lokalnego konfliktu.
8. sw.js — cache v45 i nowy moduł offline.
9. tests/unit/program-drafts.test.js — nowy.
10. tests/unit/branding.test.js.
11. tests/unit/service-worker.test.js.
12. tests/e2e/bolt-stage64d.spec.js — nowy.
13. tests/e2e/bolt-stage64b.spec.js — oczekiwanie na autosave, recovery i zrzuty.
14. tests/e2e/profiles.spec.js — synchronizacja przygotowania pierwszego scenariusza.
15. tests/e2e/smart-backup.spec.js — inicjalizacja fixture przed startem strony.
16. PROJECT_MEMORY.md.
17. docs/tasks/GV-BOLT-STAGE64.md.
18. Logi i zrzuty outputs/GV-BOLT-STAGE64D*.

Zachowano ograniczenia opisane w kontrakcie wyżej: ostatni potwierdzony zapis zamiast gwarancji ostatniego znaku przy natychmiastowym kill, możliwość utraty po skasowaniu danych witryny/ewikcji, starsze karty poza blokadą i transakcyjność localStorage. Fizyczny iPhone/iOS i autentyczny historyczny eksport nadal niezweryfikowane. Pełny ZIP obejmuje szkice; JSON pojedynczego profilu nie. Premium UI Polish pozostaje osobnym obowiązkowym etapem. Bez etapu 7, nowego czatu/worktree, subagentów, backupu katalogu, commit/merge/push/deploy/publikacji. Zastane zmiany zachowane.

## Przejście do 7A — 25.11.2026
Właściciel przyjął lokalne zamknięcie 6.4D i autoryzował integrację istniejącego generatora. Wymagana pojedyncza regresja końcowego 6.4D: Edge 56/56 PASS (outputs/GV-BOLT-STAGE7A-baseline-edge.log). Dalej obowiązuje docs/tasks/GV-BOLT-STAGE7A.md. Zabezpieczenia szkiców i synchronizacji nie są zastępowane innym mechanizmem. Starsze karty oraz transakcyjność localStorage pozostają ograniczeniami; bez publikacji.

7A zakończony lokalnie do akceptacji: unit188/188, Edge68/68, WebKit31/35 + cztery ponowione scenariusze4/4 (Edge również4/4) po poprawce wyłącznie fixture. Nowe12 testów7A i12 szkiców6.4D przechodzą w obu silnikach. Pełny raport docs/tasks/GV-BOLT-STAGE7A.md. Bez rozpoczęcia7B/7C.
