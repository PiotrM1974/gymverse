# GymVerse — wyniki i plan kontroli iOS/Safari

**Status:** przeprowadzono funkcjonalny test QA na fizycznym iPhonie 20.11.2026; wyniki i ograniczenia zapisano poniżej oraz w [raporcie końcowym](ios-qa-results.md).

**Kod aplikacji QA:** kopia runtime odpowiada snapshotowi źródłowemu `925522ffe4ff504a269d197d77ddba34a3bd3a4a`; pliki runtime są identyczne w późniejszym HEAD PR `dd58673fe91162c48f1ad343e71e18f775836894`. Commit `925522f` dodawał plan QA, a kod aplikacji pochodzi z jego rodzica `f21215c91ee5561e309bb3d11c326c1784519585`.

**Środowisko QA według raportu:** [gymverse-ios-qa.pages.dev](https://gymverse-ios-qa.pages.dev), repozytorium `PiotrM1974/testowy`, commit `9521befa80a026d50d3b24d9b9eac75f911f5523`. To osobny origin względem produkcji.
**Dane:** według raportu użyto wyłącznie danych syntetycznych; nie zmieniano produkcyjnej historii treningowej. Wyniki urządzenia pochodzą z dostarczonego raportu i nie zostały niezależnie odtworzone w ramach tej aktualizacji dokumentacji. Raport nie podaje modelu iPhone’a ani wersji iOS/Safari.

## Cel i kryteria kontroli

Sprawdzić na fizycznym iPhonie Safari oraz osobno zainstalowaną testową aplikację z ekranu początkowego:

- uruchamianie i zasoby PWA, rejestrację Service Workera i działanie offline;
- trwałość syntetycznej historii, ciężarów, planów, aktywnego treningu i draftów;
- zapis pliku ZIP v5 do Plików i możliwość ponownego odczytu;
- import/pełne odtworzenie kopii JSON v4 i ZIP v5;
- ręczną migrację **wyłącznie syntetycznego snapshotu** do IndexedDB oraz ponowny odczyt po zamknięciu i uruchomieniu aplikacji.

Każdy punkt otrzymuje `PASS`, `FAIL`, `PARTIAL` albo `NOT RUN`, wraz z adresem testu, datą i obserwacją. Wykonany raport nie zawiera modelu urządzenia ani wersji iOS/Safari; brak tych danych pozostaje ograniczeniem dowodowym. Status `PASS — funkcjonalny` oznacza zaobserwowane przejście scenariusza, nie pełne porównanie tożsamości każdego rekordu ani niezależne potwierdzenie.

## Zarejestrowane wyniki iPhone QA

Poniższa tabela odzwierciedla dostarczony raport z 20.11.2026. `PASS` nie zastępuje brakujących pomiarów integralności; `FAIL` pozostaje wynikiem niepowodzenia, nawet jeśli właściciel zaakceptował go jako ograniczenie o niskim priorytecie.

| ID | Wynik | Zaobserwowane / niepotwierdzone |
|---|---|---|
| IOS-01 | Częściowo potwierdzony | Użyto osobnego hostname QA. Nie zapisano pełnej inspekcji scope Service Workera ani magazynów. |
| IOS-02 | PASS — UI | Safari otworzyło aplikację; plany i grafiki działały. Brak pełnego raportu Web Inspectora oraz niezależnego potwierdzenia wszystkich statusów sieci. |
| IOS-03 | PASS | QA dodano do ekranu początkowego i uruchomiono jako aplikację. |
| IOS-04 | Niepełny | Service Worker był częścią przepływu migracji, ale nie zebrano pełnej inspekcji scope/cache. |
| IOS-05 | **FAIL** | Aplikacja nie uruchomiła się bez internetu. Właściciel zaakceptował znaną niezgodność jako ograniczenie niskiego priorytetu; nie została naprawiona. |
| IOS-06 | Częściowo zaliczony | Potwierdzono zapis serii, wznowienie treningu i trwałość historii. Oddzielnego powrotu niezapisanego draftu po restarcie nie udokumentowano. |
| IOS-07 | PASS | Potwierdzono trwałość pomiarów wagi i zmian planu. |
| IOS-08 | PASS | ZIP v5 wygenerowano i zapisano w aplikacji Pliki; plik nie był pusty. |
| IOS-09 | PASS — główna ścieżka | Funkcjonalnie potwierdzono pełne odtworzenie ZIP v5, cofnięcie późniejszych zmian i trwałość po restarcie. Nie wykonano niezależnego porównania pełnego zestawu identyfikatorów. |
| IOS-10 | PASS — funkcjonalny | Potwierdzono merge JSON v4 bez ponownego dodania tej samej syntetycznej sesji, pełne odtworzenie v4 i ponowne przywrócenie ZIP. Pełna kontrola rekord-po-rekordzie nie została wykonana. |
| IOS-11 | PASS — funkcjonalny | Ręczna migracja syntetycznego stanu do IndexedDB zakończyła się powodzeniem; pełne liczniki, ID i sumy przed/po nie zostały niezależnie zestawione. |
| IOS-12 | PASS — funkcjonalny | Po restarcie dane pozostały dostępne; zapisano nowy pomiar po migracji i wygenerowano/odczytano ZIP v5. Drafty oraz pełna integralność wszystkich rekordów nie zostały oddzielnie wykazane. |
| IOS-13 | Niepełny | Potwierdzono zwykły zapis po migracji. Nie wymuszano awarii IndexedDB ani błędów transakcji na urządzeniu. |

### Potwierdzone zachowania i granice dowodów

- Zgłoszono działający zapis i trwałość treningów, pomiarów oraz planów w izolowanej aplikacji QA.
- Zgłoszono udany eksport ZIP v5 do Plików oraz funkcjonalne odtworzenie ZIP v5 i JSON v4.
- Zgłoszono udane ręczne przełączenie do IndexedDB oraz późniejszy zapis i odczyt kopii ZIP v5.
- Nie udokumentowano oddzielnego odtworzenia niezapisanych draftów po restarcie/backupie.
- Nie porównano w pełni liczników, identyfikatorów sesji/serii/planów/pomiarów/draftów ani sum kontrolnych przed migracją, po niej i po restarcie.
- Wymuszone awarie magazynu wykonano w automatycznych testach syntetycznych według raportu; nie wykonywano ich na iPhonie.
- IOS-05 pozostaje FAIL. Akceptacja priorytetu nie oznacza naprawy ani zaliczenia scenariusza.

## Proponowane środowisko odizolowane

### Zastosowane rozwiązanie i dalsze wymagania

Raport wskazuje użycie osobnego originu HTTPS `gymverse-ios-qa.pages.dev` i wyróżnionej kopii GymVerse QA. Nie rekonstruowano tutaj sposobu konfiguracji hostingu ani procesu publikacji. Każde przyszłe odtworzenie testu powinno ponownie potwierdzić hostname, zawartość i zakres Service Workera przed wprowadzeniem syntetycznych danych.

### Nakładka identyfikacyjna GymVerse QA

W kopii użytej według raportu do testu zastosowano odrębne oznaczenia QA. Opis nakładki pozostaje instrukcją weryfikacyjną dla tej kopii i ewentualnego przyszłego powtórzenia; jej zakres jest wyłącznie identyfikacyjny i nie zmienia logiki aplikacji:

- w kopii `manifest.webmanifest`: `name` i `short_name` ustawione na `GymVerse QA`; pozostawić `start_url` i `scope` ograniczone do katalogu głównego osobnego hosta QA;
- w kopii HTML: `apple-mobile-web-app-title` oraz `<title>` ustawione na `GymVerse QA`;
- dodać do kopii widoczny i dostępny dla czytników ekranu pasek `ŚRODOWISKO QA — wyłącznie dane syntetyczne`;
- zachować istniejące ikony aplikacji bez zmian; nie edytować ani nie podmieniać grafik ćwiczeń.

Żaden z tych identyfikatorów nie należy do produkcyjnej aplikacji ani `main`. Raport podaje commit źródłowy, commit repozytorium kopii QA i hostname QA; osobnego SHA katalogu publikacji nie podano.

Przed każdym kolejnym testem potwierdzić:

1. `new URL(adres_testu).origin` różni się od originu produkcji `https://piotrm1974.github.io`.
2. Strona, manifest, `sw.js` i wszystkie krytyczne skrypty są serwowane z hosta testowego po HTTPS.
3. Service Worker ma zakres tylko hosta testowego, a `start_url` i `scope` manifestu wskazują testową aplikację.
4. W manifeście, metadanych strony, tytule i widocznym pasku UI widać `GymVerse QA`; nie otwierać ani nie instalować adresu produkcyjnego.

**Nie wystarczy osobna ścieżka GitHub Pages** (np. `/gymverse-qa/`). Inny path może ograniczyć zakres Service Workera, ale origin pozostaje ten sam. `localStorage`, IndexedDB i Cache Storage są powiązane z originem, więc ścieżka pod `piotrm1974.github.io` nie zapewni wymaganej izolacji danych od produkcji.

Podgląd musi zawierać komplet aplikacji: `index.html`, manifest, `sw.js`, `src/gv-base-b.js`, `src/gv-data.js`, bibliotekę ZIP i wymagane ikony/zasoby. Istniejące ścieżki względne muszą działać z katalogu głównego hosta testowego. Nie zmieniać produkcyjnej konfiguracji GitHub Pages ani `main`.

## Wymagania techniczne iOS/Safari do sprawdzenia

- **HTTPS:** Service Worker wymaga bezpiecznego kontekstu; na iPhonie użyć adresu HTTPS z prawidłowym certyfikatem. `localhost` jest wyjątkiem deweloperskim na komputerze, nie zamiennikiem hosta dostępnego na iPhonie. [MDN: ServiceWorkerContainer.register](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register)
- **Dodanie do ekranu początkowego:** w Safari otworzyć adres QA → Udostępnij → „Dodaj do ekranu początkowego” → włączyć „Otwórz jako aplikację internetową” → nadać czytelną nazwę `GymVerse QA`. To tworzy oddzielną pozycję aplikacji. [Apple Support: web app na iPhonie](https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios)
- **Oddzielny kontekst aplikacji:** Home Screen web app ma oddzielne cookies i storage względem Safari. Nie zakładać, że dane zapisane w karcie Safari będą dostępne w ikonie ekranu początkowego; w obu kontekstach używać wyłącznie syntetycznych danych. [Apple Developer, WWDC23: web apps](https://developer.apple.com/videos/play/wwdc2023/10120/?time=253)
- **Service Worker:** sprawdzić rejestrację, aktywację i kontrolę strony po ponownym otwarciu. Worker może być zatrzymany przez system między zdarzeniami; trwały jest stan w obsługiwanym magazynie/cache, nie jego zmienne globalne. Serwer musi zwracać poprawny JavaScript dla `sw.js`, a scope powinien zawierać stronę i zasoby aplikacji. [MDN: registration i scope](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register), [WebKit: lifecycle workerów](https://webkit.org/blog/8090/workers-at-your-service/)
- **IndexedDB i trwałość:** wykonać zapis, odczyt po odświeżeniu oraz po zamknięciu/ponownym uruchomieniu testowej aplikacji. Safari/WebKit dokumentuje limity, `QuotaExceededError` oraz możliwość ewakuacji danych przy presji na pamięć lub długiej nieaktywności. Od iOS 17 Storage API pozwala sprawdzić `estimate()` i wynik `persist()`; wniosek iOS zależy od heurystyk i nie jest obietnicą trwałości. Zapisać wyświetlony wynik `persistent`, `best-effort` albo `unsupported`; żadnego nie interpretować jako gwarancji kopii. [WebKit: polityka storage](https://webkit.org/blog/14403/updates-to-storage-policy/), [WebKit: Storage API](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)
- **Eksport przez arkusz udostępniania:** `navigator.canShare({files})` sprawdza obsługę pliku, a `navigator.share({files})` musi zostać wywołane bezpośrednio z gestu użytkownika. Dlatego w aplikacji po przygotowaniu ZIP wykonać drugi, jawny tap przycisku dostarczenia. Anulowanie arkusza lub rozwiązanie Promise nie potwierdza, że plik jest zapisany w Plikach. [MDN: Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API), [MDN: przesyłanie plików między aplikacjami](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Share_data_between_apps)
- **Zdalna diagnostyka:** opcjonalnie podłączyć iPhone’a do Maca, włączyć Web Inspector na iPhonie w Ustawienia → Aplikacje → Safari → Zaawansowane, zaufać Macowi, a w Safari na Macu włączyć funkcje dla web developerów i wybrać testową stronę albo Home Screen web app z menu Develop. Apple pozwala osobno inspekować strony, workery i Home Screen web apps. Nie włączać Remote Automation, jeśli wystarczy inspekcja ręczna. [Apple Developer: inspekcja iOS/iPadOS](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios?changes=_6_10), [Apple Support: menu Develop](https://support.apple.com/guide/safari/use-the-developer-tools-in-the-develop-menu-sfri20948/mac)

## Przygotowanie danych testowych i plików

1. Sprawdzić przed rozpoczęciem dokładny hostname QA i potwierdzić, że nie jest to `piotrm1974.github.io`. Nie importować żadnej kopii z produkcji ani z telefonu.
2. Użyć wyłącznie repozytoryjnego fixture’a `tests/fixtures/backup-v4.json`. Jest to syntetyczny JSON v4: jedna sesja, jedna seria testowa `40×8`, ciężar `bench_flat`, pomiar `70 kg`; nie zawiera danych właściciela. Przenieść tylko ten fixture na iPhone’a (np. przez AirDrop z komputera) i zachować nazwę `backup-v4.json`.
3. Przed ręczną migracją w aplikacji QA utworzyć i zapisać ZIP v5, pobrać go przez osobny tap „Zapisz w Plikach”, wskazać folder `Na moim iPhonie/GymVerse QA`, a następnie otworzyć aplikację Pliki i sprawdzić nazwę, rozmiar oraz możliwość ponownego wskazania pliku w imporcie. Zachować ten plik jako kopię bazową.
4. Nie wybierać plików GymVerse z iCloud, folderów produkcyjnych, komunikatorów ani kopii właściciela. Nie włączać synchronizacji plików z danymi rzeczywistymi.

## Checklist testu ręcznego

Zapisuj wynik każdej pozycji w raporcie; nierozpoznany ekran, brak zasobu, utrata wpisu lub niejasny komunikat to `FAIL` albo `NOT RUN`, nigdy domyślny PASS.

**IOS-06–IOS-12 wykonuj kolejno w tej samej instalacji aplikacji GymVerse QA uruchamianej z ikony ekranu początkowego, z tym samym syntetycznym stanem danych.** Nie usuwaj instalacji, nie resetuj jej storage i nie przechodź w tym zakresie do Safari. IOS-01/02 są osobną kontrolą strony w Safari, a IOS-03 służy instalacji. Dane w Safari i Home Screen web app mogą być rozdzielone; test nie zakłada ich współdzielenia. Jeśli aplikacja QA zostanie odinstalowana, dane zresetowane albo kontekst utracony, przerwij tę sekwencję i odnotuj ją jako `NOT RUN` do czasu odtworzenia świeżego, syntetycznego przypadku testowego.

| ID | Scenariusz | Kroki | Oczekiwany wynik | Wynik / obserwacja |
|---|---|---|---|---|
| IOS-01 | Izolacja originu | Otwórz adres QA i porównaj origin z `https://piotrm1974.github.io`; w Web Inspector sprawdź origin strony i scope SW. | Hostname inny niż produkcyjny; manifest, SW i dane należą do QA. | Częściowo potwierdzony — użyto osobnego hostname; brak pełnej inspekcji scope i magazynów. |
| IOS-02 | Uruchomienie w Safari | Załaduj stronę online; obejrzyj wszystkie cztery plany; sprawdź konsolę i błędy sieci krytycznych zasobów. | GymVerse QA uruchamia się bez błędów JS; widoczne są cztery plany; brak 404 dla `src/gv-base-b.js`, `src/gv-data.js`, ZIP codec, manifestu i ikon. | PASS — UI: aplikacja, plany i grafiki działały; pełny raport konsoli/sieci nie został zapisany. |
| IOS-03 | Instalacja PWA | Dodaj adres QA z Safari na ekran początkowy, włącz „Otwórz jako aplikację internetową”, użyj etykiety `GymVerse QA`; uruchom ikonę. | Otwiera się aplikacja standalone QA; nazwa/ikona nie mylą z produkcją. Karta Safari i aplikacja QA mogą mieć odrębny storage. | PASS — instalacja i uruchomienie zgłoszone. |
| IOS-04 | Service Worker | Po połączeniu online odczekaj aktywację, zamknij i ponownie otwórz QA; sprawdź kontroler, scope, cache aplikacji oraz odpowiedź krytycznych zasobów. | Rejestracja aktywna i ograniczona do QA; pliki krytyczne są dostępne z cache. Nie wymagaj, by worker cały czas działał w pamięci. | Niepełny — SW brał udział w przepływie migracji, brak pełnej inspekcji scope/cache. |
| IOS-05 | Offline | Online, przed odłączeniem sieci, otwórz co najmniej jedną znaną ilustrację ćwiczenia i zanotuj jej URL po potwierdzeniu pobrania/cache’owania. Następnie włącz tryb samolotowy, zamknij QA z przełącznika aplikacji i uruchom ponownie; przejdź do planów, historii i tej ilustracji. | Zasoby krytyczne znajdują się w precache; ilustracje są cache’owane dynamicznie dopiero po pobraniu online. Po teście wróć online. | **FAIL** — aplikacja nie uruchomiła się offline. Zaakceptowano jako ograniczenie niskiego priorytetu; brak naprawy. |
| IOS-06 | Serie, trening i draft | W tej samej zainstalowanej aplikacji GymVerse QA uruchomionej z ekranu początkowego — bez przechodzenia do Safari — zaimportuj fixture v4. Następnie rozpocznij testowy trening, wpisz serię i osobno pozostaw wagę/powtórzenia jako niezapisany draft. Zamknij i otwórz QA. | Historia fixture’a pozostaje; zapisany trening i draft są odróżnialne i wracają po restarcie. Niekompletny trening nadal wymaga potwierdzenia. | Częściowo zaliczony — zapis serii, wznowienie treningu i historia potwierdzone; draft po restarcie nieudokumentowany. |
| IOS-07 | Pomiar i plany | W tej samej zainstalowanej aplikacji QA z ekranu początkowego zapisz syntetyczny pomiar i wprowadź testową zmianę planu; odśwież aplikację. | Zmiany widoczne po ponownym odczycie; UI nie pokazuje sukcesu przed trwałym zapisem. | PASS — trwałość pomiaru wagi i zmiany planu zgłoszona. |
| IOS-08 | Eksport v5 do Plików | W tej samej zainstalowanej aplikacji QA z ekranu początkowego uruchom eksport v5, poczekaj na gotowość pliku, tapnij osobny przycisk dostarczenia, z arkusza wybierz „Zapisz w Plikach”, folder QA. Otwórz Pliki i sprawdź zapis. | ZIP istnieje pod oczekiwaną nazwą, nie ma zerowego rozmiaru; app potwierdza backup dopiero po powrocie i świadomym potwierdzeniu. Anulowanie arkusza nie oznacza sukcesu. | PASS — ZIP v5 zapisano w Plikach i zgłoszono jako niepusty. |
| IOS-09 | Ponowny odczyt ZIP v5 | W tej samej zainstalowanej aplikacji QA z ekranu początkowego wprowadź dodatkową syntetyczną zmianę, po czym zaimportuj zapisany ZIP jako pełne odtworzenie z jawnym potwierdzeniem. | Walidacja i podgląd poprzedzają zgodę; timer nie uruchamia się automatycznie. | PASS — główna ścieżka odtworzenia i trwałość po restarcie zgłoszone; brak pełnego niezależnego porównania ID/liczników. |
| IOS-10 | Import JSON v4 | W tej samej zainstalowanej aplikacji QA z ekranu początkowego zaimportuj `backup-v4.json`; osobno sprawdź merge i pełne odtworzenie (przed pełnym odtworzeniem zapisz ZIP bazowy). | Podgląd/potwierdzenie zgodnie z wybraną ścieżką; syntetyczna sesja i ciężar zostają zachowane. | PASS — merge bez duplikacji tej samej sesji oraz pełne odtworzenie v4 zgłoszone. |
| IOS-11 | Migracja syntetyczna | W tej samej zainstalowanej aplikacji QA z ekranu początkowego wróć do testowego stanu `localStorage` (na QA wyłącznie), pozostaw syntetyczny trening/draft. Potwierdź osobno sprawdzony eksport źródłowy v4 i ZIP v5, zamknij inne karty QA, zapisz dowody integralności z tabeli poniżej, sprawdź podgląd liczb i dopiero wtedy świadomie zatwierdź przełączenie. | Bez aktywacji przed końcową zgodą; źródłowy snapshot pozostaje, wskaźnik wskazuje IndexedDB. | PASS — funkcjonalnie migracja do IndexedDB zakończona; niezależna zgodność pełnych liczników/ID/sum nie została wykazana. |
| IOS-12 | Odczyt po migracji | W tej samej zainstalowanej aplikacji QA z ekranu początkowego odśwież, a następnie zamknij/otwórz Home Screen QA; sprawdź historię, ciężary, plany, ustawienia, aktywny trening i draft. Zapisz ponownie dowody integralności. | Sprawdź trwałość po restarcie i eksport v5 z aktywnego magazynu. | PASS — dane po restarcie, nowy pomiar oraz eksport/odczyt ZIP v5 zgłoszone; drafty i pełna integralność rekordów niepotwierdzone osobno. |
| IOS-13 | Nieudana operacja | Nie wymuszaj braku miejsca ani nie kasuj bazy na osobistym telefonie. Wykonaj wyłącznie bezpieczny, normalny zapis. | Brak eksperymentalnej destrukcji storage. | Niepełny — zwykły zapis po migracji potwierdzony; brak wymuszonych awarii na urządzeniu. |

### Dowody integralności danych

Wypełnij tę tabelę danymi wyłącznie z syntetycznej instalacji QA. Zliczaj serie jako rekordy serii, nie jako liczbę ćwiczeń. W polach identyfikatorów wpisuj pełne syntetyczne ID albo jednoznaczne, bezstratne zbiory ID; nie zastępuj ich samymi sumami kontrolnymi. Drafty bez UUID identyfikuj kluczem złożonym używanym przez aplikację (np. `planId/sessionId/step/setNumber`). Dla pomiarów podaj ich trwały klucz (np. ID, jeśli występuje, albo data/typ pomiaru zgodnie z modelem).

| Dowód | Przed migracją (localStorage) | Po przełączeniu (IndexedDB) | Po odświeżeniu i ponownym uruchomieniu QA |
|---|---|---|---|
| Liczba sesji | `____` | `____` | `____` |
| Liczba serii | `____` | `____` | `____` |
| Liczba planów | `____` | `____` | `____` |
| Liczba pomiarów | `____` | `____` | `____` |
| Liczba draftów | `____` | `____` | `____` |
| Identyfikatory sesji | `____` | `____` | `____` |
| Identyfikatory serii | `____` | `____` | `____` |
| Identyfikatory/klucze planów | `____` | `____` | `____` |
| Identyfikatory/klucze pomiarów | `____` | `____` | `____` |
| Klucze złożone draftów | `____` | `____` | `____` |
| Wynik kontroli sum kontrolnych / zgodności snapshotu | `____` | `____` | `____` |

Wynik jest zaliczony tylko wtedy, gdy liczniki i tożsamości syntetycznych rekordów są zgodne przed migracją, po przełączeniu i po ponownym uruchomieniu. Każdą różnicę wyjaśnij i oznacz `FAIL`; nie naprawiaj jej ręcznie w IndexedDB.

### Testy potrzebujące zdalnego Web Inspector

Jeśli dostępny jest Mac, podczas testu zapisz:

- błędy JavaScript i odrzucone Promise;
- statusy HTTP dla plików krytycznych i `Content-Type` skryptu `sw.js`;
- adres i scope Service Workera, jego stan `activated` i kontrolę strony po ponownym uruchomieniu;
- wynik `navigator.storage.persisted()` oraz `navigator.storage.estimate()` (wartości orientacyjne, nie gwarancja);
- dostępność `indexedDB`, otwarcie/zapis/odczyt testowej bazy, błąd lub abort transakcji jeśli naturalnie wystąpi;
- działanie `navigator.canShare({files})`, wykonanie `navigator.share({files})` po tapnięciu i rezultat ścieżki pobrania, jeśli Web Share dla plików jest niedostępne.

Nie zmieniaj danych przez konsolę, nie czyść storage Safari i nie usuwaj baz/cache z Web Inspector.

## Instrukcja eksportu, weryfikacji i odtwarzania

1. **Przed migracją:** w aplikacji testowej QA utwórz JSON v4 stanu źródłowego (lub użyj syntetycznego fixture’a), przygotuj ZIP v5, zapisz oba w folderze `Na moim iPhonie/GymVerse QA` i otwórz oba pliki z aplikacji Pliki, by upewnić się, że są dostępne. Nie polegaj na samym ekranie „Udostępnij” ani na dacie w aplikacji.
2. **Weryfikacja kopii:** w testowej aplikacji użyj jej walidacji/podglądu ZIP; potwierdź manifest, sumy, liczbę sesji/serii/planów i testowy odczyt przez import do QA. JSON v4 otwórz w podglądzie importu i sprawdź syntetyczne liczniki. Nie wklejaj plików do repozytorium.
3. **Odtworzenie:** do pełnego odtworzenia używaj wyłącznie originu QA. Zapisz osobny ZIP przed próbą, przejrzyj podgląd, zaznacz jawnie, czy mają wrócić aktywny trening i drafty, a następnie potwierdź. Po zakończeniu odśwież aplikację i sprawdź liczniki, przykładowy ciężar, ustawienia, plan i draft. Timer musi pozostać nieaktywny do ręcznej decyzji.
4. **Po migracji:** ponownie wyeksportuj ZIP z aktywnego IndexedDB, zapisz do Plików osobnym gestem, zweryfikuj go przez podgląd/odczyt w QA i porównaj liczniki oraz ID z kopią źródłową. Nie zakładaj, że JSON v4 odwzoruje wszystkie pola ZIP v5.
5. **Przerwij test**, jeśli origin jest niepewny, liczby się nie zgadzają, pojawi się nieznana kopia, zapis zwróci błąd, plik nie daje się odczytać albo urządzenie pokazuje dane produkcyjne. Nie „naprawiaj” ręcznie IDB ani nie importuj kopii rzeczywistej.

## Procedura przyszłego wdrożenia (wymaga osobnej akceptacji)

1. Dla ewentualnego ponownego testu ponownie zweryfikować już użyty origin QA i build. Zmiana/utworzenie hostingu albo publikacja nowej kopii wymaga osobnej zgody; nie zmieniać produkcyjnego Pages, `main` ani ustawień produkcyjnych.
2. Rozstrzygnąć ograniczenia zapisane w raporcie, w tym drafty i dowody integralności; jeśli zakres wydania tego wymaga, powtórzyć odpowiednie scenariusze IOS-01–IOS-13 na syntetycznym stanie. IOS-05 pozostaje FAIL, dopóki nie zostanie naprawiony i ponownie sprawdzony.
3. Usunąć z raportu wszelkie dane użytkownika; zachować wyłącznie statusy, techniczne błędy, liczniki testowego fixture’a i wersje urządzeń.
4. Przekazać raport właścicielowi. Dopiero po zaakceptowaniu testów podjąć osobną decyzję o scaleniu PR #4; samo zaakceptowanie planu i testów nie jest zgodą na merge.
5. Przed jakąkolwiek produkcyjną migracją wykonać i sprawdzić kopię na właściwym urządzeniu, pokazać wynik trwałości storage, ponownie uzyskać osobną zgodę na migrację, a po przełączeniu wykonać eksport v5 i sprawdzić go w Plikach. Test syntetyczny QA nie jest migracją ani kwalifikacją danych produkcyjnych. W razie błędu zapisy zatrzymać, zachować źródło i nie przełączać automatycznie z powrotem do localStorage.

## Ograniczenia bez fizycznego iPhone’a

Bez urządzenia iOS nie można wiarygodnie potwierdzić: zachowania aktualnego Safari/WebKit i Home Screen web app; różnicy storage między kartą Safari i aplikacją standalone; wyglądu i działania systemowego arkusza udostępniania; faktycznego zapisania/otwarcia ZIP w aplikacji Pliki; wznowienia PWA po zamknięciu, presji pamięci lub dłuższej nieaktywności; zachowania IndexedDB i Service Workera na docelowej wersji iOS, modelu i wolnym miejscu; ani dostępności/zgodności Web Inspector z używanym Makiem. Chromium/Edge, WebKit Playwright ani symulator nie zastępują tych obserwacji na urządzeniu.

Brak fizycznego testu oznacza `NOT RUN`, a nie PASS. Nawet PASS w tej checkliście obejmie wyłącznie testowy origin i dane syntetyczne; nie jest zgodą na migrację prawdziwych danych ani wdrożenie produkcyjne.
