# Oddzielna instrukcja wdrożenia zatwierdzonego UI

Ten plik jest instrukcją na **późniejszy, osobno zlecony etap**. Nie uruchamia wdrożenia.

1. Przed pracą sprawdź aktualny stan repozytorium, publikacji i zastanych zmian. Punktem odniesienia są [rejestr akceptacji](approvals.md), [specyfikacja końcowa](design-handoff.md), [tokeny Signal](design-system/signal-tokens.md) oraz odpowiednie PNG. Statyczne `board.html` służą do odczytania układu, nie są kodem produkcyjnym do bezpośredniego skopiowania.
2. Wprowadzaj wygląd etapami w istniejącej aplikacji i jej obecnym kontrakcie danych. Zachowaj plany, warianty `variantId`, historię, aktywny trening, obliczenia, eksport/import, zatwierdzone ilustracje obu sylwetek, pozycje ruchu, miniatury, synchronizację i zwijanie MuscleMap oraz PWA/offline.
3. Dostosuj istniejące komponenty do LIGHT/DARK i widoków mobilnych/desktopowych. Zachowaj funkcje i ochronę danych. Nie dodawaj profili, kreatora ani innych funkcji z listy przyszłych pomysłów. Potwierdzenia destrukcyjnych działań muszą zachować obecne skutki i możliwość anulowania.
4. Zweryfikuj widoki i stany z rejestru akceptacji, długie nazwy, większy tekst, wąski telefon i desktop, działanie kluczowych przepływów oraz istniejące testy projektu. Testuj wyłącznie syntetycznie i w izolowanym profilu; nie czyść danych właściciela.
5. Publikację wykonaj dopiero po osobnym poleceniu rozpoczęcia wdrożenia, wymaganych kontrolach projektu i potwierdzeniu działania publicznej wersji. Nie traktuj samych plansz ani tej instrukcji jako zgody na zmianę aplikacji.
