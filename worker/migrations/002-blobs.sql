-- Armazenamento de arquivo sem o R2.
-- Rode UMA vez em bancos que já existem:
--   npx wrangler d1 execute mestiza-lab --remote --file=worker/migrations/002-blobs.sql
-- Bancos novos já nascem com isso (está no schema.sql).

CREATE TABLE IF NOT EXISTS blobs (
  chave     TEXT PRIMARY KEY,
  mime      TEXT NOT NULL DEFAULT '',
  tamanho   INTEGER NOT NULL DEFAULT 0,
  dados     BLOB NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
