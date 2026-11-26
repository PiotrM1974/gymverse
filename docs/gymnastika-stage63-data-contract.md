# GymNastika 2.0 — projekt kontraktu danych etapu 6.3

**Status: propozycja do akceptacji, 24.11.2026.** Nie jest obecnym schematem ani dowodem zgodności importu. Bez implementacji i bez zmiany kodu. Etap 6.2 zaakceptowany przez właściciela. Przykłady są syntetyczne.

## 1. Fakty o istniejącym modelu

- `gymverse_profiles_v1` zawiera `schemaVersion: 1`, `activeProfileId`, opcjonalny `onboardingRequired` i `profiles[]`. Profil ma stabilne `id`, `name`, `createdAt`, `attributes` i `data`. Dane nieaktywnego profilu są wartościami JSON zapisanymi jako **łańcuchy** pod kluczami z `PROFILE_DATA_KEYS`. Aktywny profil korzysta z bieżącego snapshotu; `backupProfiles` przed eksportem wypełnia jego `data`. `switchProfile` zapisuje bieżący snapshot i odtwarza docelowy w jednej operacji zapisu.
- `normalizeAttributes` obecnie zwraca wyłącznie wiek, płeć, wzrost, wagę, doświadczenie, powrót po przerwie, sprzęt i ograniczenia. `updateProfile` zastępuje `attributes` wynikiem normalizacji; `importProfileSnapshot` rekonstruuje profil. Nowe pole celu nie przetrwa tych operacji bez ich dostosowania. `gymverse_goal` jest oddzielnym ustawieniem zakresu masy ciała, nie celem treningowym.
- `gymverse_plans` to lista **pojedynczych dni/treningów** `{id,title,exercises,dayOfWeek?}`. `cleanPlan` zachowuje tylko znane pola; wiersz ćwiczenia może mieć `key`, `sets`, `target`, `restSeconds`, `name`, `img`, `variantId`. Nieznane metadane są odrzucane. Dzień tygodnia ani nazwa nie identyfikują planu nadrzędnego.
- Sesja ma `planId`, migawkę `exercises`, serie i inne dane stanu; historia przechowuje `planId`, `planTitle` i szczegóły serii. Drafty mają m.in. `planId` i `sessionId`. `activePlan()` nadal odwołuje się również do `getPlan(active.planId)`, dlatego sama migawka ćwiczeń **nie dowodzi**, że usunięcie dnia aktywnej sesji jest bezpieczne. Aktualny edytor podczas aktywnej sesji jest blokowany. „Poprzednio” i progresja korzystają z dotychczasowych identyfikatorów i historii.
- Normalizacja historii w `index.html` szuka planu najpierw po `planId`, a następnie po `planTitle`; jeśli ID usuniętego dnia nie istnieje, inny plan o tej samej nazwie może zostać wybrany i nadpisać `planId` w normalizowanym rekordzie. Wymaganie zachowania tożsamości po usunięciu dnia nie jest więc potwierdzone i wymaga osobnej punktowej poprawki lub zachowania dnia do czasu jej wdrożenia.
- Generator przyjmuje `preferences.goal`; UI ma `fat_loss`, `hypertrophy`, `strength`, `recomposition`, `fitness`, `maintenance` i obecnie inicjuje szkic z `hypertrophy`. Wytwarza odrębne rekordy dni z własnymi `id`; podgląd i zapis są osobne.
- ZIP v5 opiera się na `legacy-storage-snapshot`, a `splitSnapshot` ma listę dopuszczonych kluczy najwyższego poziomu. Osobny nowy klucz magazynu wymagałby zmian list, przełączania profili, walidacji i kopii. `backupProfiles` kopiuje rejestr profili i migawkę aktywnego. To uzasadnia sprawdzenie rozszerzenia **wewnątrz istniejącego rejestru**, ale nie jest dowodem, że każdy importer/eksporter je zachowa.
- Przy scalaniu ZIP `planBackupImport` rozpoznaje profile po `id`, historię po tożsamości i treści, a plany po `id` oraz kanonicznej treści. Konflikt nie zastępuje lokalnego rekordu. Dla istniejącego profilu scala `data`, natomiast nie scala dowolnych nowych właściwości profilu ani atrybutów; wymagane jest jawne rozszerzenie reguł. JSON v4 nie ma tożsamości profilu, więc wymaga wyboru docelowego zgodnie z istniejącą ścieżką.

