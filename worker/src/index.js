/* =========================================================
   Mestiza Lab — Worker
   API + sessão + mídia no R2. Roda no mesmo domínio do app
   (Pages), então cookie e CORS são triviais.
   ========================================================= */

import {
  hashSenha, verificarSenha, criarSessao, lerSessao, destruirSessao,
  cookieSessao, cookieLimpo, uid, criarToken, autenticarToken,
  podeTentar, registrarFalha, limparFalhas,
} from './auth.js';

const LIMITE_IMAGEM = 12 * 1024 * 1024;
const LIMITE_VIDEO = 200 * 1024 * 1024;
const MIMES_IMAGEM = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MIMES_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

/* ---------------------------------------------------------
   Respostas
   --------------------------------------------------------- */
function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}
const erro = (status, msg, extra = {}) => json({ error: msg, ...extra }, { status });

/** Cabeçalhos de CORS. Em produção, mesma origem — só o dev
    local precisa disso, e nunca com origem curinga porque a
    sessão viaja em cookie. */
function cors(req, env) {
  const origem = req.headers.get('Origin');
  if (!origem) return {};
  const permitidas = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!permitidas.includes(origem)) return {};
  return {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

const seguro = (req) => new URL(req.url).protocol === 'https:';

/* =========================================================
   Roteador
   ========================================================= */
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const c = cors(req, env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });

    let caminho = url.pathname;
    if (caminho.startsWith('/api')) caminho = caminho.slice(4) || '/';

    try {
      const res = await rotear(req, env, ctx, caminho, url);
      for (const [k, v] of Object.entries(c)) res.headers.set(k, v);
      return res;
    } catch (e) {
      console.error('erro', caminho, e && e.stack);
      return json({ error: 'Erro interno.' }, { status: 500, headers: c });
    }
  },

  /** Faxina diária: sessões vencidas e janelas de tentativa. */
  async scheduled(event, env) {
    await env.DB.prepare("DELETE FROM sessions WHERE expira_em < datetime('now')").run();
    await env.DB.prepare("DELETE FROM login_attempts WHERE ate < datetime('now')").run();
  },
};

