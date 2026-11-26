# GYMNASTIKA 2.0
# GV-EXERCISE-VISUAL-UNIFICATION-AND-UI-HARDENING

## Kompleksowa modernizacja ilustracji ćwiczeń, poprawa interfejsu atlasu i kontrola wariantów

**TRYB: STRICT ENGINEERING / VERIFIED VISUALS / NO GUESSWORK / DATA SAFETY FIRST**

**Środowisko:** Windows 11, Codex Desktop

**Wykonawca:** Jeden główny Codex, bez subagentów.

**Projekt:** Istniejąca aplikacja GymNastika 2.0.

---

# 0. GŁÓWNY CEL

Kontynuuj istniejący projekt GymNastika 2.0 w bieżącej rozmowie Codex Desktop.

Nie rozpoczynaj projektu od nowa.

Nie twórz nowej rozmowy, gałęzi, repozytorium ani worktree.

Wykonaj trzy powiązane zadania:

**A. GV-EXERCISE-ILLUSTRATIONS-2D**

Zastąpienie dotychczasowych ilustracji techniki ćwiczeń — ciemnych grafik z neonowymi, zielonymi akcentami — nowymi, profesjonalnymi ilustracjami 2D spójnymi wizualnie z atlasem MuscleMap.

**B. GV-MUSCLEMAP-RESPONSIVE-LAYOUT**

Usunięcie problemu wychodzenia legendy i opisów atlasu poza granice karty oraz poprawa responsywności interfejsu.

**C. GV-EXERCISE-VARIANT-CONSISTENCY**

Pełna weryfikacja i ewentualna naprawa powiązania aktualnego ćwiczenia, jego wariantu i odpowiedniej wizualizacji MuscleMap.

Nie zmieniaj anatomii atlasu MuscleMap.

Nie wracaj do modeli 3D.

Nie wykonuj merge, push ani deploymentu.

---

# 1. ŚRODOWISKO I OCHRONA PROJEKTU

Repozytorium:

https://github.com/PiotrM1974/gymverse

Istniejący worktree:

`backup/worktrees/gv-musclemap-atlas-2d`

Gałąź:

`feature/gv-musclemap-atlas-2d`

Dokument nadrzędny:

`docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`

Dotychczasowy adres produkcyjny:

https://piotrm1974.github.io/gymverse/

Obowiązują ograniczenia:

- Nie zmieniaj MASTER PROMPT v2.8.
- Nie modyfikuj PR #4–#7.
- Nie wykonuj merge.
- Nie wykonuj push.
- Nie wykonuj deploymentu.
- Nie twórz subagentów.
- Nie twórz nowego worktree.
- Nie zmieniaj identyfikatorów ćwiczeń.
- Nie zmieniaj formatów eksportu.
- Nie migruj danych treningowych.
- Nie zmieniaj schematów IndexedDB ani localStorage.
- Nie przebudowuj istniejącego atlasu MuscleMap.
- Nie modyfikuj zatwierdzonych roboczo mapowań mięśni.

Zachowaj wszystkie dotychczasowe funkcjonalności.

---

# 2. FAZA ZERO — AUDYT PRZED ZMIANAMI

Przed rozpoczęciem implementacji wykonaj kontrolę obecnego projektu.

## 2.1. Git

Sprawdź:

1. Aktualny katalog roboczy.
2. Aktywną gałąź.
3. HEAD SHA.
4. Stan plików staged i unstaged.
5. Pliki nieśledzone.
6. `git status`.
7. `git diff --stat`.
8. `git diff --check`.
9. Istniejące modyfikacje atlasu.
10. Zależności od PR #7.

Nie wykonuj reset, clean, rebase ani merge.

Nie nadpisuj wcześniej przygotowanych zmian.

Zapisz stan wyjściowy.

## 2.2. Dokumentacja

Odczytaj rzeczywiste pliki:

- MASTER PROMPT v2.8.
- Katalog ćwiczeń `src/exercise/catalog.js`.
- Istniejący system ilustracji ćwiczeń.
- Manifest ilustracji i jego kontrakt.
- Metadane ćwiczeń.
- Aktualny atlas MuscleMap.
- Mapowania 31 ćwiczeń i 4 wariantów.
- Moduł wykonywania treningów.
- Moduł wyboru wariantów.
- Konfigurację PWA i service workera.
- Istniejące testy regresyjne.

