# GV — Różnorodność generatora i pomiar wagi startowej

Data: 27.11.2026  
Zakres zatwierdzony przez właściciela: naprawa generatora i wagi profilu oraz publikacja na GitHub.

## Cel

Generator ma układać dni zgodnie z wybranym podziałem, celem, partiami, sprzętem i ograniczeniami profilu, a wśród poprawnych kandydatów preferować różne zestawy ćwiczeń w tygodniu. Waga podana przy tworzeniu profilu ma pojawić się w jego statystykach jako pierwszy pomiar.

## Zakres

- Rozdzielić dozwolone partie i role ruchowe dla każdego dnia zgodnie z `full_body`, `push_pull`, `upper_lower`, `push_pull_legs` lub `custom`.
- Dobierać ćwiczenia wyłącznie z puli spełniającej sprzęt, wykluczenia, cel i ustawienia profilu. Nie uzupełniać dnia ćwiczeniami z niepowiązanych partii.
- Preferować ćwiczenia niewykorzystane już w podobnym dniu tygodnia; zachować stabilne powtórzenia, gdy są sensowne dla celu/progresu albo katalog nie daje bezpiecznej alternatywy. Wynik ma być deterministyczny i czytelny.
- Przy utworzeniu profilu z podaną wagą dodać jeden pomiar `gymverse_body` dla tego profilu i lokalnego dnia utworzenia. Przy aktualizacji aplikacji uzupełnić go dla aktywnego profilu tylko wtedy, gdy klucz pomiarów nie istnieje. Późniejsza edycja nie dopisuje ani nie przepisuje historii, a jawnie pusta lista po usunięciu pomiarów nie jest odtwarzana.
- Zachować działanie lokalne/offline, istniejące formaty danych i pozostałe rekordy profili.

## Poza zakresem

- Losowe przetasowywanie planów, automatyczne dobieranie ciężaru, zmiana schematu kopii lub migracja istniejących pomiarów.
- Zmienianie istniejącej historii lub tworzenie początkowej wagi dla profili bez wpisanej masy.
- Instalowanie zależności oraz publikowanie lokalnych plansz, galerii, logów i prywatnej pamięci projektu.

## Uzasadnienie i ograniczenia dowodów

ACSM zaleca progresywny, indywidualizowany trening; dostępne dane nie uzasadniają tezy, że częsta zmiana ćwiczeń sama w sobie poprawia adaptacje. Małe badanie zmiennego doboru ćwiczeń wykazało podobne adaptacje i możliwą korzyść motywacyjną. Z tego powodu różnorodność jest preferencją rankingu ograniczoną przez ustawienia, a nie bezwzględnym zakazem powtórzeń. Opisy Fitbod i JEFIT służą wyłącznie jako przykłady produktu uwzględniającego cele, historię, sprzęt i gotowe/personalizowane podziały.

- ACSM 2026 Position Stand: https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/
- Baz-Valle et al., 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6934277/
- Fitbod: https://fitbod.me/blog/how-to-create-your-own-workout-program/
- JEFIT: https://www.jefit.com/use-case/bodybuilding-app

## Akceptacja

- Testy potwierdzają różne, ale zgodne z profilem dni full-body oraz odpowiednie partie dla innych splitów.
- Niewystarczająca pula nie powoduje użycia niedozwolonych ćwiczeń; generator jawnie zwraca brak pokrycia.
- Zmiana celu, sprzętu, wykluczeń, ulubionych i opcjonalnej historii zmienia ranking tylko w zgodnym zakresie.
- Nowy profil z wagą widzi ją jako pierwszy punkt statystyk po przełączeniu; nowy profil bez wagi nie otrzymuje fikcyjnego pomiaru.
- Edycja profilu zachowuje wszystkie istniejące pomiary i nie tworzy duplikatu.
- Pełna regresja, build i wymagane kontrolowane sprawdzenia wydania nie wykazują błędów.

## Publikacja

Wydanie v64 z osobnej gałęzi opartej na `main` v63, przez PR do `main`. Właściciel wyraźnie zlecił publikację 27.11.2026. Lokalny `PROJECT_MEMORY.md`, plansze projektu graficznego i wyniki lokalnych testów pozostają poza allowlistą wydania. Fizyczny iPhone nie jest objęty zakresem.
