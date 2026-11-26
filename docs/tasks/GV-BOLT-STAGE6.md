# GV-BOLT-STAGE6 — podetap 6.1

## Autoryzacja 6.2 — 24.11.2026

Właściciel zaakceptował 6.1 i autoryzował wyłącznie czterostopniowy kreator tworzenia i edycji istniejącego profilu: nazwa; wiek/wzrost/waga/płeć; doświadczenie/powrót; sprzęt/ograniczenia i podsumowanie. Zachować opcjonalność, anulowanie, tożsamość, istniejące transakcje, izolację i kopie. Bez pola celu, zmian schematu lub etapu 6.3. Testować na syntetycznych danych, Edge i desktop WebKit, oba motywy 320–430 px; do oceny właściciela, bez publikacji.

### Wynik 6.2 — do oceny

**24.11.2026 — poprawka kroku 4 w realizacji:** właściciel akceptuje funkcję 6.2 i kroki 1–3, zleca wyłącznie ergonomiczny wybór sprzętu i ograniczeń oraz podsumowanie. Bez zmiany modelu lub etapu 6.3. Weryfikacja syntetyczna, Edge i WebKit, motywy 320–430 px.

**Wynik do oceny:** opcje sprzętu są checkboxami, a ograniczenia mieszczą wzorce ruchowe, osobno rozwijane ćwiczenia i wcześniejsze niestandardowe wartości. UI synchronizuje dotychczasowe listy `equipment` i `restrictions`, zachowując identyfikatory i wielokrotny wybór. Podsumowanie zawiera pięć sekcji, liczby i wybrane nazwy; brak wyboru opisuje jako „Nie wybrano”. Model profili, formaty kopii oraz poprzednie kroki bez zmian; cache v38. Zrzuty `outputs/GV-BOLT-STAGE62-CHOICES/screenshots/`.

Świeże testy: jednostkowe 141/141; Edge 46/46 (kreator, profile, kopie), desktop WebKit 24/24; osobno Tab/Spacja i symulowany dotyk po 1/1 w każdym silniku. Sprawdzono oba motywy przy 320/375/390/430, syntetyczny ZIP z wyborem i nietypowym ograniczeniem, dwa profile, anulowanie i odznaczanie. Fizyczny iPhone/Safari pozostaje niezweryfikowany. Bez 6.3, commit, merge, push i deploy.

Cztery kroki wykorzystują istniejące kontrolki i `profile-model.js`; wymagają wyłącznie nazwy, pozostałe dane pozostają opcjonalne. Nawigacja w przód/wstecz zachowuje wpisy w pamięci widoku; podsumowanie reaguje na wybór sprzętu i ograniczeń. Anulowanie usuwa niezapisany szkic z formularza. Odczyt i edycja zachowują także wcześniej zapisane dopuszczalne ograniczenia, których nie ma na standardowej liście. Pierwszy profil nadal używa technicznego profilu domyślnego; zapis dopiero po kroku 4, po sukcesie przejście do wyboru planu. Błąd transakcji pozostawia kreator i wpisy do ponowienia. Bez modyfikacji schematu, identyfikatorów, modelu kopii lub generatora; cache v37.

Testy świeże: `npm test` 141/141; Edge 13/13 końcowy kreator, 22/22 wcześniejszy przebieg kreatora i kopii, 41/41 wcześniejsze profile/powitanie i 43/43 nawigacja/timer; desktopowy WebKit 13/13 końcowy kreator. Testy obejmują błąd zapisu, anulowanie, przełączenie i usunięcie dwóch syntetycznych profili, ostatni profil, kopię ZIP i zapisane serie/historię. Oba motywy i szerokości 320/375/390/430; bez deklarowania fizycznego iPhone/Safari lub faktycznej klawiatury ekranowej. Początkowy test przełączania wymagał oczekiwania na inicjalizację i przeładowanie, a opóźniony `toggle` mógł resetować krok; poprawiono obsługę oraz testy, następne pełne zestawy przeszły. Zrzuty `outputs/GV-BOLT-STAGE62/screenshots/`, logi `outputs/GV-BOLT-STAGE62-*.log`. Bez etapu 6.3/6.4 i bez publikacji.

24.11.2026 właściciel zatwierdził wyłącznie powitanie zależne od `onboardingRequired`, cztery ścieżki wyboru planu i bezpieczny podgląd istniejących planów. Wykorzystać istniejące funkcje profilu, importu, edytora, generatora i uruchamiania treningu; bez nowego trwałego modelu, przypisania, React, migracji danych, etapu 6.2 ani publikacji. Zachować wszystkie zastane zmiany. Testy na syntetycznych danych; Edge i desktopowy WebKit, 320–430 px LIGHT/DARK, scenariusz offline w zakresie dostępnym w środowisku.

