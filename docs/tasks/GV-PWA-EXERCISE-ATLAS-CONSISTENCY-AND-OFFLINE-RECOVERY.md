# GYMNASTIKA 2.0
# GV-PWA-EXERCISE-ATLAS-CONSISTENCY-AND-OFFLINE-RECOVERY

## Szczegółowy audyt spójności ćwiczeń, renderowania offline i bezpieczeństwa aktualizacji PWA

**TRYB: STRICT ENGINEERING / ROOT CAUSE ANALYSIS / EVIDENCE-BASED / FAIL-CLOSED**

**Środowisko:** Windows 11 — Codex Desktop

**Wykonawca:** Jeden główny Codex, bez subagentów i delegowania zadań.

**Priorytet:** Poprawność aktywnego ćwiczenia, integralność danych treningowych, niezawodność PWA oraz eliminacja rzeczywistych błędów.

---

# 0. GŁÓWNE POLECENIE

Kontynuuj rozwój istniejącej aplikacji GymNastika 2.0 w bieżącej rozmowie Codex Desktop.

Nie rozpoczynaj projektu od nowa.

Nie twórz nowego czatu, gałęzi, repozytorium ani worktree.

Twoim zadaniem jest przeprowadzenie szczegółowego audytu i, jeśli błędy zostaną jednoznacznie odtworzone, wykonanie minimalnych poprawek dotyczących trzech zagadnień:

**PROBLEM A — możliwa niezgodność aktywnego ćwiczenia z atlasem mięśniowym.**

**PROBLEM B — możliwe nieprawidłowe wyświetlanie ilustracji MuscleMap po ponownym uruchomieniu offline.**

**PROBLEM C — niejednoznaczny stan service workera po przerwanej aktualizacji PWA.**

Są to hipotezy wynikające z wcześniejszych raportów i zrzutów ekranu, a nie trzy potwierdzone błędy.

Nie wolno zakładać, że wszystkie trzy problemy rzeczywiście istnieją.

Każdy musi zostać odtworzony, zdiagnozowany i oceniony niezależnie.

Jeśli problem nie zostanie potwierdzony, przedstaw dowody prawidłowego zachowania.

Nie twórz sztucznego błędu tylko po to, aby uzasadnić poprawkę.

---

# 1. ŚRODOWISKO PROJEKTU

**Produkt:** GymNastika 2.0

**Repozytorium:**
https://github.com/PiotrM1974/gymverse

**Istniejący worktree:**

`backup/worktrees/gv-musclemap-atlas-2d`

**Gałąź:**

`feature/gv-musclemap-atlas-2d`

**Dokument nadrzędny:**

`docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`

**Dotychczasowy adres produkcyjny PWA:**

https://piotrm1974.github.io/gymverse/

Nie modyfikuj produkcyjnej aplikacji.

Nie wykonuj merge, push ani deploymentu.

Nie zmieniaj istniejących PR #4–#7.

Nie zmieniaj historycznego MASTER PROMPT v2.8.

Nie twórz subagentów.

Nie wracaj do modeli 3D.

Nie zmieniaj zatwierdzonego kierunku wizualnego MuscleMap C — REFINED.

---

# 2. OBOWIĄZKOWE ZABEZPIECZENIE STANU

Przed rozpoczęciem prac:

1. Sprawdź aktywny worktree i gałąź.
2. Zapisz HEAD SHA.
3. Sprawdź `git status`.
4. Sprawdź `git diff`.
5. Sprawdź pliki staged i unstaged.
6. Zidentyfikuj pliki nieśledzone.
7. Zapisz aktualną konfigurację PWA.
8. Zapisz aktualną wersję cache i service workera.
9. Zidentyfikuj istniejące testy atlasu oraz mechanizmów zapisu.
10. Potwierdź, że żadna operacja diagnostyczna nie nadpisze istniejących zmian.

Nie wykonuj:

- `git reset`
- `git clean`
- `git rebase`
- `git merge`
- checkoutu nadpisującego zmiany
- automatycznego usuwania plików
- modyfikacji PR #4–#7

Przygotuj odczytowy baseline.

Nie twórz nowego Git worktree.

---

# 3. ŹRÓDŁA PRAWDY

