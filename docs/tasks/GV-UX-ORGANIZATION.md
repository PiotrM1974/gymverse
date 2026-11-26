# GymNastika — uporządkowanie UX i oprawa wizualna po PR #13

## Status i zakres

2026-11-26. Zmiany wyłącznie lokalne w istniejącym worktree, na release/gymnastika-2.0.2-2026-11-26. Bazowy HEAD: 5e8e9e6b6e6440d2d428cddfd842eb826ffc4312. Nie wykonano commit, push, merge, deploy, instalacji, backupu ani nowego worktree. PR #13 nie został zaktualizowany tym zakresem.

Autoryzacja: zlecenie uporządkowania UI z załącznika właściciela, następnie dostarczona wizualizacja, doprecyzowanie grafik sprzętu na kartach programów i osobnych miniatur ćwiczeń oraz polecenie dopracowania tła wszystkich ekranów.

## Wykonanie

- Ustawienia pod kołem zębatym. Dyskietka i dotychczasowe eksporty/importy ZIP v5, JSON v4, profilu i CSV oraz migracja znajdują się w ustawieniach. Nie skopiowano magazynów ani formularzy; zachowano te same operacje i identyfikatory pól. Onboarding zachowuje dostęp do formularza przed konfiguracją.
- Dodawanie/edycja/zarządzanie profilami w ustawieniach. Na ekranie głównym pozostaje wybór profilu, przełączany dotychczasową transakcją. Błąd przywraca widoczny wybór rzeczywiście aktywnego profilu.
- Jeden program = jedna karta. Ręczny edytor pokazuje zapisane programy (w tym wygenerowane), oddzielnie samodzielne dni oraz szkice. Faktyczne usuwanie programu jest dostępne wyłącznie tam. Przycisk na dole podglądu prowadzi do zarządzania. To rozstrzygnięcie sprzecznych punktów 6 i 8 zlecenia było przedstawione właścicielowi.
- Usunięcie programu usuwa jego metadane i właściwe przypisanie, pozostawiając dni, historię i szkice. Nie zmieniono modelu ani algorytmu wyboru następnego treningu.
- Lista szkiców umożliwia wznowienie i jawne odrzucenie dokładnej rewizji. Odrzucenie korzysta z istniejącego Web Lock, kontroli profilu, rewizji, odczytu po zapisie i integrityUncertain.
- Generator: stepper 1–6 dni, blokada niezaznaczonych dni po osiągnięciu limitu. Przy zmniejszeniu zachowane pierwsze wybrane dni w kolejności tygodnia; użytkownik otrzymuje komunikat. Zmiana liczby dni nie przebudowuje formularza i nie gubi niestandardowego czasu.
- Generator pozostaje automatyczny. Podgląd pokazuje jeden dzień i rozwijane szczegóły ćwiczeń. Dodatkowe przejście do ręcznej edycji najpierw zapisuje program bez zmiany przypisania, a potem otwiera osobny edytor. Zapis z przypisaniem nadal korzysta z dotychczasowej operacji. Po sukcesie zwalniany jest stan zajętości przed otwarciem edytora.
- Manrope i aktualna paleta według zlecenia. Pełne przyciski, pastelowe akcenty, kolorowe statystyki całej historii, subtelnie wypukła aktywna seria z osobnym fokusem klawiatury. Timer, serie, RIR i zapisy nie zostały przebudowane.
- Odrzucone grafiki SVG zastąpiono zatwierdzonymi ilustracjami sprzętu 3D: ławka ze sztangą, hantle, maszyna, kettlebells, suwnica i sztanga. Sześć lokalnych WebP (łącznie 187 350 bajtów) oraz warianty kolorystyczne są dostępne offline. Losowy dobór wynika z istniejącego losowego ID programu/planu; kolizje rozwiązywane w kanonicznej kolejności zapisów. Osiem pastelowych teł kafelków również wybieranych z ID. Bez dodatkowego magazynu i zmian danych. Kafelki uniesione optycznie dzięki rozświetlonej krawędzi i warstwowemu cieniowi; osobne kolory DARK i obsługa reduced-motion/forced-colors.
- Miniatury przy konkretnych ćwiczeniach i aktywnej grupie serii korzystają z zatwierdzonego rejestru ilustracji oraz rzeczywistego exerciseId/variantId. Nie używają ilustracji pierwszego ćwiczenia programu. Brak wydanej ilustracji nie jest zastępowany obrazem innego ćwiczenia. Zachowano istniejący kontrakt współdzielonych ilustracji wariantów (np. leg press high_feet).
- Wspólne tło LIGHT/DARK obejmuje wszystkie widoki, także historię, progres i odpoczynek. Warstwa pastelowych/granatowych przejść obejmująca całą długość strony nie przechwytuje zdarzeń i nie jest animowana. Karty pozostają czytelne. W forced-colors dekoracja jest wyłączona.

## Diagnoza szkiców i konfliktów

