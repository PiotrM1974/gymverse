# GV-DATA — plan migracji i odzyskiwania

## Zakres i stan wdrożenia

Warstwa `createRuntimeStore()` rozpoczyna pracę w trybie `localStorage`. To nadal jedyne źródło bieżących danych, dopóki użytkownik nie uruchomi ręcznej procedury w aplikacji. Kod nie wykonuje migracji automatycznie przy starcie. Raport z testu QA na fizycznym iPhonie z 20.11.2026 zgłasza pomyślną, ręczną migrację wyłącznie danych syntetycznych do IndexedDB; zakres dowodów i ograniczenia opisuje [raport iOS QA](ios-qa-results.md). Nie przeprowadzano migracji rzeczywistych danych użytkownika.

Ręczna procedura wymaga kolejno:

1. aktywnego Service Workera i potwierdzenia, że otwarte jest tylko jedno okno GymVerse;
2. utworzenia pliku JSON v4 ze stanu źródłowego oraz świadomego potwierdzenia jego zapisania i sprawdzenia;
3. utworzenia ZIP v5 ze stanu aplikacji, jego ponownego odczytu i walidacji oraz potwierdzenia przez użytkownika zapisania kopii;
4. ponownego sprawdzenia liczby okien i sumy źródła;
5. osobnego, końcowego potwierdzenia przełączenia.

Eksporty nie są automatycznie traktowane jako zapisane. Użytkownik sprawdza pliki w wybranym miejscu. Aplikacja nie zmienia `main`, nie publikuje migracji i nie czyści źródłowych kluczy `localStorage`.

## Struktura IndexedDB i aktywny magazyn

Baza `gymverse-db-v3` jest podnoszona do schematu IndexedDB 4. Dane aplikacji są przechowywane jako surowe wartości JSON w `runtimeRecords`, z identyfikatorem generacji i kluczem aplikacji. Wskaźnik `meta.runtimeActive` zawiera generację, wersję schematu, liczbę kluczy i SHA-256 kanonicznego snapshotu. `meta.runtimeRevision` wykrywa zapis oparty na nieaktualnym stanie innej karty. Potwierdzone interpretacje i grafiki mają osobne magazyny.

To jest warstwa kompatybilności magazynu dla istniejących kluczy i kształtów rekordów. `DB_VERSION = 4` oznacza wyłącznie układ object stores IndexedDB; backup `version = 5` oznacza format ZIP. Żaden z tych numerów nie jest `dataSchemaVersion: 3`, a ta gałąź nie jest pełną migracją modelu danych v3. Manifest backupu jawnie zawiera `schema: legacy-storage-snapshot`; nie deklaruje v3.

Nowe treningi otrzymują UUID sesji i serii przy utworzeniu. Normalizacja legacy zachowuje istniejące identyfikatory, a dla rekordów bez nich wylicza deterministyczny fingerprint treści z licznikiem wielokrotności; jednakowe daty nie są kluczem tożsamości. Backup i pełne odtworzenie v4/v5 zachowują lub uzupełniają te identyfikatory bez zmiany historycznych wartości treningu.

Migracja zapisuje znacznik `indexeddb-pending` do klucza sterującego magazynem, przygotowuje dane w transakcji IndexedDB, odczytuje wszystkie zapisane klucze, porównuje liczbę i sumę kontrolną, ponownie porównuje źródło, a dopiero potem zatwierdza `meta.runtimeActive`. Po przełączeniu znacznik otrzymuje wartość `indexeddb`. Wskaźnik w IndexedDB jest rozstrzygający, jeśli nie uda się zapisać końcowego znacznika. Klucz sterujący jest metadanymi selektora; nie zastępuje ani nie czyści danych źródłowych.

Przy starcie aplikacja sprawdza wskaźnik IndexedDB i jego sumę kontrolną. Wskaźnik aktywny albo znacznik `indexeddb`, którego bazy nie da się otworzyć, zatrzymuje normalne uruchomienie/zapisy; aplikacja nie przełącza się po cichu na starą kopię `localStorage`. Przed przełączeniem brak wskaźnika oznacza, że `localStorage` pozostaje aktywny.

Powtórzenie przygotowania używa tej samej generacji z SHA-256 i zastępuje nieaktywne rekordy przygotowane. Nie tworzy duplikatów ani nie usuwa kluczy `localStorage`. Niezweryfikowany lub przerwany snapshot nie staje się aktywny.

## Blokada kart i zmiany równoległe

Procedura wymaga Web Locks API. Przed migracją aplikacja sprawdza przez Service Workera okna w zakresie GymVerse, a następnie sonduje inne aktualne karty przez `BroadcastChannel`. W razie innego okna lub braku bezpiecznej blokady migracja jest odrzucana. W trakcie przygotowania zmiany w aplikacji są wstrzymane. Stary klient, który nie uczestniczy w protokole, może mimo to zmieniać `localStorage`; dlatego suma źródła jest sprawdzana ponownie tuż przed zatwierdzeniem wskaźnika. Wykryta zmiana przerywa aktywację.

