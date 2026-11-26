# GymNastika — etap 6.3C: projekt przypisywania programu

Status: propozycja do zatwierdzenia, bez implementacji. Właściciel zaakceptował 6.3B. Pozostają wymogi Premium UI Polish, fizycznego iPhone/Safari oraz autentycznego eksportu v4 przed publikacją. Nie obejmuje 6.4.

## Obecny stan

`planPrograms` jest opcjonalny; istniejący walidator wymaga `assignedProgramId` równego null albo ID programu z tego profilu oraz waliduje dzień w `readProgramDays`. `deleteProgram` już czyści wskazanie usuniętej grupy, ale istniejący moduł nie udostępnia operacji przypisania. `commitProgramProfile` zapisuje plany i rejestr, zgłasza `integrityUncertain` po wykryciu nieskutecznego rollbacku, a wywołujący musi przyjąć zwrócony `PROFILE_STATE`. Podgląd 6.1 wyświetla pojedynczy dzień, nie program. `planBackupImport` scala programy, lecz dla tego samego profilu nie scala obecnie `assignedProgramId` ani nie zgłasza konfliktu. W eksporcie pojedynczego profilu i pełnym ZIP metadane znajdują się w rekordzie profilu; round-trip przypisania wymaga osobnych testów.

## Kontrakt operacji

- Odczyt: brak `planPrograms` lub `assignedProgramId:null` oznacza brak przypisania; dla poprawnej wartości pobrać program z aktywnego profilu i wszystkie jego dni w kolejności. Walidować tożsamość profilu, 1–6 różnych ID i faktyczną obecność dni. Uszkodzone dane zgłosić jako błąd, bez automatycznej naprawy, zapisu ani przypisania pierwszej pozycji.
- Przypisz/zmień: wyłącznie jawna akcja użytkownika; ponownie sprawdzić aktywny profil, program, dni i brak zmiany danych od podglądu. Ta sama wartość to bezpieczna operacja bez zmian. Zmiana przypisania nie zmienia dni, historii, sesji ani draftów i nie uruchamia treningu. Aktualizować tylko `assignedProgramId`; nie tworzyć grup na podstawie pojedynczych dni.
- Usuń przypisanie: jawna akcja ustawia null i pozostawia grupę oraz jej dni. Brak `planPrograms` pozostaje brakiem, nie jest inicjalizowany samym odczytem.
- Usuń program: po potwierdzeniu wywołać obecną operację usuwania grupy i zapisać wynik; jeśli była przypisana, null w tej samej zmianie rejestru. Dni, historia i aktywna sesja pozostają. UI usuwania programu nie jest wymagane do udostępnienia przypisania; gdy będzie dostępne, stosuje tę regułę.
- Zapis: po zatwierdzeniu użytkownika sprawdzić aktualny zapis i wersję profilu, równoległą zmianę i poprawność referencji; użyć istniejącego `STORE` i jednej transakcji zmieniającej rejestr profili. Ocenić możliwość zapisu wyłącznie `gymverse_profiles_v1`, ponieważ samego przypisania nie trzeba zapisywać razem z dniami; wykorzystać istniejący mechanizm transakcji i blokadę równoległych zmian, nie fałszować gwarancji atomowości. Po trwałym zapisie i potwierdzeniu odczytu ustawić `PROFILE_STATE` oraz odświeżyć UI. Przed zapisem sprawdzić aktywny profil i zatrzymać pracę, gdy zmienił się w innym oknie. Przycisk zablokować w trakcie zapisu.

## Ekrany

Na ekranie planów niewielki panel „Przypisany program” pokazuje nazwę i liczbę dni, przy braku — „Nie wybrano programu” oraz dostęp do biblioteki. Zachować istniejące karty i pojedyncze dni. Biblioteka w stylu Signal zawiera grupy bieżącego profilu oraz osobną sekcję samodzielnych dni; brak grup ma czytelny stan pusty i prowadzi do obecnych funkcji, bez obiecywania edytora 6.4. Nie sugerować, że dotychczasowe plany już należą do programu.

Karta programu otwiera podgląd z tytułem, liczbą dni i uporządkowaną listą. Każdy dzień otwiera istniejący widok szczegółów (`showStage6Preview`) z ćwiczeniami, wariantami, seriami, powtórzeniami i rzeczywistą przerwą. Powrót z dnia wraca do programu. W podglądzie programu przycisk „Przypisz do profilu”; przy obecnie wybranym oznaczenie i osobna akcja usunięcia. Zastąpienie bieżącego przypisania czytelnie pokazuje stary i nowy program; dopiero potwierdzenie zmienia zapis. Podgląd nie wykonuje żadnego zapisu. Osobny przycisk rozpoczynania dnia wykorzystuje obecną logikę startu i ochronę aktywnej sesji. Aktywna sesja pozostaje możliwa do wznowienia po zmianie przypisania; przypisanie nie zmienia aktualnego widoku treningu ani timera.

## ZIP i import

Pełne odtworzenie zgodnie z dotychczasowymi potwierdzeniami przywraca jawne przypisanie z kopii dopiero po walidacji profilu, programu i wszystkich referencji. Nieprawidłowa kopia jest odrzucona; nie poprawiać jej po cichu. Nowy, inny profil przy imporcie pozostaje osobny i może przenieść swoje prawidłowe przypisanie; nie przełączać aktywnego profilu bez istniejącej jawnej akcji.

