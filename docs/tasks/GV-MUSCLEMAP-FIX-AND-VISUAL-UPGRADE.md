# GV-MUSCLEMAP-FIX-AND-VISUAL-UPGRADE

## Autoryzowany zakres

Użytkownik polecił naprawić błędy blokujące lokalny prototyp i poprawić atlas
MuscleMap 2D w istniejącym worktree `feature/gv-musclemap-atlas-2d`. Zachować
cztery ćwiczenia testowe, identyfikatory ćwiczeń i danych treningowych,
działanie offline oraz licencję MIT. Nie rozszerzać jeszcze mapowania na cały
katalog, nie modyfikować PR #4–#7 ani Master Prompt v2.8, nie używać prawdziwych
danych treningowych, nie wykonywać 3D, commit/push/merge/deploymentu ani
publikacji. Zakończyć lokalnym raportem i materiałami wizualnymi.

## Kryteria

- Naprawić `pagehide`/`visibilitychange`, także gdy formularz serii nie jest
  zamontowany; zachować istniejący szkic i zweryfikować wznowienie.
- Dołączyć pełne atrybucje MIT do offline precache wraz z czterema referencyjnymi
  ilustracjami MuscleMap, nie zmieniając licencji GymNastika.
- Zachować semantyczne grupowanie ścieżek SVG, nie dodawać DOM `id` ani nie
  zgadywać znaczenia dwóch ścieżek QUADS bez semantycznego ID.
- Zintegrować oficjalne obrazy WebP wyłącznie po sprawdzeniu dopasowania
  wspólnego viewBox i układu SVG; użyć proporcjonalnego kontenera bez rozciągania
  ani przycinania sylwetek.
- Uporządkować atlas mobilny i widoczną klasyfikację EXACT / APPROXIMATE /
  UNAVAILABLE. Brakujące mięśnie wymienić bez arbitralnego podświetlania.
- Sprawdzić syntetyczne scenariusze, cache offline i zrzuty czterech sylwetek
  oraz czterech map ćwiczeń. Wyniki WebKit opisać osobno od testu Safari na iPhone.
