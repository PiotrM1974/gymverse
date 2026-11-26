# GymNastika Signal — plan etapu 5 do akceptacji

Status: przygotowanie planu; implementacja wymaga osobnej akceptacji właściciela i pliku zadania zgodnego z AGENTS.md. Bez zmiany danych, obrazów, anatomii, timera, generatora lub systemu kopii. Zachować zwiniętą technikę i łatwy dostęp do serii.

## Obecne elementy

- `index.html`: nazwa aktywnego ćwiczenia, wariant, docelowe serie/powtórzenia, działająca zamiana, domyślnie zwinięte `details.exercise-hero` z ilustracjami oraz osobny `trainingAtlasDisclosure` z MuscleMap. `renderStep`, `renderExercisePresentation`, `updateExercisePresentationAtlas`, `swapCandidates`, `applySwap` i istniejący zapis sesji są źródłem zachowania.
- Rejestr `src/data/exercise-presentations/release-registry.json` oraz `src/exercise/presentation-contract.js` wiążą zaakceptowane plansze i miniatury z ID ćwiczenia, wariantem i płcią, weryfikują kontrakt i pilnują kolejności/etykiet pozycji. Plansze są dwupanelowe, 768×512; niektóre warianty mają własne zatwierdzone podpisy pozycji. Obsługa błędów nie podmienia po cichu sylwetki.
- `src/exercise/catalog.js`: 31 ćwiczeń i cztery zdefiniowane warianty, sprzęt, główne i pomocnicze mięśnie; instrukcje techniczne i typowe błędy w katalogu mają status `pending`, więc nie wolno uzupełniać ich przykładowymi wskazówkami Bolt. Istniejące zaakceptowane podpisy i opisy plansz są osobnymi danymi prezentacyjnymi.
- Rejestr zawiera 34 rekordy prezentacji: 31 podstawowych i trzy odrębne warianty. `leg_press/high_feet` korzysta z planszy podstawowej z jawnym komunikatem o współdzieleniu. `src/data/anatomy/atlas-data.js` dostarcza 35 kluczy mapy (31 + 4 warianty); część wariantów dziedziczy mapowanie podstawowe bez twierdzenia o zmianie aktywacji.
- `src/features/anatomy/atlas.js`, `atlas.css`, `highlight-engine.js` oraz `src/data/anatomy/`: istniejące żeńskie i męskie sylwetki, każda z przodem i tyłem, obrazy oraz nałożone powierzchnie SVG; legenda głównych/pomocniczych i informacje o dokładności, przybliżeniach, braku powierzchni i wykluczonych maskach. Kontrolki sylwetki synchronizują technikę i atlas. Zachować również zasady dla niezidentyfikowanego wariantu oraz niezweryfikowanego położenia przywodzicieli na żeńskim przodzie.

## Porównanie z pakietem Bolt

Bolt `DetailsScreen` to osobny demonstracyjny ekran z powrotem do treningu, tytułem i przykładowym podtytułem, przełącznikiem A/B, kartami głównej i pomocniczej grupy, zwijaną MuscleMap oraz wskazówkami. Jest wizualnym wzorcem Signal dla jednego przykładowego ćwiczenia; ilustracja, sylwetka, role mięśni i instrukcje są przykładowe. Istniejąca aplikacja ma rzeczywiste plansze dwóch pozycji widoczne obok siebie, rejestr i warianty, atlas czterech widoków, jawne stopnie dokładności oraz dostęp do zamiany i serii w kontekście treningu. Nie kopiować A/B jako zamiennika planszy, fikcyjnej sylwetki, stałych mięśni ani demonstracyjnych wskazówek.

## Rekomendowany najmniejszy zakres

