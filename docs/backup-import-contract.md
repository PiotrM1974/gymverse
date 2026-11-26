# Kontrakt kopii i importu — dla ChatGPT Work / Bolt

## Własność danych

Produkcyjny model i adaptery pozostają w repozytorium Codex. UI Bolt może wywoływać kontrakt poniżej po osobnym zatwierdzeniu integracji. Nie zastępować go modelem demonstracyjnym.

## Plik

Ten sam przycisk „Zapisz kopię” tworzy ZIP v5 (app=gymverse, schema=legacy-storage-snapshot). Manifest ma exportType=full-application, scope=all-local-profiles, wersję, datę i liczniki. Archiwum zawiera manifest.json, data.json, settings.json, checksums.json oraz opcjonalne media. SHA-256 i walidacja struktur sprawdzane przed zapisem. Nie jest to domenowy dataSchemaVersion=3.

Snapshot zawiera dozwolone klucze gymverse_*: rejestr wszystkich profili, parametry/preferencje, przypisane plany (własne/generowane/zmienione gotowe), per-exercise restSeconds, historię i źródłowe serie, last weights, pomiary, cele, ustawienia gryfu/odpoczynku/deload, metadane progresji we właściwych planach, aktywną sesję, drafty i istniejącą kopię historii. Aktywny profil jest synchronizowany w kopii z bieżącymi kluczami, niezależnie od starszego snapshotu rejestru. Własne media i potwierdzone interpretacje legacy są eksportowane osobno dla każdego profilu. Nie eksportuje się cache SW ani danych innych aplikacji.

Odbudowa statystyk i „Poprzednio” korzysta z tej samej historii; nie ma równoległej bazy importu. Ilustracje techniki i MuscleMap są zasobami aplikacji, a nie prywatnymi danymi kopii.

## Operacje

- Wczytanie pliku → walidacja → analiza bez zapisu → ekran „Import kopii GymNastika”.
- Podgląd: lista nazw profili z liczbą planów/sesji, sumy nowych/obecnych/konfliktujących treningów i nowych profili. Nazwy/teksty są renderowane jako tekst.
- Pusta aplikacja na etapie onboardingu: przywrócenie pliku wraz z profilami. Wybór użytkownika zastępuje kreator pustego profilu.
- Istniejący profil o zgodnym stabilnym ID: dodanie brakujących sesji, planów, pomiarów i brakujących własnych ćwiczeń/last weights. Istniejące ustawienia, aktywna praca, drafty i decyzje progresji mają pierwszeństwo. Konflikty pozostają lokalne, użytkownik widzi ich liczbę i typy.
- Inne ID: oddzielny profil z zachowaniem oryginalnego ID. Nazwa nie uczestniczy w rozpoznawaniu tożsamości.
- Historyczny legacy-default-profile jest wspólnym identyfikatorem technicznym dawnych instalacji: przy jego dopasowaniu UI wymaga jawnego potwierdzenia tożsamości; użytkownik może anulować.
- Starszy ZIP bez rejestru profili: obowiązkowe potwierdzenie przypisania do aktywnego profilu. v4 JSON zachowuje dotychczasowy adapter i potwierdzenie ze wskazaniem profilu; plik nie identyfikuje właściciela.
- Pełne zastąpienie danych jest osobnym wyborem, z dalszymi potwierdzeniami i oddzielnym wyborem sesji/draftów.
- Gdy bieżące dane nie pozwalają bezpiecznie przygotować scalenia, przycisk uzupełnienia znika. Można anulować lub jawnie przejść do pełnego restore, jeśli istniejąca ścieżka potrafi zabezpieczyć stan.

## Tożsamość rekordów i konflikty

Stabilne ID sesji mają pierwszeństwo. Jednakowa data nie identyfikuje sesji. Porównanie treści normalizuje daty, liczby, domyślny wariant i numer serii; pomija pochodne totalVolume/totalReps przy obecnych seriach oraz etykiety ćwiczeń z katalogu. Zachowuje źródłowe wyniki, kolejność, metadane i relacje. Brak ID: ostrożne porównanie treści z licznikiem wielokrotności identycznych sesji. Ten sam ID z inną treścią to konflikt, nie duplikat. Konflikt definicji własnego ćwiczenia blokuje zależne sesje i plany. Nie łączy się różnych nazwanych użytkowników na podstawie podobieństwa nazw.

## Zapis i awarie

Przed uzupełnieniem przygotowywana jest zwalidowana kopia bieżącego stanu z auxiliami. Po podglądzie ponownie sprawdzany jest stan źródłowy. Wynik przygotowuje się w tym samym ZIP v5 i przekazuje istniejącej funkcji restoreBackupV5. IndexedDB zapisuje dane i auxilia transakcyjnie. Ścieżka localStorage ma odczyt kontrolny i rollback; przy błędzie uzupełnienia podejmowana jest próba odzyskania przygotowanej kopii. Jeśli odzyskiwanie również zawiedzie, UI zgłasza niepewną integralność i oferuje istniejący eksport awaryjny. Nie obiecuje bezwarunkowego cofnięcia przy awarii samego magazynu. Brak sukcesu przed potwierdzeniem zapisu.

Aktywne serie są zachowywane. Odtworzone timery są zatrzymane, także w nieaktywnych profilach. Dane pomocnicze łączone są po ID reguły/nazwie pliku, lokalne konflikty mają pierwszeństwo.

## iPhone i granice publikacji

Dotychczasowe file delivery wymaga osobnego gestu do pobrania/share; użytkownik ma zapisać plik poza pamięcią aplikacji (Pliki / iCloud Drive). Standardowy wybór pliku służy do importu. Lokalna kopia przygotowana w pamięci nie chroni przed wyczyszczeniem Safari.

Nie deklarujemy fizycznego iPhone, Safari/PWA ani WebKit bez testów. Autentyczny eksport poprzedniej wersji właściciela pozostaje osobnym, oczekującym kryterium PRZED PUBLIKACJĄ. Historyczny fixture v4 jest wynikiem oryginalnego eksportera na danych syntetycznych, nie prywatnym eksportem właściciela.