Zweryfikuj również wcześniejsze ustalenia dotyczące PR #5 i #6, bez modyfikowania tych PR.

Nie zakładaj, że manifest ilustracji jest już wdrożony na obecnej gałęzi, dopóki nie potwierdzisz jego rzeczywistego stanu.

## 2.3. Inwentaryzacja obecnych ilustracji

Dla każdego ćwiczenia ustal:

- Oryginalne ID.
- Nazwę.
- Istniejący plik ilustracji.
- Format pliku.
- Wymiary.
- Rozmiar.
- Źródło.
- Licencję, jeśli jest udokumentowana.
- Sposób wykorzystania w interfejsie.
- Występowanie w cache offline.
- Powiązanie z wariantami.

Nie usuwaj starych ilustracji.

Zachowaj je jako materiał historyczny i ewentualny techniczny fallback.

---

# 3. ZADANIE A — NOWE ILUSTRACJE ĆWICZEŃ 2D

## 3.1. Cel wizualny

Obecnie GymNastika ma dwa odmienne style:

**Stare ilustracje ćwiczeń:**
- Ciemne tło.
- Neonowa zieleń.
- Styl przypominający grafiki techniczne lub gry.
- Niespójność z realistycznym atlasem.

**Nowy atlas MuscleMap:**
- Realistyczna sylwetka.
- Anatomiczne szczegóły.
- Neutralna skala szarości.
- Czerwone i żółte podświetlenia mięśni.
- Jasne, czytelne tło.

Nowe ilustracje techniki ćwiczeń mają nawiązywać do estetyki MuscleMap, ale nie muszą wykorzystywać dokładnie tych samych postaci.

**MuscleMap pokazuje aktywne mięśnie. Ilustracja ćwiczenia pokazuje sposób wykonania ruchu. Nie są to zamienne zasoby.**

## 3.2. Docelowy styl

Przyjmij spójny styl:

- Realistyczna lub wysokiej jakości półrealistyczna ilustracja 2D.
- Neutralna kolorystyka.
- Wyraźna anatomia i proporcje.
- Czytelna pozycja całego ciała albo odpowiedniego jego fragmentu.
- Poprawnie odwzorowany sprzęt.
- Jasne lub neutralne tło.
- Estetyka nowoczesnej aplikacji fitness.
- Brak przypadkowych napisów w grafikach.
- Brak neonowych zielonych konturów.
- Brak agresywnych efektów świetlnych.
- Brak dekoracji utrudniających interpretację ruchu.
- Brak nieuzasadnionych oznaczeń mięśni.

Ilustracje muszą wyglądać profesjonalnie i zachować spójność pomiędzy wszystkimi ćwiczeniami.

Nie wykorzystuj przypadkowych obrazków o różnych stylach.

## 3.3. Charakter ilustracji

Każda ilustracja ma jednoznacznie pokazywać:

- Rodzaj ćwiczenia.
- Właściwy sprzęt.
- Poprawne ustawienie ciała.
- Ułożenie kończyn.
- Prawidłowy sposób trzymania sprzętu.
- Odpowiedni zakres przedstawianego ruchu.
- Pozycję początkową i końcową, jeśli są właściwe dla danego ćwiczenia.

Preferowane rozwiązanie:

**Dwie pozycje przedstawiające ruch: START i KONIEC.**

Dopuszczalna jest również jedna ilustracja z dwiema wyraźnie rozróżnionymi pozycjami, jeśli jest to czytelne i poprawne.

Nie twórz animacji wyłącznie dlatego, że dostępne jest takie narzędzie.

Najpierw zapewnij poprawne ilustracje statyczne.

## 3.4. Weryfikacja techniki

To wymaganie krytyczne.

Nie wolno generować ilustracji na podstawie samej nazwy ćwiczenia.

Dla każdego ćwiczenia:

1. Odczytaj pełną definicję z katalogu.
2. Sprawdź jego wariant.
3. Ustal rodzaj sprzętu.
4. Odczytaj istniejące instrukcje wykonania.
5. Sprawdź ustawienia charakterystyczne dla wariantu.
6. Zweryfikuj technikę w wiarygodnych źródłach.
7. Dopiero następnie przygotuj ilustrację.

Wykorzystuj między innymi wiarygodne materiały instruktażowe i podręczniki ćwiczeń siłowych, z uwzględnieniem praw autorskich.

