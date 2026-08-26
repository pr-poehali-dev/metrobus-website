CREATE TABLE IF NOT EXISTS changelog_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    published BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO changelog_entries (entry_date, title, items, sort_order) VALUES (
    '2026-08-26',
    'Новая терминология дашборда и обновлённые соглашения',
    '["Переключатель дашборда переименован: «Пассажиры/Наблюдатели» → «Поездки/Маршруты» — так понятнее, что это два разных вида оценки, а не роль человека.", "В рейтинге активности и в панели модерации термин «Наблюдатель» заменён на «Пользователь».", "В последних оценках маршрутов убран номер борта — это служебная информация, важная только для оценок поездок.", "Пользовательское соглашение и Политика конфиденциальности приведены в соответствие с новой терминологией.", "Обновлена иллюстрация в блоке «Как это работает» — с более подробной инструкцией."]'::jsonb,
    0
);