Zapisy do IndexedDB używają rewizji w tej samej transakcji co odczyt wskaźnika i zapis rekordów. Karta z nieaktualną rewizją nie nadpisuje nowszego stanu. Zgłasza konflikt, odświeża własny snapshot i wymaga ponownego załadowania/świadomego wznowienia.

## Pokrycie operacji magazynu

| Operacja aplikacji | Ścieżka po przełączeniu |
| --- | --- |
| Start, zapis, edycja i porzucenie aktywnego treningu | `LS` i `BASE_B.persistJsonTransaction` kierują do adaptera aktywnego magazynu; zmiana stanu aktywnego jest transakcyjna w IndexedDB |
| Drafty, zmieniona liczba serii, krok, ustawienia timera i plany | Odczyt przez cache `createRuntimeStore`; zapis przez `STORE.set()` lub zgodny adapter `STORE.storage`; zatwierdzenie oczekiwane przed końcem akcji użytkownika |
| Historia, ciężary, pomiary i ustawienia | `LS.get/set/del`, `saveAll`, `commitActiveState` oraz import łączeniowy kierują do adaptera; brak zapisów do starych kluczy po przełączeniu |
| Import ZIP v5 / pełne odtworzenie JSON v4 | Walidacja i podgląd → jawna zgoda → jedna transakcja obejmująca rekordy, wskaźniki oraz partie interpretacji/grafik → kontrola odczytu |
| Eksport ZIP v5 | Odczyt po opróżnieniu kolejki z aktywnego adaptera; uwzględnia historię, plany, custom, pomiary, ciężary, ustawienia, aktywną sesję i drafty |
| Potwierdzenie pliku | ZIP/JSON jest najpierw przygotowany; osobny klik uruchamia `share()` albo pobieranie w aktywnym geście. Na iOS instrukcja każe jawnie wybrać „Zapisz w Plikach” i sprawdzić plik |
| Eksport awaryjny | Gdy IndexedDB zawiedzie, dostępny cache w pamięci może zostać wyeksportowany jako JSON v4 z ostrzeżeniem, że integralność/odzyskanie nie są gwarantowane |
| Usuwanie kluczy/rekordów | `STORE.delete()` albo `STORE.storage.removeItem()` usuwa wyłącznie z aktywnego magazynu; nie czyści źródłowego snapshotu |
| Offline | Service Worker precache'uje stronę, moduł bazowy, `gv-data.js`, bibliotekę ZIP oraz istniejące zasoby aplikacji |

## Awaria, odzyskiwanie i granice cofania

- **Brak miejsca przy zapisie znacznika selektora:** migracja zatrzymuje się przed przygotowaniem; trybem aktywnym pozostaje `localStorage`.
- **Przerwanie przed zatwierdzeniem wskaźnika:** przygotowane rekordy są nieaktywne. Przy ponownej dostępności bazy źródło nadal jest używane; ponowienie migracji zastępuje rekordy tej samej generacji.
- **Niezgodna suma lub zmienione źródło:** wskaźnik nie jest aktywowany; należy ponownie wykonać i zweryfikować eksporty.
- **IndexedDB niedostępne po przełączeniu:** zapisy zostają zablokowane, aplikacja pokazuje błąd i może zaoferować eksport tego, co jest dostępne w pamięci. Nie przełącza się na `localStorage`.
- **Niepewny wynik przywracania po zatwierdzeniu:** komunikat nie obiecuje bezstratnego rollbacku; aplikacja oferuje eksport dostępnego stanu. Transakcja może już być zatwierdzona.
- **Powrót do starej wersji aplikacji:** `localStorage` przedstawia tylko migawkę z czasu przełączenia. Treningi zapisane potem w IndexedDB nie pojawią się w starej wersji. Nie należy traktować tego jako bezstratnego cofnięcia.
- **Odtworzenie kopii:** aktywny trening jest opcjonalny, drafty są wybierane oddzielnie, a timer po odtworzeniu ma stan nieaktywny. Żaden timer ani powiadomienie nie jest automatycznie uruchamiane.

## Ograniczenia weryfikacji

Testy w repozytorium i zgłoszony test iOS QA używały wyłącznie syntetycznych wartości. Funkcjonalną migrację wykonano na fizycznym iPhonie w środowisku QA, ale nie wykazano pełnej zgodności liczników/ID/sum kontrolnych ani oddzielnej trwałości niezapisanych draftów. Nie testowano migracji rzeczywistych danych właściciela. Przed ewentualnym, osobno zatwierdzonym wdrożeniem nadal wymagane są decyzja właściciela, sprawdzona kopia konkretnego urządzenia i weryfikacja po migracji; E2E Edge nie zastępuje tych kontroli.

## Analiza granicy `dataSchemaVersion: 3`

### Stan obecny

Ta gałąź zapisuje wartości aplikacji w rekordach runtime IndexedDB i zachowuje dotychczasowe klucze oraz kształty legacy jako źródło zgodności. `DB_VERSION = 4` opisuje wersję struktury object stores IndexedDB, a `version = 5` kopii ZIP — format archiwum. Żadna z nich nie jest wersją modelu domenowego. Nie deklarujemy, że bieżące rekordy lub ZIP v5 realizują `dataSchemaVersion: 3`.

