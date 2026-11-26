# GYMNASTIKA 2.0
# GV-EXERCISE-ILLUSTRATIONS-PRODUCTION
## Profesjonalny system ilustracji ćwiczeń 2D, walidacja techniki i bezpieczeństwo wariantów

**TRYB: STRICT ENGINEERING / EVIDENCE-BASED / NO GUESSWORK / FAIL-CLOSED**

**ŚRODOWISKO:** Windows 11 / Codex Desktop

**WYKONAWCA:** Jeden główny Codex. Bezwzględnie bez subagentów.

**ETAP:** Przygotowanie czterech wzorców produkcyjnych oraz bezpiecznej obsługi wariantów.

---

# 0. GŁÓWNE POLECENIE

Kontynuuj istniejący projekt GymNastika 2.0.

Nie rozpoczynaj projektu od nowa.

Nie twórz nowego czatu, repozytorium, gałęzi ani worktree.

Twoim zadaniem jest przygotowanie profesjonalnego systemu ilustracji techniki wykonywania ćwiczeń, który docelowo zastąpi stare grafiki GymVerse z neonowymi akcentami.

Przyjmujemy zaakceptowany przez właściciela kierunek wizualny oparty na czterech przygotowanych szkicach:

1. Unoszenie hantli bokiem stojąc — sylwetka kobieca.
2. Wyciskanie hantli na ławce płaskiej — sylwetka męska.
3. Ściąganie drążka wyciągu górnego szerokim chwytem — sylwetka męska.
4. Wypychanie nóg na suwnicy — sylwetka kobieca.

Wszystkie cztery szkice przedstawiają dwie pozycje ćwiczenia.

**Zaakceptowany jest kierunek wizualny, a nie automatycznie poprawność techniki, mechaniki urządzeń czy prawa do publikacji konkretnych plików.**

Nie wdrażaj szkiców do produkcyjnej aplikacji bez pozytywnej kwalifikacji i wymaganej akceptacji.

Równocześnie zrealizuj techniczny audyt problemu `variantId` oraz potwierdź poprawność wcześniejszej naprawy responsywności atlasu.

---

# 1. ZASADY BEZWZGLĘDNE

## 1.1. Zakaz domysłów

Nie wolno:

- Wymyślać parametrów techniki ćwiczenia.
- Zgadywać sprzętu na podstawie nazwy.
- Tworzyć fikcyjnych chwytów i ustawień ciała.
- Wymyślać granic anatomicznych.
- Zmieniać definicji ćwiczeń.
- Zakładać, że podobne ćwiczenia mają identyczną technikę.
- Traktować ilustracji wygenerowanej przez AI jako zatwierdzonej.
- Uznawać estetycznego obrazu za dowód poprawności biomechanicznej.
- Zgadywać statusu licencyjnego obrazów.
- Zmieniać klasyfikacji mięśni w atlasie.
- Wymyślać nowych identyfikatorów wariantów.
- Modyfikować trwałego modelu danych bez osobnej zgody.
- Ukrywać braków przez automatyczne fallbacki.
- Przedstawiać nieukończonej pracy jako PASS.

Każda decyzja musi mieć źródło w rzeczywistym kodzie, zatwierdzonym katalogu, dokumentacji lub odpowiednich materiałach referencyjnych.

## 1.2. Ochrona projektu

Zabrania się:

- Tworzenia subagentów.
- Delegowania zadań innym agentom.
- Tworzenia nowej gałęzi.
- Tworzenia nowego worktree.
- Merge.
- Push.
- Deploymentu.
- Resetowania historii Git.
- Usuwania dotychczasowych zmian.
- Modyfikacji PR #4–#7.
- Zmiany MASTER PROMPT v2.8.
- Zmiany adresu PWA.
- Migracji danych treningowych.
- Zmiany identyfikatorów ćwiczeń.
- Zmiany formatów eksportu.
- Przebudowy atlasu MuscleMap.
- Powrotu do atlasu 3D.
- Używania płatnych zasobów lub usług.

Nie wykonuj operacji, które mogą naruszyć rzeczywistą historię treningów użytkownika.

