-- Ajusta coluna senha para aceitar hashes e garante unicidade de e-mail (case-insensitive)
BEGIN;

-- Aumenta tipo da coluna senha (caso não aceite hashes)
ALTER TABLE usuario ALTER COLUMN senha TYPE VARCHAR(255);

-- Cria índice único usando lower(email) para evitar duplicatas por caixa
CREATE UNIQUE INDEX IF NOT EXISTS usuario_email_unique ON usuario (LOWER(email));

COMMIT;
