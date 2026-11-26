# GymNastika 2.0.3 — przygotowanie PR

## Zakres i autoryzacja

Właściciel zaakceptował lokalny UX i oprawę wizualną oraz zlecił commit, push gałęzi wydania i jeden PR do main. Bez zgody na merge, push main lub publikację. Dodatkowo 26.11.2026 potwierdził dopasowanie różnic w nowym prompcie: bez samoczynnego odznaczania dni, bez przycisku usuwania poza edytorem, globalne preferencje i informacje o aplikacji w Ustawieniach.

## Baza i publikacja

- Baza: origin/main 94a7511a047f9d421a10fcc24b217bde5789c6ab, scalony PR #13 / 2.0.2. Drzewo identyczne z wcześniejszym HEAD 5e8e9e6b6e6440d2d428cddfd842eb826ffc4312.
- Gałąź: release/gymnastika-2.0.3, utworzona w istniejącym worktree bez resetu, kopiowania projektu i utraty plików. Zastane 12 alternatywnych plików projektu graficznego nie są częścią wydania.
- GitHub Pages odczytane przez uwierzytelnione API: legacy, main, katalog /. Jedyny workflow: dynamic/pages/pages-build-deployment. Brak workflow w repozytorium. Push gałęzi PR nie uruchamia Pages.
- Ostatnie wdrożenie przed zadaniem: main 94a7511, sukces, run 45863549086. Produkcyjny adres: https://piotrm1974.github.io/gymverse/.
- Numer aplikacji 2.0.3 widoczny w O aplikacji i metadanych dokumentu. Cache zmieniony v57 → v58. Zachowane start_url/scope/ikony/tożsamość PWA i cykl aktualizacji SW; bez skipWaiting, clients.claim ani nowych operacji czyszczenia danych. Historyczne numery dokumentacji i schematów ZIP/JSON nie są numerem aplikacji.

## Zawartość

Zaakceptowana paleta Manrope+Signal LIGHT/DARK, wspólne tła, karty 3D i lokalne grafiki sprzętu; pojedyncza karta programu, osobne treningi samodzielne, dokładne miniatury exerciseId/variantId, centralne Ustawienia z kopiami i profilami, lista zapisanych programów i trwałych szkiców w osobnym edytorze, jawne odrzucanie szkiców, osobne zapisanie propozycji przed ręczną edycją.

Dopasowania przed PR:
- Minus zachowuje zaznaczone dni. Nadmiar pozostaje widoczny; komunikat prosi o odznaczenie lub zwiększenie liczby treningów. Dalej jest blokowane do dopasowania, również po zmianie czasu/rerenderze. Nie zmieniono algorytmu generatora.
- Podgląd nie ma przycisku Usuń program. Faktyczne usuwanie wyłącznie w Edytuj plany i ćwiczenia; Usuń przypisanie pozostaje na dole podglądu.
- Globalne preferencje to istniejące ustawienia dla aktywnego profilu: przerwa ogólna, gryf kalkulatora i dostęp do preferencji profilu. Przeniesiono istniejące kontrolki przerwy; szybkie czasy ćwiczenia pozostają pod seriami. Zachowano pierwszeństwo indywidualnego czasu ćwiczenia i dotychczasowe klucze zapisu.
- Informacje O aplikacji zawierają wersję i opis lokalnego przechowywania.

## Bezpieczeństwo i kontrola diff

Bez nowych zależności, modeli danych, backendu ani automatycznej migracji. Zachowane Web Locks, porównania aktualności, readback/rollback/integrityUncertain, historia, RIR, aktywna sesja, ZIP v5 / JSON v4. Testy używają wyłącznie syntetycznych danych. Wszystkie zasoby BASE_SHELL istnieją, sześć grafik programu zajmuje 187350 bajtów. Kontrola nazw/treści plików i wzorców sekretów nie wykazała prywatnych eksportów ani kluczy. PROJECT_MEMORY.md i outputs pozostają ignorowane. Zrzuty do PR są świadomie wybraną dokumentacją, a nie śladami przeglądarki.

## Świeża weryfikacja — osobne przebiegi

