CREATE DATABASE test_db;

-- Conectarse a test_db antes de ejecutar lo siguiente.
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