---

# 2. ŚRODOWISKO

Repozytorium:

https://github.com/PiotrM1974/gymverse

Istniejący worktree:

`backup/worktrees/gv-musclemap-atlas-2d`

Gałąź:

`feature/gv-musclemap-atlas-2d`

Dokument nadrzędny:

`docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`

Dotychczasowa PWA:

https://piotrm1974.github.io/gymverse/

Wykorzystuj istniejącą strukturę projektu i narzędzia dostępne lokalnie.

Blender nie jest wymagany, ponieważ docelowe ilustracje mają pozostać 2D.

Nie twórz dodatkowej infrastruktury, jeśli obecna architektura zapewnia wszystkie wymagane funkcje.

---

# 3. FAZA A — KONTROLA STANU WYJŚCIOWEGO

Przed rozpoczęciem zmian wykonaj audyt lokalnego projektu.

## 3.1. Git

Zapisz:

- Aktywny katalog.
- Gałąź.
- HEAD SHA.
- Commit bazowy.
- Stan plików staged i unstaged.
- Pliki nieśledzone.
- Wynik `git status`.
- Wynik `git diff --stat`.
- Wynik `git diff --check`.

Ustal, które zmiany pochodzą z wcześniejszych etapów.

Nie nadpisuj ich.

Nie traktuj historycznych wyników testów jako dowodu obecnego stanu.

## 3.2. Dokumentacja

Odczytaj:

- MASTER PROMPT v2.8.
- `src/exercise/catalog.js`.
- Obecne metadane ćwiczeń.
- Kontrakt manifestu ilustracji.
- Macierz 31 ćwiczeń i 4 wariantów.
- Dotychczasowe raporty produkcji ilustracji.
- Raport responsywności atlasu.
- Raport obsługi `variantId`.
- Istniejące testy.
- Konfigurację service workera.
- Moduły aktywnego treningu i wznowienia sesji.

Nie zgaduj nazw ani zawartości brakujących plików.

Jeżeli dokument nie istnieje, odnotuj brak i jego znaczenie dla etapu.

---

# 4. FAZA B — ZABEZPIECZENIE CZTERECH SZKICÓW

Odnajdź rzeczywiste pliki czterech wcześniej przygotowanych zestawów START/KONIEC.

Nie odtwarzaj obrazów na podstawie miniatur, jeśli dostępne są oryginalne pliki.

Dla każdego zestawu zapisz:

- ID ćwiczenia.
- Nazwę.
- Oryginalny plik.
- Format.
- Wymiary.
- Rozmiar.
- SHA-256.
- Metodę powstania.
- Dostępne informacje licencyjne.
- Status przeglądu technicznego.
- Status weryfikacji techniki.
- Wykryte problemy.

Zachowaj oryginały w niezmienionej postaci.

Nie usuwaj wcześniejszych szkiców.

Nie nadpisuj zaakceptowanego materiału nową generacją bez zachowania jego historii i możliwości porównania.

---

# 5. FAZA C — STANDARD WIZUALNY GYMNASTIKA

## 5.1. Docelowy charakter

Przyjmij wspólny styl ilustracji:

**REALISTIC FITNESS INSTRUCTIONAL 2D**

Wymagania:

- Realistyczne, proporcjonalne sylwetki.
- Profesjonalna estetyka aplikacji fitness.
- Naturalna anatomia.
- Neutralne kolory ubrań.
- Grafitowe lub szare stroje.
- Realistycznie przedstawiony sprzęt.
- Jasne, neutralne tło.
- Miękkie, naturalne oświetlenie.
- Brak neonowych akcentów.
- Brak agresywnych filtrów.
- Brak przypadkowych elementów otoczenia.
- Brak nieuzasadnionych elementów dekoracyjnych.
- Brak tekstów generowanych wewnątrz obrazów.
- Spójność pomiędzy wszystkimi zestawami.

Obrazy powinny być stylistycznie zgodne z realistycznym atlasem MuscleMap, lecz służyć innemu celowi.

