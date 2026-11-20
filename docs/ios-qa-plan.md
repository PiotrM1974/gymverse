# GymVerse — plan kontrolowanego testu iOS/Safari

**Status:** plan do akceptacji właściciela; nie uruchomiono hostingu ani testu na urządzeniu.  
**Wersja aplikacji objęta planem:** PR #4, commit `f21215c91ee5561e309bb3d11c326c1784519585`.  
**Dane:** wyłącznie syntetyczne. Test nie jest zgodą na merge, publikację, wdrożenie ani migrację rzeczywistych danych.

## Cel i kryteria zaliczenia

Sprawdzić na fizycznym iPhonie Safari oraz osobno zainstalowaną testową aplikację z ekranu początkowego:

- uruchamianie i zasoby PWA, rejestrację Service Workera i działanie offline;
- trwałość syntetycznej historii, ciężarów, planów, aktywnego treningu i draftów;
- zapis pliku ZIP v5 do Plików i możliwość ponownego odczytu;
- import/pełne odtworzenie kopii JSON v4 i ZIP v5;
- ręczną migrację **wyłącznie syntetycznego snapshotu** do IndexedDB oraz ponowny odczyt po zamknięciu i uruchomieniu aplikacji.

Każdy punkt otrzymuje `PASS`, `FAIL` albo `NOT RUN`, wraz z modelem iPhone’a, wersją iOS, wersją Safari (jeżeli dostępna), adresem testu, datą i krótką obserwacją. Nie testowano na prawdziwym iPhonie; żaden punkt poniżej nie jest wynikiem PASS.

## Proponowane środowisko odizolowane

### Zalecana forma

Po osobnej zgodzie utworzyć statyczny podgląd PR #4 na tymczasowym hostingu pod dedykowanym hostname, np. osobnym projektem preview na Cloudflare Pages (`<unikalny-projekt-qa>.pages.dev`). Wdrożyć wyłącznie zawartość gałęzi `feature/gv-data`, bez łączenia do `main`, i ustawić wyróżniającą nazwę aplikacji testowej `GymVerse QA`, aby ikona nie mogła być pomylona z produkcyjną.

Hosting, DNS, konto, projekt preview i wdrożenie nie zostały utworzone ani skonfigurowane. Ich utworzenie wymaga osobnej zgody. Po przydzieleniu adresu przed testem sprawdzić:

1. `new URL(adres_testu).origin` różni się od originu produkcji `https://piotrm1974.github.io`.
2. Strona, manifest, `sw.js` i wszystkie krytyczne skrypty są serwowane z hosta testowego po HTTPS.
3. Service Worker ma zakres tylko hosta testowego, a `start_url` i `scope` manifestu wskazują testową aplikację.
4. W Safari widać nazwę `GymVerse QA`; nie otwierać ani nie instalować adresu produkcyjnego.

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