Nie odczytywano prywatnych planów właściciela. Sprawdzono syntetyczne przypadki „Do sprawdzenia — góra”. Na bieżącej bazie po PR #13 zabezpieczenie usuwania dnia już odróżniało dayPlanIds szkicu od całego basePlans; nie wyłączono go. Problem braku dostępu do zarządzania gotowym programem rozwiązano listą programów w ręcznym edytorze. Rzeczywisty szkic nie blokuje usunięcia metadanych zapisanego programu. Późniejszy zapis starego szkicu usuniętego programu jest poprawnie odrzucany.

Dzień faktycznie użyty przez niezapisany szkic pozostaje chroniony; użytkownik może teraz odnaleźć ten szkic i świadomie go odrzucić. Historia, aktywne sesje i rzeczywiste powiązania programów nadal chronią dni przed usunięciem. Nie „naprawiano” komunikatów przez pomijanie Web Locks lub osłabianie kontroli danych.

## Weryfikacja — osobne przebiegi

- Testy jednostkowe: 213/213, 26 plików. Ostatni wykonany przebieg po dopasowaniu do wizualizacji; kolejne zmiany grafiki/tła potwierdzane E2E.
- Początkowe trzy nowe testy UX: 3/3. Test przed implementacją odtworzył niezgodność organizacji ustawień.
- Główne celowane Chromium: 34/35. Jedyny błąd był zbyt wczesnym odczytem po usunięciu programu, ponieważ edytor pozostaje otwarty. Poprawiono oczekiwanie na zniknięcie karty, zachowując wszystkie asercje zapisanych rekordów.
- Następny celowany Chromium: 11/11 (onboarding, odmowa/retry, integracja dwóch profili z treningami/progresją/ZIP, usunięcie programu, ochrona i odrzucanie szkiców, mobilne widoki).
- Dotyk, klawiatura, tekst 200%, odmowa usunięcia i ponowienie: 3/3 Chromium. Po dostarczeniu wizualizacji kontrola interakcji i widoków: osobno 5/5.
- Grafiki: 3/3 Chromium — test trzech typów sprzętu oraz LIGHT/DARK z weryfikacją dokładnej miniatury bench_flat, przejścia na db_fly i odczytu obrazów. Brak nadpisania planów przy wyborze grafiki.
- WebKit: 10/11. Test zmiany profilu odwoływał się do pojedynczej karty przed zakończeniem przełączenia i napotykał dwie stare karty. Dodano oczekiwanie na jedną kartę docelowego profilu; osobne ponowienie 1/1 PASS. Nie przedstawiać tych wyników jako jednego zielonego przebiegu 11/11.
- Końcowa kontrola nowego tła i zrzutów: 2/2 Chromium (28,6 s), 13 widoków w LIGHT/DARK, szerokości 320/375/390/430 px. Warstwa obejmuje pełną długość strony; timer pokazany jako rzeczywisty widok pełnoekranowy.
- Nie uruchamiano pełnego historycznego zestawu 454 E2E. Starsze scenariusze opisujące dawną nawigację/proces generatora nie są przez te wyniki uznane za zaliczone. Zaktualizowano używane ścieżki i wspólny helper steppera, nie osłabiano asercji danych.

W testach porównywano rzeczywiste zapisane rekordy. Potwierdzono między innymi programy 1/3/6 dni, brak duplikacji dni na głównej stronie, odrzucenie starego zapisu w dwóch kartach, scalenie niezależnych zmian, localStorage/IndexedDB, zachowanie szkiców po odmowie, historię/RIR/odtwarzanie sesji, poprzednie wyniki i ZIP.

## Zrzuty

Lokalna galeria: outputs/GV-UX-ORGANIZATION/index.html. Zrzuty LIGHT/DARK 390 px przedstawiają home, generator, podgląd propozycji, program, listę edycji, edytor programu, trening, statystyki, ustawienia, kopie, progres, historię i odpoczynek. W testach sprawdzane szerokości 320/375/390/430 px. Wyłącznie syntetyczne dane. Obrazy są rzeczywistym renderem aplikacji, nie makietami telefonu.

## Zmienione pliki repozytorium

- index.html
- src/ui/signal.css
- src/features/plans/program-editor-ui.js
- tests/e2e/helpers/generator-days.js
- tests/e2e/ux-organization.spec.js
- tests/e2e/ux-organization-safety.spec.js
- tests/e2e/ux-organization-interactions.spec.js
- tests/e2e/ux-organization-visual.spec.js
- tests/e2e/ux-organization-art.spec.js
- tests/e2e/generator-editor-separation.spec.js
- tests/e2e/home-program-cards.spec.js
- tests/e2e/bolt-stage7a.spec.js
- tests/e2e/bolt-stage7c.spec.js
- tests/e2e/bolt-stage10b.spec.js
- tests/e2e/profiles.spec.js
- PROJECT_HANDOFF.md
- docs/tasks/GV-UX-ORGANIZATION.md