**Atlas MuscleMap pokazuje aktywne mięśnie. Nowe ilustracje pokazują wykonanie ruchu.**

Nie kopiuj grafik atlasu MuscleMap jako ilustracji techniki.

## 5.2. Konsekwentna prezentacja

Dla dwóch pozycji tego samego ćwiczenia zachowaj:

- Tę samą postać.
- Ten sam strój.
- Ten sam sprzęt.
- Ten sam punkt widzenia, jeżeli nie ma technicznego uzasadnienia dla zmiany.
- Jednolite oświetlenie.
- Jednolity kadr.
- Zgodne proporcje ciała.
- Logiczną ciągłość ruchu.
- Prawidłową ciągłość ustawienia ciężaru i sprzętu.

Nie twórz dwóch niezależnych obrazów, które wyglądają jak dwa różne ćwiczenia.

## 5.3. Układ START/KONIEC

Każdy zestaw powinien umożliwiać jednoznaczne rozróżnienie:

- START.
- KONIEC.

Nazwy pozycji dodawaj w interfejsie lub kontrolowanym procesie składu grafiki, a nie przez niekontrolowane generowanie napisów w obrazie.

Dla ćwiczeń, w których określenie START/KONIEC zależy od przyjętej konwencji ruchu, ustal tę konwencję na podstawie katalogu i dokumentacji.

Nie zakładaj automatycznie, że lewy obraz oznacza START.

## 5.4. Wspólne parametry techniczne

Ustal i udokumentuj:

- Docelowe proporcje ilustracji.
- Zalecane wymiary.
- Docelowy format WebP.
- Sposób kompresji.
- Sposób kadrowania.
- Maksymalny rozmiar zasobu wynikający z przyjętego budżetu wydajności.
- Sposób skalowania w PWA.
- Obsługę ekranów Retina.
- Nazewnictwo plików.
- Metadane pochodzenia i licencji.

Jeśli projekt ma już normatywny kontrakt tych parametrów, stosuj go zamiast ustanawiać nowy.

Nie wymyślaj liczbowych limitów, które nie wynikają z wymagań. Przygotuj propozycję i przedstaw ją jako propozycję.

---

# 6. FAZA D — WALIDACJA CZTERECH ĆWICZEŃ

## 6.1. Unoszenie hantli bokiem stojąc

ID:

`lat_raise_stand`

Sprawdź:

- Pozycję stojącą.
- Ustawienie stóp.
- Ustawienie tułowia.
- Pozycję barków.
- Chwyt hantli.
- Ustawienie nadgarstków.
- Ugięcie łokci.
- Tor unoszenia ramion.
- Wysokość końcową.
- Symetrię ruchu.
- Pozycję ciężaru względem ramion.
- Zgodność obu faz ćwiczenia.

Szczególnie sprawdź, czy pozycja końcowa nie sugeruje niezamierzonego wariantu ruchu.

Nie zmieniaj obrazu na podstawie samej estetyki.

## 6.2. Wyciskanie hantli leżąc

ID:

`db_bench`

Sprawdź:

- Rodzaj i ustawienie ławki.
- Stabilność pozycji.
- Kontakt stóp z podłożem.
- Ustawienie głowy i tułowia.
- Pozycję łopatek.
- Tor ruchu hantli.
- Ustawienie nadgarstków.
- Położenie łokci.
- Zakres zgięcia i wyprostu.
- Orientację hantli.
- Zgodność sprzętu w obu pozycjach.

Zwróć uwagę, czy perspektywa nie sprawia wrażenia, że ciężary znajdują się w nieprawidłowym miejscu.

## 6.3. Ściąganie drążka szeroko

ID:

`lat_pulldown_wide`

Sprawdź:

- Rodzaj maszyny.
- Sposób zamocowania linki.
- Położenie bloczków.
- Ciągłość linki.
- Połączenie linki z drążkiem.
- Ustawienie siedziska.
- Stabilizację ud.
- Szerokość chwytu.
- Orientację dłoni.
- Pozycję tułowia.
- Kierunek prowadzenia drążka.
- Pozycję końcową względem klatki.
- Logiczną zmianę położenia stosu obciążenia.

