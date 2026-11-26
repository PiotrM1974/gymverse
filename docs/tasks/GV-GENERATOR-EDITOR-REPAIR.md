# Naprawa generatora, edytora i konfliktów — 26.11.2026

Status: lokalnie gotowe do akceptacji właściciela. Baza produkcyjna 2.0.1: be447d4f2a77ea6ca027196404b572d919c82e84. Gałąź fix/gymnastika-generator-editor-conflicts-2026-11-26. Bez commit/push/merge/deploy, instalacji i danych właściciela.

## Mapa ścieżek

| Obszar | Przed | Po |
|---|---|---|
| Generator | Wspólny view-planedit, stare renderery, 10 kroków, wejście do ręcznej edycji wyniku | Osobny tryb: cel → liczba/czas → warunki → podsumowanie → podgląd → Zapisz i ustaw jako mój program → ekran główny |
| Własny program | Generator i ręczne opcje w jednym kontekście | Własny plan → ręczny edytor 1–6 dni → ćwiczenia dnia → zapis → podgląd; przypisanie pozostaje osobną decyzją |
| Wygenerowany zapisany program | Edycja mieszała się z generowaniem | Po zapisaniu można otworzyć program w osobnym ręcznym edytorze |
| Ponowne generowanie | Ryzyko utraty wcześniejszego szkicu przy awarii zastąpienia | Ten sam trwały szkic i ID programu; stary szkic zachowany, dopóki zastąpienie się nie powiedzie |

## Potwierdzone przyczyny i poprawki

1. Pozostawione, ponownie deklarowane renderery i wspólny stan nawigacji mieszały interfejsy. Usunięto stare renderery, rozdzielono tryby i odzyskiwanie szkiców. Generator ma 4 kroki, zwinięte ustawienia zaawansowane oraz wyłącznie podgląd wyniku. Algorytm doboru ćwiczeń nie zmienił się.
2. Porównanie całej listy planów lub rejestru profili wywoływało konflikty po niezależnej zmianie. Zapis scala zmienione rekordy po stabilnych ID/kluczach i odrzuca rzeczywistą zmianę tego samego rekordu. Przypisanie sprawdza właściwy program, jego dni i przypisanie aktywnego profilu.
3. Porównanie JSON zależało od kolejności pól obiektu. Test ręcznego dodania, a następnie przesunięcia ćwiczenia odtworzył fałszywy konflikt w jednej karcie. Porównanie semantyczne ignoruje kolejność pól obiektu, zachowując znaczenie kolejności tablic/dni/ćwiczeń.
4. Odtworzono rzeczywiste nadpisanie historii w IndexedDB: druga karta dopisywała sesję, pierwsza usuwała starą sesję ze starego widoku, a odświeżony cache magazynu pozwalał zapisać niepełną historię. Teraz commitHistoryChanges porównuje historię widzianą przez UI z aktualnym magazynem pod wspólną blokadą przed usunięciem/zapisem. Oba magazyny odrzucają taką operację, zachowując dokładnie nowsze rekordy.
5. Zapis generatora i przypisanie są jedną operacją w istniejącym magazynie. Stabilne ID nie zmienia się przy ponowieniu; właściwy szkic jest kończony po sukcesie. Starszy wygenerowany szkic bez generatedProgramId otrzymuje je przy jawnym wznowieniu, bez zmiany ID dni. Awaria regenerowania zachowuje poprzedni szkic. Zmiana profilu podczas kreatora blokuje generowanie na starych ograniczeniach.
6. Service Worker gymverse-v57 obejmuje nowy moduł plan-merge.js. Potwierdzono rzeczywiste otwarcie generatora offline w Chromium. Nie zmieniono cyklu aktywacji SW ani nie czyszczono danych.

## Zapis, synchronizacja i usuwanie

Wykorzystano istniejącą blokadę gymnastika-plan-program-data i magazyn danych; zapis runtime jest serializowany blokadą gymnastika-runtime-store-write. Kolejność: blokada operacji → blokada runtime. Wewnątrz aktualizowana jest migawka i sprawdzane są zmieniane klucze oraz wersja IndexedDB. To warstwy istniejącego zapisu, nie drugi model planów. Sukces, wyjątek i rollback zwalniają blokady; niepewny rollback blokuje dalszy zapis przez integrityUncertain.

