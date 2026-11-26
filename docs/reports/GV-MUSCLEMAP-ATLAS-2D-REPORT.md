# GV-MUSCLEMAP-ATLAS-2D — raport

**Wynik: PROTOTYP GOTOWY; zgodność anatomiczna PARTIAL.** To lokalna wersja
przeglądowa na osobnym worktree opartym na PR #7. Nie została scalona,
wdrożona ani opublikowana. Istniejące PR #4–#7 pozostały bez zmian.

## Audyt źródeł i licencji

Wybranym źródłem jest repozytorium `Jsplice/MuscleMap`. Autor projektu opisuje
diagramy `@musclemap/assets` jako oryginalne wektorowe ścieżki odrysowane w
Inkscape i deklaruje licencję MIT dla całego repozytorium. To oświadczenie
autora, a nie niezależna weryfikacja pochodzenia. Tekst MIT obejmuje dane
ścieżek SVG i wymaga zachowania informacji o prawach autorskich oraz treści
pozwolenia w kopiach lub istotnych fragmentach. Lokalny notice zawiera pełny
tekst licencji, linki źródłowe, przypięty commit i identyfikatory blobów.
Licencja pozwala na dystrybucję publicznej aplikacji PWA po dołączeniu notice;
ten raport nie jest opinią prawną.

Do prototypu włączono tylko cztery diagramy wektorowe. Nie używamy opcjonalnych
fotografii referencyjnych, renderera React ani pozostałych pakietów upstream.
Cztery pliki TypeScript przekształcono do składni modułów JavaScript; ścieżki i
dane diagramów zachowano. Pliki modułu i arkusz stylów dodano do precache,
żeby atlas działał offline.

Źródła: [repozytorium MuscleMap](https://github.com/Jsplice/MuscleMap),
[pochodzenie zasobów](https://github.com/Jsplice/MuscleMap/blob/170cfacda79376dd59ac0cf2f7dfab8ff9f4443a/ASSET_PROVENANCE.md),
[licencja MIT](https://github.com/Jsplice/MuscleMap/blob/170cfacda79376dd59ac0cf2f7dfab8ff9f4443a/LICENSE).

Przypięty commit źródłowy: `170cfacda79376dd59ac0cf2f7dfab8ff9f4443a`.

| Diagram źródłowy | SHA blobu upstream |
| --- | --- |
| `male-front.ts` | `2e552019eac8403d08a09b48ccbc62c14de0702e` |
| `male-back.ts` | `edc7673311275cbe458310dca6a9015b67c741c7` |
| `female-front.ts` | `def6d7998791cf8e4d16d7c6868df3ac8e3bbab7` |
| `female-back.ts` | `ca75ccab4c1f667581d77d2fb3741aa9092c6416` |

## Prototyp i mapowanie ćwiczeń

Atlas to moduł JavaScript zintegrowany z istniejącym ekranem treningu. Nie
dodaje frameworka interfejsu ani zależności uruchomieniowej. Użytkownik wybiera
sylwetkę męską lub żeńską oraz widok z przodu lub z tyłu. Mięśnie główne są
czerwone (`#F04438`), pomocnicze złote (`#F3B544`), a pozostałe obszary
grafitowe. Stan atlasu pozostaje tylko w pamięci strony i nie zapisuje się do
rekordów treningowych.

| ID ćwiczenia | Obszary główne | Obszary pomocnicze | Ograniczenie |
| --- | --- | --- | --- |
| `lat_raise_stand` | lewy/prawy naramienny boczny | lewy/prawy czworoboczny | Nadgrzebieniowy nie ma osobnej powierzchni. |
| `db_bench` | lewa/prawa klatka piersiowa | lewy/prawy triceps i naramienny przedni | Atlas nie rozdziela głównego mięśnia piersiowego na głowy. |
| `lat_pulldown_wide` | lewy/prawy najszerszy grzbietu | biceps, równoległoboczne, czworoboczny | Obły większy nie ma osobnej powierzchni; „środkowa część pleców” jest przybliżona przez równoległoboczne i czworoboczny. Przybliżone obszary mają przerywany obrys. |
| `leg_press` | czworogłowe i pośladkowy, obie strony | przywodziciele, obie strony | Są to szersze regiony atlasu, bez podziału na poszczególne głowy mięśnia. |

Nazwy mięśni pochodzą z lokalnego katalogu ćwiczeń. Prototyp nie dopisuje
nowych danych treningowych ani nie zmienia katalogu ćwiczeń.

## Architektura i pliki

- `src/data/anatomy/male-front.js`, `male-back.js`, `female-front.js`,
  `female-back.js` — diagramy źródłowe.
- `src/data/anatomy/atlas-data.js` — cztery mapy ćwiczeń do powierzchni.
- `src/data/anatomy/THIRD-PARTY-NOTICES.md` — atrybucja i tekst MIT.
- `src/features/anatomy/atlas.js`, `atlas.css` — renderowanie i kontrolki.
- `index.html` — miejsce w ekranie treningu i połączenie ze zmianą ćwiczenia.
- `sw.js` — wpisy precache dla pracy offline; wersja i strategia cache bez zmian.
- `tools/serve-test.mjs` — prawidłowy typ MIME CSS dla lokalnego serwera E2E.
- `tests/unit/anatomy-atlas.test.js`, `tests/e2e/anatomy-atlas.spec.js` — testy
  danych i przepływu w przeglądarce.

Nie zmieniono `localStorage`, IndexedDB, eksportu/importu, kopii zapasowych,
Master Prompt, siatek źródłowych ani zasobów 3D/GLB. Atlas jest dodatkiem do
ekranu treningu; dotychczasowy przepływ ilustracji i zapisu serii pozostaje.

## Sprawdzenie

- `npm test`: 8 plików testowych przeszło, 62 testy zaliczone.
- Pełny zestaw Playwright Chromium uruchomiony w Microsoft Edge: 47 testów
  zaliczonych, w tym przepływ atlasu. Ten przepływ uruchamia syntetyczny plan
  Push A1, sprawdza kontrolki i wszystkie cztery mapy oraz potwierdza, że atlas
  nie dodał historii ani serii treningowych.
- Pierwsza próba E2E wykazała, że schowany nadrzędny ekran treningu naturalnie
  ukrywa atlas; końcowy test otwiera ekran przed jego sprawdzeniem. Dostosowano
  też asercję do syntetycznej sesji aktywnej, oddzielając ją od historii. Były
  to korekty przygotowania testu; nie użyto prywatnych danych użytkownika.
- Nie wykonano pełnej macierzy przeglądarek ani ręcznej walidacji anatomicznej.
  Zgodność anatomiczna pozostaje PARTIAL, bo atlas nie pokazuje osobno
  wszystkich mięśni wymienionych przy ćwiczeniach.

## Rekomendacja

Można używać tego atlasu jako edukacyjnej nakładki wizualnej na ekranie
treningu po przejrzeniu prototypu. Ograniczenia mapowania powinny być widoczne,
jeżeli kolory są prezentowane jako aktywacja mięśni. Kolory nie stanowią
walidacji medycznej, biomechanicznej ani specyficznej dla danego ćwiczenia.
Współrzędne 2D są współrzędnymi rysunku wektorowego, a nie skalą pomiarową.
Zarchiwizowany import 3D pozostaje osobnym materiałem referencyjnym i nie jest
używany przez ten prototyp.