## 2. Proponowany cel treningowy

Dodatek do **istniejącego** `profile.attributes`, nie nowy profil ani klucz ustawień:

| Wartość proponowana | Etykieta | Istniejący `preferences.goal` generatora |
| --- | --- | --- |
| `fat_loss` | Redukcja tkanki tłuszczowej | `fat_loss` |
| `hypertrophy` | Budowa masy mięśniowej | `hypertrophy` |
| `recomposition` | Rekompozycja sylwetki | `recomposition` |
| `fitness` | Poprawa kondycji | `fitness` |

Pole nieobecne oznacza „nie podano”; nowe zapisy mogą przechowywać jedną z czterech wartości lub `null` po świadomym wyczyszczeniu. Brak wartości nie zapisuje domyślnego celu do profilu. Walidacja odrzuca inny typ i nieznane wartości przy zapisie; uszkodzone dane nie mogą zostać po cichu wyzerowane. Rozszerzyć normalizację, edycję, kopię pojedynczego profilu i pełne ZIP tak, aby wcześniejsze atrybuty oraz nieobecność pola przetrwały. Zmiana celu jest zapisem tylko do wybranego profilu, nie wpływa na inny profil, historię lub plany.

Przyszły adapter kreatora generatora może wstępnie wybrać zadeklarowany cel jako **edytowalną** wartość. Wybór w generatorze jest osobny i nie nadpisuje profilu bez jawnej akcji. Dla profilu bez celu zachować bieżące zachowanie generatora jako roboczy wybór `hypertrophy`, wyraźnie rozróżniony od niezapisanego celu profilu; alternatywnie można w przyszłości wymagać jawnego wyboru, ale byłaby to odrębna zmiana UX. `strength` i `maintenance` nadal mogą występować w generatorze, choć nie w proponowanych czterech celach profilu. Algorytm generatora nie wymaga zmiany.

## 3. Proponowany plan nadrzędny

Na rekordzie profilu proponuje się opcjonalny **nowy** obiekt `planPrograms` wewnątrz istniejącego `gymverse_profiles_v1`:

```json
{
  "schemaVersion": 1,
  "activeProfileId": "profile_demo_0001",
  "profiles": [{
    "id": "profile_demo_0001",
    "name": "Profil testowy",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "attributes": { "trainingGoal": "hypertrophy", "equipment": ["dumbbells"], "restrictions": [] },
    "planPrograms": {
      "schemaVersion": 1,
      "assignedProgramId": "pg_11111111111111111111111111111111",
      "programs": [{
        "id": "pg_11111111111111111111111111111111",
        "title": "Upper / Lower",
        "dayPlanIds": ["day_upper_a", "day_lower_a", "day_upper_b", "day_lower_b"]
      }]
    },
    "data": { "gymverse_plans": "[{\"id\":\"day_upper_a\",\"title\":\"Upper A\",\"exercises\":[{\"key\":\"bench_flat\",\"variantId\":\"default\",\"sets\":3,\"target\":\"8-12\",\"restSeconds\":90}]}]" }
  }]
}
```

Przykład pokazuje kształt rekordu i tylko jeden dzień w skróconym `data.gymverse_plans`; **nie jest kompletnym poprawnym snapshotem**: przed zapisem muszą istnieć wszystkie cztery wskazane dni. W pełnym snapshotie aktywnego profilu aktualna lista znajduje się także pod najwyższym kluczem `gymverse_plans`; przed eksportem dane profilu aktywnego są synchronizowane istniejącą ścieżką. Żaden rekord dnia ani sesji nie jest zastępowany nowym typem.

