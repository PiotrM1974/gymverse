# Poprawki UX po uruchomieniu produkcyjnym

Autoryzacja: zlecenie właściciela przekazane 26.11.2026 w załączniku `08214eff-657c-459a-9667-85a8ff94c808`. Produkcyjny PR #11 jest już scalony. Zmiany wykonywane lokalnie na obecnym worktree; bez commit, push, merge i deploy.

## Zakres

1. Usunąć osobną widoczną sekcję „Ustawienia przerw”; zachować „Czas przerwy” dla ćwiczenia, a ogólny wybór czasu umieścić w istniejących domyślnie zwiniętych „Opcjach serii”. Nie zmieniać logiki timera ani zapisanych wartości.
2. Zastąpić niebieskie linki-akcje w głównym widoku kompaktowymi przyciskami Manrope + Signal; zachować handlery i nawigację.
3. Zastąpić dużą sekcję kopii ikoną dyskietki z dostępnym menu czterech istniejących działań. Menu ma być zamknięte domyślnie i obsługiwać Escape, kliknięcie poza obszarem, dotyk, klawiaturę oraz dostępność migracji bez uruchamiania jej podczas otwierania.
4. Zastąpić akapit całej historii dwiema kartami: unikalne zapisane ukończone sesje oraz całkowity tonaż aktywnego profilu. Pominąć puste rekordy, odrzucić duplikaty stabilnych ID, liczyć z serii według istniejącego `setLoad` bez mutowania historii i bez dołączania aktywnego treningu.
5. Zachować storage, historię, profile, aktywne treningi, ZIP v5, JSON v4, offline oraz bezpieczne zachowanie aktualizacji PWA.

## Weryfikacja

Celowane testy jednostkowe i E2E na syntetycznych rekordach; LIGHT/DARK i szerokości 320/375/390/430 px; kontrola offline w obsługiwanym Chromium. Pełna regresja 454 E2E nie należy do tego zlecenia. Zrzuty lokalne mogą trafić wyłącznie do ignorowanego `outputs/`.

## Wykonanie

Wdrożenie lokalne zakończone 26.11.2026. Główny widok używa kompaktowych przycisków Signal; wszystkie akcje kopii są w domyślnie zamkniętym menu dyskietki, zachowując istniejące handlery ZIP v5/importu i warunkową migrację. W treningu pozostał widoczny odpoczynek ćwiczenia; wybór ogólny jest w zwiniętych opcjach. Statystyki profilu pokazują liczbę ukończonych sesji z niepustymi seriami i tonaż wyliczony istniejącym setLoad; stabilne, powtarzające się ID są liczone raz. Po zapisie zmian historii widok odświeża karty.

Kontrola zrzutu wykryła regresję CSS: .home-action { display:flex } nadpisywało hidden dla dwóch kontrolnych przycisków startu profilu. Dodano .home-action[hidden] { display:none!important } i asercje E2E. Test profili wykazał także, że jego fixture ponownie inicjalizował dane po przeładowaniu i selektor usuwał niewłaściwy wpis historii; poprawiono wyłącznie fixture/scenariusz testu, bez zmiany logiki profili. Zrzuty wykonano z wyłączonymi animacjami, aby odzwierciedlały finalny motyw.

Wyniki: npm run test:unit — 200/200 PASS. Celowane Chromium: post-production-ux.spec.js 5/5 oraz history-volume.spec.js 1/1, razem 6/6 PASS. Obejmują LIGHT/DARK i 320/375/390/430 px, widoczność ukrytych przycisków, menu/klawiaturę, dotychczasowe zapisy/wybór importu, statystyki dwóch profili, brak poziomego przewijania i kontrolowany offline shell. Nie uruchamiano pełnej regresji 454 E2E ani WebKit. Test E2E wymagał jawnego lokalnego portu, ponieważ 41900 zgłaszał EADDRINUSE, a właściciela procesu nie dało się odczytać w środowisku; port nie został zwolniony przez zakończenie obcego procesu. Użyto istniejącego Chromium z tymczasowego cache, niczego nie instalowano.

Zrzuty (ignorowane przez Git): outputs/GV-POST-PRODUCTION-UX/ — home LIGHT/DARK, menu DARK, trening LIGHT/DARK i statystyki LIGHT/DARK, 390 px. Oględziny końcowych obrazów potwierdziły stan ukrytych przycisków oraz kontrast DARK. Testy offline dotyczą tylko przeglądarkowego Chromium; brak fizycznego iPhone/Safari. ZIP v5 i JSON v4 nie zostały zmienione; test menu sprawdza istniejący eksport i otwarcie selektora pliku, nie wykonuje pełnego round-trip importu.

Nie zmieniono historii, algorytmu setLoad, logiki treningu/timera, formatu ZIP v5/JSON v4 ani modelu danych. Cache Service Workera podbito z gymverse-v55 do gymverse-v56, aby odświeżyć HTML/moduł pomocniczy; aktualizacja nie używa skipWaiting/clients.claim i nie czyści danych localStorage/IndexedDB. git diff --check czysty; pozostały nieśledzone alternatywne plansze Signal zachowano. Bez commit, push, merge ani deploy. Produkcyjna witryna nie została zaktualizowana.