**Mechanika urządzenia musi być poprawna w obu pozycjach.**

Nie akceptuj ilustracji z przerwaną, nielogicznie poprowadzoną lub nieprawidłowo połączoną linką.

## 6.4. Wypychanie nóg na suwnicy

ID:

`leg_press`

Sprawdź:

- Typ suwnicy.
- Kąt prowadnic.
- Pozycję siedziska.
- Kontakt pleców z oparciem.
- Pozycję miednicy.
- Ustawienie stóp.
- Kontakt stóp z platformą.
- Tor ruchu platformy.
- Ruch stawów kolanowych.
- Ustawienie bioder.
- Końcowy zakres wyprostu.
- Brak sugestii przeprostu kolan.
- Ułożenie obciążenia i elementów maszyny.
- Zgodność obu faz ćwiczenia.

Nie traktuj pozycji końcowej z całkowicie zablokowanymi kolanami jako automatycznie poprawnej.

Oddziel ilustrację standardowego ustawienia stóp od wariantów wymagających innego położenia.

---

# 7. FAZA E — NIEZALEŻNA KONTROLA TECHNIKI

## 7.1. Źródła

Wykorzystaj wiarygodne, dostępne bezpłatnie źródła techniki ćwiczeń.

W szczególności możesz sprawdzić odpowiednie materiały:

- ACE.
- NASM.
- ExRx, jeśli odpowiednia treść jest dostępna zgodnie z warunkami korzystania.
- Publikacje naukowe dotyczące ćwiczeń.
- Instrukcje producentów maszyn, jeśli odpowiadają rzeczywistemu sprzętowi.

Nie kopiuj cudzych ilustracji bez właściwych praw.

Oddziel informacje o technice od praw do wykorzystania materiałów wizualnych.

## 7.2. Macierz kontroli

Dla każdego zestawu przygotuj tabelę:

- Element techniki.
- Oczekiwane zachowanie.
- Dowód źródłowy.
- Co rzeczywiście przedstawia ilustracja.
- Zgodność.
- Niezgodność.
- Stopień pewności.
- Wymagana poprawka.

Nie stosuj ogólnego stwierdzenia „poprawna technika” bez szczegółowego uzasadnienia.

## 7.3. Statusy

Stosuj:

**TECHNICALLY_VALID**

Zgodność z dokumentacją została sprawdzona w zakresie dostępnych dowodów.

**PARTIAL**

Istnieją konkretne ograniczenia lub błędy.

**UNVERIFIED**

Brak wystarczających dowodów.

**REJECTED**

Stwierdzono istotną niezgodność.

**EXPERT_REVIEWED**

Dopuszczalne wyłącznie po rzeczywistym przeglądzie odpowiednio kompetentnej osoby, z udokumentowanym zakresem takiej oceny.

Nie przyznawaj statusu EXPERT_REVIEWED samodzielnie.

---

# 8. FAZA F — POPRAWIANIE SZKICÓW

Jeśli weryfikacja wykaże błędy, wykonaj poprawki wyłącznie wtedy, gdy można je wprowadzić bez tworzenia nowej niepewności technicznej.

Dla każdej poprawki:

1. Opisz błąd.
2. Wskaż dowód.
3. Określ poprawne ustawienie.
4. Ustal, czy istniejące narzędzie potrafi je odtworzyć.
5. Zachowaj poprzednią wersję.
6. Przygotuj nową wersję.
7. Porównaj przed/po.
8. Ponownie oceń technikę.

Nie akceptuj nowej ilustracji tylko dlatego, że wygląda lepiej.

Nie poprawiaj obrazu przez przypadkowe deformowanie kończyn, sprzętu lub stawów.

Jeżeli poprawna edycja nie jest możliwa, zachowaj status PARTIAL albo UNVERIFIED.

## 8.1. Spójność postaci

Nie jest wymagane, aby każda ilustracja przedstawiała tę samą osobę.

Wymagane jest jednak, aby w obrębie jednego zestawu START/KONIEC zachowana była ciągłość wyglądu postaci i sprzętu.