Proponowane reguły:

1. `planPrograms` brakujące = brak utworzonych grup i przypisania; nie wpisywać obiektu przy starcie. `schemaVersion` tego **nowego podobiektu** wynosi 1 i nie jest nową wersją ZIP. `programs` to lista, a `assignedProgramId` to ID istniejącej grupy lub `null`.
2. `id` grupy: `pg_` + 32 małe znaki heksadecymalne z bezpiecznego UUID; trwały, nie wywodzony z nazwy, kolejności ani daty. Unikalność w profilu sprawdzać przy zapisie i imporcie; porównywać zawsze razem z `profile.id`.
3. `title`: po usunięciu białych znaków 1–60 znaków. `dayPlanIds`: 1–6 **różnych** istniejących ID dni w kolejności prezentacji. Liczbę dni wyliczać z długości, nie zapisywać drugiego licznika. ID dnia jest istniejącym `gymverse_plans[].id` i pozostaje niezmienne przy zmianie nazwy lub kolejności. Pierwsza wersja: pojedynczy dzień może należeć najwyżej do jednej grupy w obrębie profilu; samodzielne dni pozostają samodzielne. Nie identyfikować dni po `dayOfWeek`.
4. Zmiana kolejności przestawia wyłącznie `dayPlanIds`; edycja dnia aktualizuje tylko istniejący rekord o tym ID. Pozostałe dni, `variantId`, `restSeconds` — także 30/90/240 — i wszystkie istniejące pola nie ulegają zmianie. Sprawdzić faktyczną normalizację, aby nie gubić innych obecnie zapisywanych pól.
5. Utworzenie grupy, ewentualne utworzenie jej dni i przypisanie zapisuje się jedną transakcją obejmującą `gymverse_plans` i `gymverse_profiles_v1`; walidacja referencji przed zatwierdzeniem, bez połowicznej grupy po błędzie. Nie tworzyć grupy przy samym podglądzie. Pusty plan nadrzędny może być co najwyżej nietrwałym szkicem UI; trwały musi spełniać 1–6 dni.
6. Przypisanie jest osobną potwierdzoną akcją `assignedProgramId = id`; wyczyszczenie to `null`. Podgląd, zmiana profilu i uruchomienie treningu nie zmieniają przypisania. Plany dni już są izolowane w snapshotach profili, lecz ta izolacja sama nie określa **wybranego** planu nadrzędnego; potrzebna jest jawna referencja.
7. Usunięcie grupy domyślnie usuwa tylko jej metadane, po potwierdzeniu; dni pozostają samodzielne. Jeżeli była przypisana, w tej samej transakcji ustawić `assignedProgramId: null`. Osobne usuwanie dni musi obsłużyć referencje i potwierdzenia; nie dopuszczać do grupy bez dnia lub zerwanej referencji. Nie usuwać ani nie modyfikować historii, `planId`, `sessionId`, serii i draftów. Przy aktywnej sesji z danym dniem zachować istniejącą blokadę edytora; nie usuwać lub przepisywać tego dnia do czasu osobno zweryfikowanego rozwiązania. Usunięcie grupy nie przerywa sesji, bo nie usuwa dnia. Usuwanie dnia powiązanego z historią należy wstrzymać do poprawienia i przetestowania normalizacji po `planTitle`; samo zachowanie tekstu historii nie dowodzi zachowania tożsamości, „Poprzednio” ani progresji.

## 4. Import, konflikty i zgodność