Przeczytaj rzeczywiste pliki lokalne, zwłaszcza:

- `src/exercise/catalog.js`
- Aktualny moduł obsługi treningów.
- Aktualny moduł przechodzenia między ćwiczeniami.
- Mechanizm zapisu i wznowienia sesji.
- Komponent kart ćwiczeń.
- Komponent atlasu MuscleMap.
- Moduł mapowania ćwiczeń do mięśni.
- Service worker.
- Konfigurację cache.
- Istniejące testy Playwright.
- Mechanizmy IndexedDB/localStorage.

Odczytaj również:

`outputs/GV-MUSCLEMAP-FULL-CATALOG-IMPLEMENTATION-REPORT.md`

`outputs/GV-MUSCLEMAP-TECHNICAL-CLOSURE-REPORT.md`

oraz ostatni raport:

`outputs/GV-PWA-RELEASE-RECOVERY-AND-IPHONE-READINESS/GV-PWA-RELEASE-RECOVERY-AND-IPHONE-READINESS-REPORT.md`

Jeśli rzeczywista ścieżka pliku różni się od wskazanej, odnajdź plik po nazwie w istniejącym worktree.

Nie odtwarzaj brakujących informacji z pamięci.

Wyniki historyczne służą wyłącznie jako punkt odniesienia.

---

# 4. PROBLEM A — ZGODNOŚĆ ĆWICZENIA Z ATLASEM

## 4.1. Zaobserwowana sytuacja

Na wcześniejszym zrzucie aplikacji:

**Aktywne ćwiczenie:**

„Ściąganie drążka wyciągu górnego do klatki — szeroko”

**Atlas mięśniowy:**

„Wyciskanie sztangi na ławce płaskiej”

Jeśli oba elementy należą do tego samego stanu aktywnego treningu, może to oznaczać błędne powiązanie atlasu z ćwiczeniem.

Nie zakładaj jednak, że jest to rzeczywisty błąd produkcyjnej logiki.

Zrzut pochodzi z testowego scenariusza aktualizacji. Możliwe, że atlas był niezależnym komponentem demonstracyjnym lub że test celowo skonfigurował różne ćwiczenia.

Twoim pierwszym zadaniem jest ustalenie tego faktu.

## 4.2. Analiza architektury

Zidentyfikuj dokładnie:

- Skąd pochodzi ID aktywnego ćwiczenia.
- Skąd pochodzi nazwa wyświetlana na karcie treningowej.
- Skąd atlas otrzymuje ID ćwiczenia.
- Czy atlas pobiera dane z aktywnej sesji, czy niezależnego stanu.
- Czy istnieje osobny stan demonstracyjny.
- Czy komponent może korzystać z nieaktualnego identyfikatora.
- Czy identyfikator jest przekazywany jako parametr.
- Czy stosowany jest indeks tablicy zamiast stabilnego ID.
- Czy zmiana ćwiczenia powoduje odświeżenie atlasu.
- Czy wznowienie treningu odtwarza właściwy identyfikator.
- Czy service worker może dostarczyć niezgodne wersje kodu i mapowania.

Nie wprowadzaj zmian przed ustaleniem rzeczywistego przepływu danych.

## 4.3. Zasada jednego źródła prawdy

W normalnym trybie wykonywania treningu atlas musi prezentować mięśnie ćwiczenia, które aktualnie wykonuje użytkownik.

Jeśli architektura udostępnia kanoniczny identyfikator aktywnego ćwiczenia, wykorzystaj go jako źródło powiązania.

Nie twórz nowego, niezależnego stanu atlasu bez rzeczywistej konieczności.

Nie dodawaj drugiego licznika bieżącego ćwiczenia.

Nie opieraj powiązania na nazwie tekstowej.

Nie dopasowuj ćwiczeń za pomocą podobieństwa nazw.

Nie stosuj automatycznego fallbacku do pierwszej pozycji katalogu.

## 4.4. Zgodność identyfikatorów

Dla każdego testowanego stanu porównaj:

A. ID ćwiczenia aktywnej sesji.

B. ID ćwiczenia widocznego na karcie treningowej.

C. ID ćwiczenia przekazanego do atlasu.

