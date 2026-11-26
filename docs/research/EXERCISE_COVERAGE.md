# EXERCISE_COVERAGE — snapshot 24.11.2026

Źródło: obecny `src/exercise/catalog.js`; 31 ćwiczeń bazowych i 4 warianty. Zatwierdzona struktura katalogu nie oznacza pełnej pokrywy wzorców potrzebnej generatorowi.

| Grupa widoczna w katalogu | Przykładowe stabilne ID | Ocena pokrycia |
|---|---|---|
| Klatka/piersiowy | bench_flat, db_incline, db_bench, db_fly, chest_machine, pec_deck, pushup, dips | Dobre wypychanie; brak osobnego obiektywnego standardu oceny pełnego zakresu ruchu. |
| Plecy/przyciąganie | lat_pulldown_wide, lat_pulldown_neutral, row_v, row_straight, row_machine, pullup | Przyciąganie pionowe i poziome; sprzęt głównie maszyny/wyciąg/drążek. |
| Barki | shoulder_press, lat_raise_stand, lat_raise_seated, lat_raise_cable, rear_delt, face_pull, front_raise | Dostępne główne kierunki, pewne pokrycie nakłada się z klatką/plecami. |
| Ramiona | biceps_preacher, hammer_curl, cable_curl, tri_rope, tri_machine, tri_overhead | Dostępne izolacje i warianty. |
| Nogi | leg_press, smith_squat, leg_extension, leg_curl | Czworogłowe i zginacze kolana. |
| Brak / niedostateczne | — | Brak jawnego hip hinge/RDL/deadlift, wyprostu biodra, łydek, brzucha/core i ćwiczeń równowagi; brak wariantu domu bez sprzętu dla większości partii; brak zatwierdzonego cardio. |

Cztery warianty (`leg_press/high_feet`, `db_fly/incline`, `shoulder_press/dumbbells`, `tri_overhead/rope`) są wariantami wykonania, nie nowymi bazowymi wzorcami.

## Mapowanie generatora — lokalny prototyp

Wersja 1 generatora ma jawne mapowanie każdego z 31 zatwierdzonych bazowych ID do roboczych grup mięśniowych, wymaganego sprzętu i wzorca używanego do filtrów ograniczeń (`src/features/plans/generator.js`). Test sprawdza zgodność mapy 1:1 z katalogiem. Cztery warianty nie są liczone jako oddzielne ćwiczenia. Klasyfikacja jest funkcjonalna i nie stanowi niezależnej walidacji klinicznej/anatomicznej.

Generator wymaga potwierdzonego wieku dorosłego i wyboru dostępnego sprzętu, nie wymyśla wpisów, respektuje zapisane wykluczenia i zwraca odmowę, kiedy brakuje ćwiczeń dla wybranych priorytetów. Każda propozycja jest opisana jako „Do sprawdzenia”. Zawsze sygnalizuje brak zawiasu biodrowego, łydek i core; użytkownik widzi to przed zapisaniem. Ustawienia 2 serie i zakres 8–12 powtórzeń są robocze i edytowalne, nie przedstawiane jako indywidualny cel naukowy.

Praktyczne konsekwencje: z aktualnego zestawu nie wolno deklarować kompletnego FBW albo PPL dla dowolnego sprzętu. Generator powinien wprost pokazać brak pokrycia, ograniczyć plan do dostępnych wpisów lub poprosić o zmianę sprzętu/prioritetu. Nie uzupełniać fikcyjnymi ćwiczeniami. Braki wymagają osobnej walidacji anatomii, sprzętu i zatwierdzonych instrukcji przed dodaniem do katalogu.