1. Ustalić wizualną hierarchię rozwiniętego panelu Technika i sekcji MuscleMap w istniejącym `view-workout`: odstępy, nagłówki, karty ról i kontrolki w tokenach Signal, z zachowaniem istniejących elementów DOM oraz źródeł danych tam, gdzie to możliwe. Nie przenosić treści do osobnego ekranu, jeśli nie będzie to osobno zatwierdzone.
2. Zachować domyślnie zwiniętą technikę, jej otwieranie i zamykanie, obecny wybór Mężczyzna/Kobieta, parę zaakceptowanych pozycji i podpisy oraz osobno dostępną MuscleMap z przodem/tyłem, legendą i objaśnieniami ograniczeń. Utrzymać nazwę ćwiczenia, zamianę, pola serii i powrót bez utraty stanu.
3. Karty grup mięśniowych wyświetlać wyłącznie z istniejących danych mapy/katalogu z zachowaniem ról oraz ostrzeżeń o przybliżeniach; nie wyliczać procentów ani nie obiecywać nowej dokładności anatomicznej. Nie dodawać list wskazówek technicznych z demonstracyjnego Bolt, jeżeli źródło ma status `pending`.
4. Przed ewentualną zmianą ostrzeżeń sprawdzić w działającej aplikacji możliwą niespójność: `renderStep` wyznacza `variantImageMissing` dla wariantów innych niż współdzielony `leg_press/high_feet`, choć rejestr zawiera odrębne trzy plansze wariantów. Jeśli błąd się potwierdzi, zaproponować wyłącznie punktowe powiązanie komunikatu z rzeczywiście rozstrzygniętym zasobem, z testem braku i błędu ładowania; bez zmiany mapowania.
5. Każdą zmianę układu obejrzeć na danych syntetycznych w Edge i dostępnym desktopowym WebKit, potem dopiero przekazać zrzuty do decyzji właściciela. Nie oznaczać fizycznego Safari/iPhone jako sprawdzonego na podstawie WebKit.

## Ryzyka i zabezpieczenia

- Przypadkowe powiązanie obrazu lub sylwetki z innym ID, wariantem lub płcią; zachować walidację rejestru, kontrolę asynchronicznych odpowiedzi oraz komunikat błędu bez cichego fallbacku.
- Zmiana kolorów lub usunięcie tekstowych ról, precyzji i wykluczeń może sugerować fałszywą dokładność. Zachować czerwony główny, żółty pomocniczy, tekstowe legendy, brak procentów oraz istniejące ograniczenia atlasu.
- Zamiana i przerysowanie nie mogą gubić serii, draftów, RIR i wariantów ani nie mogą przenosić wyników między ćwiczeniami. Technika i MuscleMap nie mogą zasłonić kompaktowych serii po powrocie.
- Offline: obrazy/rejestr/style mają pozostać dostępne przez obecny cache; każda ewentualna zmiana wersji powłoki musi być zgodna z obecnym mechanizmem. Nie zmieniać źródeł anatomicznych ani nie generować nowych zasobów.

## Kryteria przyjęcia po osobnej autoryzacji

- Sprawdzić wszystkie 31 ćwiczeń i cztery warianty na poziomie powiązań ID/rejestru/mapy; dla każdej sylwetki i przodu/tyłu zachować role, teksty, dostępne oraz niedostępne powierzchnie. Zweryfikować trzy odrębne ilustracje wariantów oraz jawnie współdzielony `leg_press/high_feet`, brak zasobu i brak sieci.
- E2E: rozwinięcie/zamknięcie techniki i mapy, zmiana płci oraz widoku, zamiana przed/po zapisaniu serii, powrót do treningu, drafty, RIR, wariant, timer etapu 4, historia i offline. Sprawdzić faktyczne rekordy oraz komunikaty błędów.
- LIGHT/DARK 320/375/390/430, brak poziomego przewijania, dotykowe elementy co najmniej 44 px, czytelne etykiety oraz pierwsza seria wysoko przy zwiniętej technice. Zrzuty 390 LIGHT/DARK, 320 DARK, rozwinięta technika i MuscleMap z obiema sylwetkami; ocena właściciela.
- Testy jednostkowe i właściwa pełna regresja Edge oraz dostępny desktopowy WebKit; osobno odnotować fizyczne Safari/iPhone. Zatrzymać się przed publikacją; brak zmian modelu, kopii i zasobów anatomii bez osobnej zgody.
