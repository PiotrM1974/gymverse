# Decyzja: widoczna marka GymNastika

- Data: 2026-11-21
- Status: zatwierdzony etap `GV-BRAND-GYMNASTIKA`

## Decyzja

Istniejąca aplikacja GymVerse otrzymuje nową oficjalną nazwę widoczną dla użytkownika: **GymNastika**. Nazwa projektu rozwojowego to **GymNastika 2.0**. Zachowujemy obecną aplikację, repozytorium, origin, produkcyjny adres `https://piotrm1974.github.io/gymverse/` i wszystkie dane użytkownika.

## Zakres prezentacji

Widoczny tytuł strony, nagłówek, tytuł iOS oraz nazwy manifestu PWA używają `GymNastika`. Opis manifestu brzmi `Dziennik treningowy — plany, treningi, historia i postępy`. Aktualizacje nazwy nie zmieniają zachowania aplikacji ani danych.

## Zachowana kompatybilność

Pozostają bez zmian: `start_url`, `scope`, brak jawnego `id` w manifeście, ikony PWA, origin, ścieżka GitHub Pages, wszystkie klucze `gymverse_*`, baza IndexedDB i object stores, schemat i formaty kopii, pole `app: "gymverse"`, API techniczne, komunikaty Service Workera, cache `gymverse-v6`, identyfikatory ćwiczeń i semantyka historii.

Service Worker może otrzymać wyłącznie minimalną zmianę, która powoduje wykrycie nowej wersji skryptu i odświeżenie cache powłoki wraz z manifestem. Nie zmieniamy nazwy cache ani nie wymuszamy `skipWaiting`; aktywny trening nie może zostać przerwany. Istniejąca ikona na iOS może wymagać czasu na odświeżenie przez system; nie obiecujemy natychmiastowej zmiany ani nie zalecamy reinstalacji.

## Poza zakresem

Historyczny Master Prompt v2.8 i inne historyczne raporty pozostają niezmienione. Nie wykonujemy migracji, zmiany ikon/logo, rebrandingu technicznych identyfikatorów, merge, wdrożenia ani pilota ilustracji w ramach tej decyzji.