async function rotear(req, env, ctx, caminho, url) {
  const db = env.DB;
  const m = req.method;

  /* ---------- arquivos do R2 (público para quem tem o link) ---------- */
  if (caminho.startsWith('/files/')) {
    return servirArquivo(env, caminho.slice('/files/'.length), req);
  }

  /* ---------- login ---------- */
  if (caminho === '/auth/login' && m === 'POST') {
    const { email, senha } = await req.json().catch(() => ({}));
    if (!email || !senha) return erro(400, 'E-mail e senha são obrigatórios.');

    const ip = req.headers.get('CF-Connecting-IP') || '0';
    const chave = `${String(email).toLowerCase()}|${ip}`;
    if (!(await podeTentar(db, chave))) {
      return erro(429, 'Muitas tentativas. Espere alguns minutos.');
    }

    const u = await db.prepare(
      'SELECT id, email, nome, role, senha_hash, ativo FROM users WHERE email = ?'
    ).bind(String(email).toLowerCase().trim()).first();

    // Mesma resposta e mesmo custo de tempo para usuário
    // inexistente e senha errada: não entregamos quais
    // e-mails existem.
    const ok = u && u.ativo && (await verificarSenha(senha, u.senha_hash));
    if (!ok) {
      if (!u) await verificarSenha(senha, 'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
      await registrarFalha(db, chave);
      return erro(401, 'E-mail ou senha não conferem.');
    }

    await limparFalhas(db, chave);
    const { token, expira } = await criarSessao(db, u.id, req.headers.get('User-Agent'));
    await db.prepare("UPDATE users SET visto_em = datetime('now') WHERE id = ?").bind(u.id).run();

    return json(
      { user: { id: u.id, email: u.email, nome: u.nome, role: u.role } },
      { headers: { 'Set-Cookie': cookieSessao(token, expira, { seguro: seguro(req) }) } },
    );
  }

  if (caminho === '/auth/logout' && m === 'POST') {
    await destruirSessao(db, req);
    return json({ ok: true }, { headers: { 'Set-Cookie': cookieLimpo({ seguro: seguro(req) }) } });
  }

  /* ---------- ingestão do Claude (token, não sessão) ---------- */
  if (caminho === '/intake' && m === 'POST') {
    const tok = await autenticarToken(db, req);
    if (!tok) return erro(401, 'Token inválido.');
    return intake(req, env, tok);
  }
  if (caminho === '/intake' && m === 'GET') {
    // Ajuda quem está configurando: descreve o contrato.
    const tok = await autenticarToken(db, req);
    if (!tok) return erro(401, 'Token inválido.');
    return json(contratoIntake());
  }

  /* ---------- daqui pra baixo, sessão obrigatória ---------- */
  const user = await lerSessao(db, req);
  if (!user) return erro(401, 'Não autenticado.');

  if (caminho === '/me' && m === 'GET') {
    const eds = await db.prepare('SELECT id, nome, kicker, descricao FROM editorias WHERE ativa = 1 ORDER BY ordem').all();
    return json({ user: { id: user.id, email: user.email, nome: user.nome, role: user.role }, editorias: eds.results });
  }

  if (caminho === '/editorias' && m === 'GET') {
    const r = await db.prepare('SELECT id, nome, kicker, descricao FROM editorias WHERE ativa = 1 ORDER BY ordem').all();
    return json({ editorias: r.results });
  }

  /* ---------- posts ---------- */
  if (caminho === '/posts' && m === 'GET') {
    const status = url.searchParams.get('status') || '';
    const editoria = url.searchParams.get('editoria') || '';
    const limite = Math.min(parseInt(url.searchParams.get('limite') || '200', 10), 500);
    // content/overrides só viajam quando ainda NÃO existe
    // miniatura: nesse caso o app desenha a própria e devolve
    // pro R2. Quem já tem thumb recebe '{}' e a lista fica leve.
    let sql = `SELECT id, titulo, editoria, formato, template, status, thumb, origem,
                      criado_em, atualizado_em,
                      CASE WHEN thumb IS NULL THEN content   ELSE '{}' END AS content,
                      CASE WHEN thumb IS NULL THEN overrides ELSE '{}' END AS overrides
               FROM posts WHERE 1=1`;
    const bind = [];
    if (status) { sql += ' AND status = ?'; bind.push(status); }
    if (editoria) { sql += ' AND editoria = ?'; bind.push(editoria); }
    sql += ' ORDER BY atualizado_em DESC LIMIT ?';
    bind.push(limite);
    const r = await db.prepare(sql).bind(...bind).all();
    return json({ posts: r.results.map(hidratar) });
  }

  if (caminho === '/posts' && m === 'POST') {
    const b = await req.json().catch(() => ({}));
    const post = await inserirPost(db, b, user.id, 'app');
    return json({ post }, { status: 201 });
  }

  let mm;
  if ((mm = /^\/posts\/([\w-]+)$/.exec(caminho))) {
    const id = mm[1];
    if (m === 'GET') {
      const p = await db.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
      if (!p) return erro(404, 'Post não encontrado.');
      return json({ post: hidratar(p) });
    }
    if (m === 'PUT') {
      const b = await req.json().catch(() => ({}));
      const atual = await db.prepare('SELECT id FROM posts WHERE id = ?').bind(id).first();
      if (!atual) return erro(404, 'Post não encontrado.');

      const campos = [];
      const bind = [];
      const texto = { titulo: 1, editoria: 1, formato: 1, template: 1, status: 1, legenda: 1, hashtags: 1, thumb: 1 };
      const objeto = { content: 1, overrides: 1, video: 1 };
      for (const [k, v] of Object.entries(b)) {
        if (texto[k]) { campos.push(`${k} = ?`); bind.push(v == null ? '' : String(v)); }
        else if (objeto[k]) { campos.push(`${k} = ?`); bind.push(v == null ? null : JSON.stringify(v)); }
      }
      if (!campos.length) return json({ ok: true });
      campos.push("atualizado_em = datetime('now')");
      bind.push(id);
      await db.prepare(`UPDATE posts SET ${campos.join(', ')} WHERE id = ?`).bind(...bind).run();
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      const p = await db.prepare('SELECT thumb FROM posts WHERE id = ?').bind(id).first();
      await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
      if (p?.thumb) ctx.waitUntil(env.MEDIA.delete(`thumbs/${id}.jpg`).catch(() => {}));
      return json({ ok: true });
    }
  }

  /* ---------- miniatura do post ---------- */
  if ((mm = /^\/posts\/([\w-]+)\/thumb$/.exec(caminho)) && m === 'POST') {
    const id = mm[1];
    const fd = await req.formData();
    const f = fd.get('file');
    if (!f || typeof f === 'string') return erro(400, 'Arquivo ausente.');
    if (f.size > 2 * 1024 * 1024) return erro(413, 'Miniatura grande demais.');
    const chave = `thumbs/${id}.jpg`;
    await env.MEDIA.put(chave, f.stream(), {
      httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=60' },
    });
    const urlThumb = `${base(env, url)}/files/${chave}?v=${Date.now().toString(36)}`;
    await db.prepare("UPDATE posts SET thumb = ? WHERE id = ?").bind(urlThumb, id).run();
    return json({ thumb: urlThumb });
  }

  /* ---------- mídia ---------- */
  if (caminho === '/media' && m === 'GET') {
    const tipo = url.searchParams.get('tipo') || '';
    let sql = 'SELECT * FROM media WHERE 1=1';
    const bind = [];
    if (tipo) { sql += ' AND tipo = ?'; bind.push(tipo); }
    sql += ' ORDER BY criado_em DESC LIMIT 300';
    const r = await db.prepare(sql).bind(...bind).all();
    return json({ media: r.results.map((x) => ({ ...x, url: `${base(env, url)}/files/${x.chave}` })) });
  }

  if (caminho === '/media' && m === 'POST') {
    const fd = await req.formData();
    const f = fd.get('file');
    if (!f || typeof f === 'string') return erro(400, 'Arquivo ausente.');

    const mime = f.type || 'application/octet-stream';
    const ehImagem = MIMES_IMAGEM.includes(mime);
    const ehVideo = MIMES_VIDEO.includes(mime) || mime.startsWith('video/');
    if (!ehImagem && !ehVideo) return erro(415, 'Formato não aceito. Use JPG, PNG, WebP, MP4 ou MOV.');
    const limite = ehVideo ? LIMITE_VIDEO : LIMITE_IMAGEM;
    if (f.size > limite) return erro(413, `Arquivo maior que ${Math.round(limite / 1048576)} MB.`);

    const id = uid('med_');
    const ext = extDe(f.name, mime);
    const chave = `${ehVideo ? 'video' : 'img'}/${new Date().toISOString().slice(0, 7)}/${id}.${ext}`;

    await env.MEDIA.put(chave, f.stream(), {
      httpMetadata: {
        contentType: mime,
        // Imutável: a chave contém um id único, então nunca
        // muda de conteúdo. Isso zera requisição repetida.
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    await db.prepare(`
      INSERT INTO media (id, chave, nome, mime, tipo, tamanho, criado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, chave, (f.name || '').slice(0, 200), mime, ehVideo ? 'video' : 'image', f.size, user.id).run();

    return json({
      media: { id, chave, nome: f.name, mime, tipo: ehVideo ? 'video' : 'image', tamanho: f.size, url: `${base(env, url)}/files/${chave}` },
    }, { status: 201 });
  }

  if ((mm = /^\/media\/([\w-]+)$/.exec(caminho)) && m === 'DELETE') {
    const row = await db.prepare('SELECT chave FROM media WHERE id = ?').bind(mm[1]).first();
    if (!row) return erro(404, 'Não encontrado.');
    await db.prepare('DELETE FROM media WHERE id = ?').bind(mm[1]).run();
    ctx.waitUntil(env.MEDIA.delete(row.chave).catch(() => {}));
    return json({ ok: true });
  }

  /* ---------- briefings ---------- */
  if (caminho === '/briefings' && m === 'GET') {
    const status = url.searchParams.get('status');
    const sql = status
      ? 'SELECT * FROM briefings WHERE status = ? ORDER BY criado_em DESC LIMIT 200'
      : "SELECT * FROM briefings WHERE status != 'arquivado' ORDER BY criado_em DESC LIMIT 200";
    const r = status ? await db.prepare(sql).bind(status).all() : await db.prepare(sql).all();
    return json({ briefings: r.results });
  }
  if ((mm = /^\/briefings\/([\w-]+)$/.exec(caminho))) {
    if (m === 'GET') {
      const b = await db.prepare('SELECT * FROM briefings WHERE id = ?').bind(mm[1]).first();
      return b ? json({ briefing: b }) : erro(404, 'Não encontrado.');
    }
    if (m === 'PUT') {
      const b = await req.json().catch(() => ({}));
      if (b.status) await db.prepare('UPDATE briefings SET status = ? WHERE id = ?').bind(b.status, mm[1]).run();
      return json({ ok: true });
    }
  }

  /* ---------- tokens ---------- */
  if (caminho === '/tokens' && m === 'GET') {
    const r = await db.prepare('SELECT id, nome, prefixo, criado_em, usado_em FROM api_tokens ORDER BY criado_em DESC').all();
    return json({ tokens: r.results });
  }
  if (caminho === '/tokens' && m === 'POST') {
    const { nome } = await req.json().catch(() => ({}));
    if (!nome) return erro(400, 'Dê um nome ao token.');
    const t = await criarToken(db, String(nome).slice(0, 80), user.id);
    return json({ token: t.valor, id: t.id, base: base(env, url) }, { status: 201 });
  }
  if ((mm = /^\/tokens\/([\w-]+)$/.exec(caminho)) && m === 'DELETE') {
    await db.prepare('DELETE FROM api_tokens WHERE id = ?').bind(mm[1]).run();
    return json({ ok: true });
  }

  /* ---------- pessoas (só admin) ---------- */
  if (caminho === '/users') {
    if (user.role !== 'admin') return erro(403, 'Só administrador.');
    if (m === 'GET') {
      const r = await db.prepare('SELECT id, email, nome, role, ativo, criado_em, visto_em FROM users ORDER BY criado_em').all();
      return json({ users: r.results });
    }
    if (m === 'POST') {
      const b = await req.json().catch(() => ({}));
      const email = String(b.email || '').toLowerCase().trim();
      if (!email.includes('@')) return erro(400, 'E-mail inválido.');
      if (String(b.senha || '').length < 8) return erro(400, 'A senha precisa de pelo menos 8 caracteres.');
      const existe = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existe) return erro(409, 'Já existe alguém com esse e-mail.');
      const id = uid('usr_');
      await db.prepare(
        'INSERT INTO users (id, email, nome, senha_hash, role) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, email, String(b.nome || '').slice(0, 120), await hashSenha(b.senha), b.role === 'admin' ? 'admin' : 'editor').run();
      return json({ user: { id, email, nome: b.nome, role: b.role } }, { status: 201 });
    }
  }
  if ((mm = /^\/users\/([\w-]+)$/.exec(caminho)) && m === 'PUT') {
    const alvo = mm[1];
    const b = await req.json().catch(() => ({}));
    // Cada um troca a própria senha; o resto é coisa de admin.
    const proprio = alvo === user.id;
    if (!proprio && user.role !== 'admin') return erro(403, 'Só administrador.');

    if (b.senha !== undefined) {
      if (String(b.senha).length < 8) return erro(400, 'A senha precisa de pelo menos 8 caracteres.');
      await db.prepare('UPDATE users SET senha_hash = ? WHERE id = ?').bind(await hashSenha(b.senha), alvo).run();
      // Trocar senha derruba as outras sessões — o esperado.
      if (proprio) await db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').bind(alvo, user.tokenHash).run();
    }
    if (b.nome !== undefined) await db.prepare('UPDATE users SET nome = ? WHERE id = ?').bind(String(b.nome).slice(0, 120), alvo).run();
    if (user.role === 'admin' && b.ativo !== undefined) {
      if (alvo === user.id) return erro(400, 'Você não pode desativar a si mesmo.');
      await db.prepare('UPDATE users SET ativo = ? WHERE id = ?').bind(b.ativo ? 1 : 0, alvo).run();
      if (!b.ativo) await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(alvo).run();
    }
    if (user.role === 'admin' && b.role !== undefined && alvo !== user.id) {
      await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(b.role === 'admin' ? 'admin' : 'editor', alvo).run();
    }
    return json({ ok: true });
  }

  return erro(404, 'Rota não encontrada.');
}

/* =========================================================
   Ingestão do Claude
   Um POST cria o briefing e, se vier `post`, já monta a peça
   na fila. É o que faz "pede aqui, aparece lá" funcionar.
   ========================================================= */
async function intake(req, env, tok) {
  const db = env.DB;
  const b = await req.json().catch(() => null);
  if (!b) return erro(400, 'JSON inválido.');

  const briefingId = uid('brf_');
  let postId = null;
  let post = null;

  if (b.post) {
    post = await inserirPost(db, b.post, tok.userId, 'claude');
    postId = post.id;
  }

  await db.prepare(`
    INSERT INTO briefings (id, titulo, corpo, editoria, payload, origem, post_id)
    VALUES (?, ?, ?, ?, ?, 'claude', ?)
  `).bind(
    briefingId,
    String(b.titulo || b.post?.titulo || 'Briefing').slice(0, 200),
    String(b.briefing || b.corpo || '').slice(0, 20000),
    b.editoria || b.post?.editoria || null,
    JSON.stringify(b).slice(0, 60000),
    postId,
  ).run();

  return json({
    ok: true,
    briefing_id: briefingId,
    post_id: postId,
    post,
    aviso: post ? null : 'Briefing salvo sem post. Envie o objeto "post" para já montar a peça.',
  }, { status: 201 });
}

/** Contrato publicado no próprio endpoint — quem for
    integrar não precisa adivinhar nem abrir o código. */
function contratoIntake() {
  return {
    metodo: 'POST',
    autenticacao: 'Authorization: Bearer <token>',
    corpo: {
      titulo: 'string — título do briefing',
      briefing: 'string — o briefing em texto',
      post: {
        titulo: 'string',
        editoria: "'institucional' | 'livre' | 'video'",
        formato: "'feed-45' | 'feed-11' | 'feed-916' | 'story-916' | 'reels-916' | 'carrossel-45' | 'carrossel-11'",
        template: "'inst-declaracao' | 'inst-capa-projeto' | 'inst-citacao' | 'inst-bastidores' | 'inst-lista' | 'inst-anuncio' | 'inst-carrossel' | 'video-moldura' | 'video-manchete' | 'video-legenda' | 'livre-poster' | 'livre-split' | 'livre-duotone'",
        content: 'objeto — os slots do template (titulo, chapeu, imagem, blocos…)',
        legenda: 'string — a legenda do Instagram',
        hashtags: 'string',
        status: "'rascunho' | 'revisao' | 'aprovado' | 'publicado'",
      },
    },
    observacao: 'O campo content.imagem aceita a URL devolvida por POST /media. Sem imagem, o post entra com o placeholder e a pessoa escolhe no editor.',
  };
}

/* =========================================================
   Auxiliares
   ========================================================= */

async function inserirPost(db, b, userId, origem) {
  const id = uid('pst_');
  const post = {
    id,
    titulo: String(b.titulo || 'Sem título').slice(0, 200),
    editoria: String(b.editoria || 'institucional'),
    formato: String(b.formato || 'feed-45'),
    template: String(b.template || 'inst-declaracao'),
    status: ['rascunho', 'revisao', 'aprovado', 'publicado'].includes(b.status) ? b.status : 'rascunho',
    content: b.content && typeof b.content === 'object' ? b.content : {},
    overrides: b.overrides && typeof b.overrides === 'object' ? b.overrides : {},
    legenda: String(b.legenda || ''),
    hashtags: String(b.hashtags || ''),
    video: b.video || null,
    origem,
  };
  await db.prepare(`
    INSERT INTO posts (id, titulo, editoria, formato, template, status, content, overrides, legenda, hashtags, video, origem, criado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    post.id, post.titulo, post.editoria, post.formato, post.template, post.status,
    JSON.stringify(post.content), JSON.stringify(post.overrides),
    post.legenda, post.hashtags, post.video ? JSON.stringify(post.video) : null,
    origem, userId,
  ).run();
  return post;
}

/** JSON guardado como texto volta como objeto para o cliente. */
function hidratar(p) {
  const parse = (s, fb) => { try { return s ? JSON.parse(s) : fb; } catch { return fb; } };
  return { ...p, content: parse(p.content, {}), overrides: parse(p.overrides, {}), video: parse(p.video, null) };
}

function base(env, url) {
  return env.PUBLIC_BASE || `${url.origin}/api`;
}

function extDe(nome, mime) {
  const doNome = /\.([a-z0-9]{2,5})$/i.exec(nome || '');
  if (doNome) return doNome[1].toLowerCase();
  return ({
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  })[mime] || 'bin';
}

/**
 * Entrega do R2 com Range e ETag.
 * Range não é luxo aqui: sem ele o <video> em iOS não
 * consegue buscar e o clipe simplesmente não toca.
 */
async function servirArquivo(env, chave, req) {
  if (!chave || chave.includes('..')) return new Response('Não encontrado', { status: 404 });

  const range = req.headers.get('Range');
  const obj = await env.MEDIA.get(chave, range ? { range: req.headers } : undefined);
  if (!obj) return new Response('Não encontrado', { status: 404 });

  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('etag', obj.httpEtag);
  h.set('Accept-Ranges', 'bytes');
  // Sem CORS aqui o canvas fica "tainted" e o export de PNG
  // falha. É a linha que faz o botão Exportar funcionar.
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Cross-Origin-Resource-Policy', 'cross-origin');
  if (!h.has('Cache-Control')) h.set('Cache-Control', 'public, max-age=31536000, immutable');

  if (obj.range && obj.size != null) {
    const inicio = obj.range.offset ?? 0;
    const tam = obj.range.length ?? obj.size - inicio;
    h.set('Content-Range', `bytes ${inicio}-${inicio + tam - 1}/${obj.size}`);
    return new Response(obj.body, { status: 206, headers: h });
  }
  return new Response(obj.body, { headers: h });
}
