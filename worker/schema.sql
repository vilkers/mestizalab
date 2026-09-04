-- =========================================================
-- Mestiza Lab — esquema D1
-- Aplique com:
--   npx wrangler d1 execute mestiza-lab --remote --file=schema.sql
-- =========================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------
-- Pessoas
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL DEFAULT '',
  senha_hash  TEXT NOT NULL,          -- pbkdf2$<iter>$<salt b64>$<hash b64>
  role        TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor')),
  ativo       INTEGER NOT NULL DEFAULT 1,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  visto_em    TEXT
);

-- ---------------------------------------------------------
-- Sessões
-- Guardamos o SHA-256 do token, nunca o token. Vazamento do
-- banco não vira sessão válida.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em   TEXT NOT NULL,
  ua          TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expira_em);

-- ---------------------------------------------------------
-- Tentativas de login — freio de força bruta
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  chave     TEXT PRIMARY KEY,          -- email|ip
  tentativas INTEGER NOT NULL DEFAULT 0,
  ate       TEXT NOT NULL              -- janela atual
);

-- ---------------------------------------------------------
-- Editorias
-- Tabela, e não constante no código, porque a próxima
-- editoria entra sem deploy.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorias (
  id        TEXT PRIMARY KEY,
  nome      TEXT NOT NULL,
  kicker    TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  ordem     INTEGER NOT NULL DEFAULT 0,
  ativa     INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------
-- Posts
-- `content` e `overrides` são JSON. O documento renderizado
-- NÃO é salvo: ele é derivado de template + formato +
-- content + overrides. É o que deixa trocar de template sem
-- perder o texto.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id            TEXT PRIMARY KEY,
  titulo        TEXT NOT NULL DEFAULT 'Sem título',
  editoria      TEXT NOT NULL DEFAULT 'institucional',
  formato       TEXT NOT NULL DEFAULT 'feed-45',
  template      TEXT NOT NULL DEFAULT 'inst-declaracao',
  status        TEXT NOT NULL DEFAULT 'rascunho'
                CHECK (status IN ('rascunho','revisao','aprovado','publicado')),
  content       TEXT NOT NULL DEFAULT '{}',
  overrides     TEXT NOT NULL DEFAULT '{}',
  legenda       TEXT NOT NULL DEFAULT '',
  hashtags      TEXT NOT NULL DEFAULT '',
  video         TEXT,
  thumb         TEXT,
  origem        TEXT NOT NULL DEFAULT 'app',   -- 'app' | 'claude'
  criado_por    TEXT REFERENCES users(id) ON DELETE SET NULL,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_at     ON posts(atualizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_posts_ed     ON posts(editoria);

-- ---------------------------------------------------------
-- Mídia (ponteiros para o R2)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id         TEXT PRIMARY KEY,
  chave      TEXT NOT NULL UNIQUE,     -- caminho no R2
  nome       TEXT NOT NULL DEFAULT '',
  mime       TEXT NOT NULL DEFAULT '',
  tipo       TEXT NOT NULL DEFAULT 'image',  -- 'image' | 'video'
  tamanho    INTEGER NOT NULL DEFAULT 0,
  largura    INTEGER,
  altura     INTEGER,
  -- Coleção é texto livre, não tabela. Criar uma coleção é
  -- digitar um nome; não existe passo de "criar pasta antes
  -- de subir". Se um dia precisar de ordem ou capa, vira
  -- tabela — até lá isso resolve com zero atrito.
  colecao    TEXT NOT NULL DEFAULT '',
  criado_por TEXT REFERENCES users(id) ON DELETE SET NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_em      ON media(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_media_colecao ON media(colecao);

-- ---------------------------------------------------------
-- Briefings — o que chega do Claude
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefings (
  id         TEXT PRIMARY KEY,
  titulo     TEXT NOT NULL DEFAULT '',
  corpo      TEXT NOT NULL DEFAULT '',
  editoria   TEXT,
  payload    TEXT NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','lido','arquivado')),
  origem     TEXT NOT NULL DEFAULT 'claude',
  post_id    TEXT REFERENCES posts(id) ON DELETE SET NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_brief_em ON briefings(criado_em DESC);

-- ---------------------------------------------------------
-- Tokens de integração (Claude)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_tokens (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  prefixo    TEXT NOT NULL,            -- primeiros caracteres, só pra reconhecer na lista
  token_hash TEXT NOT NULL UNIQUE,
  criado_por TEXT REFERENCES users(id) ON DELETE SET NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now')),
  usado_em   TEXT
);

-- ---------------------------------------------------------
-- Semente das editorias
-- ---------------------------------------------------------
INSERT OR IGNORE INTO editorias (id, nome, kicker, descricao, ordem) VALUES
  ('institucional', 'Institucional', 'Voz oficial do estúdio',
   'Grade rígida, hairline, serif com itálico dourado. É o que sustenta a marca.', 1),
  ('livre', 'Livre', 'Fora do layout institucional',
   'Experimental. Tipo sangrando, blend difference, duotone. Continua sendo Mestiza — sem a régua.', 2),
  ('video', 'Vídeo', 'Máscaras sobre Reels e Stories',
   'Molduras e faixas que entram por cima do vídeo. Nada invade a UI do Instagram.', 3);