Jeżeli tworzone są warianty męskie i żeńskie tego samego ćwiczenia, nie zakładaj, że wystarczy przekształcić geometrię jednej sylwetki.

---

# 9. FAZA G — LICENCJE I POCHODZENIE

Przeprowadź osobny audyt praw do czterech zestawów ilustracji.

Dla każdego obrazu ustal:

- Czy został wygenerowany lokalnie.
- Jakim narzędziem.
- Na podstawie jakich materiałów.
- Czy użyto zewnętrznego obrazu referencyjnego.
- Czy referencja została skopiowana lub przetworzona.
- Jakie warunki dotyczą wykorzystania i dystrybucji wyniku.
- Czy istnieją obowiązki atrybucji.
- Czy istnieje dokumentacja pochodzenia.
- Czy możliwe jest wykorzystanie w publicznej, darmowej PWA.

Nie twierdź, że każdy materiał AI jest automatycznie objęty MIT albo CC0.

Nie przypisuj samodzielnie cudzych licencji do wygenerowanych ilustracji.

Nie utożsamiaj prawa do korzystania z narzędzia z prawem do redystrybucji wszystkich jego materiałów wejściowych.

Jeżeli warunki są niejasne, oznacz:

`LICENCE_UNVERIFIED`

i nie kwalifikuj konkretnego pliku do publicznego wydania.

Przygotuj rejestr pochodzenia wszystkich obrazów.

---

# 10. FAZA H — PROTOTYP PREZENTACJI START/KONIEC

Przygotuj lokalny, odizolowany prototyp prezentacji czterech zestawów.

Nie zastępuj jeszcze istniejących ilustracji użytkownika w normalnym przepływie treningowym.

## 10.1. Funkcjonalność

Prototyp powinien umożliwiać:

- Wyświetlenie pozycji START.
- Wyświetlenie pozycji KONIEC.
- Przełączanie między nimi.
- Odczyt nazwy ćwiczenia.
- Wyświetlenie statusu weryfikacji ilustracji.
- Wyświetlenie źródła i informacji licencyjnych.
- Poprawne skalowanie na iPhonie.

Możesz przygotować go jako osobny lokalny podgląd lub eksperymentalny widok odseparowany od normalnego treningu.

Nie zmieniaj modelu danych treningowych.

Nie ustawiaj prototypu jako produkcyjnej ilustracji ćwiczenia.

## 10.2. Układ karty

Preferowany układ:

1. Duża ilustracja.
2. Przełącznik START/KONIEC.
3. Nazwa ćwiczenia.
4. Istniejąca informacja o seriach i powtórzeniach.
5. Atlas MuscleMap w osobnej sekcji.

Zachowaj ciemny motyw GymNastika.

Zadbaj o kontrast między jasnym tłem ilustracji i ciemnym otoczeniem.

Nie dodawaj zbędnych dekoracji.

## 10.3. Responsywność

Przetestuj:

- 375 px.
- 390 px.
- 430 px.
- Wąskie karty desktopowe.
- Szersze widoki desktopowe.

Ilustracja nie może być przycinana.

Nie rozciągaj proporcji.

Nie umieszczaj przełączników w obszarze zasłanianym przez timer przerwy.

Weryfikuj rzeczywistą szerokość komponentu, a nie wyłącznie viewportu.

---

# 11. FAZA I — PROBLEM VARIANT ID

## 11.1. Stan wyjściowy

W poprzednim etapie wykryto:

Wariant suwnicy określony jako „stopy wyżej” zapisuje bazowe ID `leg_press` bez osobnego `variantId`.

Atlas wybiera wówczas mapowanie bazowe.

Nie zakładaj automatycznie, że oznacza to niepoprawne działanie całej aplikacji.

Sprawdź rzeczywisty kontrakt danych, definicję wariantu i oczekiwane zachowanie.

## 11.2. Audyt

Prześledź:

