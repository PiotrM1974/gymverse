# Inwentaryzacja rzeczywistych widoków

Źródło: bieżący `index.html`, moduły `src/features/anatomy/` i `src/exercise/`, 23.11.2026. Rzeczywiste widoki to siedem sekcji `view-*`; pozostałe pozycje są ich stanami lub panelami.

| Obszar | Stan obecny | Główne części i stany do zaprojektowania |
| --- | --- | --- |
| Start i wybór planu `view-plans` | Jeden widok | Kafelki planów, wznowienie treningu, pasek tygodnia, odciążenie, edycja planów, kopia/import; stan pusty i rozpoczęty |
| Trening `view-workout` | Jeden widok, także karta ćwiczenia i rejestracja serii | Postęp, zatwierdzona ilustracja, wybór sylwetki i pozycji, serie, wartości, Zrobione, następne ćwiczenie, zamiana, zwijany MuscleMap; przed/zapisana seria, długi tytuł, kompaktowy nagłówek |
| Odpoczynek | Panel `timerBar` w treningu | Czas, pauza, +30 s, Pomiń; stan aktywny i wstrzymany |
| Podsumowanie `view-summary` | Osobny widok | Tonaż, powtórzenia, czas, porównanie, rekordy, udostępnienie |
| Progres `view-charts` | Osobny widok | Wybór ćwiczenia, zakres czasu, trzy wykresy; brak danych |
| Historia `view-history` | Osobny widok | Filtr, wpisy, ręczne dodanie treningu, rozwinięte szczegóły; pusta historia |
| Statystyki `view-stats` | Osobny widok | Karty liczbowe, wykres tygodni, kalendarz, grupy mięśni, rekordy, masa ciała; brak danych |
| Edycja planów `view-planedit` | Osobny widok | Plany, ćwiczenia i warianty; edycja, usuwanie, potwierdzenia |
| Biblioteka ćwiczeń | Brak osobnego widoku | Katalog służy planom i zamianie ćwiczenia; nie projektować osobnego ekranu biblioteki |
| Ustawienia i panele pomocnicze | Bez osobnej zakładki | Dane/kopia na starcie, kalkulator talerzy i zamiana w treningu, cel tygodniowy w statystykach, natywne okna potwierdzeń, toast, błędy obrazu/importu |

Wspólne elementy: górna nawigacja do startu, statystyk, progresu i historii; tytuły, przyciski, pola, karty, informacje zwrotne. Istniejące ilustracje i MuscleMap są zasobami; zmieniać można tylko oprawę interfejsu w późniejszej fazie wdrożenia.