D. ID ćwiczenia użytego do wybrania mapowania mięśni.

E. Nazwę ćwiczenia w nagłówku atlasu.

F. ID wariantu ćwiczenia, jeżeli występuje.

W normalnym trybie treningowym wszystkie identyfikatory muszą odpowiadać tej samej pozycji katalogu i temu samemu wariantowi zgodnie z kontraktem aplikacji.

Rozróżniaj ID od nazw prezentacyjnych. Dwie nazwy mogą się różnić, ale ID musi pozostawać zgodne.

Jeżeli atlas działa w odrębnym trybie edukacyjnym, wyraźnie oddziel ten tryb od aktywnego treningu i przetestuj jego zachowanie osobno.

## 4.5. Scenariusze obowiązkowe

Przetestuj:

**A1 — rozpoczęcie nowego treningu**

Uruchom syntetyczny plan i sprawdź zgodność pierwszego ćwiczenia z atlasem.

**A2 — przejście do kolejnego ćwiczenia**

Sprawdź aktualizację nazwy, ID i mapowania mięśni.

**A3 — przejście między seriami**

Atlas nie może samoczynnie przełączać się na inne ćwiczenie podczas kolejnej serii tego samego ćwiczenia.

**A4 — powrót do poprzedniego ćwiczenia**

Sprawdź zgodność po cofnięciu.

**A5 — zmiana planu treningowego**

Sprawdź, czy atlas nie zachowuje ID z poprzedniego planu.

**A6 — wznowienie przerwanej sesji**

Odtwórz sesję z danymi syntetycznymi. Sprawdź ID ćwiczenia i wariantu po ponownym otwarciu.

**A7 — restart offline**

Otwórz wcześniej przygotowaną sesję bez internetu i sprawdź zgodność.

**A8 — aktualizacja PWA**

Sprawdź zgodność identyfikatorów po kontrolowanej aktualizacji starej wersji do nowej.

**A9 — wszystkie plany i warianty**

Przetestuj istniejące plany Push/Pull oraz wszystkie rzeczywiste warianty zawarte w katalogu.

**A10 — tryb bez aktywnego treningu**

Sprawdź, czy atlas nie przedstawia przypadkowego ćwiczenia jako aktywnego.

**A11 — szybkie przełączanie ćwiczeń**

Sprawdź, czy opóźniona aktualizacja komponentu nie powoduje wyświetlenia nieaktualnego atlasu.

**A12 — aktywny timer przerwy**

Sprawdź zmianę ćwiczenia i powrót do aplikacji przy aktywnym timerze, bez ingerowania w jego logikę.

## 4.6. Test powiązania

Dodaj automatyczny test regresyjny potwierdzający:

`activeExerciseId === atlasExerciseId`

dla normalnego trybu aktywnego treningu.

Jeśli aplikacja rozróżnia ID ćwiczenia i wariantu, zastosuj porównanie odpowiednich stabilnych identyfikatorów.

Nie używaj samego porównania tytułów.

Test musi także sprawdzać rzeczywiście użyte mapowanie atlasu, a nie tylko wartość przekazaną do komponentu.

Jeżeli komponent korzysta ze starej wartości po zmianie ćwiczenia, test powinien to wykrywać.

## 4.7. Kryterium wyniku

**PASS:** brak niezgodności w rzeczywiście wykonanych wymaganych scenariuszach i udokumentowana zgodność źródeł danych.

**FAIL:** odtworzono nieprawidłowe powiązanie.

**PARTIAL:** część scenariuszy zweryfikowano, ale inne pozostają niepewne.

**UNVERIFIED:** brak dowodów pozwalających na rozstrzygnięcie.

---

# 5. PROBLEM B — BŁADA ILUSTRACJA PO URUCHOMIENIU OFFLINE

## 5.1. Zaobserwowana sytuacja

Na wcześniejszych zrzutach ilustracja sylwetki kobiecej wyglądała inaczej po uruchomieniu offline.

W jednym przypadku postać była dobrze widoczna.

W drugim była bardzo jasna, niemal przezroczysta, podczas gdy wybrane oznaczenia mięśni nadal się wyświetlały.

Nie zakładaj automatycznie, że plik WebP nie został pobrany.

