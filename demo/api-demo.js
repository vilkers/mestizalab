/* =========================================================
   Mestiza Lab — API simulada (modo demonstração)

   Substitui `app/js/api.js` no build de demonstração. Mesma
   interface, mesmas promessas, mesmos formatos de resposta —
   só que tudo acontece no próprio navegador, em localStorage.

   Serve para uma coisa: alguém abrir o link no celular e USAR
   o app antes de existir servidor. Editor, templates, grade,
   carrossel, export de PNG e a máscara de vídeo funcionam
   igual, porque nada disso depende de rede.

   O que muda de propósito: nada é compartilhado entre pessoas
   e nada sobrevive a limpar o navegador. É demonstração.
   ========================================================= */

import { DEMO_MEDIA, DEMO_POSTS, DEMO_BRIEFINGS } from './seed.js';

const CHAVE = 'mz.demo.v1';
const espera = (ms = 140) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.error) || `Erro ${status}`);
    this.status = status;
    this.body = body || {};
  }
}

/* ---------------------------------------------------------
   Estado
   --------------------------------------------------------- */
function novoEstado() {
  return {
    user: { id: 'usr_demo', email: 'vilkervs@gmail.com', nome: 'Vilker Silva', role: 'admin' },
    logado: false,
    posts: JSON.parse(JSON.stringify(DEMO_POSTS)),
    media: JSON.parse(JSON.stringify(DEMO_MEDIA)),
    briefings: JSON.parse(JSON.stringify(DEMO_BRIEFINGS)),
    tokens: [],
    users: [
      { id: 'usr_demo', email: 'vilkervs@gmail.com', nome: 'Vilker Silva', role: 'admin', ativo: 1, criado_em: agora() },
    ],
  };
}

let estado = carregar();

function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.posts) return d;
    }
  } catch {}
  return novoEstado();
}

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch {}
}

export function reiniciarDemo() {
  estado = novoEstado();
  estado.logado = true;
  salvar();
}

function agora() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
function id(p) { return p + Math.random().toString(16).slice(2, 12); }

function exigirLogin() {
  if (!estado.logado) throw new ApiError(401, { error: 'Não autenticado.' });
}

/* ---------------------------------------------------------
   A interface, igual à de produção
   --------------------------------------------------------- */
