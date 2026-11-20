# Migracja i kopie danych GymVerse

## Format kopii ZIP v5

Archiwum zawiera `manifest.json`, `data.json`, `settings.json` oraz `checksums.json`. Opcjonalne grafiki użytkownika są umieszczane w `custom-media/`. SHA-256 obejmuje każdy plik ładunku poza manifestem i samym plikiem sum kontrolnych. Import sprawdza ścieżki, duplikaty, dozwolone typy, sygnatury obrazów, rozmiary przed dekompresją, liczbę wpisów i sumy.

`data.json` rozdziela snapshot kluczy legacy od potwierdzonych lokalnie interpretacji historii. `settings.json` zawiera dozwolone ustawienia aplikacji. Kopia może obejmować aktywny trening, drafty i własne grafiki; przy odtworzeniu użytkownik wybiera osobno, czy przywrócić aktywny trening i drafty. Grafiki trafiają do osobnego magazynu IndexedDB. Pełne odtworzenie zastępuje klucze GymVerse, ale zachowuje niepowiązane wpisy `localStorage`.

Eksport jest przygotowywany po działaniu użytkownika. Aplikacja prosi o potwierdzenie, że plik został zapisany; anulowanie arkusza udostępniania lub brak potwierdzenia nie oznacza trwałego backupu. Import najpierw weryfikuje i pokazuje liczbę rekordów, potem żąda jawnego potwierdzenia. JSON v4 pozostaje obsługiwany w trybie łączeniowym i pełnym odtworzeniu.

## Walidator lokalny

Uruchom `node tools/validate-backup.js <plik.json>` dla JSON legacy albo `node tools/validate-backup.js <plik.zip>` dla ZIP v5. Wyjście zawiera wyłącznie liczniki, klucze schematu, skrót i kody anomalii; nie wypisuje nazw własnych ćwiczeń, ciężarów, danych sesji ani ścieżki źródłowej.

## Migracja

Aktywną ścieżką aplikacji jest `createRuntimeStore()`: startuje w `localStorage`, oferuje ręczne przygotowanie eksportów i dopiero po potwierdzeniu użytkownika oraz walidacji przełącza wskaźnik IndexedDB. Dane źródłowe pozostają zachowane; osobny klucz sterujący wskazuje aktywny magazyn. Snapshot sprawdza liczbę rekordów, identyfikatory, schemat i SHA-256 przed zatwierdzeniem. `stageLegacyMigration` pozostaje pomocniczym walidatorem/stagerem snapshotu i nie przełącza runtime aplikacji. Pełna procedura i odzyskiwanie są opisane w [data-migration.md](data-migration.md).

Interpretacje legacy są trzymane w osobnym magazynie IndexedDB, ze źródłem `user_confirmed`, wersją reguły i referencjami do wybranych sesji; surowe rekordy historii nie są przez nie nadpisywane.

Sama obecność danych w IndexedDB nie gwarantuje ich trwałego zachowania. `requestStoragePersistence` zwraca faktyczny status `persistent`, `best-effort` albo `unsupported`; nie gwarantuje trwałości. Po migracji cofnięcie do starej wersji aplikacji odtworzy w niej tylko stan zachowany w `localStorage` w chwili migracji. Późniejsze dane zapisane wyłącznie w IndexedDB nie będą widoczne w starej aplikacji.
