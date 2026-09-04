/* =========================================================
   Mestiza Lab — autenticação
   PBKDF2-SHA256 via WebCrypto: é o que o runtime dos Workers
   oferece nativamente e o que dá pra defender. Sem bcrypt
   (não roda no isolate) e sem senha em claro em lugar nenhum.
   ========================================================= */

const ITER = 210_000;   // recomendação OWASP para PBKDF2-SHA256
const KEYLEN = 32;
const SESSION_DIAS = 30;

const enc = new TextEncoder();

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
export function b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
export function unb64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
export function b64url(buf) {
  return b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function uid(prefixo = '') {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return prefixo + [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Comparação em tempo constante — evita timing attack no token. */
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* ---------------------------------------------------------
   Senha
   --------------------------------------------------------- */
async function derive(senha, salt, iter = ITER) {
  const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, KEYLEN * 8);
}

export async function hashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(senha, salt);
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(bits)}`;
}

export async function verificarSenha(senha, armazenado) {
  try {
    const [alg, iter, saltB64, hashB64] = String(armazenado).split('$');
    if (alg !== 'pbkdf2') return false;
    const bits = await derive(senha, unb64(saltB64), parseInt(iter, 10));
    return timingSafeEqual(b64(bits), hashB64);
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------
   Sessão
   --------------------------------------------------------- */
export const COOKIE = 'mz_sess';

export async function criarSessao(db, userId, ua) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await sha256hex(token);
  const expira = new Date(Date.now() + SESSION_DIAS * 864e5).toISOString();
  await db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expira_em, ua) VALUES (?, ?, ?, ?)'
  ).bind(hash, userId, expira, (ua || '').slice(0, 200)).run();
  return { token, expira };
}

export async function lerSessao(db, req) {
  const token = lerCookie(req, COOKIE);
  if (!token) return null;
  const hash = await sha256hex(token);
  const row = await db.prepare(`
    SELECT s.token_hash, s.expira_em, u.id, u.email, u.nome, u.role, u.ativo
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).bind(hash).first();
  if (!row) return null;
  if (new Date(row.expira_em) < new Date()) {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(hash).run();
    return null;
  }
  if (!row.ativo) return null;
  return { id: row.id, email: row.email, nome: row.nome, role: row.role, tokenHash: hash };
}

export async function destruirSessao(db, req) {
  const token = lerCookie(req, COOKIE);
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256hex(token)).run();
}

export function cookieSessao(token, expira, { seguro = true } = {}) {
  const partes = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${new Date(expira).toUTCString()}`,
  ];
  // Secure quebra o desenvolvimento em http://localhost, e só lá.
  if (seguro) partes.push('Secure');
  return partes.join('; ');
}

export function cookieLimpo({ seguro = true } = {}) {
  const partes = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (seguro) partes.push('Secure');
  return partes.join('; ');
}

export function lerCookie(req, nome) {
  const raw = req.headers.get('Cookie') || '';
  for (const parte of raw.split(';')) {
    const i = parte.indexOf('=');
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nome) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
}

/* ---------------------------------------------------------
   Freio de força bruta
   Janela de 15 minutos por email+IP. Não é rate limit
   distribuído, mas resolve o caso real: alguém tentando
   adivinhar a senha de um usuário conhecido.
   --------------------------------------------------------- */
const MAX_TENTATIVAS = 8;
const JANELA_MIN = 15;

export async function podeTentar(db, chave) {
  const agora = new Date();
  const row = await db.prepare('SELECT tentativas, ate FROM login_attempts WHERE chave = ?').bind(chave).first();
  if (!row) return true;
  if (new Date(row.ate) < agora) {
    await db.prepare('DELETE FROM login_attempts WHERE chave = ?').bind(chave).run();
    return true;
  }
  return row.tentativas < MAX_TENTATIVAS;
}

export async function registrarFalha(db, chave) {
  const ate = new Date(Date.now() + JANELA_MIN * 60_000).toISOString();
  await db.prepare(`
    INSERT INTO login_attempts (chave, tentativas, ate) VALUES (?, 1, ?)
    ON CONFLICT(chave) DO UPDATE SET tentativas = tentativas + 1
  `).bind(chave, ate).run();
}

export async function limparFalhas(db, chave) {
  await db.prepare('DELETE FROM login_attempts WHERE chave = ?').bind(chave).run();
}

/* ---------------------------------------------------------
   Tokens de integração (Claude)
   --------------------------------------------------------- */
export const TOKEN_PREFIXO = 'mzl_';

export async function criarToken(db, nome, userId) {
  const valor = TOKEN_PREFIXO + b64url(crypto.getRandomValues(new Uint8Array(24)));
  const hash = await sha256hex(valor);
  const id = uid('tok_');
  await db.prepare(
    'INSERT INTO api_tokens (id, nome, prefixo, token_hash, criado_por) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, nome, valor.slice(0, 12), hash, userId).run();
  return { id, valor };
}

export async function autenticarToken(db, req) {
  const h = req.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  if (!m) return null;
  const hash = await sha256hex(m[1].trim());
  const row = await db.prepare(`
    SELECT t.id, t.nome, t.criado_por, u.role
    FROM api_tokens t LEFT JOIN users u ON u.id = t.criado_por
    WHERE t.token_hash = ?
  `).bind(hash).first();
  if (!row) return null;
  // Barato o bastante para registrar em toda chamada e útil
  // para descobrir token esquecido em uso.
  await db.prepare("UPDATE api_tokens SET usado_em = datetime('now') WHERE id = ?").bind(row.id).run();
  return { tokenId: row.id, nome: row.nome, userId: row.criado_por, role: row.role || 'editor' };
}
