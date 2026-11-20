# GV-IMG-META — kontrakt manifestu ilustracji

## Zakres tego PR

Ten podetap definiuje schemat JSON, manifest 35 kompozycji, walidator oraz testy i zasady zatwierdzania. Korzysta ze stabilnych identyfikatorów i relacji wariantów z `src/exercise/catalog.js`; nie tworzy konkurencyjnego katalogu ani nie zmienia jego metadanych wykonania.

Wszystkie 35 kompozycji zaczyna jako `pending`. Ten PR nie dodaje plików graficznych, nie uzupełnia `techniqueInstructions` ani `commonMistakes`, nie zmienia UI, historii, magazynu IndexedDB ani istniejących mapowań grafik.

Normatywne źródła to MASTER PROMPT v2.8 §§2.1, 3.4, 4.1–4.7 i 5.1–5.4. `exerciseAssetsVersion: 1` jest wersją kontraktu zasobów z mastera; `manifestSchemaVersion: 1` oznacza proponowaną wersję struktury JSON. Wersje te są odrębne.

## Statusy niezależne

Status `records[].status` dotyczy wyłącznie kompozycji ilustracji. Nie zmienia statusu całego rekordu ćwiczenia w katalogu i nie zatwierdza instrukcji techniki ani typowych błędów.

- `pending`: brak plików i zatwierdzeń; ścieżki, sumy i pola plików są `null`.
- `draft`: rozpoczęto zasób; pliki istnieją, ale nie zostały skierowane do akceptacji.
- `review`: trzy widoki są gotowe do przeglądu, a dane katalogowe potrzebne do poprawności ilustracji zostały sprawdzone.
- `approved`: wszystkie widoki mają status `approved`, kontrola gotowości katalogu jest aktualna, a właściciel zaakceptował bieżącą rewizję.
- `rejected`: właściciel odrzucił kompozycję z zapisanym powodem.

Każdy widok ma własny status. Walidator pilnuje, by status kompozycji nie przeczył statusom widoków. Samo ustawienie `approved` nie wystarcza: wymagane są trzy zatwierdzone widoki, `imageReadiness.status: approved`, fingerprint bieżących pól katalogu oraz decyzja właściciela dla tej samej rewizji.

Do `imageReadiness` należą tylko dane potrzebne do poprawności ilustracji: tożsamość i nazwa ćwiczenia, sprzęt i pozycja, metadane wykonania oraz główne i pomocnicze mięśnie. `reviewedFields` jawnie wymienia pięć tych grup; fingerprint obejmuje bieżący snapshot katalogu. Zatwierdzenie tych danych nie wymaga wcześniejszego zatwierdzenia `techniqueInstructions` ani `commonMistakes`.

## Kontrakt plików

- Wymagane widoki: `technique`, `muscles`, `thumbnail`.
- `technique` jest obrazem wykonania bez nakładki mięśniowej.
- `muscles` pokazuje tę samą pozycję i kadr z zatwierdzonym kolorowaniem.
- `thumbnail` pochodzi z widoku `technique` i ma 256×256 WebP.
- Pliki publikowane są w formacie WebP. Około 768×768 dla widoków głównych i 256×256 dla miniatur to cele z §5.2.
- Ścieżki są względne wobec katalogu aplikacji, mają dokładny kształt `img/exercises/<view>/<exerciseId>__<variantId>.webp`, gdzie katalog miniatur to `thumbnails`. Nie wolno używać adresów URL, ścieżek bezwzględnych, separatorów Windows, segmentów `..`, parametrów ani fragmentów.
- `sha256` jest małymi literami i ma 64 znaki szesnastkowe. Walidator plików porównuje deklarowany MIME, wymiary, rozmiar i SHA-256 z rzeczywistymi bajtami.
- Limity 200 KB dla widoku głównego i 40 KB dla miniatur są celami optymalizacyjnymi. Ich przekroczenie generuje ostrzeżenie, nie automatyczne odrzucenie ani wymóg obniżenia jakości.
- Teksty alternatywne są osobnymi polami i nie mogą być zastąpione informacją wyłącznie kolorystyczną.