export const api = {
  /* --- primeiro acesso: já configurado na demo --- */
  async precisaSetup() { await espera(60); return { necessario: false }; },
  async setup() { throw new ApiError(409, { error: 'A plataforma já foi configurada.' }); },

  /* --- sessão --- */
  async login(email, senha) {
    await espera(420);
    if (!senha) throw new ApiError(401, { error: 'Digite qualquer senha — isto é uma demonstração.' });
    estado.logado = true;
    if (email) estado.user.email = email;
    salvar();
    return { user: estado.user };
  },
  async logout() { estado.logado = false; salvar(); return { ok: true }; },
  async me() {
    await espera(80);
    exigirLogin();
    return {
      user: estado.user,
      editorias: [
        { id: 'institucional', nome: 'Institucional', kicker: 'Voz oficial do estúdio', descricao: '' },
        { id: 'livre', nome: 'Livre', kicker: 'Fora do layout institucional', descricao: '' },
        { id: 'video', nome: 'Vídeo', kicker: 'Máscaras sobre Reels e Stories', descricao: '' },
      ],
      // Sem servidor não há upload de vídeo — o mesmo caminho
      // do modo sem R2, que é o que ele vai usar de verdade.
      recursos: { armazenamento: 'demo', video: false, limiteImagem: 4 * 1024 * 1024, limiteVideo: 0 },
    };
  },

  /* --- posts --- */
  async listPosts(q = {}) {
    await espera(220);
    exigirLogin();
    let posts = [...estado.posts];
    if (q.status) posts = posts.filter((p) => p.status === q.status);
    if (q.editoria) posts = posts.filter((p) => p.editoria === q.editoria);
    posts.sort((a, b) => (b.atualizado_em || '').localeCompare(a.atualizado_em || ''));
    return { posts: posts.map((p) => ({ ...p })) };
  },
  async getPost(pid) {
    await espera(180);
    exigirLogin();
    const p = estado.posts.find((x) => x.id === pid);
    if (!p) throw new ApiError(404, { error: 'Post não encontrado.' });
    return { post: JSON.parse(JSON.stringify(p)) };
  },
  async createPost(dados) {
    await espera(260);
    exigirLogin();
    const p = {
      id: id('pst_'),
      titulo: dados.titulo || 'Sem título',
      editoria: dados.editoria || 'institucional',
      formato: dados.formato || 'feed-45',
      template: dados.template || 'inst-declaracao',
      status: dados.status || 'rascunho',
      content: dados.content || {},
      overrides: {},
      legenda: '', hashtags: '', video: null, thumb: null,
      origem: 'app', criado_em: agora(), atualizado_em: agora(),
    };
    estado.posts.unshift(p);
    salvar();
    return { post: p };
  },
  async updatePost(pid, dados) {
    await espera(120);
    exigirLogin();
    const p = estado.posts.find((x) => x.id === pid);
    if (!p) throw new ApiError(404, { error: 'Post não encontrado.' });
    Object.assign(p, dados, { atualizado_em: agora() });
    salvar();
    return { ok: true };
  },
  async deletePost(pid) {
    await espera(160);
    exigirLogin();
    estado.posts = estado.posts.filter((x) => x.id !== pid);
    salvar();
    return { ok: true };
  },
  async uploadThumb(pid, blob) {
    // A miniatura vira data URI e fica no próprio post. Em
    // produção ela vai para o R2 ou para a tabela de blobs.
    const url = await paraDataURI(blob);
    const p = estado.posts.find((x) => x.id === pid);
    if (p) { p.thumb = url; salvar(); }
    return { thumb: url };
  },

  /* --- mídia --- */
  async listMedia(q = {}) {
    await espera(200);
    exigirLogin();
    let m = estado.media.filter((x) => !q.tipo || x.tipo === q.tipo);
    if (q.colecao !== undefined && q.colecao !== null) m = m.filter((x) => (x.colecao || '') === q.colecao);
    return { media: m.map((x) => ({ ...x })) };
  },
  async updateMedia(mid, dados) {
    exigirLogin();
    const m = estado.media.find((x) => x.id === mid);
    if (m) Object.assign(m, dados);
    salvar();
    return { ok: true };
  },
  async deleteMedia(mid) {
    await espera(140);
    exigirLogin();
    estado.media = estado.media.filter((x) => x.id !== mid);
    salvar();
    return { ok: true };
  },
  async listColecoes() {
    exigirLogin();
    const mapa = new Map();
    let soltas = 0;
    for (const m of estado.media) {
      if (!m.colecao) { soltas++; continue; }
      mapa.set(m.colecao, (mapa.get(m.colecao) || 0) + 1);
    }
    return {
      colecoes: [...mapa.entries()].map(([nome, itens]) => ({ nome, itens }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
      soltas,
    };
  },
  async armazenamento() {
    const bytes = estado.media.reduce((a, m) => a + (m.tamanho || 0), 0);
    return { backend: 'demo', bytes, arquivos: estado.media.length };
  },
  uploadMedia(file, { onProgress, colecao, largura, altura } = {}) {
    return new Promise((resolve, reject) => {
      exigirLogin();
      let p = 0;
      const t = setInterval(() => {
        p = Math.min(1, p + 0.18);
        onProgress && onProgress(p);
        if (p >= 1) clearInterval(t);
      }, 90);
      paraDataURI(file).then((url) => {
        setTimeout(() => {
          const m = {
            id: id('med_'), chave: 'demo/' + file.name, nome: file.name,
            mime: file.type, tipo: file.type.startsWith('video') ? 'video' : 'image',
            tamanho: file.size, largura: largura || null, altura: altura || null,
            colecao: colecao || '', criado_em: agora(), url,
          };
          estado.media.unshift(m);
          salvar();
          resolve({ media: m });
        }, 520);
      }).catch(() => reject(new ApiError(0, { error: 'Não consegui ler esse arquivo.' })));
    });
  },

  /* --- editorias --- */
  async listEditorias() { return (await this.me()).editorias; },

  /* --- briefings --- */
  async listBriefings() {
    await espera(200);
    exigirLogin();
    return { briefings: estado.briefings.filter((b) => b.status !== 'arquivado') };
  },
  async getBriefing(bid) {
    exigirLogin();
    return { briefing: estado.briefings.find((b) => b.id === bid) };
  },
  async updateBriefing(bid, dados) {
    exigirLogin();
    const b = estado.briefings.find((x) => x.id === bid);
    if (b) Object.assign(b, dados);
    salvar();
    return { ok: true };
  },

  /* --- pessoas e tokens --- */
  async listUsers() { exigirLogin(); return { users: estado.users }; },
  async createUser(dados) {
    exigirLogin();
    const u = { id: id('usr_'), ...dados, ativo: 1, criado_em: agora() };
    estado.users.push(u);
    salvar();
    return { user: u };
  },
  async updateUser(uid, dados) {
    exigirLogin();
    const u = estado.users.find((x) => x.id === uid);
    if (u) Object.assign(u, dados);
    salvar();
    return { ok: true };
  },
  async listTokens() { exigirLogin(); return { tokens: estado.tokens }; },
  async createToken(nome) {
    exigirLogin();
    const valor = 'mzl_demo' + Math.random().toString(36).slice(2, 22);
    const t = { id: id('tok_'), nome, prefixo: valor.slice(0, 12), criado_em: agora(), usado_em: null };
    estado.tokens.unshift(t);
    salvar();
    return { token: valor, id: t.id, base: 'https://seu-app.workers.dev/api' };
  },
  async revokeToken(tid) {
    exigirLogin();
    estado.tokens = estado.tokens.filter((t) => t.id !== tid);
    salvar();
    return { ok: true };
  },
};

function paraDataURI(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}

export function request() {
  throw new ApiError(501, { error: 'Indisponível na demonstração.' });
}