Nie kopiuj cudzej grafiki tylko dlatego, że jest publicznie dostępna.

Jeżeli źródła opisują różne poprawne warianty techniki, wybierz wyłącznie wariant jednoznacznie zgodny z katalogiem GymNastika.

Jeśli katalog nie określa istotnej różnicy, nie zgaduj.

Oznacz konflikt i przygotuj go do decyzji właściciela.

## 3.5. Błędy niedopuszczalne

Nie akceptuj ilustracji zawierających:

- Nieprawidłowy chwyt.
- Nieprawidłową pozycję ciała.
- Niewłaściwy sprzęt.
- Błędny kierunek ruchu.
- Nienaturalne stawy.
- Dodatkowe palce lub kończyny.
- Zniekształcone hantle lub sztangi.
- Nieprawidłowo pokazane maszyny.
- Niemożliwy mechanicznie układ sprzętu.
- Niespójne pozycje START i KONIEC.
- Ruch niezgodny z nazwą i definicją ćwiczenia.
- Pomieszanie wariantów.
- Niespójne ustawienie sprzętu pomiędzy klatkami.

Nie uznawaj estetycznego obrazu za poprawny technicznie.

## 3.6. Źródła obrazów

Przeprowadź badanie dostępnych, bezpłatnych zasobów.

Preferencje:

1. Własne oryginalne ilustracje, przygotowane z wykorzystaniem zweryfikowanych materiałów referencyjnych.
2. Zasoby CC0 lub domena publiczna.
3. Zasoby MIT lub inne zgodne licencje, jeśli obejmują konkretne grafiki.
4. CC BY 4.0 po spełnieniu warunków.
5. Inne licencje tylko po analizie możliwości wykorzystania.

Nie korzystaj z materiałów płatnych.

Nie używaj grafik oznaczonych jedynie jako „free”, jeśli nie mają jasnych praw do redystrybucji.

Nie zakładaj, że licencja kodu repozytorium obejmuje automatycznie jego obrazy.

Nie usuwaj znaków wodnych.

Nie kopiuj ilustracji z płatnych atlasów ani aplikacji.

## 3.7. Generowanie ilustracji

Możesz wykorzystać dostępne, bezpłatne narzędzia generowania obrazów lub obróbki grafiki, o ile są rzeczywiście dostępne w środowisku.

Nie korzystaj z płatnych API ani subskrypcji.

Nie twórz fikcyjnych narzędzi ani nie deklaruj wykonania grafik, których nie wygenerowano.

Materiały AI traktuj jako propozycje wymagające kontroli.

Każdy obraz musi przejść osobny przegląd techniki ćwiczenia.

Nie oznaczaj ilustracji jako zatwierdzonej tylko dlatego, że wygląda realistycznie.

Jeżeli nie ma odpowiedniego narzędzia do wygenerowania poprawnej ilustracji, zgłoś ograniczenie. Nie zastępuj zadania przypadkową grafiką.

---

# 4. ZAKRES ĆWICZEŃ I WARIANTÓW

Docelowy katalog:

**31 ćwiczeń i 4 warianty.**

Dokładną liczbę unikalnych zestawów ilustracji ustal na podstawie rzeczywistych danych.

Nie zakładaj, że wszystkie warianty wymagają nowych plików.

Nie zakładaj również, że dwa podobne ćwiczenia mogą korzystać z tej samej ilustracji.

Każde współdzielenie ilustracji musi być uzasadnione rzeczywistą zgodnością ruchu, sprzętu i techniki.

## 4.1. Kolejność prac

Najpierw przygotuj cztery referencyjne ćwiczenia:

- `lat_raise_stand`
- `db_bench`
- `lat_pulldown_wide`
- `leg_press`

Dla każdego przygotuj:
- Pozycję START.
- Pozycję KONIEC.
- Podgląd w karcie ćwiczenia.
- Opis użytego sprzętu.
- Źródła weryfikacji techniki.
- Status poprawności.

Te cztery ćwiczenia mają posłużyć do oceny spójności nowego stylu i mechanizmu ilustracji.

Po pozytywnej kontroli technicznej kontynuuj przygotowanie pozostałych pozycji katalogu w tym samym standardzie.

**Nie oznaczaj całego katalogu jako ukończonego, dopóki każda wymagana ilustracja nie istnieje i nie przejdzie wymaganych kontroli.**

