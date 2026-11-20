# GymVerse QA — raport testów iOS dla GV-DATA

**Data testów:** 20.11.2026

**Repozytorium i PR:** [PiotrM1974/gymverse — PR #4](https://github.com/PiotrM1974/gymverse/pull/4)

**Stan PR w chwili raportu:** otwarty, niescalony; base `main` (`7d32975ec834903bf96987218bafdd67b8e0f9cf`), head `feature/gv-data` (`dd58673fe91162c48f1ad343e71e18f775836894`).

**Środowisko QA:** [https://gymverse-ios-qa.pages.dev](https://gymverse-ios-qa.pages.dev)

**Repozytorium kopii QA:** `PiotrM1974/testowy`, commit `9521befa80a026d50d3b24d9b9eac75f911f5523`.

**Snapshot źródłowy kopii QA:** `PiotrM1974/gymverse` commit `925522ffe4ff504a269d197d77ddba34a3bd3a4a`. Ten commit dodawał plan QA; kod aplikacji w tym snapshotcie pochodzi z rodzica `f21215c91ee5561e309bb3d11c326c1784519585`. Późniejsze commity PR zmieniły dokumentację, nie pliki runtime aplikacji.

**Urządzenie:** fizyczny iPhone, model i wersja iOS/Safari nie zostały zapisane.
**Dane:** według raportu wyłącznie syntetyczne; nie modyfikowano produkcyjnej historii treningowej.

## Zakres i źródło wyników

Raport opisuje ręczne sprawdzenie GymVerse QA na iPhonie: uruchomienie Safari i aplikacji z ekranu początkowego, zapisy, eksport i odtworzenie kopii v5, import JSON v4 oraz ręczną migrację do IndexedDB.

Wyniki ręczne w tym dokumencie pochodzą z raportu dostarczonego przez właściciela 20.11.2026. Nie zostały niezależnie powtórzone podczas aktualizacji dokumentacji. Wyniki automatyczne także przepisano z raportu wykonania; nie uruchamiano ich ponownie w tej rundzie.

## Wyniki automatyczne zgłoszone w raporcie

| Kontrola | Wynik zgłoszony |
|---|---:|
| Vitest | 39/39 PASS |
| Playwright E2E — Microsoft Edge Chromium | 45/45 PASS |
| `npm audit` | 0 wykrytych podatności |
| SHA-256 ilustracji ćwiczeń | wszystkie 21 zgodne |

## Wyniki scenariuszy na iPhonie

| ID | Wynik | Obserwacja i zakres dowodu |
|---|---|---|
| IOS-01 | Częściowo potwierdzony | Użyto osobnego hostname QA. Brakuje pełnej inspekcji scope Service Workera i magazynów. |
| IOS-02 | PASS — UI | Aplikacja otwierała się w Safari; plany i grafiki działały. Nie zapisano pełnego raportu Web Inspectora ani dowodu wszystkich statusów sieci. |
| IOS-03 | PASS | Aplikację QA dodano do ekranu początkowego i uruchomiono. |
| IOS-04 | Niepełny | Service Worker uczestniczył w procedurze migracji; nie wykonano pełnej inspekcji scope i cache. |
| IOS-05 | **FAIL** | GymVerse QA nie uruchomił się bez internetu. Właściciel zaakceptował tę znaną niezgodność jako ograniczenie niskiego priorytetu. Problem nie został naprawiony i nie jest zaliczony. |
| IOS-06 | Częściowo zaliczony | Zgłoszono zapis serii, wznowienie treningu i trwałość historii. Oddzielnego sprawdzenia powrotu niezapisanego draftu po restarcie nie udokumentowano. |
| IOS-07 | PASS | Zgłoszono trwałość pomiaru wagi i zmian planu. |
| IOS-08 | PASS | Eksport ZIP v5 działał, a niepusty plik zapisano w aplikacji Pliki. |
| IOS-09 | PASS — główna ścieżka | Zgłoszono pełne odtworzenie ZIP v5, cofnięcie późniejszych zmian i trwałość po ponownym uruchomieniu. Nie ma niezależnego porównania wszystkich identyfikatorów i liczników. |
| IOS-10 | PASS — funkcjonalny | Zgłoszono import łączeniowy JSON v4 bez ponownego dodania tej samej syntetycznej sesji, pełne odtworzenie v4 i ponowne odtworzenie ZIP. Pełna kontrola rekord-po-rekordzie nie została wykonana. |
| IOS-11 | PASS — funkcjonalny | Zgłoszono pomyślną ręczną migrację syntetycznych danych do IndexedDB. Nie udokumentowano pełnego porównania liczników, ID i sum kontrolnych przed/po migracji. |
| IOS-12 | PASS — funkcjonalny | Zgłoszono dostępność danych po restarcie, zapis nowego pomiaru po migracji oraz wygenerowanie i odczyt ZIP v5. Drafty i pełna integralność rekordów nie zostały oddzielnie potwierdzone. |
| IOS-13 | Niepełny | Zgłoszono zwykły zapis po migracji. Nie wymuszano błędów IndexedDB na osobistym urządzeniu. |

### Potwierdzone ścieżki funkcjonalne

- Zapis treningu i utrzymanie historii po ponownym uruchomieniu aplikacji.
- Trwałość pomiarów oraz edycji planu.
- Eksport ZIP v5 do Plików i funkcjonalne ponowne odczytanie/odtworzenie.
- Import łączeniowy i pełne odtworzenie syntetycznego JSON v4.
- Ręczne przełączenie syntetycznego magazynu do IndexedDB oraz późniejszy zapis i odczyt backupu v5.

To potwierdza wykonanie głównych ścieżek użytkownika, ale nie jest pełnym dowodem integralności każdego rekordu.

## Niezamknięte ograniczenia

1. **Offline:** IOS-05 jest FAIL. Nie zmieniono aplikacji ani Service Workera w ramach tej aktualizacji dokumentacyjnej. Akceptacja priorytetu przez właściciela nie zmienia wyniku testu.
2. **Drafty:** brak odrębnego, udokumentowanego dowodu, że niezapisane pola wagi/powtórzeń przetrwały restart i pełne odtworzenie.
3. **Integralność rekordów:** raport nie zawiera przed/po liczników ani pełnych ID sesji, serii, planów, pomiarów i draftów, ani wyniku porównania sum kontrolnych. Zgodność funkcjonalna nie zastępuje takiego porównania.
4. **Diagnostyka urządzenia:** nie zapisano modelu iPhone’a, wersji iOS/Safari ani pełnego logu Web Inspectora.
5. **Awarie:** nie wykonywano wymuszonych awarii zapisu/rollbacku na iPhonie; pozostają pokryte wyłącznie automatycznymi testami syntetycznymi zgłoszonymi w raporcie.

## Granica GV-DATA i gotowość

GV-DATA pozostaje warstwą zgodności dla istniejącego modelu danych. `DB_VERSION = 4` opisuje strukturę object stores IndexedDB, a ZIP v5 format archiwum. Żadna z tych wartości nie oznacza pełnego wdrożenia modelu domenowego `dataSchemaVersion: 3`; manifest kopii używa `legacy-storage-snapshot`.

Raport QA nie stanowi deklaracji gotowości produkcyjnej ani zgody na merge lub wdrożenie. Każda z tych czynności, a także migracja rzeczywistych danych, wymaga osobnej decyzji właściciela. Test syntetyczny na originie QA nie potwierdza bezpieczeństwa migracji produkcyjnych danych.