| ID | Scenariusz | Kroki | Oczekiwany wynik | Wynik / obserwacja |
|---|---|---|---|---|
| IOS-01 | Izolacja originu | Otwórz adres QA i porównaj origin z `https://piotrm1974.github.io`; w Web Inspector sprawdź origin strony i scope SW. | Hostname inny niż produkcyjny; manifest, SW i dane należą do QA. | `____` |
| IOS-02 | Uruchomienie w Safari | Załaduj stronę online; obejrzyj wszystkie cztery plany; sprawdź konsolę i błędy sieci krytycznych zasobów. | GymVerse QA uruchamia się bez błędów JS; widoczne są cztery plany; brak 404 dla `src/gv-base-b.js`, `src/gv-data.js`, ZIP codec, manifestu i ikon. | `____` |
| IOS-03 | Instalacja PWA | Dodaj adres QA z Safari na ekran początkowy, włącz „Otwórz jako aplikację internetową”, użyj etykiety `GymVerse QA`; uruchom ikonę. | Otwiera się aplikacja standalone QA; nazwa/ikona nie mylą z produkcją. Karta Safari i aplikacja QA mogą mieć odrębny storage. | `____` |
| IOS-04 | Service Worker | Po połączeniu online odczekaj aktywację, zamknij i ponownie otwórz QA; sprawdź kontroler, scope, cache aplikacji oraz odpowiedź krytycznych zasobów. | Rejestracja aktywna i ograniczona do QA; pliki krytyczne są dostępne z cache. Nie wymagaj, by worker cały czas działał w pamięci. | `____` |
| IOS-05 | Offline | Po udanym IOS-04 włącz tryb samolotowy, zamknij QA z przełącznika aplikacji i uruchom ponownie; przejdź do planów i historii. | Powłoka, cztery plany i wcześniej zapisane dane syntetyczne ładują się bez sieci; brak fałszywego komunikatu o nowym zapisie. Po teście wróć online przed eksportem/odtworzeniem. | `____` |
| IOS-06 | Serie, trening i draft | Zaimportuj fixture v4. Następnie rozpocznij testowy trening, wpisz serię i osobno pozostaw wagę/powtórzenia jako niezapisany draft. Zamknij i otwórz QA. | Historia fixture’a pozostaje; zapisany trening i draft są odróżnialne i wracają po restarcie. Niekompletny trening nadal wymaga potwierdzenia. | `____` |
| IOS-07 | Pomiar i plany | Zapisz syntetyczny pomiar i wprowadź testową zmianę planu; odśwież aplikację. | Zmiany widoczne po ponownym odczycie; UI nie pokazuje sukcesu przed trwałym zapisem. | `____` |
| IOS-08 | Eksport v5 do Plików | Uruchom eksport v5, poczekaj na gotowość pliku, tapnij osobny przycisk dostarczenia, z arkusza wybierz „Zapisz w Plikach”, folder QA. Otwórz Pliki i sprawdź zapis. | ZIP istnieje pod oczekiwaną nazwą, nie ma zerowego rozmiaru; app potwierdza backup dopiero po powrocie i świadomym potwierdzeniu. Anulowanie arkusza nie oznacza sukcesu. | `____` |
| IOS-09 | Ponowny odczyt ZIP v5 | W QA wprowadź dodatkową syntetyczną zmianę, po czym zaimportuj zapisany ZIP jako pełne odtworzenie z jawnym potwierdzeniem. | Walidacja i podgląd poprzedzają zgodę; po odtworzeniu wracają liczby sesji, serii, planów, ciężarów, ustawień i draftów z kopii. Timer nie uruchamia się automatycznie; aktywny trening/draft przywracane są zgodnie z osobnymi wyborami. | `____` |
| IOS-10 | Import JSON v4 | Na odizolowanym stanie QA zaimportuj `backup-v4.json`; osobno sprawdź merge i pełne odtworzenie (przed pełnym odtworzeniem zapisz ZIP bazowy). | Podgląd/potwierdzenie zgodnie z wybraną ścieżką; syntetyczna sesja i ciężar zostają zachowane; brak błędów walidacji lub pomijania serii. | `____` |
| IOS-11 | Migracja syntetyczna | Wróć do testowego stanu `localStorage` (na QA wyłącznie), pozostaw syntetyczny trening/draft. Potwierdź osobno sprawdzony eksport źródłowy v4, ponownie sprawdzony ZIP v5, zamknij inne karty QA i wykonaj ręczne przygotowanie. Sprawdź podgląd liczb i dopiero wtedy świadomie zatwierdź przełączenie. | Bez aktywacji przed końcową zgodą. Po przełączeniu źródłowy snapshot pozostaje; wskaźnik wskazuje IndexedDB; żaden wpis nie znika ani nie dubluje się. | `____` |
| IOS-12 | Odczyt po migracji | Odśwież i zamknij/otwórz Home Screen QA; sprawdź historię, ciężary, plany, ustawienia, aktywny trening i draft. | Wszystkie liczniki i identyfikatory odpowiadają stanowi przed migracją; zapisany timer/powiadomienia nie startują automatycznie. Eksport v5 po migracji zawiera stan aktywnego magazynu. | `____` |
| IOS-13 | Nieudana operacja | Nie wymuszaj braku miejsca ani nie kasuj bazy na osobistym telefonie. Wykonaj wyłącznie bezpieczny, normalny zapis; awarie IDB i błędy transakcji pozostają pokryte automatycznymi syntetycznymi testami. | Brak eksperymentalnej destrukcji storage. Jeśli naturalny błąd wystąpi, zanotuj komunikat i nie próbuj migracji/fallbacku. | `____` |

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

## Procedura przyszłego wdrożenia (niezatwierdzona)

1. Uzyskać osobną zgodę na uruchomienie preview hostingu na odrębnym originie i przygotować wyróżnioną aplikację `GymVerse QA` z gałęzi PR #4. Nie zmieniać Pages, `main` ani ustawień produkcyjnych.
2. Wykonać testy IOS-01–IOS-13 na syntetycznym stanie i zebrać raport, bez zmiany produkcyjnej PWA.
3. Usunąć z raportu wszelkie dane użytkownika; zachować wyłącznie statusy, techniczne błędy, liczniki testowego fixture’a i wersje urządzeń.
4. Przekazać raport właścicielowi. Dopiero po zaakceptowaniu testów podjąć osobną decyzję o scaleniu PR #4; samo zaakceptowanie planu i testów nie jest zgodą na merge.
5. Przed jakąkolwiek produkcyjną migracją wykonać i sprawdzić kopię na właściwym urządzeniu, pokazać wynik trwałości storage, ponownie uzyskać osobną zgodę na migrację, a po przełączeniu wykonać eksport v5 i sprawdzić go w Plikach. W razie błędu zapisy zatrzymać, zachować źródło i nie przełączać automatycznie z powrotem do localStorage.

## Ograniczenia bez fizycznego iPhone’a

Bez urządzenia iOS nie można wiarygodnie potwierdzić: zachowania aktualnego Safari/WebKit i Home Screen web app; różnicy storage między kartą Safari i aplikacją standalone; wyglądu i działania systemowego arkusza udostępniania; faktycznego zapisania/otwarcia ZIP w aplikacji Pliki; wznowienia PWA po zamknięciu, presji pamięci lub dłuższej nieaktywności; zachowania IndexedDB i Service Workera na docelowej wersji iOS, modelu i wolnym miejscu; ani dostępności/zgodności Web Inspector z używanym Makiem. Chromium/Edge, WebKit Playwright ani symulator nie zastępują tych obserwacji na urządzeniu.

Brak fizycznego testu oznacza `NOT RUN`, a nie PASS. Nawet PASS w tej checkliście obejmie wyłącznie testowy origin i dane syntetyczne; nie jest zgodą na migrację prawdziwych danych ani wdrożenie produkcyjne.
