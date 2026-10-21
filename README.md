# Candidate Helper

Мобильный одностраничный сайт для:
- согласования кандидата;
- копирования готового текста;
- подготовки короткого/расширенного сообщения кандидату;
- сохранения анкеты в Google Таблицу.

## Google Таблица
Используется таблица:
https://docs.google.com/spreadsheets/d/1VOjhFMR86KeRO3JJoEXEwJ0TA7bBPlHD5hF64-wbI9Y/edit

1. Открой таблицу → Расширения → Apps Script.
2. Вставь содержимое `Code.gs`.
3. Deploy → New deployment → Web app.
4. Execute as: Me.
5. Who has access: Anyone.
6. Скопируй URL, заканчивающийся `/exec`.
7. Замени в `index.html` значение `GOOGLE_SCRIPT_URL`.

## GitHub Pages
Settings → Pages → Source: GitHub Actions.
После этого каждый push в `main` автоматически обновляет сайт.