## Wynik 6.1 — do oceny właściciela

Powitanie korzysta z `onboardingRequired`, otwiera dotychczasowy formularz technicznego profilu lub istniejący wybór pliku ZIP/JSON. Po zapisaniu pierwszego profilu pokazuje wybór ścieżki; dostęp do wyboru z ekranu planów pozostaje również po przełączeniu profilu. Cztery ścieżki prowadzą do istniejącej listy, edytora, generatora i ekranu planów. Podgląd odczytuje rzeczywiste rekordy, pokazuje warianty, serie, zakresy i przerwy, nie zapisuje i nie uruchamia sesji; osobny przycisk używa `startWorkout` z istniejącą ochroną aktywnej sesji. Trwałego przypisywania nie wprowadzono. Offline cache v34.

Świeże testy: jednostkowe 141/141; Edge celowana regresja profili/kopii/timera i widoków 75/75 (przed końcowym kosmetycznym CSS i rozszerzeniem testów), finalne 6.1 12/12; desktopowy WebKit 12/12. Nowy test przywraca syntetyczny ZIP przez przycisk powitalny i sprawdza jedyny przywrócony profil; test podglądu porównuje zawartość localStorage i brak aktywnej sesji. Test aktywnej sesji sprawdza brak zmian i wznowienie. Przerwanie lokalnego serwera po cache v34: nowe widoki otwierają się w Edge i desktopowym WebKit. LIGHT/DARK 320/375/390/430, bez poziomego przewijania. Logi `outputs/GV-BOLT-STAGE6-*.log`; zrzuty `outputs/GV-BOLT-STAGE6/screenshots/`. Fizyczny iPhone/Safari oraz emulacja `setOffline` WebKit pozostają ograniczeniami.

## Wstępna propozycja przyszłego kontraktu — nie wdrożono

- `profile.attributes.trainingGoal`: opcjonalna wartość ze słownika uzgodnionego z generatorem, niezależna od `gymverse_goal` dla masy; brak oznacza brak deklaracji. Stare profile i ID zachować.
- Plan nadrzędny: opcjonalny stabilny identyfikator grupy i uporządkowane odniesienia do istniejących identyfikatorów planów-dni; rekord dnia zachowuje obecne pola i identyfikator. Nie zgadywać grupy na podstawie nazwy ani `dayOfWeek`, nie migracją przy otwarciu. Szczegółowe miejsce przechowywania pozostaje do zatwierdzenia, bo `cleanPlan` usuwa nieznane pola.
- Przyszłe przypisanie: jawna relacja aktywnego profilu do zatwierdzonego identyfikatora planu nadrzędnego, bez automatycznego uruchamiania lub nadpisania treningu. Wybrać sposób obsługi usuniętej grupy i kolizji.
- Przed implementacją: dowieść zgodności syntetycznym round-trip ZIP v5, importem v4, przełączaniem profili, konfliktami i rollbackiem; ustalić zachowanie starszej wersji. Brak gwarancji zgodności na podstawie samej propozycji.

## Poprawki końcowe 6.1 — 24.11.2026

Właściciel zaakceptował funkcje i zażądał samodzielnego powitania. Przy `onboardingRequired` zwykły pulpit, zarządzanie planami i nawigacja są ukryte; tworzenie profilu otwiera dotychczasowy formularz z możliwością powrotu, a przywracanie istniejący importer. Pominięcie widoczne jest w wyborze planu po konfiguracji, nie na powitaniu. Po zapisie pierwszego profilu wybór czterech ścieżek jest dostępny, a panel zarządzania pozostaje zwinięty. Model profilu i logika kopii bez zmian.

Nagłówek powitania otrzymał jawny krój `Source Sans 3`, z systemowym `Segoe UI` jako alternatywą, wagę 700, line-height 1.2 i normalne odstępy; wcześniejsza reguła nagłówków używała Barlow Condensed z zastępczym Impact oraz line-height 1.05. Cache v35. Zrzuty `outputs/GV-BOLT-STAGE6-WELCOME/screenshots/`.

Świeże testy: jednostkowe 141/141; Edge 30/30 dla powitania, kopii i wyboru planu, 19/19 starszej nawigacji/zarządzania profilami, 6/6 wybranych scenariuszy profili, offline, v4 i edytora; WebKit 20/20. Dodatkowy test zrzutu po zniknięciu komunikatu 1/1. Wcześniejsze próby szerszej regresji przerwano po wykryciu przestarzałego pomocniczego kodu otwierającego panel przed zakończeniem inicjalizacji; testy dostosowano i uruchomiono ponownie w wskazanych zestawach. Bez pełnej regresji wszystkich plików. Fizyczny iPhone/Safari niezweryfikowany. Do końcowej oceny właściciela; bez 6.2 i publikacji.
