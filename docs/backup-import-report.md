# Pełna kopia i inteligentny import — raport 24.11.2026

## Wynik

Rozszerzono istniejący mechanizm ZIP v5, bez drugiego systemu kopii i bez migracji do modelu Bolt. Implementacja i testy lokalne Edge są zakończone. Publikacja pozostaje zablokowana do osobnej zgody właściciela oraz weryfikacji autentycznego eksportu poprzedniej wersji. Fizyczny iPhone/Safari pozostają niezweryfikowane.

## Co zastano i co zmieniono

Zastany eksporter obejmował już profile, aktywne klucze użytkownika, plany, historię, ustawienia, sesję/drafty i auxilia wszystkich profili. Brakowało bezpiecznego porównania ZIP z bieżącym stanem i ekranu wyboru uzupełnienia.

- Ten sam eksport synchronizuje w pliku dane aktywnego profilu z bieżącym magazynem. Nie kopiuje starego snapshotu jako aktualnego stanu.
- ZIP v5 pozostaje zgodny z wcześniejszym czytnikiem; manifest dodaje `exportType: full-application` i `scope: all-local-profiles`.
- Dodano czysty planner i ekran podglądu w `src/features/backup/import-plan.js` i `import-preview.js`.
- Profile są porównywane po ID; różne ID oznaczają osobne profile. Wspólny techniczny legacy-default-profile wymaga jawnego potwierdzenia użytkownika. Starszy ZIP bez rejestru wymaga wskazanego aktywnego profilu i potwierdzenia przypisania.
- Uzupełnianie dodaje nieobecne sesje, plany, pomiary i brakujące wpisy map. Zachowuje lokalne ustawienia, progresję, zakończone serie, aktywną pracę oraz drafty. Identyczne rekordy pomija; konflikty zgłasza i zachowuje lokalne wartości.
- Konflikt własnego ćwiczenia blokuje zależne sesje/plany. Potwierdzone interpretacje odnoszące się do konfliktującej sesji nie są dopisywane do zachowanej lokalnej sesji.
- Deduplikacja rozróżnia stabilny ID od technicznie wygenerowanego identyfikatora legacy, normalizuje daty/liczby i pomija pochodne statystyki oraz etykiety katalogowe. Zachowuje wielokrotność identycznych sesji legacy.
- Zachowano czytniki historycznego JSON v4 i starszego ZIP v5. Nieznane historyczne ćwiczenia pozostają oznaczonymi, przenośnymi danymi bez zgadywania mapowania.
- Weryfikacja struktury obejmuje również zapisane dane nieaktywnego profilu, typy surowych wartości i jego wersję schematu; błędny zagnieżdżony profil odrzuca kopię.
- Przed scaleniem przygotowywana jest zweryfikowana kopia stanu z auxiliami. Po podglądzie sprawdzana jest aktualność stanu. Zapis używa istniejącego restoreBackupV5, transakcji IndexedDB lub kontroli odczytu/rollback localStorage. Błąd nie jest przedstawiany jako sukces; awaria odzyskiwania uruchamia dotychczasowy komunikat o niepewnej integralności i możliwość eksportu awaryjnego.
- Gdy obecny stan nie daje się bezpiecznie porównać, uzupełnianie jest niedostępne. Zachowano osobny, świadomy wybór pełnego przywracania.
- Odtwarzane timery są zatrzymane także w profilach nieaktywnych. Sesje i zapisane serie pozostają dostępne.
- Lokalny cache podniesiono z v26 do v27 i dodano oba moduły do offline precache. Nie publikowano aktualizacji.

Nie zmieniano zatwierdzonych ilustracji, MuscleMap, architektury produkcyjnej ani kodu Bolt. Nie tworzono subagentów, gałęzi ani worktree. Zachowano wszystkie zastane zmiany.

## Format i dostarczenie pliku

ZIP v5: manifest.json, data.json, settings.json, checksums.json, opcjonalne grafiki. SHA-256 obejmuje payloady. Model pozostaje `legacy-storage-snapshot`, nie domenowy schema v3. Manifestowe liczniki historycznej warstwy odnoszą się do aktywnego snapshotu; nowy podgląd sumuje dane wszystkich profili. Parametry profili są w rejestrze, czasy odpoczynku/progresja i kolejność w planach, historia zawiera źródłowe serie. Auxilia są wydzielone według profilu. Cache przeglądarki i zasoby demonstracyjne nie są kopiowane.

Zachowano istniejące pobranie/share w osobnym geście użytkownika i standardowy wybór pliku. Zapis do iOS Pliki/iCloud Drive zależy od działania przeglądarki i świadomego zapisania pliku poza PWA. Kopia robocza w pamięci nie chroni przed wyczyszczeniem danych Safari.

## Świeże wyniki