Ilustracje wymagające niezależnej oceny techniki pozostają oznaczone jako oczekujące na zatwierdzenie, nawet jeśli technicznie poprawnie wyświetlają się w aplikacji.

## 4.2. Status ilustracji

Każdy zestaw ilustracji otrzymuje status:

- VERIFIED — potwierdzona zgodność z udokumentowaną techniką przez odpowiednio kompetentnego recenzenta.
- TECHNICALLY_VALID — pliki są poprawne, a zgodność z referencjami została sprawdzona w zakresie dostępnych dowodów, bez niezależnej akceptacji.
- PARTIAL — wymaga poprawek.
- UNVERIFIED — brak wystarczających dowodów poprawności techniki.
- UNAVAILABLE — brak odpowiedniej ilustracji.

Nie traktuj TECHNICALLY_VALID jako pełnej niezależnej walidacji biomechanicznej.

Nie oznaczaj UNVERIFIED jako VERIFIED.

---

# 5. FORMATY I ORGANIZACJA ILUSTRACJI

## 5.1. Format

Preferuj formaty odpowiednie dla PWA:

- WebP dla realistycznych ilustracji.
- SVG dla ewentualnych prostych oznaczeń ruchu.
- PNG jako materiał diagnostyczny, jeżeli potrzebny.

Nie wprowadzaj ciężkich plików bez uzasadnienia.

Nie zmniejszaj jakości tak mocno, aby nie można było rozpoznać sprzętu lub pozycji.

Wybór rozdzielczości oprzyj na realnych rozmiarach renderowania i gęstości pikseli docelowych ekranów.

## 5.2. Nazewnictwo

Zastosuj istniejący kontrakt manifestu ilustracji, po jego odczytaniu.

Zachowaj identyfikatory ćwiczeń.

Nie wymyślaj nowego schematu, jeśli projekt ma już obowiązujący.

Przykładowa logiczna struktura, tylko jeśli jest zgodna z kontraktem:

- Exercise ID.
- Variant ID.
- START asset.
- END asset.
- Source.
- License.
- Review status.
- Version.

Nie dodawaj metadanych atlasu do rekordów treningowych.

## 5.3. Fallback

Jeżeli nowe ilustracje nie zostały zweryfikowane:

- Nie wyświetlaj ich jako zatwierdzonych.
- Zachowaj dotychczasowy materiał jako techniczny fallback, jeżeli jest dostępny i legalny.
- Oznacz brak docelowej ilustracji w raporcie.
- Nie podmieniaj obrazów po cichu.
- Nie prezentuj starego stylu jako nowej zatwierdzonej ilustracji.

Nie usuwaj starych plików podczas tego etapu.

---

# 6. INTEGRACJA Z KARTĄ ĆWICZENIA

## 6.1. Docelowy wygląd

Zachowaj ciemny motyw GymNastika.

Nowa ilustracja powinna być czytelna w karcie ćwiczenia, estetycznie kontrastując z ciemnym otoczeniem.

Preferowany układ:

1. Ilustracja techniki.
2. Nazwa ćwiczenia.
3. Informacja o seriach i powtórzeniach.
4. Zwięzła wskazówka techniczna, jeśli istnieje w katalogu.
5. Atlas MuscleMap w osobnej sekcji poniżej.

Nie łącz ilustracji techniki i atlasu w jeden nieczytelny obraz.

## 6.2. START i KONIEC

Jeśli ćwiczenie ma dwa zatwierdzone obrazy, przygotuj przełączanie pomiędzy pozycjami.

Możliwe rozwiązanie:
- Dwie miniatury.
- Przełącznik START / KONIEC.
- Dwa widoki obok siebie na szerszym ekranie.

Dobierz sposób prezentacji do istniejącej architektury i dostępnej przestrzeni.

Nie wprowadzaj automatycznej animacji, dopóki nie ma prawidłowych obrazów obu pozycji.

## 6.3. Responsywność

Przetestuj:

- 375 px.
- 390 px.
- 430 px.
- Wąską kartę desktopową.
- Szerszy widok desktopowy.

Nie przycinaj sylwetek.

Nie rozciągaj obrazów w sposób zmieniający proporcje.

Używaj odpowiednich wartości `object-fit` i rozmiarów kontenerów.

