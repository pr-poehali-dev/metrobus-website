CREATE TABLE IF NOT EXISTS role_accounts (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('carrier', 'regulator')),
    login VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (role, login)
);

INSERT INTO role_accounts (role, login, password_hash, org_name) VALUES
    ('carrier', 'carrier@demo.ru', '54a05cdd1a2536b145443eb3d0f0de14$3447c5bcacc87e856f25ba582d4b36c3886d26c3359f2e3c2c48e693807edf7f', 'ГУП «Горэлектротранс»'),
    ('regulator', 'zakazchik@demo.ru', 'fb3e7b980e728024405336033a0d7de0$2388279ef48811a7ba124a7333149a2e077de0fb7b6622ae30f296391612f028', 'Комитет по транспорту Санкт-Петербурга');