- Katalog ćwiczeń.
- Definicje wariantów.
- Wybór wariantu.
- Tworzenie aktywnej sesji.
- Zapis serii.
- Zapis historii treningów.
- Mechanizm wznowienia.
- Wybór ilustracji.
- Wybór mapowania MuscleMap.
- Eksport.
- Import.
- Zachowanie wcześniejszych zapisów.

Odczytaj wszystkie historyczne kontrakty kompatybilności.

Nie interpretuj braku `variantId` jako zgody na zmianę schematu danych.

## 11.3. Wymagana analiza rozwiązań

Porównaj co najmniej trzy warianty postępowania:

**A. Pozostawienie obecnego zapisu i jawne ograniczenie mapowania wariantowego.**

**B. Rozróżnianie wariantu wyłącznie w nietrwałym stanie prezentacyjnym, jeżeli istniejące dane pozwalają to zrobić bez zgadywania.**

**C. Rozszerzenie kontraktu danych o jawny identyfikator wariantu, wymagające osobnej decyzji, testów kompatybilności i ewentualnego planu migracji.**

Dla każdego opisz:

- Zalety.
- Ograniczenia.
- Wpływ na historyczne treningi.
- Wpływ na localStorage.
- Wpływ na IndexedDB.
- Wpływ na eksport/import.
- Wpływ na wznowienie treningu.
- Wpływ na atlas.
- Wpływ na ilustracje.
- Ryzyko utraty danych.
- Zakres wymaganych zmian.

## 11.4. Zasada bezpieczeństwa

**Nie wykonuj w tym etapie migracji danych ani zmiany trwałego kontraktu `variantId`.**

Jeśli istnieje bezpieczne rozwiązanie wyłącznie prezentacyjne, przygotuj jego niezależny prototyp lub test.

Nie wprowadzaj go automatycznie do trwałego zapisu treningów.

Jeśli historyczny zapis nie pozwala odtworzyć wariantu, nie dopowiadaj go na podstawie nazwy, ciężaru, planu ani innych pośrednich przesłanek.

Oznacz taki stan jako nierozróżnialny.

## 11.5. Wynik

Przedstaw:

- Faktyczną przyczynę obecnego zachowania.
- Analizę przepływu ID.
- Wyniki testów.
- Macierz wariantów.
- Rekomendowaną architekturę rozwiązania.
- Plan zabezpieczenia danych.
- Plan regresji po ewentualnej przyszłej zmianie.

Jeśli rozwiązanie wymaga modyfikacji zapisu danych, zatrzymaj się przed implementacją i uzyskaj odrębną zgodę.

---

# 12. FAZA J — REGRESJA RESPONSYWNOŚCI ATLASU

Poprzedni etap naprawił wychodzenie legendy MuscleMap poza granice karty.

Zachowaj tę poprawkę.

Wykonaj kontrolę regresyjną:

- Przy szerokościach komponentu mniejszych niż standardowy viewport mobilny.
- Przy szerokościach 375, 390 i 430 px.
- Na wąskich kartach desktopowych.
- Przy długich nazwach mięśni.
- Przy wielu mięśniach pomocniczych.
- Przy długich uzasadnieniach APPROXIMATE.
- Przy aktywnym timerze.
- Przy przełączaniu płci i widoków.

Nie ukrywaj obcinanej zawartości przez `overflow: hidden`.

Nie zmieniaj geometrii MuscleMap.

Jeśli nie występuje rzeczywisty błąd, nie wprowadzaj kolejnych zmian stylów.

---

# 13. FAZA K — TESTY AUTOMATYCZNE

Na zakończenie uruchom:

- `npm test`.
- Pełny Playwright Edge.
- Test wszystkich 31 ćwiczeń i 4 wariantów.
- Test obecnych mapowań MuscleMap.
- Test istnienia ilustracji.
- Test integralności plików.
- Test prototypu START/KONIEC.
- Test responsywności.
- Test `variantId`.
- Test offline.
- Test cache.
- Test `pagehide`.
- Test `flushDraftsForStep`.
- Test wznowienia sesji.
- Test eksportu/importu.
- Test integralności syntetycznych danych.
- `git diff --check`.