Sprawdź, czy timer przerwy nie zasłania ważnych kontrolek.

---

# 7. ZADANIE B — NAPRAWA UKŁADU ATLASU

## 7.1. Obecny problem

Na rzeczywistym zrzucie z GymNastika legenda atlasu MuscleMap wychodzi poza prawą granicę białej karty.

Szczególnie dotyczy to długich nazw mięśni oraz opisów dokładności.

Problem zaobserwowano w wąskiej karcie desktopowej. Wcześniejsze testy szerokości mobilnych nie wykazały tego samego defektu.

Nie zakładaj, że jest to problem wyłącznie telefonów.

## 7.2. Diagnostyka

Sprawdź:

- Szerokość karty.
- Wewnętrzny padding.
- Układ grid/flex.
- `min-width`.
- `max-width`.
- `flex-shrink`.
- `minmax(0, 1fr)`.
- Szerokości SVG.
- Szerokość legendy.
- Łamanie długich nazw.
- `overflow-wrap`.
- Zachowanie rozwijanych opisów.
- Marginesy i zaokrąglenia.

Zidentyfikuj faktyczną przyczynę na podstawie obliczonych wymiarów DOM.

Nie maskuj problemu przez ustawienie `overflow: hidden`, jeżeli spowoduje to obcięcie treści.

## 7.3. Docelowy układ

Na szerokich ekranach dopuszczalne jest umieszczenie ilustracji i legendy obok siebie.

Na wąskich kartach:

**Ilustracja powinna znajdować się nad legendą.**

Legenda powinna zajmować pełną dostępną szerokość.

Teksty muszą się prawidłowo zawijać.

Nie może występować poziome przewijanie karty.

Nie wolno obcinać nazw mięśni.

Nie wolno ukrywać informacji APPROXIMATE, UNAVAILABLE i UNVERIFIED.

Nie zmieniaj geometrii SVG.

## 7.4. Testy układu

Sprawdź rzeczywistą szerokość komponentu, a nie tylko szerokość całego viewportu.

Przetestuj w szczególności różne szerokości kontenera, również w sytuacji, gdy desktop ma szeroki ekran, ale sama karta jest wąska.

Sprawdź:
- Długie nazwy mięśni.
- Wiele mięśni głównych.
- Wiele mięśni pomocniczych.
- Brakujące powierzchnie.
- Długie uzasadnienia APPROXIMATE.
- Wszystkie cztery sylwetki.
- Rozwijane szczegóły.
- Aktywny timer treningu.

Dodaj test regresyjny potwierdzający, że żaden widoczny element legendy nie wykracza poza granice kontenera.

Wykonaj porównawcze zrzuty przed i po poprawce.

---

# 8. ZADANIE C — WERYFIKACJA VARIANT ID

## 8.1. Cel

Wcześniejszy audyt potwierdził zgodność bazowego ID ćwiczenia z atlasem.

Jednak obsługa `variantId` w aktywnej sesji pozostała niezweryfikowana.

Twoim zadaniem jest zamknięcie tej niepewności.

Nie zakładaj, że wariant jest reprezentowany w taki sam sposób jak ćwiczenie bazowe.

## 8.2. Audyt

Sprawdź:

- Strukturę katalogu.
- Sposób przechowywania wariantów.
- Identyfikator wariantu.
- Sposób wyboru wariantu.
- Sposób zapisu aktywnej sesji.
- Sposób wznowienia sesji.
- Sposób wyboru ilustracji.
- Sposób wyboru mapowania MuscleMap.
- Sposób eksportowania danych.

## 8.3. Wymagana zgodność

Dla normalnego trybu treningowego sprawdź:

- `activeExerciseId`
- `activeVariantId`, jeśli występuje
- ID wyświetlanej karty ćwiczenia
- ID użyte do wyboru ilustracji techniki
- ID użyte do wyboru mapowania atlasu
- ID wykorzystywane podczas wznowienia sesji

Wszystkie muszą odpowiadać tej samej rzeczywistej pozycji katalogu i wybranemu wariantowi.

Nie dopasowuj wariantów na podstawie podobieństwa nazw.

Nie stosuj automatycznego fallbacku do niepowiązanego ćwiczenia.

Jeżeli wariant zgodnie z katalogiem współdzieli ilustrację lub mapowanie z ćwiczeniem bazowym, potwierdź to na podstawie danych.