Walidator techniczny sprawdza strukturę, relacje, ścieżki, sygnaturę WebP, SHA-256, rozmiar i wymiary. Nie rozpoznaje poprawności anatomii, ustawienia uchwytów, kierunku ruchu ani zgodności ćwiczącego z referencją. Te punkty wymagają oceny merytorycznej oraz jawnej decyzji właściciela.

## Wersjonowanie i pochodzenie

- Manifest wskazuje `masterVersion: "2.8"` i źródłowe sekcje.
- Każda kompozycja ma rosnące `revision`; decyzja właściciela musi wskazywać tę samą rewizję.
- Zmiana obrazu, briefu albo danych merytorycznych użytych do zatwierdzenia wymaga nowej rewizji i unieważnia wcześniejsze zatwierdzenie.
- `imageReadiness.catalogFingerprint` wiąże przegląd z bieżącą nazwą, sprzętem, anatomią i metadanymi wykonania z istniejącego katalogu.
- Pochodzenie każdego obrazu wskazuje brief, źródło lub narzędzie; obrazy pochodne wskazują widok `technique`.
- `exerciseAssetsVersion` i `manifestSchemaVersion` nie zastępują `dataSchemaVersion` ani wersji backupu.

## Wyjaśnienie właściciela: `tri_machine`

Decyzja właściciela z 2026-11-20 (`owner-clarification:2026-11-20:tri-machine-dual-function`): `biceps_preacher` i `tri_machine` mogą korzystać z tej samej fizycznej maszyny dwufunkcyjnej. Są to odrębne ćwiczenia z własnymi identyfikatorami: biceps oznacza konfigurację uginania, a triceps — konfigurację prostowania. Ilustracje mogą pokazywać tę samą konstrukcję urządzenia, lecz muszą przedstawiać właściwą konfigurację i odmienny ruch.

To doprecyzowanie nie zmienia historycznego MASTER PROMPT v2.8. Nie zatwierdza konkretnego ustawienia urządzenia. Do przygotowania ilustracji `tri_machine` wymagana jest dostępna fotografia konfiguracji tricepsowej albo dodatkowy opis właściciela. Bez referencji konfiguracja pozostaje pending.

## Procedura zatwierdzania

1. Zespół przygotowuje brief z odwołaniami do mastera i odpowiednim rekordem katalogu.
2. Recenzent merytoryczny sprawdza sprzęt, pozycję, technikę i anatomię w zakresie widocznym na obrazie.
3. Właściciel zatwierdza dane katalogowe istotne dla ilustracji; zapisuje się fingerprint i datę przeglądu.
4. Dla każdego obrazu weryfikuje się ID, wariant, kadr, sprzęt, kolorowanie, tekst alternatywny, WebP, wymiary, sumę i ścieżkę.
5. Właściciel akceptuje wszystkie trzy widoki dla jawnie wskazanej rewizji. Odrzucenie wymaga powodu.
6. W razie zmiany obrazu lub danych wejściowych zwiększa się rewizję i ponawia odpowiedni przegląd.

Zatwierdzenie ilustracji nie zatwierdza całego rekordu ćwiczenia. Dopóki `techniqueInstructions` lub `commonMistakes` pozostają pending, ogólny rekord katalogu pozostaje częściowo zatwierdzony.

## Walidacja

Testy powinny obejmować wszystkie 35 relacji, manifest bez obrazów, brakujące i zduplikowane rekordy, obce identyfikatory, traversal i zewnętrzne URL-e, błędne mapowanie nazwy pliku, sprzeczne statusy, brak decyzji właściciela, nieaktualny fingerprint, błędne metadane pliku, brak pliku, błędny WebP, różnicę SHA/rozmiaru/wymiarów oraz ostrzeżenia o celach optymalizacyjnych.

Testy nie stanowią wizualnej ani anatomicznej akceptacji. Nie zawierają prywatnych fotografii ani danych treningowych.