- Unit: **141/141**, 17 plików, w tym 11 nowych testów plannerów/ochrony importu w smart-backup.test.js.
- Pełny zwykły katalog Edge: **147/147**, 4 workery, log `outputs-smart-backup-verified.log`.
- Ilustracje/pilot: **12/12**, log `outputs-smart-backup-pilot.log`.
- Oddzielny nagłówek: **1/1**, wykonany w tej sesji z `playwright.header.config.js`.
- Razem **160 unikalnych E2E Edge**. Powtórek nie sumować.
- Po ostatnich zmianach warstwy danych powtórzono cały zestaw danych/profili/legacy/aktywnej sesji: **92/92**, log `outputs-smart-backup-data-confirmed.log`.
- Po końcowej walidacji nieaktywnych profili powtórzono dotknięte pliki: **53/53**, log `outputs-smart-backup-registry-validation.log`.
- Dodatkowy końcowy smart-backup: **10/10**, log `outputs-smart-backup-smart-final.log`.
- LIGHT/DARK: podgląd przy 320, 390 i 430 px; brak poziomego overflow, zrzuty w outputs/GV-SMART-BACKUP. Obrazy 320 px obu motywów obejrzano; nagłówek i przyciski są czytelne.
- WebKit: świeża próba jednego scenariusza nie wystartowała, bo brak `webkit-2215/Playwright.exe`; wynik nie jest dowodem zgodności. Log `outputs-smart-backup-webkit.log`.
- `git diff --check`: PASS, tylko ostrzeżenia LF/CRLF zastanych plików. Node 26.13.0 zgodny z .node-version.

Pierwsze przebiegi ujawniły wyścigi inicjalizacji w dwóch testach oraz zbyt wczesne wpisywanie serii po zmianie ćwiczenia. Testy czekają teraz na faktyczny stan UI/magazynu. Duży plik testowany bez kosztownego trace payloadu; błędy wcześniejszych przebiegów nie są wliczane do końcowych wyników. Synchronizację snapshotu aktywnego profilu sprawdzono względem pobranego pliku i danych źródłowych, zamiast porównywać kopię do starego cache rejestru.

## Macierz 16 wymagań

| Kryterium | Dowód świeżej weryfikacji |
|---|---|
| 1. Pełny eksport jednego profilu | phase0-export-compatibility: UI download + clean offline restore; profiles: JSON profilu |
| 2. Eksport wielu profili | phase0-export-compatibility: downloaded multi-profile backup; gv-data: registry + auxiliary round-trip |
| 3. Pusta aplikacja | smart-backup: empty onboarding restores complete backup |
| 4. Plany i historia | pełne porównanie kluczy w phase0 multi-profile i unit closure-profile-roundtrip |
| 5. Poprzednio | smart-backup empty restore: 41 kg × 8; phase0 historical: 75×8, 70×10, 65×12 |
| 6. Starsza kopia do nowszego profilu | smart-backup supplementation; planner zachowuje bieżące wartości |
| 7. Wyłącznie brakujące sesje | unit 80 wspólnych + 15 nowych; E2E częściowe pokrycie |
| 8. Ponowny import | każdy z sześciu scenariuszy LIGHT/DARK importuje ten sam ZIP ponownie |
| 9. Konflikty ID | smart-backup: zachowanie lokalnego wyniku; unit: konflikty sesji, własnych ćwiczeń i interpretacji |
| 10. Inny profil | smart-backup different profile + auxiliary test; identyczna nazwa nie scala ID |
| 11. Starszy plik bez profilu | v4 w profiles/base-b/phase0; stary ZIP w gv-data; jawne przypisanie |
| 12. JSON i wersje | closure-21 invalid import; unit: nieobsługiwany schemat i uszkodzony JSON nieaktywnego profilu |
| 13. Przerwanie/odzyskiwanie | smart-backup failed merge → niezmieniona historia → udane ponowienie; gv-data i base-b: transakcje, brak miejsca, nieudany rollback |
| 14. Serie i izolacja | smart-backup active completed work, new profile; profiles izolacja IndexedDB/auxiliary |
| 15. Aktywna sesja | smart-backup failed merge + gv-data/phase0 restore; timery zatrzymane |
| 16. Aktualizacja | istniejące testy SW/offline, wznowienie tych samych danych; v27 bez resetu historii i profili |

## Ograniczenia i gotowość publikacji

Implementacja jest gotowa do lokalnego przeglądu i akceptacji w zakresie Edge. **Nie jest jeszcze gotowa do publikacji:** zgodnie z nowym zleceniem kryterium autentycznego eksportu poprzedniej wersji pozostaje oczekujące na dostarczenie pliku i weryfikację. Dotychczasowy v4 fixture pochodzi z oryginalnego eksportera wykonanego na danych syntetycznych; nie jest eksportem właściciela.

Nie potwierdzono fizycznego iPhone, Safari/PWA, zapisu do Plików/iCloud Drive, rzeczywistego ubicia procesu Safari podczas zapisu ani utraty pamięci całego urządzenia. Testy awarii są kontrolowanymi symulacjami; nie obiecują bezwarunkowego odzyskania, gdy sam magazyn odmawia zapisu lub zostanie wyczyszczony. Zachowano limit pliku ZIP 25 MB, pojedynczej pozycji 12 MB, 256 wpisów archiwum i 20 profili.

Kontrakt dla Work/Bolt: docs/backup-import-contract.md. Stan Git: feature/gymnastika-approved-ui, HEAD fc6f177, zastane oraz nowe zmiany lokalne; brak stage/commit/merge/push/deploy. Integracja Bolt pozostaje osobnym etapem.