Możliwe przyczyny obejmują:

- Brak pobranego obrazu.
- Nieudane dekodowanie obrazu.
- Nieprawidłową wersję pliku w cache.
- Błąd renderowania SVG.
- Różnice opacity.
- Niewłaściwy filtr CSS.
- Błąd `mix-blend-mode`.
- Niewłaściwe `clipPath`.
- Wyścig czasowy podczas renderowania.
- Zrzut wykonany przed zakończeniem ładowania.
- Mieszanie zasobów z różnych wersji PWA.

To lista hipotez diagnostycznych, nie lista potwierdzonych przyczyn.

## 5.2. Audyt komponentu

Sprawdź:

- Źródło URL obrazu WebP.
- Logikę wyboru ilustracji.
- Powiązanie płeć/widok.
- Wartości opacity.
- Filtry grayscale i brightness.
- Mieszanie kolorów.
- Elementy SVG `image`.
- `viewBox`.
- `clipPath`.
- Warstwy nakładek.
- Kolejność renderowania.
- Czas dekodowania obrazu.
- Zachowanie po zmianie widoku.
- Zachowanie po ponownym otwarciu aplikacji.

Nie zmieniaj geometrii SVG.

Nie modyfikuj ilustracji WebP.

## 5.3. Rzeczywista weryfikacja plików

Dla wszystkich czterech ilustracji:

- male-front.webp
- male-back.webp
- female-front.webp
- female-back.webp

Sprawdź:

1. Czy plik znajduje się w aktualnym zestawie zasobów.
2. Czy URL odpowiada właściwej wersji aplikacji.
3. Czy odpowiedź ma prawidłowy status.
4. Czy obraz został poprawnie zdekodowany.
5. Czy wymiary obrazu są prawidłowe.
6. Czy obraz jest dostępny offline.
7. Czy nie występuje konflikt ścieżek.
8. Czy rzeczywiście został wykorzystany podczas renderowania.
9. Czy nie następuje niespodziewana zmiana filtra.
10. Czy nie występują konflikty identyfikatorów SVG.

Nie traktuj samej obecności pliku w Cache Storage jako dowodu prawidłowego renderowania.

## 5.4. Porównanie online/offline

Dla identycznych warunków wykonaj:

**B1 — online, zimny start**

**B2 — online, ponowne otwarcie**

**B3 — offline, pierwsze otwarcie po precache**

**B4 — offline, ponowne otwarcie**

**B5 — offline, zmiana płci**

**B6 — offline, zmiana przód/tył**

**B7 — offline, zmiana ćwiczenia**

**B8 — offline, wznowienie aktywnego treningu**

**B9 — restart po aktualizacji service workera**

**B10 — szybkie przełączanie czterech sylwetek**

Dla każdego scenariusza:

- Wykonaj zrzut ekranu.
- Zapisz status sieci.
- Zapisz użyty URL obrazu.
- Zapisz stan załadowania i dekodowania.
- Zapisz obliczone właściwości CSS.
- Zapisz wersję service workera.
- Zapisz nazwę cache.
- Zapisz błędy konsoli.
- Sprawdź rzeczywistą widoczność ilustracji.

## 5.5. Eliminacja błędu czasowego

Nie wykonuj zrzutu w przypadkowym momencie.

Ustal deterministyczny warunek gotowości:

- Zakończony render komponentu.
- Dostępny obraz.
- Potwierdzone dekodowanie.
- Zakończone wymagane przejścia wizualne.
- Dostępne prawidłowe maski.
- Właściwy stan ćwiczenia.

Nie opieraj testu wyłącznie na arbitralnym `sleep(1000)`.

Jeżeli nie ma wiarygodnego sygnału gotowości, zastosuj odpowiedni pomiar stanu obrazu i DOM w teście.

## 5.6. Porównanie wizualne

Porównaj:

- Widoczność ciała.
- Kontrast ilustracji.
- Położenie nakładek.
- Kolor oznaczeń.
- Jasność.
- Przezroczystość.
- Proporcje.
- Wymiary renderowanej powierzchni.

Porównuj identyczne ćwiczenie, płeć, widok, wariant i ustawienia wizualne.