## 8.4. Scenariusze testowe

Przetestuj:

1. Wybór ćwiczenia bazowego.
2. Wybór każdego z czterech wariantów.
3. Zmianę wariantu przed rozpoczęciem treningu.
4. Zmianę wariantu w dozwolonym przez aplikację momencie.
5. Przejście do następnego ćwiczenia.
6. Wznowienie przerwanego treningu.
7. Restart offline.
8. Aktualizację PWA w izolowanym środowisku.
9. Powrót z innego planu.
10. Zmianę ćwiczenia z aktywnym timerem.

Nie dodawaj funkcji zmiany wariantu w trakcie treningu, jeżeli istniejąca aplikacja jej nie obsługuje. Testuj rzeczywisty kontrakt.

## 8.5. Kryterium zaliczenia

PASS wymaga potwierdzonej zgodności identyfikatorów ćwiczenia i wariantu z rzeczywiście wyświetlanymi danymi.

Jeśli znajdziesz błąd, najpierw go odtwórz.

Następnie wykonaj minimalną poprawkę bez modyfikowania trwałych identyfikatorów.

Nie zmieniaj schematów danych użytkownika.

---

# 9. OCHRONA DANYCH TRENINGOWYCH

To bramka krytyczna.

Nie wolno zmieniać:

- Historii treningów.
- Serii.
- Ciężarów.
- Powtórzeń.
- Aktywnych sesji.
- Przerwanych treningów.
- Identyfikatorów ćwiczeń.
- Identyfikatorów wariantów.
- Jednostek.
- Formatów eksportu.
- Schematów IndexedDB.
- Schematów localStorage.

Wszystkie testy wykonuj na syntetycznych danych.

Przed i po każdej istotnej zmianie sprawdź pełną zawartość magazynów testowych.

Nie wystarczy porównanie liczby rekordów.

Zachowaj wcześniejszą naprawę `pagehide` oraz `flushDraftsForStep`.

Nie testuj migracji ani czyszczenia danych na rzeczywistym profilu użytkownika.

---

# 10. OFFLINE I PWA

Nowe ilustracje muszą działać offline.

Sprawdź:

1. Wykaz wszystkich nowych zasobów.
2. Poprawność ścieżek.
3. Zgodność z `/gymverse/`.
4. Mechanizm precache.
5. Wersjonowanie cache.
6. Pobieranie ilustracji.
7. Dekodowanie WebP.
8. Dostępność obrazów START i KONIEC.
9. Dostępność atlasu MuscleMap.
10. Notice MIT i pozostałe wymagane informacje licencyjne.

Nie zmieniaj strategii service workera bez rzeczywistej potrzeby.

Jeśli dodanie ilustracji wymaga aktualizacji manifestu lub listy precache, wykonaj to zgodnie z istniejącym kontraktem.

Nie publikuj aplikacji.

---

# 11. TESTY AUTOMATYCZNE

Po implementacji uruchom:

- `npm test`.
- Pełny Playwright Edge.
- Test katalogu 31 ćwiczeń i 4 wariantów.
- Test integralności manifestu ilustracji.
- Test istnienia plików.
- Test ścieżek zasobów.
- Test zgodności identyfikatorów.
- Test wariantów.
- Test responsywności.
- Test braku overflow legendy.
- Test offline.
- Test cache.
- Test wznowienia treningu.
- Test `pagehide`.
- Test eksportu.
- `git diff --check`.

Używaj rzeczywistych skryptów projektu.

Nie zakładaj istnienia poleceń, których nie ma.

Dodaj testy dla nowych funkcjonalności i naprawionych błędów.

Nie usuwaj ani nie osłabiaj istniejących testów.

Nie poprawiaj testów tylko po to, aby uzyskać PASS.

## 11.1. Testy ilustracji

Automatycznie zweryfikuj:

- Każde wymagane ćwiczenie ma prawidłowo określony stan ilustracji.
- Każdy plik istnieje.
- Każdy plik można odczytać.
- Format jest prawidłowy.
- Wymiary są poprawne.
- Manifest nie zawiera nieznanych ID.
- Obrazy START/KONIEC są prawidłowo przypisane.
- Nie ma przypadkowego przypisania ilustracji do innego ćwiczenia.
- Status zatwierdzenia nie jest zawyżony.
- Istnieje udokumentowane pochodzenie i licencja.

