-- Coleções na biblioteca de mídia.
-- Rode UMA vez em bancos que já existem:
--   npx wrangler d1 execute mestiza-lab --remote --file=migrations/001-colecoes.sql
-- Bancos novos já nascem com isso (está no schema.sql).

ALTER TABLE media ADD COLUMN colecao TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_media_colecao ON media(colecao);
