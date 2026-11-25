import { Database } from "bun:sqlite";

const db = new Database("database.sqlite");
db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        nome            TEXT NOT NULL UNIQUE,
        email           TEXT NOT NULL UNIQUE,
        password_hash   TEXT NOT NULL,
        telefone        TEXT,
        id_importancia  INTEGER
    );

    CREATE TABLE IF NOT EXISTS produtos (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        nome            TEXT NOT NULL,
        descricao       TEXT,
        preco           REAL NOT NULL,
        data_validade   TEXT,
        data_cadastro   TEXT,
        estoque         INTEGER NOT NULL,
        imagem          TEXT
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
        id              INTEGER PRIMARY KEY,
        admin_criado    INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO configuracoes (id, admin_criado) VALUES (1, 0);
`);

export { db };