Nie porównuj różnych konfiguracji jako dowodu błędu.

Nie wymagaj identyczności pikselowej, jeśli istnieją udokumentowane niedeterministyczne różnice renderowania.

Zastosuj odpowiednio uzasadnioną tolerancję wizualną.

## 5.7. Kryterium wyniku

**PASS:** obrazy ładują się i renderują zgodnie z oczekiwaniami we wszystkich wykonanych wymaganych scenariuszach.

**FAIL:** odtworzono rzeczywisty błąd renderowania.

**PARTIAL:** dostępne wyniki nie rozstrzygają wszystkich scenariuszy.

**UNVERIFIED:** brak odpowiednich dowodów.

---

# 6. PROBLEM C — PRZERWANA AKTUALIZACJA SERVICE WORKERA

## 6.1. Stan wcześniejszych badań

W poprzednim eksperymencie odtworzono aktualizację:

`gymverse-v5 → gymverse-v10`

Test standardowej aktualizacji zakończył się pozytywnie.

Jednak podczas przerwanego precache zaobserwowano współistniejące cache v5 i v10.

Nie udało się jednoznacznie potwierdzić, który service worker obsłużył interfejs.

Wynik tej części pozostał PARTIAL.

Twoim zadaniem jest rozstrzygnięcie tej niepewności.

**Samo współistnienie dwóch cache nie musi oznaczać błędu.** Nie traktuj tego automatycznie jako problemu.

## 6.2. Audyt service workera

Sprawdź faktyczny kod i strategię aktualizacji.

Zidentyfikuj:

- Nazwy cache.
- Listę precache.
- Instalację workera.
- Aktywację workera.
- Zachowanie `skipWaiting`.
- Zachowanie `clientsClaim`.
- Mechanizm usuwania starszych cache.
- Strategie obsługi fetch.
- Reakcję na błędy pobierania.
- Zachowanie podczas przerwanej instalacji.
- Zasady przejmowania kontroli nad istniejącymi kartami.
- Ewentualną politykę rollback.

Nie dopisuj nowych mechanizmów wyłącznie na podstawie przypuszczeń.

## 6.3. Rejestrowanie cyklu życia

W izolowanym środowisku testowym rejestruj:

- `registration.installing`
- `registration.waiting`
- `registration.active`
- `navigator.serviceWorker.controller`
- `controllerchange`
- `statechange`
- `updatefound`

Zapisz rzeczywiste URL skryptów workerów i ich stany.

Ustal, który worker kontroluje stronę przed, w trakcie i po aktualizacji.

Nie wnioskuj o aktywnym workerze wyłącznie na podstawie istniejącego cache.

## 6.4. Kontrola pochodzenia zasobów

Dla kluczowych zasobów:

- HTML.
- JavaScript.
- CSS.
- Danych atlasu.
- Ilustracji WebP.
- Mapowań SVG.
- Notice MIT.

Sprawdź:

1. URL.
2. Status odpowiedzi.
3. Źródło odpowiedzi, jeśli można je wiarygodnie ustalić.
4. Wersję zasobu.
5. Hash SHA-256, gdy dostępne są właściwe pliki referencyjne.
6. Zgodność z oczekiwaną wersją aplikacji.

Nie zakładaj, że wszystkie odpowiedzi muszą pochodzić wyłącznie z Cache Storage — weryfikuj faktyczną strategię aplikacji.

## 6.5. Testy przerwania aktualizacji

W odizolowanym profilu wykonaj:

**C1 — przerwanie instalacji przed precache.**

**C2 — przerwanie podczas pobierania zasobów.**

**C3 — przerwanie pod koniec instalacji.**

**C4 — ponowienie aktualizacji po przywróceniu sieci.**

**C5 — zamknięcie strony podczas oczekującej aktualizacji.**

**C6 — aktywny syntetyczny trening podczas aktualizacji.**

**C7 — restart offline po przerwanej aktualizacji.**

**C8 — sprawdzenie kontrolera i wersji zasobów po restarcie.**

Nie wymuszaj ręcznie stanów service workera, które nie odpowiadają rzeczywistemu mechanizmowi aktualizacji.

Jeżeli wstrzykujesz awarię sieci, odnotuj dokładnie moment i zakres przerwania.