Nie zakładaj, że wszystkie wymienione komendy są gotowymi skryptami. Wykorzystaj rzeczywistą konfigurację projektu i dodaj tylko potrzebne testy.

Nie modyfikuj testów w celu wymuszenia PASS.

Nie osłabiaj istniejących zabezpieczeń.

Wszystkie testy danych wykonuj na odizolowanych profilach testowych.

Nie używaj rzeczywistych treningów użytkownika.

## 13.1. WebKit i iPhone

Jeżeli Playwright WebKit jest nadal niedostępny, oznacz UNTESTED.

Nie twierdź, że wykonano test Safari.

Nie uruchamiaj serwera LAN ani publicznego środowiska testowego bez odrębnej zgody.

---

# 14. KRYTERIA JAKOŚCI

Każda bramka otrzymuje osobny status:

PASS / PARTIAL / FAIL / UNTESTED / BLOCKED.

## GATE 1 — SOURCE INTEGRITY

Wszystkie źródła, identyfikatory i pliki wejściowe zweryfikowane.

## GATE 2 — VISUAL STYLE

Cztery zestawy reprezentują spójny, zaakceptowany kierunek wizualny.

## GATE 3 — EXERCISE TECHNIQUE

Każda ilustracja ma udokumentowaną kontrolę techniki i jawny status weryfikacji.

Nie wymagaj fikcyjnej certyfikacji eksperckiej.

## GATE 4 — LICENSING

Prawa do wykorzystania i redystrybucji konkretnych obrazów zostały odpowiednio udokumentowane.

## GATE 5 — START/END PRESENTATION

Prototyp prawidłowo prezentuje dwie pozycje ćwiczenia.

## GATE 6 — VARIANT CONSISTENCY

Wszystkie warianty zostały przeanalizowane, a ryzyka zapisu i wznowienia są jawnie opisane.

Nie uznawaj samego planu naprawy za PASS wdrożonej obsługi wariantów.

## GATE 7 — RESPONSIVE LAYOUT

Atlas i nowy prototyp nie wykazują nieuzasadnionego poziomego overflow.

## GATE 8 — DATA SAFETY

Nie wykryto nieautoryzowanych zmian danych treningowych.

## GATE 9 — REGRESSION

Dostępne wymagane testy zostały rzeczywiście wykonane.

## GATE 10 — MOBILE READINESS

Oceniona gotowość do przyszłych izolowanych testów iPhone, niezależnie od ich faktycznego wykonania.

---

# 15. RAPORT KOŃCOWY

Przygotuj:

`GV-EXERCISE-ILLUSTRATIONS-PRODUCTION-REPORT.md`

Zapisz raport w istniejącym worktree.

Uwzględnij:

1. Stan Git przed i po pracy.
2. HEAD SHA.
3. Wykaz odczytanych dokumentów.
4. Inwentaryzację czterech szkiców.
5. Wszystkie sumy SHA-256.
6. Opis standardu wizualnego.
7. Macierz kontroli techniki.
8. Porównanie wersji obrazów przed i po ewentualnych poprawkach.
9. Status praw do każdego pliku.
10. Listę ilustracji zaakceptowanych technicznie.
11. Listę ilustracji wymagających dalszej weryfikacji.
12. Działanie prototypu START/KONIEC.
13. Zrzuty ekranu mobilne i desktopowe.
14. Wyniki regresji responsywności atlasu.
15. Szczegółową analizę `variantId`.
16. Porównanie rozwiązań A/B/C dla wariantów.
17. Plan bezpiecznego wdrożenia wariantów.
18. Wyniki testów jednostkowych.
19. Wyniki Playwright Edge.
20. Wyniki offline.
21. Wyniki kontroli danych treningowych.
22. Listę zmienionych plików.
23. Status każdej bramki.
24. Listę nierozwiązanych problemów.
25. Rekomendację kolejnego etapu.

Nie przedstawiaj ilustracji jako produkcyjnie zatwierdzonej bez dowodów.

---

# 16. PLANSZE WIZUALNE

Przygotuj czytelne materiały do oceny przez właściciela.