- npm test: 216/216, 27 plików.
- Jeden celowany przebieg Chromium: 52/52, 2,5 min. Generator, programy 1/3/6, edytor, przypisanie i retry, usuwanie, szkice, profile, ochrona historii w dwóch kartach/localStorage/IndexedDB, rzeczywisty trening/RIR/timer/progresja, pełny ZIP i odtworzenie dwóch profili, cache v58/offline, miniatury i mobilny UX.
- Osobny desktopowy WebKit: 9/9, 28,4 s. Ustawienia/preferencje, profile, zmiana liczby dni, usuwanie i konflikty szkiców.
- Kontrola 13 widoków LIGHT/DARK, 320/375/390/430 px, dotyk/klawiatura/tekst 200%. Rzeczywiste zrzuty przejrzane; zachowany zaakceptowany wygląd poza uzgodnionymi dopasowaniami ustawień.
- Test przed poprawką potwierdził automatyczne odznaczenie dnia. W pierwszym nowym teście preferencji odczytano klucz przed zapisem; poprawiono oczekiwanie na rzeczywistą wartość, bez osłabienia asercji. Następnie wymienione 52/52 i 9/9 na końcowym kodzie.
- Nie wykonano pełnej regresji setek E2E. Historyczne scenariusze dawnego 10-krokowego generatora (m.in. profiles/bolt-stage10b) nadal wymagają osobnej aktualizacji przed pełnym przebiegiem; drobne zmiany ich helpera nie oznaczają zaliczenia tych scenariuszy. Nie pominięto ich oznaczeniem skip.

## Ograniczenia

Fizyczny iPhone/Safari i autentyczny starszy eksport nie zostały zweryfikowane. Desktopowy WebKit nie zastępuje urządzenia. Stare karty mogą nie respektować aktualnych blokad; localStorage nie ma natywnej atomowości wielu kluczy. Kolory kafelków mogą się powtarzać; przy usunięciu/reorder/importowaniu kolekcji kosmetycznie może zmienić się ikona rozstrzygana wcześniej przez kolizję. Szczegóły w src/ui/program-art/README.md.

Stan przygotowania: kandydat gotowy do PR i przeglądu. Scalenie/publikacja wymagają osobnej zgody. Ten dokument opisuje kontrolę przed utworzeniem commita; wynik operacji GitHub i SHA podano w raporcie dla właściciela.

## Zrzuty

[Galeria dziewięciu ekranów LIGHT/DARK](../releases/2.0.3/README.md).

## Dokładna lista plików (49)

- PROJECT_HANDOFF.md
- docs/releases/2.0.3/01-home-dark-390.png
- docs/releases/2.0.3/01-home-light-390.png
- docs/releases/2.0.3/02-generator-dark-390.png
- docs/releases/2.0.3/02-generator-light-390.png
- docs/releases/2.0.3/03-generated-preview-dark-390.png
- docs/releases/2.0.3/03-generated-preview-light-390.png
- docs/releases/2.0.3/04-program-dark-390.png
- docs/releases/2.0.3/04-program-light-390.png
- docs/releases/2.0.3/05-editor-dark-390.png
- docs/releases/2.0.3/05-editor-light-390.png
- docs/releases/2.0.3/06-workout-dark-390.png
- docs/releases/2.0.3/06-workout-light-390.png
- docs/releases/2.0.3/07-stats-dark-390.png
- docs/releases/2.0.3/07-stats-light-390.png
- docs/releases/2.0.3/08-settings-dark-390.png
- docs/releases/2.0.3/08-settings-light-390.png
- docs/releases/2.0.3/09-backups-dark-390.png
- docs/releases/2.0.3/09-backups-light-390.png
- docs/releases/2.0.3/README.md
- docs/tasks/GV-RELEASE-203.md
- docs/tasks/GV-UX-ORGANIZATION.md
- index.html
- src/features/plans/program-editor-ui.js
- src/ui/program-art.js
- src/ui/program-art/README.md
- src/ui/program-art/barbell.webp
- src/ui/program-art/bench.webp
- src/ui/program-art/dumbbells.webp
- src/ui/program-art/kettlebells.webp
- src/ui/program-art/leg-press.webp
- src/ui/program-art/machine.webp
- src/ui/signal.css
- sw.js
- tests/e2e/bolt-stage10b.spec.js
- tests/e2e/bolt-stage7a.spec.js
- tests/e2e/bolt-stage7c.spec.js
- tests/e2e/generator-editor-separation.spec.js
- tests/e2e/helpers/generator-days.js
- tests/e2e/home-program-cards.spec.js
- tests/e2e/profiles.spec.js
- tests/e2e/ux-organization-art.spec.js
- tests/e2e/ux-organization-interactions.spec.js
- tests/e2e/ux-organization-safety.spec.js
- tests/e2e/ux-organization-visual.spec.js
- tests/e2e/ux-organization.spec.js
- tests/unit/branding.test.js
- tests/unit/program-art.test.js
- tests/unit/service-worker.test.js