## 6.6. Oczekiwane zachowanie

W przypadku nieudanej instalacji nowej wersji aplikacja nie powinna bezpiecznie przechodzić na niekompletny zestaw zasobów.

Oczekiwania szczegółowe ustal na podstawie kontraktu istniejącego service workera i reguł platformy.

Sprawdź, czy:

- Poprzednia wersja pozostaje funkcjonalna tam, gdzie powinna.
- Nowy worker nie przejmuje kontroli przed prawidłowym zakończeniem wymaganej instalacji.
- Nie występuje niezgodne mieszanie kodu i mapowań.
- Dane syntetyczne pozostają integralne.
- Ponowna próba aktualizacji działa zgodnie z istniejącą polityką.
- Nie występuje niekończąca się pętla aktualizacyjna.

Nie usuwaj starych cache automatycznie tylko dlatego, że istnieją równocześnie.

## 6.7. Test bezpieczeństwa danych

Podczas scenariuszy C1–C8 utwórz syntetyczne dane treningowe.

Porównaj pełną zawartość:

- localStorage.
- IndexedDB.
- Historii treningów.
- Serii.
- Ciężarów.
- Powtórzeń.
- Identyfikatorów.
- Ustawień.
- Aktywnego treningu.
- Przerwanej sesji.

Jeżeli wykryjesz ryzyko utraty danych, przerwij niebezpieczne scenariusze.

Nie wykonuj testów na produkcyjnym profilu użytkownika.

---

# 7. DOZWOLONE POPRAWKI

Po jednoznacznym odtworzeniu problemu możesz wprowadzić minimalną poprawkę w istniejącym worktree.

Dotyczy to wyłącznie:

- Synchronizacji aktywnego ćwiczenia z atlasem.
- Usunięcia potwierdzonego błędu renderowania WebP/SVG.
- Naprawy potwierdzonego błędu działania service workera.
- Dodania odpowiednich testów regresyjnych.
- Uzupełnienia dokumentacji.

Przed każdą zmianą:

1. Zapisz reprodukcję.
2. Wskaż przyczynę.
3. Określ dotknięte pliki.
4. Ustal minimalny zakres zmiany.
5. Sprawdź ryzyko wpływu na dane.
6. Przygotuj test, który powinien wykrywać błąd.

Po zmianie:

1. Uruchom test reprodukcyjny.
2. Uruchom odpowiednią regresję.
3. Sprawdź brak zmian w danych użytkownika.
4. Zweryfikuj działanie offline.
5. Sprawdź rzeczywisty diff.
6. Udokumentuj wynik.

**Nie wolno zmieniać mapowań mięśni ani geometrii masek SVG w celu naprawienia błędu synchronizacji.**

Jeżeli naprawa wymaga migracji danych, zmiany kontraktu zapisu, większej przebudowy service workera lub naruszenia innego chronionego obszaru, zatrzymaj tę poprawkę i oznacz ją jako BLOCKED.

Nie poprawiaj niezwiązanych funkcji przy okazji.

---

# 8. PEŁNA REGRESJA PO POPRAWKACH

Na aktualnym stanie kodu wykonaj:

- `npm test`.
- Pełny zestaw Playwright Edge.
- Test katalogu 31 ćwiczeń i 4 wariantów.
- Test zgodności aktywnego ćwiczenia z atlasem.
- Test zmiany ćwiczenia.
- Test wznowienia treningu.
- Test restartu offline.
- Test ładowania czterech WebP.
- Test `pagehide`.
- Test `flushDraftsForStep`.
- Test aktualizacji service workera.
- Test przerwanej aktualizacji.
- Test integralności danych syntetycznych.
- Test formatu eksportu.
- `git diff --check`.

Nie zakładaj istnienia skryptów o podanych nazwach. Użyj rzeczywistych poleceń dostępnych w projekcie.

Jeżeli potrzebny jest nowy test, dodaj go w zakresie tego zlecenia.

Nie usuwaj istniejących testów.

Nie uznawaj testów za zaliczone, jeżeli zostały pominięte.

Nie stosuj pustych bloków `catch` do ukrywania błędów.

---

# 9. TESTY MOBILNE