| Operacja | Wynik kontroli |
|---|---|
| Usuń ćwiczenie z dnia | Zmienia tylko edytowany dzień; dodawanie, przesunięcie i usunięcie potwierdzone na zapisanych rekordach |
| Usuń samodzielny dzień | Niepowiązany dzień można usunąć; zależności programu, aktywnej pracy i trwałych szkiców są chronione. Dla szkicu komunikat wskazuje potrzebę jego rozstrzygnięcia |
| Odłącz dzień | Zmienia skład programu; nie usuwa rekordu dnia ani historii |
| Usuń program | Jawne potwierdzenie; usuwa metadane i przypisanie, zachowuje dni i historyczne sesje |
| Zmień/usuń przypisanie | Zmienia odniesienie aktywnego profilu; poprzedni program i historia pozostają |
| Usuń trening z historii | Usuwa wskazaną sesję, zachowuje pozostałe; odrzuca stary widok po dopisaniu sesji przez drugą kartę |

## Wyniki na końcowym kodzie

Wszystkie dane syntetyczne; rzeczywiste współdzielone magazyny dwóch kart.

- Jednostkowe: **213/213 PASS**, 26 plików.
- Jeden przebieg Chromium generator-editor-separation + bolt-stage7a: **33/33 PASS**, 50,4 s, bez retry. Obejmuje generator 1–6 dni, ręczne operacje, zapis/przypisanie, awarie, retry, integrityUncertain, szkice, ZIP v5, oba magazyny i blokady.
- Zależny wybór edytora/planów/magazynu: początkowo **7/9 PASS**. Siedem przypadków ręcznej edycji 1/3/6 dni, kolejności, odłączenia i przypisania przeszło. Dwa testy miały nieaktualne przygotowanie: sprawdzały przycisk migracji bez otwarcia menu kopii w UI 2.0.1. Fixture otwiera teraz menu, bez osłabienia asercji.
- Po tej korekcie cztery przypadki odmowy zapisu IndexedDB (edycja/usunięcie historii, plan, własne ćwiczenie): **4/4 PASS**, 9,3 s.
- Końcowy test integracyjny Stage 7C: **1/1 PASS**, 34,5 s. Dwa profile, programy 3/6 dni, edycja zapisanego programu wyłącznie w osobnym edytorze, cztery treningi, RIR, timer i wznowienie, dodatnia decyzja progresji, eksport/odtworzenie ZIP i „Poprzednio”. Zachowano pozytywne asercje progresji; nie zastąpiono ich sprawdzaniem jej braku.
- Łącznie 45 różnych celowanych przypadków Chromium potwierdzonych w powyższych przebiegach; **nie jest to jeden przebieg 45/45**. Nie wykonano pełnej regresji 454, Edge ani WebKit w tym zadaniu.
- LIGHT/DARK 320/375/390 px bez poziomego przewijania; scenariusz integracji dodatkowo 430 px. Generator i edytor 390 px obejrzane na rzeczywistych zrzutach.

## Zrzuty lokalne (ignorowane)

outputs/GV-GENERATOR-UX-REPAIR/: chromium-generator-{1,3,6}-{light,dark}-390.png, chromium-own-editor-{light,dark}-390.png oraz chromium-own-plans-{light,dark}-390.png. Nie są częścią kodu do publikacji.

## Zmienione pliki

- index.html; sw.js; src/gv-data.js.
- src/features/plans/: generated-program.js, program-drafts.js, program-editor-ui.js, program-editor.js, programs.js, nowy plan-merge.js.
- tests/e2e/: bolt-stage7a.spec.js, bolt-stage7c.spec.js, gv-data.spec.js, nowy generator-editor-separation.spec.js.
- tests/unit/: branding.test.js, inline-functions.test.js, plan-programs.test.js, program-editor.test.js, service-worker.test.js, nowy plan-merge.test.js.
- PROJECT_HANDOFF.md; docs/tasks/GV-BOLT-STAGE7A.md; ten raport; lokalny ignorowany PROJECT_MEMORY.md.

## Ograniczenia i decyzja

Gotowe do lokalnej akceptacji; produkcja nie została zmieniona. Stare otwarte karty mogą nie respektować nowych blokad. localStorage nie daje natywnej atomowości wielu kluczy; zastosowane blokady, rollback i readback ograniczają ryzyko, a integrityUncertain zatrzymuje niepewne zapisy. IndexedDB ma transakcję, localStorage nie wolno opisywać jako równoważnie atomowego. Trwały szkic chroni ostatni potwierdzony zapis, nie dowolny ostatni znak przed zakończeniem PWA przez system. Fizyczny iPhone/Safari, desktop WebKit i autentyczny historyczny eksport pozostają poza tym przebiegiem; importer JSON v4 nie był zmieniany. Nie wykonywano badań na rzeczywistych danych właściciela. Zachowano niezwiązane nieśledzone plansze projektu.

## Finalizacja 2.0.2 — 26.11.2026

