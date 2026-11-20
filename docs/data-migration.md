# GV-DATA — plan migracji i odzyskiwania

## Zakres i stan wdrożenia

Warstwa `createRuntimeStore()` rozpoczyna pracę w trybie `localStorage`. To nadal jedyne źródło bieżących danych, dopóki użytkownik nie uruchomi ręcznej procedury w aplikacji. Kod nie wykonuje migracji automatycznie przy starcie. Na prawdziwym iPhonie migracji nie uruchamiano.

Ręczna procedura wymaga kolejno:

1. aktywnego Service Workera i potwierdzenia, że otwarte jest tylko jedno okno GymVerse;
2. utworzenia pliku JSON v4 ze stanu źródłowego oraz świadomego potwierdzenia jego zapisania i sprawdzenia;
3. utworzenia ZIP v5 ze stanu aplikacji, jego ponownego odczytu i walidacji oraz potwierdzenia przez użytkownika zapisania kopii;
4. ponownego sprawdzenia liczby okien i sumy źródła;
5. osobnego, końcowego potwierdzenia przełączenia.

Eksporty nie są automatycznie traktowane jako zapisane. Użytkownik sprawdza pliki w wybranym miejscu. Aplikacja nie zmienia `main`, nie publikuje migracji i nie czyści źródłowych kluczy `localStorage`.

## Struktura IndexedDB i aktywny magazyn

Baza `gymverse-db-v3` jest podnoszona do schematu IndexedDB 4. Dane aplikacji są przechowywane jako surowe wartości JSON w `runtimeRecords`, z identyfikatorem generacji i kluczem aplikacji. Wskaźnik `meta.runtimeActive` zawiera generację, wersję schematu, liczbę kluczy i SHA-256 kanonicznego snapshotu. `meta.runtimeRevision` wykrywa zapis oparty na nieaktualnym stanie innej karty. Potwierdzone interpretacje i grafiki mają osobne magazyny.

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

Testy używają wyłącznie syntetycznych wartości. Test przełączenia na urządzeniu iOS/Safari oraz test z rzeczywistym eksportem właściciela pozostają obowiązkowym krokiem przed przyszłym, osobno zatwierdzonym wdrożeniem. Obecne E2E Edge nie zastępują tego testu.