Uzupełnianie tego samego ID profilu: (1) lokalny `planPrograms` istnieje z ID lub jawnym null — lokalna wartość wygrywa; inna jawna wartość kopii, w tym null, zgłasza konflikt; (2) lokalny `planPrograms` całkowicie nie istnieje — można po potwierdzeniu przyjąć źródłowe ID, wyłącznie jeśli cała grupa i jej dni weszły lub są identyczne bez konfliktu; źródłowe null nie wymaga tworzenia pustego obiektu; (3) brak źródłowej informacji nie zmienia lokalnej. Nie wskazywać programu zależnego od odrzuconego lub różniącego się dnia, nawet jeśli lokalnie jest program o takim samym ID. Kolizję zgłosić w podglądzie jako zrozumiały opis, nie sam kod techniczny. Identyczny import powtórzony nie tworzy duplikatów ani nowych konfliktów. Dla źródłowego jawnego null i lokalnego przypisania konflikt pozostaje widoczny przy każdym ponowieniu, ponieważ wartości nadal się różnią. Jeśli błąd nastąpi po częściowym zapisie, wykorzystać istniejące planowanie oraz rollback, a nie obiecywać jego powodzenia.

Stare JSON v4 nie mają programów ani przypisań; zachować dotychczasową ochronę dni grup przed zastąpieniem i nie tworzyć ani nie usuwać przypisania bez wyraźnej operacji. Starszy klient może zgubić lub zignorować metadane przy zapisie; zapis starszym klientem nie jest potwierdzony jako zgodny.

## Niepewna integralność

Po błędzie z `integrityUncertain`: zatrzymać kolejne operacje modyfikujące stan, bez komunikatu sukcesu; wyświetlić trwały, dostępny komunikat, że dane wymagają odzyskania. Pozostawić odczyt i dostęp do awaryjnego eksportu oraz kontrolowane przywracanie zweryfikowanej kopii, o ile mechanizm potrafi je bezpiecznie przeprowadzić. Zaproponować istniejący `offerEmergencyExport`, jasno zaznaczając jego ograniczenie: aktualny JSON v4 nie zawiera rejestru profili, programów ani przypisania i nie jest kompletną kopią. Użyć istniejącego ZIP v5 tylko jeżeli walidacja dostępnego snapshotu oraz odczyt z obu magazynów przejdą; nie nazywać takiego eksportu pewną, kompletną kopią przy niespójnym stanie. Odmowa eksportu nie znosi blokady; po ponownym uruchomieniu stan musi zostać zweryfikowany albo przywrócony, a nie automatycznie uznany za bezpieczny. Wymaga zaprojektowania trwałego i odtwarzalnego sygnału blokady oraz postępowania, gdy jego zapis też jest niedostępny; w tym ostatnim przypadku nie obiecywać trwałej blokady po zamknięciu karty.

## Pliki i kolejność po zgodzie

1. `docs/tasks/GV-BOLT-STAGE63C.md`, `docs/gymnastika-stage63-data-contract.md`, `PROJECT_MEMORY.md`: ustalenia, testy i rzeczywisty status.
2. `src/features/plans/programs.js`: jawne operacje odczytu/przypisania/wyczyszczenia, walidacja i niezmienność pozostałych danych. `src/features/profiles/profile-model.js` tylko jeśli testy wykażą niezbędne zmiany.
3. `src/features/backup/import-plan.js` i `src/features/backup/import-preview.js`: reguły zgodności zależności, konflikty i opisy; `src/gv-data.js` wyłącznie jeśli testy dowiodą konieczności zmian walidacji, zapisu lub odzyskiwania.
4. `index.html`, `src/ui/signal.css`: istniejący ekran planów, biblioteka i podgląd programu, bez nowego edytora; ścieżka sukcesu wyłącznie po potwierdzeniu zapisu, uwzględnienie `PROFILE_STATE`, aktywnego profilu i bezpiecznego stanu błędu. `sw.js` oraz testy cache, jeżeli zmienią się zasoby powłoki.
5. Nowe testy jednostkowe i E2E oraz celowana regresja 6.3A/6.3B, importu, sesji i profili.

## Testy i akceptacja

Syntetyczne dane: brak pola/null/id, przypisz/zamień/wyczyść, błędne ID, brak dnia, jedno i sześć dni, dwa profile z tymi samymi nazwami, zmiana profilu podczas podglądu/zapisu, usunięcie przypisanej grupy, aktywna sesja i drafty, odczyt po przeładowaniu; porównać faktyczne rekordy, nie tylko UI. Podgląd musi pozostawiać snapshot bez zmian i nie uruchamiać sesji. ZIP: eksport z przycisku i pełne przywrócenie, inny profil, wszystkie kombinacje null/brak/id, konflikt grupy/dnia, powtórny import, odmowa zapisu, rollback i podwójna awaria. Test starego JSON v4 oraz działanie offline po uprzednim zainstalowaniu powłoki. Edge i dostępny desktopowy WebKit, LIGHT/DARK 320/375/390/430 px, klawiatura i czytelne stany. Safari na fizycznym iPhonie pozostaje osobnym testem.

Najmniejszy zakres: niezmienny model dni, jawne przypisanie metadanych, podgląd wszystkich dni przez istniejące szczegóły, reguły importu, bezpieczna obsługa błędów; bez automatycznego tworzenia programów, edytora 6.4, zmian generatora ani nowego systemu kopii.
