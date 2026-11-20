# GV-IMG-META — zatwierdzone metadane katalogu ćwiczeń

## Cel i zależności

Przygotować kanoniczny manifest metadanych 31 ćwiczeń bazowych i 4 zatwierdzonych wariantów przed etapem GV-DB. Praca odbywa się na `feature/gv-exercise-meta`, od `feature/gv-data`; PR jest stacked i ma bazę `feature/gv-data`, ponieważ PR #4 (GV-DATA) pozostaje otwarty.

Normatywne źródło: `docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md`, zwłaszcza §§3.1–3.4, 4.1–4.7 i 14. Wersjonowanego mastera nie zmieniać.

## Zakres

- Ująć dokładnie 31 stabilnych bazowych `exerciseId` z §3.4 i §4; zachować grupy statystyczne `GROUP_BASE`.
- Ująć dokładnie warianty `leg_press/high_feet`, `db_fly/incline`, `shoulder_press/dumbbells` i `tri_overhead/rope` jako rekordy zależne od bazowego ćwiczenia, nie nowe bazowe ID.
- Przenieść wartości `loadUnit`, `executionMode`, `repsUnit`, `implementCount`, `trainedSides`, sprzęt, pozycję, `primaryMuscles` i `secondaryMuscles` wyłącznie z normatywnych tabel.
- Każdy rekord otrzymuje pochodzenie wskazujące wersję mastera i konkretne sekcje/wiersze.
- `techniqueInstructions`, `commonMistakes` i niezweryfikowane mapowania `imageManifest` mają status `pending` z przyczyną. Nie tworzyć instrukcji, błędów techniki, przypisań ilustracji ani procentów EMG przez domysł.
- Dla bazowego wpisu bez odrębnego `variantId`, `defaultVariant: null` oznacza użycie bazowego rekordu; nie tworzyć nowego ID wariantu.
- Zmienić wyłącznie wyświetlaną nazwę `tri_machine` na „Prostowanie przedramion na maszynie do tricepsa”, zachowując ID oraz mapowanie ilustracji.
- Nie modyfikować historii, danych produkcyjnych, interpretacji legacy, plików graficznych ani istniejących mapowań grafik. Nie wdrażać, nie scalać i nie rozpoczynać GV-IMG, GV-DB ani kolejnego etapu.

## Weryfikacja i kryteria akceptacji

- Testy sprawdzają dokładny zestaw 31 bazowych ID, zgodność ID z istniejącym katalogiem, kompletność pól i pochodzenia, poprawność wartości z §3.4, cztery relacje wariantów, statusy `pending` oraz poprawioną nazwę `tri_machine`.
- Raport odróżnia kompletność strukturalną od pól zatwierdzonych merytorycznie; pola `pending` nie są przedstawiane jako zatwierdzone.
- Uruchomić `npm test` oraz E2E Microsoft Edge Chromium. Zachować testy jednostkowe i E2E istniejących etapów.
- Porównać pełną listę zmian z punktem bazowym; wykazać brak zmian w 21 plikach ilustracji i w mapowaniach graficznych.
- Wypchnąć branch i utworzyć PR do `feature/gv-data`; pozostawić PR #4 otwarty i nie scalony.
