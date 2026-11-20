# GymVerse — zasady pracy

- Chroń prywatne dane treningowe. Nie odczytuj eksportów ani danych z urządzeń bez wyraźnego polecenia; fixtures muszą być syntetyczne.
- Zmiany logiki produkcyjnej wymagają osobnego zatwierdzonego etapu. Zachowuj istniejące dane, działanie offline i kopie zapasowe.
- Uruchamiaj testy przez `npm test`; dla E2E używaj serwera ograniczonego do `127.0.0.1` i `npm run test:e2e`. Przypięta wersja Node jest w `.node-version`.
- Nie scalaj PR, nie wdrażaj i nie publikuj bez wyraźnego polecenia użytkownika.
- Bieżącą normatywną specyfikacją projektu jest [GymVerse 2.0 MASTER PROMPT v2.8](docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md). Sam master opisuje wymagania, ale nie autoryzuje pracy nad etapem.
- Etap wolno rozpocząć tylko na podstawie nowej, wyraźnej zgody użytkownika i odpowiadającego pliku `docs/tasks/GV-*.md`. Nagłówek START i §17 mastera są historycznym zapisem pierwszego zlecenia; nie autoryzują ponownego GV-BASE-A.
- Wersjonowane kopie masterów są niezmiennymi snapshotami. Nowa wersja specyfikacji wymaga osobnej zgody; nie nadpisuj starszej.
