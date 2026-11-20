# GV-DATA — ochrona danych, migracja i kopie zapasowe

Wykonuj wyłącznie GV-DATA na gałęzi `feature/gv-data`, bazując na zatwierdzonym GV-BASE-B. Normatywne wymagania znajdują się w `docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`, przede wszystkim §§2.3–2.5, 8, 14.2 i 15.

Zakres obejmuje anonimowy lokalny walidator eksportów JSON v4 i ZIP v5, niedestrukcyjne i idempotentne przygotowanie/migrację snapshotu legacy do IndexedDB z kontrolą integralności przed przełączeniem wskaźnika, eksport/import kopii v5 ZIP, zgodność importu legacy JSON v4, lokalne interpretacje niejednoznacznej historii bez zmiany rekordów źródłowych oraz syntetyczne testy awarii i ochrony danych. Dla ZIP można użyć przypiętej biblioteki `@zip.js/zip.js`; archiwum musi mieć sumy SHA-256, limity rozmiaru/liczby wpisów oraz walidację ścieżek i typów plików.

Nie odczytuj prawdziwych danych użytkownika ani eksportów z urządzeń. Nie zapisuj ich w repozytorium. Zachowaj `localStorage` źródłowe. Najpierw waliduj i pokaż podgląd; zapis/aktywacja dopiero po jawnej decyzji. Nie obiecuj rollbacku bez utraty późniejszych danych IndexedDB. Nie implementuj Web Push, nie zmieniaj konfiguracji Pages ani master promptu. Nie scalaj, nie publikuj i nie wdrażaj bez nowej zgody.

Wszystkie testy danych muszą używać syntetycznych fixture'ów. Nie rozstrzygaj automatycznie nierozstrzygalnych duplikatów ani semantyki historycznych ćwiczeń; zapisz je jako wymagające decyzji użytkownika.