| Przypadek | Projektowane zachowanie |
| --- | --- |
| Stary profil bez `trainingGoal`/`planPrograms` | Odczyt bez zmiany danych. Brak celu i grup, dotychczasowe działanie. |
| Stary samodzielny dzień, w tym PUSH/PULL/FULL BODY | Bez automatycznej migracji, grupowania, przypisania lub zmiany ID. |
| Generator 1–6 dni | Istniejący generator pozostaje właścicielem rekordów dni. Grupę można utworzyć dopiero po jawnej decyzji i zapisie; zachować istniejący podgląd i algorytm. |
| Nowy profil z ZIP | Przenieść jego atrybuty, metadane i dni, następnie sprawdzić referencje; nie mieszać z innymi profilami. |
| Ten sam profil w ZIP | Rozszerzyć aktualny merge: brakujące grupy tylko jeśli wszystkie wymagane dni zostały przyjęte lub są identyczne; identyczne ID/treść jest duplikatem; to samo ID i różna treść = zgłoszony konflikt, lokalna wersja zostaje. Zablokować grupę zależną od konfliktującego lub brakującego dnia, bez jej częściowego importu. |
| Cel i przypisanie w obu wersjach profilu | Bez bazowej wersji wspólnej nie zgadywać nowszego zapisu. Istniejąca jawna lokalna wartość wygrywa; różne jawne wartości zgłosić jako konflikt. Gdy lokalna wartość nie istnieje, można zaproponować dodanie wartości źródłowej w podglądzie i zastosować po potwierdzeniu; nie nadpisywać istniejącej. Import źródłowego przypisania tylko gdy grupa i wszystkie dni są dostępne oraz brak konfliktu. `null` jako jawne wyczyszczenie traktować oddzielnie od nieobecności. |
| JSON v4 | Aktualna walidacja i wybór docelowego profilu; stare dni importować jako samodzielne. Nie wymyślać celu, grupy ani przypisania. Konflikt ID istniejącego dnia zgłosić bez nadpisania. |
| Błąd walidacji/referencji lub zapisu | Nie aktywować części danych, zachować dotychczasowy snapshot i wskazać błąd. Przy nieudanym rollbacku zastosować istniejące ostrzeżenie i odzyskiwanie; nie obiecywać atomowości localStorage ponad rzeczywisty mechanizm transakcji. |

ZIP v5: zaproponowane umieszczenie w `gymverse_profiles_v1` nie dodaje pliku do archiwum ani klucza najwyższego poziomu. Źródło wskazuje, że pełny snapshot może przenieść obiekt, **ale nie dowodzi round-trip**: `normalizeAttributes`, eksport/import pojedynczego profilu, walidacja snapshotu, `backupProfiles`, `planBackupImport`, `prepareMergedBackup` i restore trzeba zmodyfikować lub przetestować zgodnie z rzeczywistym zachowaniem. Sprawdzić oba magazyny, limity, sumy kontrolne oraz wybory aktywnej sesji/draftów. Nie zmieniać wersji/układu ZIP bez wykazania konieczności i osobnego uzgodnienia.

Weryfikacja wersji starszej jest krytyczna: dotychczasowy `updateProfile` może usunąć nowy `trainingGoal`, a dawny `importProfileSnapshot` nie przenosi nowego `planPrograms`; nawet jeśli ZIP zostanie odczytany, starsza aplikacja może później zgubić metadane. Nie deklarować wstecznej zgodności zapisu przez starsze wydania. Wariant wycofania musi najpierw chronić pełny eksport nowej wersji i dowieść round-trip; starszy kod uruchamiać co najwyżej w odizolowanej kopii bez zapisu do oryginału. Nie kasować metadanych jako automatycznej migracji wstecz.

## 5. Plan testów i bramki

Wyłącznie syntetyczne dane; niezależne testy jednostkowe oraz E2E w Edge i dostępnym desktopowym WebKit, bez utożsamiania go z fizycznym Safari.

