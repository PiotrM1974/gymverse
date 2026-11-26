# GV-BOLT-STAGE63B — model programów wielodniowych

Zakres zatwierdzony przez właściciela: izolowany w profilu model 1–6 istniejących dni, bez współdzielenia dnia między grupami, ochrona tożsamości historii, eksport/import i bezpieczny merge. Bez przypisywania programu, edytora 6.4, publikacji i zmian generatora. Istniejące dane zachować. Testy wyłącznie syntetyczne.

## Wynik implementacji — do oceny

Dane i operacje: `profile.planPrograms` schemaVersion 1, assignedProgramId null, programs z ID `pg_` i 1–6 uporządkowanymi dayPlanIds; brak współdzielenia dnia w profilu. Moduł tworzy, edytuje, odczytuje i usuwa wyłącznie metadane oraz udostępnia zapis do istniejącej transakcji magazynu. Historia zachowuje pierwotne ID i nie zgaduje po tytule. Zablokowano usunięcie dni związanych z programem, aktywną sesją, draftem lub historią; v4 nie może zastąpić dni w profilu posiadającym programy. Eksport profilu, ZIP v5, restore i smart merge zachowują/oceniają referencje. PWA v40.

Świeże wyniki: 161/161 unit; 6/6 Edge dla etapu; regresja Edge 60/60 uruchomiona przed końcowym doprecyzowaniem sygnalizacji błędu zapisu; WebKit 4+2 w osobnych przebiegach, pierwsza seria przerwana po czterech sukcesach podczas oczekiwania na inicjalizację, dwie pozostałe po synchronizacji przeszły. Testy E2E na syntetycznych danych, w tym interfejsy kopii i konflikt zależnych dni. Wycofanie po awarii może zgłosić `integrityUncertain`, jeśli nie uda się odzyskać poprzedniego stanu; nie jest to gwarancja integralności przy podwójnym błędzie. Fizyczny Safari/iPhone i autentyczny v4 niezweryfikowane. Starszy klient może usunąć nowe metadane. Premium UI Polish pozostaje obowiązkowy.