Sprawdź szerokości:

- 375 px.
- 390 px.
- 430 px.

Dla każdej zweryfikuj:

- Zgodność ćwiczenia i atlasu.
- Poprawność renderowania obrazu.
- Poprawne przełączanie płci.
- Poprawne przełączanie widoku.
- Brak poziomego przewijania.
- Widoczność legendy.
- Działanie rozwijanych szczegółów.
- Prawidłowe zachowanie podczas przerwy między seriami.
- Poprawne odtworzenie po restarcie offline.

Sprawdź również, czy panel timera nie zasłania elementów niezbędnych do obsługi treningu.

Jeżeli WebKit nie jest dostępny, oznacz:

`WEBKIT: UNTESTED`

Nie deklaruj testów na fizycznym iPhonie, jeżeli ich nie wykonano.

Nie publikuj wersji testowej.

---

# 10. ODRĘBNE BRAMKI JAKOŚCI

## GATE A — EXERCISE CONSISTENCY

PASS tylko wtedy, gdy w wymaganych wykonanych scenariuszach atlas odpowiada aktywnemu ćwiczeniu i wariantowi, a zgodność została potwierdzona przez stabilne ID oraz rzeczywiste mapowanie.

## GATE B — IMAGE RENDERING

PASS tylko wtedy, gdy ilustracje renderują się prawidłowo online i offline, a wcześniejszą różnicę udało się wyjaśnić lub wiarygodnie wykluczyć w odpowiednich scenariuszach.

## GATE C — SERVICE WORKER RECOVERY

PASS tylko wtedy, gdy potwierdzono stan kontrolera i bezpieczeństwo zachowania aplikacji podczas wymaganych scenariuszy przerwanej aktualizacji.

## GATE D — DATA INTEGRITY

PASS tylko wtedy, gdy wykonane testy wykazują brak nieautoryzowanej zmiany danych syntetycznych.

## GATE E — REGRESSION

PASS tylko wtedy, gdy wszystkie obowiązkowe, dostępne testy przechodzą po wprowadzonych poprawkach.

## GATE F — MOBILE

Raportuj oddzielnie:

- Edge responsive.
- Playwright WebKit.
- Safari na fizycznym iPhonie.
- PWA na fizycznym iPhonie.

Nie łącz tych wyników.

## GATE G — ANATOMICAL TRANSPARENCY

Zachowaj dotychczasową klasyfikację:

- 0 pełnych.
- 21 częściowych.
- 10 niewystarczających.

Nie zmieniaj ról mięśni.

Nie zmieniaj masek.

Nie wprowadzaj nowych przypisań.

Zachowaj jawne statusy APPROXIMATE, UNAVAILABLE i UNVERIFIED.

---

# 11. RAPORT KOŃCOWY

Przygotuj dokument:

`GV-PWA-EXERCISE-ATLAS-CONSISTENCY-AND-OFFLINE-RECOVERY-REPORT.md`

Raport ma zawierać:

1. Stan Git przed pracą.
2. HEAD SHA.
3. Wykaz odczytanych źródeł.
4. Szczegółową diagnozę problemu A.
5. Szczegółową diagnozę problemu B.
6. Szczegółową diagnozę problemu C.
7. Informację, które problemy rzeczywiście odtworzono.
8. Przyczyny potwierdzonych błędów.
9. Listę wykonanych poprawek.
10. Listę przypadków, w których poprawka nie była potrzebna.
11. Wyniki zgodności ID aktywnego ćwiczenia i atlasu.
12. Wyniki testów wszystkich planów i wariantów.
13. Wyniki porównania WebP online/offline.
14. Wyniki kontroli filtrów, opacity i SVG.
15. Wyniki audytu kontrolera service workera.
16. Wyniki scenariuszy przerwanej aktualizacji.
17. Wyniki integralności danych.
18. Wyniki regresji jednostkowej.
19. Wyniki Playwright Edge.
20. Wyniki testów mobilnych.
21. Status WebKit i iPhone.
22. Listę zmienionych plików.
23. Stan Git po pracy.
24. Status każdej bramki.
25. Nierozwiązane problemy.
26. Rekomendację dotyczącą gotowości do testów na iPhonie.

