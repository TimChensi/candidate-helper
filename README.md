# Candidate Helper

Мобильный одностраничный сайт для:
- согласования кандидата;
- копирования готового текста;
- подготовки короткого/расширенного сообщения кандидату;
- сохранения анкеты в Google Таблицу.

## Google Таблица
Используется таблица:
https://docs.google.com/spreadsheets/d/16xoI3uN2-wgVq2qNNu1y8SKGHaYj1phJES3tJ-zVlpQ/edit

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