# GymVerse — zasady pracy

- Chroń prywatne dane treningowe. Nie odczytuj eksportów ani danych z urządzeń bez wyraźnego polecenia; fixtures muszą być syntetyczne.
- Zmiany logiki produkcyjnej wymagają osobnego zatwierdzonego etapu. Zachowuj istniejące dane, działanie offline i kopie zapasowe.
- Uruchamiaj testy przez `npm test`; dla E2E używaj serwera ograniczonego do `127.0.0.1` i `npm run test:e2e`. Przypięta wersja Node jest w `.node-version`.
- Nie scalaj PR, nie wdrażaj i nie publikuj bez wyraźnego polecenia użytkownika.
- Bieżącą normatywną specyfikacją projektu jest [GymVerse 2.0 MASTER PROMPT v2.8](docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md). Sam master opisuje wymagania, ale nie autoryzuje pracy nad etapem.
- Etap wolno rozpocząć tylko na podstawie nowej, wyraźnej zgody użytkownika i odpowiadającego pliku `docs/tasks/GV-*.md`. Nagłówek START i §17 mastera są historycznym zapisem pierwszego zlecenia; nie autoryzują ponownego GV-BASE-A.
- Wersjonowane kopie masterów są niezmiennymi snapshotami. Nowa wersja specyfikacji wymaga osobnej zgody; nie nadpisuj starszej.

## PROTOKÓŁ PAMIĘCI GYMNASTIKA

- Na początku nowego czatu przeczytaj `PROJECT_MEMORY.md`, sprawdź aktywną gałąź i rzeczywisty stan Git. Pamięć jest punktem wejścia; dalsze pliki czytaj tylko w zakresie zadania. Nie analizuj całej historii rozmów ani nie powtarzaj ukończonych prac bez konkretnego powodu.
- Rozróżniaj plan, wykonanie i weryfikację. Gdy pamięć różni się od repozytorium, ustal przyczynę, popraw zapis i kieruj się potwierdzonym stanem kodu. Pamięć nie zastępuje wyraźnej zgody właściciela, pliku zadania ani normatywnego mastera.
- Po istotnej zmianie funkcji, UI, architektury, decyzji, testów, problemu lub statusu zadania uaktualnij odpowiednie sekcje `PROJECT_MEMORY.md`. Po logicznym etapie oraz przed zakończeniem sesji uaktualnij HANDOFF do rzeczywistego stanu. Jeśli zadanie nie zmieniło istotnego stanu, nie edytuj pamięci bez potrzeby.
