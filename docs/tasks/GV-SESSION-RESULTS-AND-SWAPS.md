# Seria, historia i zamiany — 24.11.2026

Autoryzacja: załączone polecenie właściciela z 24.11.2026. Status: GOTOWE LOKALNIE, bez publikacji. Istniejąca gałąź i worktree, bez subagentów.

## Wykonane zmiany

1. Każda seria ma wspólny poziomy układ ciężar / powtórzenia / zatwierdzenie. Na telefonie przycisk ma ikonę ✓ oraz etykietę dostępną. Stan ukończenia jest turkusowy. Usunięto wyjątek CSS pierwszej serii, który przenosił przycisk pod pola.
2. Pole daty respektuje szerokość i padding formularza; ograniczono rozmiar minimalny pola oraz wewnętrznego elementu WebKit. Nie zmieniono logiki zapisywania daty.
3. Ramka wskazuje pierwszą nieukończoną serię, także przy nietypowej kolejności, edycji i wznowieniu. Nie zapisuje dodatkowego stanu i nie przewija automatycznie. Dotychczasowy przycisk ukończonej serii nadal otwiera edycję, nie usuwa wyniku; odświeżenie odtwarza ostatni zapis.
4. „Poprzednio” pochodzi z zapisanej historii: stabilny identyfikator ćwiczenia, wariant i numer serii. Preferowany ostatni wcześniejszy trening tego samego planu (porównywalna kolejność ćwiczeń); fallback jest oznaczony „inny plan”. Bieżąca sesja oraz przyszłe daty są wykluczone. Brakujący numer daje „Brak danych”, nie sąsiedni wynik. Starszy brak variantId jest odczytywany jako wersja podstawowa, bez migracji historii. Obsługiwane są ułamki, ręczne wpisy, edycje i usunięcia. Podpowiedź nie nadpisuje samoczynnie wpisanych pól.
5. Panel „Zamień ćwiczenie” jest przy nazwie ćwiczenia. Propozycje z katalogu są ograniczone rodziną ruchu i wspólnymi głównymi mięśniami; kolejność uwzględnia mięśnie główne/pomocnicze, sprzęt i warianty. Panel pokazuje istniejące miniatury, mięśnie, sprzęt, uzasadnienie i wybór. Potwierdzenie wymienia stare/nowe ćwiczenie oraz uprzedza o wyczyszczeniu niezapisanych pól. Ukończone serie zachowują ID, obciążenie, powtórzenia i numery slotów. Nowe wyniki należą do zamiennika. Plan pozostaje bez zmian; anulowanie/błąd zapisu zachowują sesję. Wznowienie, ilustracje i MuscleMap używają zamiennika. Blokada równoczesnych operacji obejmuje kliknięcia i Enter.

Dodatkowo test ręcznego treningu ujawnił brak przycisków „+ seria” w pustej historii. Renderowanie pokazuje teraz brakujące ćwiczenia planu; samo wyświetlenie nie zapisuje żadnych wyników. Cache v20 zawiera 68 istniejących plansz i 68 miniatur, dzięki czemu panel działa offline. Ilustracje i anatomia nie zostały zmodyfikowane.

## Przykłady zweryfikowane na danych syntetycznych

| Seria | Zapis poprzedniego treningu | Wyświetlona podpowiedź |
| --- | --- | --- |
| 1 | 75 kg, 8 powt. | 75 kg × 8 |
| 2 | 70 kg, 10 powt. | 70 kg × 10 |
| 3 | 65 kg, 12 powt. | 65 kg × 12 |

- Zamiana przed pierwszą serią: bench_flat → db_bench. Wszystkie trzy później zapisane serie należą do db_bench; oryginalny plan nadal zawiera bench_flat.
- Zamiana po jednej serii: historia zachowuje bench_flat, seria 1, 40 kg × 8; serie 2 i 3 zapisują się jako db_bench, 22,5 kg × 10. Podpowiedzi dla wolnych slotów pochodzą z serii 2 i 3 poprzedniego db_bench. Sprawdzono także zamianę po dwóch seriach.
- Edycja po zamianie zachowuje tożsamość starego ćwiczenia, również dla wyniku z masą ciała 0 kg. Błąd zapisu oraz szybkie wielokrotne kliknięcia/Enter nie usuwają ani nie duplikują zapisanej pracy.
- Dotychczasowe wpisy historii i zapisany plan porównano przed/po: niezmienione. Testy pracowały wyłącznie w odizolowanych kontekstach z syntetycznymi danymi.