Właściciel zaakceptował powyższy lokalny zakres i autoryzował commit/push nowej gałęzi oraz PR, bez merge/deploy. Aktualny origin/main: be447d4f2a77ea6ca027196404b572d919c82e84; gałąź release/gymnastika-2.0.2-2026-11-26 utworzona bez zmiany bazy i bez utraty plików. Podczas finalizacji nie zmieniono kodu aplikacji ani cache v57.

Uzupełnienie kontroli: **3/3 Chromium PASS, 10,1 s** po utworzeniu gałęzi. Dwa nowe przypadki: wcześniej zapisany wygenerowany program → odmowa samego przypisania → ponowienie bez duplikacji i bez zmiany dni; powrót do odpowiedzi i anulowanie zachowujące poprzedni program. Trzeci to celowo powtórzony istniejący test rollback/retry wspólnego zapisu generatora. Zwykły generator zapisuje i przypisuje wspólnie, zatem nie deklarujemy osobnego częściowego sukcesu przy prawidłowym rollbacku. Niepewny rollback nadal blokuje dalsze zapisy. W bibliotece odmowa przypisania pozostawia zapisany program oraz aktywną możliwość ponowienia, z komunikatem o nieudanym przypisaniu.

Wykorzystano zaakceptowane wcześniejsze wyniki, bez ponawiania pełnej regresji. Pages: legacy, main, katalog /; dynamiczny pages-build-deployment, brak własnych workflowów. PR ma zawierać wyłącznie 22 pliki napraw, testów i dokumentacji wymienione wyżej; outputs, lokalna pamięć i 12 niezatwierdzonych plansz projektu są wyłączone. Scalenie i publikacja wymagają osobnej zgody.

## Obowiązkowe rozszerzenie 2.0.2: jedna karta programu

Właściciel zlecił dołączenie tej poprawki przed PR. Plan i realizacja: renderAssignedProgram renderuje teraz karty programów (przypisany pierwszy, oznaczony Aktywny); renderPlans wyklucza wszystkie rzeczywiste dayPlanIds programów aktywnego profilu z sekcji samodzielnych treningów. Bez grupowania po nazwie/dniu tygodnia, bez migracji i bez usuwania rekordów. Zapis generatora i ręczny edytor prowadzą do tej samej prezentacji. W bibliotece pozostają istniejące akcje; showProgramPreview pokazuje dni, a showProgramSelectedDay dopiero po wyborze ujawnia ćwiczenia i start. Usunięto duży, zdublowany panel przypisania. Zachowano Signal/Manrope, klawiaturę i widoki mobilne.

Przed poprawką dwa testy odtworzyły brak kart programów i zablokowany start z programu. Przyczyną drugiego błędu były odwołania startWorkout do dawnych pól registry/plans w PROGRAM_PREVIEW. Zastąpiono je istniejącą kontrolą semantycznej migawki programu/dni pod Web Lock. Nie osłabiono ochrony: zmieniony dzień/program nadal blokuje start, niezależny plan go nie blokuje. startable i nextPlanId porównano z produkcją — nie zmieniły się. Testy potwierdzają rzeczywisty programId, dayPlanId, numer dnia, RIR, wznowienie, poprzednie wyniki oraz historię także po późniejszym dołączeniu wcześniej samodzielnego dnia.

Wyniki: początkowe 7/7 nowych przypadków; po uzupełnieniu ochrony i zależnych fixture jeden przebieg **25/25 Chromium PASS (1,5 min)**; jednostkowe **213/213 PASS**. Po usunięciu nagłówków grupowania samodzielnych treningów według tygodnia wykonano tylko **4/4** dotknięte przypadki kart/layoutu (5,5s). Poprzednie wyniki 33/33 i pozostałe zestawy pozostają odrębnymi przebiegami. Brak pełnej454 i brak WebKit/fizycznego iPhone.

Dodatkowe pliki ponad wcześniejsze22: src/ui/signal.css; tests/e2e/home-program-cards.spec.js; tests/e2e/bolt-stage63c-lock.spec.js; tests/e2e/bolt-stage63c.spec.js; tests/e2e/bolt-stage64-synchronization-diagnostic.spec.js; tests/e2e/bolt-stage64b.spec.js; tests/e2e/bolt-stage64d.spec.js; tests/e2e/bolt-stage9.spec.js. Łączny zakres PR: **30 plików**. Zależne testy korzystają z nowych kart i jawnego wyboru dnia; asercje danych zachowane. Nowe zrzuty w outputs/GV-20202-HOME/ obejmują home/program/day-two w LIGHT/DARK390 oraz sekcję samodzielną; przejrzane wizualnie, poza Git.

Brak zgody na merge/deploy. Wszystkie wcześniejsze ograniczenia danych i platform pozostają aktualne.