Osobno lokalny, ignorowany PROJECT_MEMORY.md i outputs z dowodami. Zastane alternatywne plansze pozostały nietknięte.

## Ograniczenia i decyzja

Gotowe do lokalnej oceny wizualnej; końcowa kontrola tła zakończona. Bez zgody na publikację. Fizyczny iPhone/PWA i autentyczny historyczny eksport pozostają niezweryfikowane. Desktopowy WebKit nie stanowi potwierdzenia działania na iPhonie. Emulacji offline WebKit nie ponawiano; Chromium offline przechodził w celowanym zestawie.

Stare karty aplikacji mogą nie respektować nowych blokad. localStorage nie zapewnia natywnej transakcji wielu kluczy; pozostają rollback/readback i integrityUncertain. Schemat ZIP v5/JSON v4, dane treningowe i algorytm generatora bez zmian. Cache pozostaje v57 nieopublikowanego wydania 2.0.2. Przed ewentualną publikacją wymagane osobne zatwierdzenie aktualnego zakresu i aktualizacja PR; nie wykonywano tego automatycznie.

## Grafiki 3D i losowe kafelki — 26.11.2026

Właściciel odrzucił wcześniejsze SVG, zaakceptował realistyczną ławkę 3D, różny sprzęt i warianty kolorystyczne; następnie zlecił losowy dobór ikon i tła oraz efekt 3D kafelków. Implementacja obejmuje także samodzielne plany. Zmiana nazwy, przypisania i zwykłe odświeżenie nie losują grafiki ponownie. Brak automatycznych zapisów danych treningowych. Przeniesienie/usunięcie/import wpisów może kosmetycznie zmienić ikonę, gdy wcześniej rozwiązano kolizję. Paleta teł ma osiem rodzin i może się powtarzać; 1296 kombinacji sprzętu/koloru, bliskie odcienie przy dużych kolekcjach. Szczegóły i zestaw promptów: src/ui/program-art/README.md.

Weryfikacja: jednostki216/216; Chromium początkowo3/4 (test offline pobrał pusty DOM przed renderem), poprawiono oczekiwanie na dwie karty i wykonano6/6 obejmujące offline oraz13widoków LIGHT/DARK320–430px. Desktopowy WebKit3/3: poprawne grafiki, dokładna miniatura ćwiczenia, zrzuty LIGHT/DARK. Po dodaniu cienia3D osobno2/2 Chromium. Bez pełnej regresji i bez fizycznego iPhone. Zrzuty aktualnych kafelków: outputs/GV-UX-ORGANIZATION/13-random-cards-{light,dark}-390.png.

Dodatkowe pliki: sw.js, src/ui/program-art.js, sześć src/ui/program-art/*.webp, src/ui/program-art/README.md, tests/unit/program-art.test.js. Zaktualizowane istniejące index.html, signal.css, testy art/visual oraz dokumentacja. Cache nadalv57 oczekującego wydania; brak commit/push/publikacji.

### Mocniejszy efekt 3D kafelków — 26.11.2026

Na uwagę właściciela zwiększono widoczną grubość kafelków do 9px, dodano mocniejszy refleks górnej krawędzi, fazowanie powierzchni i wyraźny cień. Zwiększono odstępy wokół kart; bez zmian logiki i oznaczenia aktywnej serii. Reduced-motion oraz forced-colors zachowane. Celowane Chromium2/2 PASS, LIGHT/DARK320/375/390/430px. Rzeczywiste zrzuty outputs/GV-UX-ORGANIZATION/14-raised-cards-{light,dark}-390.png. Bez publikacji.


## Akceptacja właściciela — 26.11.2026

Właściciel zaakceptował przedstawiony lokalny zakres UX i wygląd, w tym grafiki sprzętu 3D, losowy dobór wariantów ikon i kolorów kafelków, mocniejszy efekt wypukłości oraz wspólne tła LIGHT/DARK. Akceptacja nastąpiła po raporcie zakresu i ograniczeń oraz udostępnieniu aktualnej galerii. Lokalny odbiór wizualny zakończony.

Nie wykonano commit, push, aktualizacji PR, merge ani publikacji. Te operacje pozostają osobnym krokiem wymagającym zlecenia. Test fizycznego iPhone’a, autentyczny starszy eksport i udokumentowane ograniczenia pozostają otwarte; akceptacja nie oznacza ich zaliczenia.


## Przekazanie do2.0.3 — 26.11.2026

Aktualny zakres wydania, autoryzacja i wyniki są w [GV-RELEASE-203](GV-RELEASE-203.md). Nowe dopasowania zatwierdzone przez właściciela zastępują wcześniejsze ustalenia: minus nie usuwa zaznaczeń; przycisk Usuń program usunięty z podglądu; istniejąca przerwa ogólna i ustawienie gryfu dostępne w Ustawieniach, dodano informację o wersji2.0.3. Cachev58, zachowany zaakceptowany wygląd. Chromium52/52 i WebKit9/9 to osobne przebiegi.