Obowiązkowe:

1. Cztery zestawy START/KONIEC w docelowym stylu.
2. Porównanie pierwotnych szkiców z ewentualnie poprawionymi wersjami.
3. Widok pojedynczej karty ćwiczenia.
4. Widok z przełącznikiem START/KONIEC.
5. Widok ilustracji obok atlasu MuscleMap.
6. Widok na ekranie o szerokości 375 px.
7. Widok na ekranie o szerokości 390 px.
8. Widok na ekranie o szerokości 430 px.
9. Widok wąskiej karty desktopowej.
10. Widok z aktywnym timerem.

Nie ukrywaj elementów mających status PARTIAL lub UNVERIFIED.

Dołącz czytelne podpisy i legendę statusów.

---

# 17. PAKIET KONTROLNY

Przygotuj:

`GV-EXERCISE-ILLUSTRATIONS-PRODUCTION.zip`

Uwzględnij:

- Raport końcowy.
- Macierz kontroli techniki.
- Cztery zestawy ilustracji.
- Metadane pochodzenia.
- Informacje licencyjne.
- Wyniki testów.
- Plansze porównawcze.
- Zrzuty interfejsu.
- Analizę `variantId`.
- Plan bezpiecznego rozwiązania wariantów.
- Listę blokad.

Nie umieszczaj w pakiecie rzeczywistych danych treningowych, tokenów, haseł ani innych sekretów.

---

# 18. GRANICA ETAPU I OBOWIĄZKOWE ZATRZYMANIE

Ten etap obejmuje:

**TAK:**

- Ocenę czterech szkiców.
- Ustalenie standardu wizualnego.
- Kontrolowane dopracowanie szkiców, gdy pozwalają na to wiarygodne dowody.
- Audyt licencji.
- Przygotowanie lokalnego prototypu START/KONIEC.
- Kontrolę responsywności atlasu.
- Analizę problemu `variantId`.
- Testy regresyjne.
- Raport i pakiet kontrolny.

**NIE:**

- Automatyczne przygotowanie ilustracji dla wszystkich pozostałych ćwiczeń.
- Podmiana wszystkich dotychczasowych obrazów w aplikacji.
- Wdrożenie nowych ilustracji jako zatwierdzonych bez zgody.
- Migracja danych.
- Zmiana trwałego kontraktu `variantId`.
- Modyfikacja ról mięśni.
- Modyfikacja MuscleMap.
- Publikacja PWA.
- Merge, push, deployment.
- Tworzenie subagentów.

Po ukończeniu czterech zestawów referencyjnych i analiz przedstaw je do akceptacji.

**Nie przechodź samodzielnie do produkcji całego katalogu.**

---

# 19. OSTATECZNA DYREKTYWA

Wykonaj etap:

`GV-EXERCISE-ILLUSTRATIONS-PRODUCTION`

Skup się na dostarczeniu czterech profesjonalnych zestawów referencyjnych ilustracji START/KONIEC, pełnej dokumentacji ich techniki i pochodzenia oraz bezpiecznego rozwiązania projektowego dla `variantId`.

Nie twórz pozornej zgodności techniki tylko dlatego, że ilustracja wygląda realistycznie.

Nie ignoruj problemów mechaniki urządzeń.

Nie stosuj automatycznych domysłów anatomicznych.

Nie zmieniaj danych treningowych.

Nie twórz subagentów.

Nie modyfikuj PR #4–#7 ani MASTER PROMPT v2.8.

Nie wykonuj merge, push ani deploymentu.

Po zakończeniu przedstaw:

- Cztery zestawy referencyjne.
- Ich statusy weryfikacji.
- Prototyp prezentacji.
- Analizę `variantId`.
- Wyniki testów.
- Raport.
- Pakiet kontrolny.

**ZATRZYMAJ SIĘ PRZED PRODUKCJĄ POZOSTAŁYCH ILUSTRACJI I PRZED PUBLIKACJĄ APLIKACJI.**

Dalszy etap wymaga jednoznacznej zgody właściciela GymNastika.