## 11.2. Testy wizualne

Przygotuj rzeczywiste zrzuty:

- Wszystkich nowych ilustracji.
- Czterech ćwiczeń referencyjnych.
- Widoku karty treningowej.
- Widoku atlasu.
- Widoku z aktywnym timerem.
- Wąskich kart desktopowych.
- Widoków mobilnych.

Nie wykorzystuj wcześniejszych zrzutów jako nowych wyników.

## 11.3. WebKit i iPhone

Jeżeli WebKit pozostaje niedostępny, oznacz UNTESTED.

Nie deklaruj testów na fizycznym iPhonie.

Nie publikuj wersji testowej bez zgody właściciela.

---

# 12. BRAMKI JAKOŚCI

## GATE 1 — SOURCE INTEGRITY

Zweryfikowany obecny stan projektu, katalogu i manifestów.

## GATE 2 — ILLUSTRATION LICENSING

Każda użyta ilustracja ma udokumentowane prawa do wykorzystania.

## GATE 3 — EXERCISE TECHNIQUE

Każdy zestaw ilustracji ma określony status zgodności z udokumentowaną techniką.

Nie zaliczaj niezależnej walidacji eksperckiej bez rzeczywistego przeglądu.

## GATE 4 — VISUAL CONSISTENCY

Ilustracje tworzą spójny stylistycznie zestaw.

## GATE 5 — CATALOG COVERAGE

Wszystkie wymagane pozycje mają jednoznacznie określony stan zasobów.

Rozróżniaj dostępność ilustracji od ich zatwierdzenia merytorycznego.

## GATE 6 — RESPONSIVE LAYOUT

Żaden element legendy nie wychodzi poza kartę.

## GATE 7 — VARIANT CONSISTENCY

Identyfikator ćwiczenia, wariantu, ilustracji i atlasu pozostaje zgodny.

## GATE 8 — OFFLINE

Wymagane zasoby działają bez dostępu do internetu.

## GATE 9 — DATA SAFETY

Nie wykryto nieautoryzowanych zmian danych treningowych.

## GATE 10 — REGRESSION

Wszystkie obowiązkowe dostępne testy zakończone.

## GATE 11 — MOBILE READINESS

Gotowość do izolowanego testu na iPhonie oceniona niezależnie od rzeczywistego testu urządzeniowego.

Dopuszczalne statusy:

- PASS.
- PARTIAL.
- FAIL.
- BLOCKED.
- UNTESTED.

Nie wymuszaj PASS.

---

# 13. RAPORT I MATERIAŁY WYNIKOWE

Przygotuj:

`GV-EXERCISE-VISUAL-UNIFICATION-AND-UI-HARDENING-REPORT.md`

Raport musi zawierać:

1. Stan Git przed i po pracy.
2. HEAD SHA.
3. Listę wykorzystanych źródeł.
4. Audyt pierwotnych ilustracji.
5. Opis wybranego docelowego stylu.
6. Inwentaryzację nowych ilustracji.
7. Listę wszystkich ćwiczeń i wariantów.
8. Status każdego zestawu START/KONIEC.
9. Źródła techniki ćwiczeń.
10. Wyniki kontroli techniki.
11. Pochodzenie i licencje grafik.
12. Lista ilustracji wymagających dodatkowej akceptacji.
13. Wyniki naprawy układu legendy.
14. Wyniki weryfikacji variantId.
15. Wyniki testów jednostkowych.
16. Wyniki Playwright.
17. Wyniki offline.
18. Wyniki kontroli danych treningowych.
19. Porównawcze zrzuty przed i po.
20. Listę zmienionych plików.
21. Status każdej bramki.
22. Nierozwiązane problemy.
23. Rekomendację dalszych prac.

Dla każdej ilustracji zapisz:

- Exercise ID.
- Variant ID, jeśli dotyczy.
- START file.
- END file.
- Source.
- License.
- SHA-256.
- Technical review status.
- Anatomical/technique review status.
- Notes.

---

# 14. PAKIET KONTROLNY

Przygotuj ZIP:

`GV-EXERCISE-VISUAL-UNIFICATION-AND-UI-HARDENING.zip`

Uwzględnij:

- Raport.
- Macierz ilustracji.
- Plansze podglądowe.
- Cztery ćwiczenia referencyjne.
- Zestawienie licencji.
- Wyniki testów.
- Zrzuty interfejsu.
- Testy responsywności.
- Testy wariantów.
- Listę braków i ograniczeń.