Dla każdego problemu zastosuj:

- CONFIRMED BUG.
- NOT REPRODUCED.
- EXPECTED BEHAVIOR.
- INSUFFICIENT EVIDENCE.

Nie stosuj NOT REPRODUCED jako dowodu, że błąd nie może wystąpić.

Dla każdej poprawki podaj dowód, że usunęła konkretny błąd.

---

# 12. PAKIET DOWODOWY

Przygotuj jeden ZIP:

`GV-PWA-EXERCISE-ATLAS-CONSISTENCY-AND-OFFLINE-RECOVERY.zip`

Uwzględnij:

- Raport końcowy.
- Logi testów.
- Wyniki regresji.
- Zrzuty ekranu problemu A.
- Porównanie obrazów online/offline.
- Zestawienie kontrolerów service workera.
- Historię stanów workerów.
- Wyniki kontroli cache.
- Dowody integralności syntetycznych danych.
- Listę zmian i nierozstrzygniętych problemów.

Nie dołączaj rzeczywistych danych treningowych.

Nie dołączaj haseł, tokenów, ciasteczek ani innych sekretów.

---

# 13. OCHRONA PROJEKTU

Bezwzględnie zabronione:

- Tworzenie subagentów.
- Tworzenie nowego czatu.
- Tworzenie gałęzi lub worktree.
- Merge.
- Push.
- Deployment.
- Rebase.
- Reset.
- Czyszczenie worktree.
- Modyfikacja PR #4–#7.
- Modyfikacja MASTER PROMPT v2.8.
- Zmiana adresu produkcyjnej PWA.
- Zmiana identyfikatorów ćwiczeń.
- Zmiana formatów eksportu.
- Migracja danych użytkownika.
- Zmiana anatomii.
- Zmiana masek SVG.
- Zmiana zatwierdzonych mapowań.
- Przebudowa całego atlasu.
- Powrót do 3D.
- Publiczne udostępnienie serwera testowego.

Pracuj w istniejącym worktree.

Zachowaj dotychczasowy wariant C — REFINED i całą historię wykonanych prac.

---

# 14. KOŃCOWA DECYZJA

Na zakończenie określ niezależnie:

**A. Poprawność powiązania atlasu z aktywnym ćwiczeniem.**

**B. Poprawność renderowania online/offline.**

**C. Bezpieczeństwo przerwanej aktualizacji service workera.**

**D. Integralność danych treningowych.**

**E. Regresję techniczną.**

**F. Gotowość do izolowanych testów na iPhonie.**

Dopuszczalne decyzje zbiorcze:

### READY FOR ISOLATED IPHONE TEST

Wymagane lokalne kontrole związane z bezpieczeństwem testu urządzeniowego zostały zaliczone. Nie ma znanych błędów blokujących, a ewentualne niezamknięte zagadnienia produkcyjnej aktualizacji są jawnie wskazane i wyłączone z zakresu testów urządzeniowych.

Nie jest to zgoda na publikację.

### NOT READY

Wykryto rzeczywiste problemy blokujące lub ryzyko utraty danych.

### INSUFFICIENT EVIDENCE

Brakuje dowodów niezbędnych do wiarygodnego określenia bezpieczeństwa danego etapu.

Nie wymuszaj PASS.

---

# 15. OSTATECZNA DYREKTYWA

**Zbadaj trzy wskazane problemy i rozstrzygnij je na podstawie rzeczywistych dowodów.**

Najpierw odtwórz zachowanie.

Następnie ustal przyczynę.

Jeżeli problem istnieje i mieści się w dozwolonym zakresie, wykonaj minimalną poprawkę.

Po poprawce przeprowadź test regresyjny.

Nie zmieniaj innych części aplikacji.

Nie stosuj domysłów.

Nie ukrywaj brakujących dowodów.

Nie zmieniaj rzeczywistych danych treningowych.

Nie korzystaj z subagentów.

Nie wykonuj merge, push ani deploymentu.

Zakończ szczegółowym raportem i pakietem dowodowym.

**ZATRZYMAJ SIĘ PO PRZEDSTAWIENIU WYNIKÓW.**

Dalsze działania wymagają osobnej zgody właściciela GymNastika.