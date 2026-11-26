# GV-BOLT-STAGE5 — technika i MuscleMap Signal

Autoryzacja właściciela 24.11.2026: implementacja zaakceptowanego `docs/bolt-stage5-plan.md`. Wyłącznie dopracowanie istniejących zwijanych paneli, zachowanie zatwierdzonych ilustracji, map, etykiet dokładności, serii i danych. Sprawdzić i w razie potwierdzenia punktowo naprawić komunikat wariantu; bez zmiany mapowania, nowej anatomii, instrukcji, etapu 6 lub publikacji.

Kontrola przed zmianą: 31 ćwiczeń, 4 warianty, 34 rekordy ilustracji, 35 kluczy atlasu; walidacja rejestru poprawna, wszystkie pliki rejestru zgodne z zadeklarowaną długością i SHA-256; cztery warianty rozwiązane, `leg_press/high_feet` współdzieli podstawową planszę.

## Wynik 24.11.2026

Oprawa zwijanej techniki i legendy MuscleMap dostosowana do Signal; zachowano plansze, podpisy, mapowanie i kolory mięśni. Potwierdzony testem fałszywy komunikat o braku ilustracji wariantu skorygowano, uwzględniając istniejący rekord prezentacji. Prawdziwy błąd ładowania nadal ma oddzielny komunikat. Cache PWA podniesiono do v33.

Świeże testy: jednostkowe 141/141, Edge celowane 41/41 oraz 4/4 timer i 6/6 prezentacja/offline; desktopowy WebKit 9/9 warianty i responsywność, dodatkowo 6/7 regresji. W siódmym teście i odosobnionym powtórzeniu przeładowanie po `context.setOffline(true)` kończy się `WebKit encountered an internal error`; offline WebKit po restarcie nie został potwierdzony, przyczyna nieustalona. Edge potwierdził offline. Wyniki poszczególnych zestawów nie są pełną regresją aplikacji.

Zrzuty Edge: `outputs/GV-BOLT-STAGE5/screenshots/`. Fizyczny iPhone/Safari pozostaje niezweryfikowany; wcześniejsza sporadyczna pauza WebKit oraz historyczny autentyczny eksport przed publikacją pozostają otwarte. Etap do oceny właściciela, bez deklaracji pełnego zamknięcia przy niepotwierdzonym offline WebKit. Nie rozpoczynać etapu 6 ani nie publikować.

## Kontrola końcowa 24.11.2026 — wynik aktualny

Właściciel zaakceptował etap wizualnie. Test minimalny niezawierający kodu GymNastiki odtworzył w WebKit 26.0 (Playwright 1.56.1, rewizja 2215) ten sam błąd po `context.setOffline(true)`, również z aktywnym Service Workerem i stroną w cache; Edge w tym samym przykładzie odzyskał stronę. Log WebKit wskazuje `WebLoaderStrategy.cpp:649`, komunikat `This is a WebKit bug`. W obu silnikach przełączenie online po teście działało. Binarna wersja przeglądarki odpowiada przypiętej wersji Playwright i przechodzi pozostałe testy; nie wykonywano niezależnej kryptograficznej weryfikacji dystrybucji. Log i minimalny przykład: `outputs/GV-BOLT-STAGE5-CLOSURE-diagnostic.log`, `outputs/GV-BOLT-STAGE5-CLOSURE/offline-diagnostic.mjs`.

Odrębna próba bez emulacji `setOffline`: po zainstalowaniu aktywnego workera `gymverse-v33` i utworzeniu syntetycznej sesji zatrzymano lokalny serwer. W Edge i WebKit przeładowanie, wznowienie treningu, obraz techniki w obu sylwetkach i wszystkie cztery widoki atlasu działały; porównanie zapisu aktywnej sesji przed i po było identyczne. Dowód: `outputs/GV-BOLT-STAGE5-CLOSURE-outage-final.log` i `outputs/GV-BOLT-STAGE5-CLOSURE/server-outage.mjs`. To test niedostępności serwera, nie fizycznego rozłączenia sieci ani test Safari na iPhonie. Test emulacji `setOffline` nadal nie przechodzi w tym środowisku i nie jest podstawą deklaracji pełnej zgodności offline.

Świeża pełna regresja Edge: 239/239 w głównej konfiguracji oraz 13/13 w osobnej wymaganej konfiguracji ilustracji/nagłówka. Jednostkowe 141/141. Końcowe celowane WebKit 15/15 (w tym LIGHT/DARK 320/375/390/430, warianty, zamiana, serie/RIR i timer); dodatkowo próba niedostępności serwera opisana wyżej. Nie wprowadzono poprawki produkcyjnej, ponieważ odtworzony błąd nie wymaga jej na podstawie dostępnych dowodów.

Decyzja: etap 5 można zamknąć lokalnie w sprawdzonym zakresie, z jawnym ograniczeniem testu symulowanego offline WebKit. Otwarte pozostają test fizycznego iPhone/Safari, wcześniejsza sporadyczna pauza WebKit i autentyczny eksport historyczny przed publikacją. Etapu 6 nie rozpoczynać bez zgody; bez commit, merge, push i deploy.