1. Starszy profil z brakiem pola i z pustym celem: odczyt/reload/edycja innych pól bez niejawnego celu, bez zmiany snapshotu przy samym starcie.
2. Cztery wartości, `null`, błędny typ/wartość i zmiana celu; generator otrzymuje wartość profilu jako edytowalną, jego jednorazowa zmiana nie zapisuje jej do profilu. Dwa profile zachowują niezależne cele.
3. Grupy 1, 3 i 6 dni: stabilne ID, zapis, reload, ponowne otwarcie, zmiana nazwy/kolejności, brak duplikatów i brak grupowania po nazwie/dniu; odrzucenie 0/7, duplikatu dnia, kolizji ID i nieistniejącego dnia.
4. Edycja drugiego dnia, wariantów i odpoczynków 30/90/240: porównać rzeczywiste rekordy pozostałych dni, profilu, serii i historii przed/po. Samodzielne stare plany i istniejące PUSH/PULL/FULL BODY działają jak wcześniej.
5. Podgląd bez przypisania, świadome przypisanie/wyczyszczenie i przełączanie dwóch profili; generator 1–6 dni, brak samoczynnego startu treningu.
6. Zmiana i usunięcie grupy, brakujące dni i przypisanie; przy aktywnej sesji/draftach nie usuwać zależnego dnia. Historia, „Poprzednio”, progresja, RIR i aktywna sesja zachowane także po reload.
7. ZIP v5 round-trip wszystkich profili, celu, grup, kolejności i przypisania, osobny eksport/import profilu, kopiowanie do pustej aplikacji oraz różne kombinacje aktywnych sesji/draftów. Porównać konkretne rekordy i sprawdzić import tej samej kopii dwukrotnie.
8. JSON v4 bez metadanych, wybór profilu, brak automatycznych grup/celu, zachowanie historii oraz test autentycznego eksportu, gdy właściciel go udostępni; fixture syntetyczny nie jest dowodem autentycznej kompatybilności.
9. Scalenie brakujących danych: brakujący dzień i grupa, identyczny duplikat, kolizje `profile.id`, `program.id` i `day.id`, różny cel/przypisanie, brak zależności, konflikt dnia i grupy. Sprawdzić podgląd konfliktów oraz niezmienność lokalnych danych; powtórny import bez duplikacji.
10. Symulowany błąd walidacji/zapisu w localStorage i IndexedDB: przerwanie przed/w trakcie operacji, atomowość wskazanych rekordów, reload, poprawne ostrzeżenie przy nieudanym rollbacku oraz przywrócenie sprawdzonej kopii. Test starszego czytnika/edycji wyłącznie na odizolowanych syntetycznych danych.

## 6. Kolejność implementacji po osobnej zgodzie

1. Zamrozić kontrakt i testy ochrony obecnych danych; przygotować plik zadania wg `AGENTS.md`. Ocenić konflikty z formatem ZIP, profilem pojedynczym i starym klientem przed zapisem danych.
2. Wprowadzić opcjonalny cel i testy tworzenia/edycji/normalizacji oraz kopii; bez domyślnych zapisów i bez zmian algorytmu generatora.
3. Dodać walidowaną grupę i transakcyjne operacje powiązane z istniejącymi dniami; osobno przypisanie i zabezpieczenia sesji. Żadnej migracji przy starcie.
4. Dostosować pełny ZIP, pojedynczy profil, inteligentny merge i konflikty, jeśli testy potwierdzą potrzebę; potwierdzić 1–10. Nie zmieniać struktury ZIP bez uzasadnienia.
5. Dopiero po pozytywnych testach podpinać odpowiednie UI w uzgodnionym zakresie; osobno etap 6.4, o ile zostanie zlecony. Na końcu regresja i ocena właściciela, bez publikacji.

**Premium UI Polish:** po zakończeniu funkcjonalnej integracji GymNastika 2.0, a przed publikacją, przewidziany jest osobny etap dopracowania wyglądu, typografii, kart, formularzy, przycisków, odstępów, animacji i spójności ekranów z zatwierdzonym projektem Bolt. Nie jest częścią niniejszej pracy.

## Aktualizacja implementacyjna 6.3B — 24.11.2026