## Pliki

- `index.html`: renderowanie serii, historia, podświetlenie, panel/ranking zamienników, transakcja zamiany i ochrona równoczesnych operacji.
- `src/ui/signal.css`: układ mobilny/desktop, data, ramka i panel.
- `sw.js`: cache v20 z istniejącymi miniaturami.
- `tests/e2e/session-results-swaps.spec.js`: 21 nowych testów integracyjnych i zrzuty.
- Dostosowane istniejące testy: atlas-consistency, variant-flow, base-b-regressions, exercise-images-complete oraz odwołania do wersji cache w testach offline/branding. Zachowano wcześniejsze zmiany użytkownika w base-b-regressions.
- `PROJECT_MEMORY.md`: aktualny stan i HANDOFF.

## Weryfikacja 24.11.2026

| Sprawdzenie | Wynik |
| --- | --- |
| `npm test -- --reporter=dot` | 92/92 PASS, 12 plików |
| Edge, `playwright.core-edge.config.js` | 105/105 PASS; log w outputs/GV-SESSION-RESULTS-AND-SWAPS/regression-edge.txt |
| `playwright.presentation.config.js`, exercise-images-complete | 4/4 PASS, w tym komplet ilustracji i offline z 136 obrazami |
| Dodatkowy test Enter + klik po domknięciu blokady operacji | 1/1 PASS |
| LIGHT/DARK, 320/375/390/430/1280 px | PASS: puste/uzupełnione/zapisane serie, wspólny rząd, rozmiar dotykowy, data bez przepełnienia |
| Panel zamienników, te same 5 szerokości | Bez poziomego przewijania, przyciski co najmniej 44 × 44 px |
| `git diff --check` | PASS |
| Safari/WebKit | NIEZWERYFIKOWANE: brak uruchamialnego silnika; pobieranie doszło do 100%, rozpakowanie utknęło, próbę przerwano |

Pierwszy przebieg wykrył błędne założenia fixtures o identycznych tytułach różnych planów oraz aktywacji service workera bez przeładowania, brak przycisku dodania serii do pustej historii i starą asercję oczekującą pomijania historii v4. Przyczyny poprawiono; końcowa regresja jest zielona. Fizyczny iPhone nie był wymagany ani testowany.

## Zrzuty

Katalog `outputs/GV-SESSION-RESULTS-AND-SWAPS/` zawiera 25 PNG:

- `chromium-{320,375,390,430,1280}-{light,dark}-series.png` — ramka drugiej serii po zapisaniu pierwszej oraz poprzednie trzy wyniki.
- `chromium-{320,375,390,430,1280}-{light,dark}-date.png` — formularz daty.
- `chromium-swap-after-{0,1,2}.png` — zapisane serie po zamianie.
- `swap-options-390-{light,dark}.png` — panel zamienników.

Zrzuty kadrują sprawdzane elementy; podczas zrzutu ukryto nakładający się sticky header, bez zmiany aplikacji. Obejrzano m.in. 320 px LIGHT/DARK, datę, desktop, panel w obu motywach i zachowaną serię po zamianie. Akceptacja właściciela pozostaje osobną decyzją.

## Stan Git i dalsza praca

Gałąź `feature/gymnastika-approved-ui`, HEAD `39a3a1d`, ahead 1 według lokalnego śledzenia. Nie utworzono commita, gałęzi ani worktree. Zastane zmiany i materiały zachowano. Nie wykonano push, merge ani publikacji. Następny krok: ocena lokalnych ekranów przez właściciela; publikacja wymaga osobnego polecenia. Nie powtarzać zakończonego audytu ani testów bez nowej zmiany lub problemu.