### Elementy wymagane przez §2.1, których obecny model jeszcze nie realizuje

- **Wersjonowanie modelu domenowego:** brak kanonicznego `dataSchemaVersion: 3` na nowym modelu sesji/kopii; nie istnieje kompletna, walidowana konwersja legacy → v3.
- **Snapshot wykonania serii:** sesje i serie runtime nadal opierają się na polach legacy. Brakuje kompletnego, obowiązkowego zapisu `variantId`, `exerciseInstanceId`, `repsUnit`, `loadUnit`, `executionMode`, `implementCount` i `trainedSides` dla nowo wykonanej serii oraz jej snapshotu metadanych katalogu.
- **Jednostronne/asymetryczne wyniki:** brak kanonicznego `sideResults` z jednym UUID serii i wynikiem jednej lub dwóch stron. Nie ma jeszcze kontraktu pełnego zapisu i walidacji stron w UI, normalizacji ani raportach.
- **Rozdzielenie metryk:** brak w pełni wdrożonych, niezależnych wartości `externalVolume`, `externalVolumeStatus`, `repsTotalMovements` i `repsPerSide` zgodnych z tabelą §3.3. Wartości `totalVolume`/`totalReps` legacy są zachowywane, ale nie są przez to równoważne nowym metrykom.
- **Stan sesji v3:** nie wszystkie sesje mają jawne `startedAt`, `finishedAt`, `localDate`, `timeZone`, `status` i `sourceSchemaVersion`. Aktywny trening i drafty są zachowane jako zgodne klucze runtime, a nie w pełni znormalizowany graf encji v3.
- **Identyfikatory i relacje v3:** UUID/deterministyczne ID istnieją dla nowych oraz normalizowanych rekordów historii, ale nie definiują jeszcze kompletnego modelu encji, relacji do instancji ćwiczeń w planie oraz walidacji integralności domenowej v3.
- **Katalog i warianty:** aktualna konfiguracja aplikacji nie stanowi zatwierdzonego, pełnego katalogu 31 ćwiczeń i 4 wariantów z wymaganymi metadanymi wykonania. Stary katalog nie może służyć do wstecznego zgadywania wariantu ani interpretacji historii.

### Zależności etapowe

1. **GV-IMG-META (osobna zgoda właściciela):** normatywna mapa metadanych 31 ćwiczeń i 4 wariantów oraz walidacja ich kompletności. Ten etap jest prerekwizytem określonym w §3.4 dla konsumentów nowych serii. Niniejsza analiza go nie rozpoczyna ani nie zmienia jego zakresu.
2. **GV-DB (osobna zgoda właściciela):** interfejs tworzenia nowej serii musi zapisywać snapshot wariantu, jednostek, trybu, liczby przyrządów/stron i wyników stron, a sesja — jawny status i czasy. Kreator interpretacji legacy z §2.5 może dopisać wyłącznie osobne, potwierdzone reguły, nigdy modyfikować oryginalnych metryk.
3. **GV-COMP / GV-PROG / GV-RPT (osobne etapy):** metryki i raporty muszą rozróżniać legacy totals od nowych metryk zewnętrznych; rekordy `unknown` muszą pozostać poza porównywalnymi sumami. Nie wolno wymagać migracji lub interpretacji tych wartości przez zmianę historycznych pól.
4. **Walidator, kopie i migracja:** przed konwersją potrzebne są zatwierdzone definicje walidacji v3, fixture'y dla v1/v2/v4 i dane niejednoznaczne, porównanie liczebności/identyfikatorów oraz niezależne kontrole eksportu. v4 JSON pozostaje formatem zgodności; ZIP v5 pozostaje formatem kopii, dopóki właściciel nie zatwierdzi jawnego kontraktu zawartości v3.

### Proponowany bezpieczny podział przyszłych prac — do decyzji właściciela

1. **Kontrakt i walidacja bez migracji:** określić granice encji oraz walidator v3 dla sesji, serii, stron, metryk i stanów aktywnych; nie przepisywać istniejących danych.
2. **Katalog metadanych:** po zatwierdzeniu GV-IMG-META udostępnić wersjonowany katalog ćwiczeń/wariantów i testy kompletności.
3. **Zapis nowych treningów v3:** po osobnym zatwierdzeniu GV-DB zapisywać nowe sesje i serie w v3 z snapshotami wykonania oraz osobnymi metrykami; stare rekordy pozostawić legacy.
4. **Interpretacja legacy jako danych pochodnych:** wdrożyć osobne potwierdzenia użytkownika zgodnie z §2.5, z możliwością wycofania reguły i bez zmiany źródłowych rekordów.
5. **Konwersja/eksport pełnego modelu:** dopiero po testach zgodności i jawnej akceptacji właściciela rozważyć opcjonalne, idempotentne mapowanie do kopii v3. Zachować oryginalny magazyn, pokazać raport rozbieżności i nie aktywować konwersji po niejednoznaczności.

To jest analiza i propozycja kolejności, nie zatwierdzona strategia produktu. Nie dodano nowego modelu, migracji domenowej ani deklaracji zgodności v3.
