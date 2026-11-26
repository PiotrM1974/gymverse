# GV-MUSCLEMAP-HIGHLIGHT-ENGINE

## Zgoda i granice etapu

Użytkownik autoryzował diagnostykę masek czterech sylwetek, eksperymentalny tryb `TEXTURE_AWARE_HIGHLIGHT`, porównanie ORIGINAL / TEXTURE AWARE / REFINED, testy regresyjne i raport. Pracować wyłącznie w istniejącym worktree `feature/gv-musclemap-atlas-2d`. Zachować WebP, źródłowe SVG, dane i formaty eksportu, cztery ćwiczenia prototypowe oraz oryginalne kolorowanie jako fallback. Nie rozszerzać katalogu, nie wykonywać merge/push/deploymentu ani prac 3D.

## Plan wykonania

1. Zweryfikować źródła i licencje trzech wskazanych projektów; żaden obcy kod ani obraz nie jest potrzebny do eksperymentu.
2. Zmierzyć wspólną geometrię WebP/SVG, udokumentować nakładanie i wykonać pięć diagnostycznych ujęć każdej sylwetki.
3. Porównać w przeglądarce CSS `multiply`, `normal` i poziomy przezroczystości na tych samych ścieżkach. Nie zmieniać geometrii.
4. Wprowadzić wybrany tryb jako opcję atlasu z oryginalnym fallbackiem; ustalić kolejność ról przy nakładaniu masek.
5. Wykonać plansze A/B/C, zbliżenia barków, testy jednostkowe i pełne E2E z offline, danymi i `pagehide`.
6. Zapisać raport przyczyn, porównania, niepewności anatomii, licencji oraz rekomendacji i zatrzymać etap.