Wcześniejsze sekcje dokumentują projekt, a nie dowód realizacji. Wdrożono opcjonalny `profile.planPrograms`: schemaVersion 1, assignedProgramId (na tym etapie brak operacji przypisywania), programs z trwałym `pg_` ID, tytułem i 1–6 uporządkowanymi ID istniejących dni. Dzień może należeć tylko do jednego programu w profilu. Funkcje modelu i transakcyjnego zapisu znajdują się w `src/features/plans/programs.js`; usunięcie grupy pozostawia dni. Historia nigdy nie otrzymuje ID na podstawie samej nazwy. Import ZIP odrzuca błędne referencje i zachowuje lokalne dane przy konflikcie; import starszego JSON v4, który zastąpiłby dni profilu z grupami, jest blokowany.

Wykonano 161/161 unit, 6/6 Edge dla etapu, szerszą regresję Edge 60/60 (rozpoczętą przed końcowym doprecyzowaniem sygnalizacji błędu) i 4+2 odrębne przejścia WebKit. ZIP i eksport profilu sprawdzono faktycznym zapisem i odtworzeniem w syntetycznych kontekstach. `integrityUncertain` sygnalizuje nieudany rollback; podwójna awaria nadal wymaga odzyskania danych. Szczegóły w `docs/tasks/GV-BOLT-STAGE63B.md` i PROJECT_MEMORY.md. Fizyczny iPhone, autentyczny eksport v4 oraz starsze klienty nie są potwierdzone.

## Aktualizacja 6.3C — 24.11.2026

Wdrożono odczyt i jawne przypisanie/zmianę/wyczyszczenie `assignedProgramId` oraz bibliotekę i podgląd dni bez automatycznego startu. W inteligentnym imporcie lokalne jawne przypisanie lub null wygrywa, różna wartość jest konfliktem; przy braku lokalnych metadanych źródłowe przypisanie przechodzi tylko dla przyjętej, zgodnej grupy i dni. Pełny ZIP odtwarza przypisanie, JSON v4 go nie tworzy. W przypadku wykrytej niepewności blokada zapisów działa w bieżącej sesji; ZIP z dostępnych danych waliduje strukturę, nie gwarantuje kompletności; awaryjny JSON nie obejmuje profili/programów. Szczegóły i ograniczenia testów: `docs/tasks/GV-BOLT-STAGE63C.md` i `PROJECT_MEMORY.md`.

## Etap 7A — wynik generatora jako program (25.11.2026)
Generator nie jest drugim modelem planów: adapter przenosi wynik istniejącego silnika do szkicu programu i commitProgramDraft. Identyfikatory dni i ich kolejność pozostają stabilne; zapis tworzy profile.planPrograms bez automatycznego przypisania. Wartość trainingGoal jest wyłącznie sugestią początkową kreatora.
Istniejący szkic gymverse_program_drafts_v1 może zawierać opcjonalny obiekt generatorAnswers z walidowanymi odpowiedziami 10 kroków. Nie zawiera funkcji ani drugiego zbioru planów; pełny ZIP v5 zachowuje go wraz z migawką, JSON profilu nie. Walidacja zachowuje zgodność rekordów legacy bez opcjonalnego target. Pozostałe gwarancje i ograniczenia 6.4A/6.4D pozostają: wspólna blokada, CAS, aktualność źródła, integrityUncertain, izolacja profili, ograniczona transakcyjność localStorage i brak ochrony przed starym klientem zapisującym poza blokadą.

## Etap 7B — odczyt historii (25.11.2026)
Historia nie otrzymuje nowych pól ani drugiego magazynu. Kontekst programu wynika wyłącznie z session.planId w aktualnych dayPlanIds bieżącego profilu; nie oznacza historycznego przypisania. Nazwy nie są kluczem. Rekordy niejednoznaczne pozostają w widoku ogólnym. Filtr wariantu odróżnia brak pola od jawnego default. Reguły progresji otrzymują tylko serie tego samego planId i wariantu celu, bez mutowania historii. Jawny zapis istniejącego progressionReview używa wspólnej synchronizacji; normalizacja planu zachowuje te metadane po reload. Odczyty nie wywołują migracji ani zapisu historii. ZIPv5/JSONv4 i model danych pozostają zgodne.
