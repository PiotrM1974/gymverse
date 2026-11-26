# GymNastika 2.0 — zatwierdzony projekt UI

Stan na 23.11.2026. Zestaw końcowych PNG jest wskazany w [rejestrze akceptacji](approvals.md). Każdy z dziewięciu etapów został osobno zaakceptowany. Plansze są statyczne; wartości treningowe na nich są syntetyczne. Wcześniejsze warianty kolorystyczne zachowano jako archiwum propozycji, nie jako część zatwierdzonego wzorca.

## System wizualny

- Układ i typografia: Mineral Track. Krój nagłówków **Barlow Condensed**, tekstu i kontrolek **Source Sans 3**; awaryjnie odpowiednio Impact i Arial.
- Kolorystyka: **Signal**. Pełne wartości LIGHT/DARK i role kolorów: [tokeny Signal](design-system/signal-tokens.md). Błękit oznacza działania główne, pomarańcz Push, turkus Pull, żółty następny plan lub czas. MuscleMap zachowuje własną semantykę kolorów.
- Wzorzec mobilny ma szerokość 390 punktów CSS. Kontrolki dotykowe mają zwykle co najmniej 44 punkty wysokości; odstępy i długości tekstu muszą zachować czytelność także na węższych ekranach. Osobne zaakceptowane widoki desktopowe są w rejestrze.
- Stan aktywny jest opisany kolorem **i** tekstem lub kształtem. Oznaczenia Push/Pull i zmiany kolejności w edytorze planów używają słów zamiast samych strzałek.

## Komponenty

| Komponent | Wzorzec i stan |
| --- | --- |
| Górna nawigacja | Plany, Statystyki, Progres, Historia; zaznaczenie kolorem i podkreśleniem; kompaktowy nagłówek podczas treningu. |
| Karta planu | Nazwa, liczba ćwiczeń, czytelne oznaczenie Push/Pull, stan następnego planu i przycisk rozpoczęcia. |
| Karta ćwiczenia | Nazwa, postęp, zatwierdzona ilustracja, obie sylwetki i pozycje, serie, duże pola ciężaru/powtórzeń i działanie „Zrobione”. |
| Atlas i timer | Atlas rozwijany w treningu i zsynchronizowany z ilustracją; timer z pauzą, dodaniem 30 s i pominięciem. |
| Dane i plany | Pola i przyciski o wyraźnych granicach, oznaczone warianty ćwiczeń, „Wyżej”/„Niżej”, eksport/import oraz komunikaty o stanie kopii. |
| Informacja zwrotna | Zwięzły komunikat sukcesu lub błędu, ostrzeżenie i potwierdzenie działania mogącego usunąć dane. Wzór potwierdzenia jest wizualizacją; obecna aplikacja używa natywnego `confirm`. |

## Mapa ekranów

`Start / wybór planu → trening → podsumowanie → historia / statystyki / progres`.

Z ekranu startowego dostępne są edytor planów oraz kopia/import/CSV. W treningu znajdują się karta ćwiczenia, serie, timer, zamiana ćwiczenia, kalkulator talerzy i rozwijany MuscleMap. Z historii można przejść do szczegółów wpisu; statystyki obejmują cel tygodniowy i masę ciała. Biblioteka ćwiczeń i ustawienia nie mają osobnych zakładek w obecnej aplikacji.

## Granica zakresu

Wdrożenie zatwierdzonego wyglądu nie wymaga nowej logiki treningowej. Osobnej zgody wymagają przyszłe funkcje: profile i onboarding, kreator i konfiguracja planów, nowe style treningu, rozszerzenie cardio, redukcja i obliczanie wydatku energetycznego. Zastąpienie natywnych potwierdzeń własnymi oknami wymaga zachowania dostępności, kolejności potwierdzeń i aktualnej ochrony danych; sama plansza nie jest zgodą na zmianę tych zasad.