Nie dodawaj rzeczywistych danych treningowych.

Nie dołączaj sekretów, haseł i tokenów.

Nie duplikuj dużych plików historycznych bez potrzeby.

---

# 15. KOŃCOWA DECYZJA

Oceń niezależnie:

**A. Gotowość ilustracji techniki ćwiczeń.**

**B. Spójność wizualną GymNastika.**

**C. Responsywność atlasu.**

**D. Zgodność ćwiczeń i wariantów.**

**E. Bezpieczeństwo danych.**

**F. Działanie offline.**

**G. Gotowość do testów na iPhonie.**

Nie przedstawiaj nieukończonego zestawu ilustracji jako kompletnego.

Nie uznawaj TECHNICALLY_VALID za niezależną certyfikację techniki.

## Dopuszczalne decyzje zbiorcze

**READY FOR VISUAL REVIEW**

Przygotowano materiały pozwalające właścicielowi ocenić nowy styl i jakość ilustracji, a dostępne testy techniczne nie wykazały blokad w tym zakresie.

**READY FOR ISOLATED IPHONE TEST**

Wymagane lokalne kontrole zostały zakończone, a materiały przewidziane do testu urządzeniowego są odpowiednio przygotowane i jawnie oznaczone.

Nie oznacza to zgody na produkcję.

**PARTIAL**

Część prac ukończona, ale istnieją braki lub elementy wymagające zatwierdzenia.

**NOT READY**

Występują błędy blokujące.

**INSUFFICIENT EVIDENCE**

Nie ma wystarczających danych, aby wiarygodnie rozstrzygnąć gotowość.

---

# 16. BEZWZGLĘDNE OGRANICZENIA

Nie wykonuj:

- Tworzenia subagentów.
- Tworzenia nowego czatu.
- Tworzenia nowych gałęzi.
- Tworzenia nowych worktree.
- Merge.
- Push.
- Deploymentu.
- Rebase.
- Resetu.
- Usuwania historii.
- Modyfikacji PR #4–#7.
- Modyfikacji MASTER PROMPT v2.8.
- Migracji danych treningowych.
- Zmiany identyfikatorów ćwiczeń.
- Zmiany formatów eksportu.
- Zmiany ról mięśni.
- Zmiany geometrii MuscleMap.
- Powrotu do atlasu 3D.
- Korzystania z płatnych usług.
- Publikowania nowej wersji GymNastika.

Nie uruchamiaj środowiska publicznego.

Nie naruszaj rzeczywistych danych treningowych.

---

# 17. OSTATECZNE POLECENIE

**Wykonaj etap `GV-EXERCISE-VISUAL-UNIFICATION-AND-UI-HARDENING` w istniejącym worktree GymNastika 2.0.**

Pracuj w następującej kolejności:

1. Zweryfikuj obecny stan projektu i istniejące kontrakty.
2. Przeprowadź audyt ilustracji ćwiczeń.
3. Wybierz bezpłatną, prawidłowo licencjonowaną metodę tworzenia realistycznych ilustracji 2D.
4. Przygotuj cztery ćwiczenia referencyjne.
5. Zweryfikuj zgodność ruchu i sprzętu z katalogiem.
6. Przygotuj pozostałe ilustracje, jeśli dostępne dane i narzędzia umożliwiają ich rzetelne wykonanie.
7. Zintegruj technicznie wyłącznie zasoby odpowiednio zweryfikowane i jawnie oznaczone zgodnie z istniejącymi kontraktami.
8. Napraw problem legendy wychodzącej poza kartę.
9. Zweryfikuj `variantId`.
10. Wykonaj pełną regresję techniczną.
11. Zweryfikuj działanie offline.
12. Przygotuj plansze porównawcze i raport końcowy.

Nie dopowiadaj brakujących informacji o technice ćwiczeń.

Nie twórz nieprawidłowych obrazów tylko po to, aby osiągnąć kompletność katalogu.

Nie zmieniaj anatomii MuscleMap.

Nie korzystaj z subagentów.

Nie wykonuj merge, push ani deploymentu.

**ZATRZYMAJ SIĘ PO RAPORCIE I PAKIECIE KONTROLNYM.**

Dalsze działania wymagają osobnej zgody właściciela GymNastika.