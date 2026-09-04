/* =========================================================
   Mestiza Lab — armazenamento de arquivos

   Duas implementações atrás da mesma interface:

   · R2   — o certo. 10 GB grátis, saída ilimitada, sem limite
            prático de tamanho por arquivo. Mas a Cloudflare
            costuma pedir cartão para ativar.

   · D1   — o quebra-galho. Guarda o binário numa tabela do
            próprio banco. Funciona sem cartão nenhum e resolve
            para começar hoje; tem teto de tamanho por arquivo
            e não serve para vídeo.

   Qual entra em uso é decidido pelo binding: se `env.MEDIA`
   existe, é R2; senão, D1. O app não sabe a diferença, e o dia
   que o R2 for ativado nada precisa ser reescrito — só os
   arquivos antigos continuam no D1, servidos normalmente.
   ========================================================= */

/** Teto por arquivo no modo D1. Acima disso o SQLite começa a
    doer e a resposta do Worker fica pesada demais. */
export const LIMITE_D1 = 800 * 1024;

export function backendDe(env) {
  return env.MEDIA ? 'r2' : 'd1';
}

export function suportaVideo(env) {
  // Vídeo num blob de banco é pedir para o app cair: um clipe
  // de 30s passa de 10 MB e o D1 não é lugar para isso.
  return backendDe(env) === 'r2';
}

export function limiteBytes(env, tipo) {
  if (backendDe(env) === 'd1') {
    // Zero, e não o teto de imagem: video simplesmente nao
    // existe neste modo, e devolver um numero faria o app
    // mostrar um limite que nunca sera aceito.
    return tipo === 'video' ? 0 : LIMITE_D1;
  }
  return tipo === 'video' ? 200 * 1024 * 1024 : 12 * 1024 * 1024;
}

/* ---------------------------------------------------------
   Escrita
   --------------------------------------------------------- */
export async function guardar(env, chave, arquivo, { mime, cacheControl } = {}) {
  if (env.MEDIA) {
    await env.MEDIA.put(chave, arquivo.stream ? arquivo.stream() : arquivo, {
      httpMetadata: {
        contentType: mime,
        cacheControl: cacheControl || 'public, max-age=31536000, immutable',
      },
    });
    return { backend: 'r2' };
  }

  const buf = new Uint8Array(await arquivo.arrayBuffer());
  if (buf.length > LIMITE_D1) {
    const err = new Error(
      `Sem o R2 ativado, cada arquivo pode ter no máximo ${Math.round(LIMITE_D1 / 1024)} KB. ` +
      'O app reduz as fotos antes de enviar — se caiu aqui, é uma imagem muito grande ou um vídeo.'
    );
    err.status = 413;
    throw err;
  }
  await env.DB.prepare(
    'INSERT OR REPLACE INTO blobs (chave, mime, tamanho, dados) VALUES (?, ?, ?, ?)'
  ).bind(chave, mime || 'application/octet-stream', buf.length, buf).run();
  return { backend: 'd1' };
}

/* ---------------------------------------------------------
   Remoção
   --------------------------------------------------------- */
export async function remover(env, chave) {
  if (env.MEDIA) {
    await env.MEDIA.delete(chave).catch(() => {});
  }
  // Sempre tenta o D1 também: depois de ativar o R2, os
  // arquivos antigos continuam morando lá.
  await env.DB.prepare('DELETE FROM blobs WHERE chave = ?').bind(chave).run().catch(() => {});
}

/* ---------------------------------------------------------
   Leitura
   Range é obrigatório: sem ele o <video> no iOS não consegue
   buscar dentro do arquivo e o clipe simplesmente não toca.
   --------------------------------------------------------- */
export async function servir(env, chave, req) {
  if (!chave || chave.includes('..')) return new Response('Não encontrado', { status: 404 });

  // R2 primeiro. Um arquivo pode existir só no D1 (subido
  // antes do R2 ser ativado), então o D1 é o fallback.
  if (env.MEDIA) {
    const range = req.headers.get('Range');
    const obj = await env.MEDIA.get(chave, range ? { range: req.headers } : undefined);
    if (obj) {
      const h = new Headers();
      obj.writeHttpMetadata(h);
      h.set('etag', obj.httpEtag);
      aplicarPadrao(h);
      if (obj.range && obj.size != null) {
        const inicio = obj.range.offset ?? 0;
        const tam = obj.range.length ?? obj.size - inicio;
        h.set('Content-Range', `bytes ${inicio}-${inicio + tam - 1}/${obj.size}`);
        return new Response(obj.body, { status: 206, headers: h });
      }
      return new Response(obj.body, { headers: h });
    }
  }

  const row = await env.DB.prepare('SELECT mime, tamanho, dados FROM blobs WHERE chave = ?')
    .bind(chave).first();
  if (!row) return new Response('Não encontrado', { status: 404 });

  const dados = new Uint8Array(row.dados);
  const h = new Headers();
  h.set('Content-Type', row.mime || 'application/octet-stream');
  aplicarPadrao(h);

  const range = req.headers.get('Range');
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (m) {
    const inicio = m[1] ? parseInt(m[1], 10) : 0;
    const fim = m[2] ? Math.min(parseInt(m[2], 10), dados.length - 1) : dados.length - 1;
    if (inicio >= dados.length || inicio > fim) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${dados.length}` } });
    }
    const fatia = dados.slice(inicio, fim + 1);
    h.set('Content-Range', `bytes ${inicio}-${fim}/${dados.length}`);
    h.set('Content-Length', String(fatia.length));
    return new Response(fatia, { status: 206, headers: h });
  }

  h.set('Content-Length', String(dados.length));
  return new Response(dados, { headers: h });
}

function aplicarPadrao(h) {
  h.set('Accept-Ranges', 'bytes');
  // Sem CORS aqui o canvas fica "tainted" e o export de PNG
  // falha. É a linha que faz o botão Exportar funcionar.
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Cross-Origin-Resource-Policy', 'cross-origin');
  if (!h.has('Cache-Control')) h.set('Cache-Control', 'public, max-age=31536000, immutable');
}

/* ---------------------------------------------------------
   Diagnóstico — usado pela tela de Ajustes
   --------------------------------------------------------- */
export async function uso(env) {
  const backend = backendDe(env);
  if (backend === 'r2') return { backend, bytes: null };
  const r = await env.DB.prepare('SELECT COALESCE(SUM(tamanho),0) AS b, COUNT(*) AS n FROM blobs').first();
  return { backend, bytes: r?.b || 0, arquivos: r?.n || 0 };
}
