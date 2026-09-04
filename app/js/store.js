/* =========================================================
   Mestiza Lab — estado do documento

   Decisão central deste arquivo
   -----------------------------
   O que é salvo NÃO é a lista de layers. É:

     content   → o que você escreveu e escolheu (slots)
     overrides → o que você moveu/recoloriu na mão, por id

   O documento é reconstruído com
       buildDoc(template, formato, content)  +  overrides

   Por que isso importa na prática: você troca o template ou
   o formato e o texto continua lá, reancorado na grade nova.
   Um editor que salva layers crus não consegue fazer isso —
   trocar de template apagaria tudo.
   ========================================================= */

import { buildDoc, getTemplate, defaultContent } from './templates.js';
import { getFormat } from './formats.js';

const HISTORY_MAX = 60;

export class PostStore extends EventTarget {
  constructor(post) {
    super();
    this.id = post?.id ?? null;
    this.titulo = post?.titulo ?? 'Post sem título';
    this.editoria = post?.editoria ?? 'institucional';
    this.formato = post?.formato ?? 'feed-45';
    this.template = post?.template ?? 'inst-declaracao';
    this.status = post?.status ?? 'rascunho';
    this.legenda = post?.legenda ?? '';
    this.hashtags = post?.hashtags ?? '';
    this.video = post?.video ?? null;   // { src, poster, duracao }

    const tpl = getTemplate(this.template);
    this.content = { ...defaultContent(tpl), ...(post?.content || {}) };
    this.overrides = post?.overrides ? structuredClone(post.overrides) : {};

    this.selection = null;      // id do layer selecionado
    this.slideIndex = 0;
    this.dirty = false;

    this._past = [];
    this._future = [];
    this._doc = null;
    this.rebuild();
  }

  /* ---------- documento derivado ---------- */

  rebuild() {
    const doc = buildDoc(this.template, this.formato, this.content);
    // Overrides são por slide+id: um carrossel tem o mesmo id
    // de layer repetido em vários slides, e cada um é seu.
    doc.slides.forEach((slide, si) => {
      slide.layers = slide.layers.map((l) => {
        const o = this.overrides[`${si}:${l.id}`];
        return o ? deepMerge(l, o) : l;
      });
    });
    this._doc = doc;
    this.slideIndex = Math.min(this.slideIndex, doc.slides.length - 1);
    this.dispatchEvent(new CustomEvent('change', { detail: { doc } }));
    return doc;
  }

  get doc() { return this._doc; }
  get format() { return getFormat(this.formato); }
  get tpl() { return getTemplate(this.template); }
  get slide() { return this._doc.slides[this.slideIndex]; }
  get slideCount() { return this._doc.slides.length; }

  layer(id, slideIndex = this.slideIndex) {
    return (this._doc.slides[slideIndex]?.layers || []).find((l) => l.id === id) || null;
  }
  get selected() { return this.selection ? this.layer(this.selection) : null; }

  /* ---------- mutações ---------- */

  /** Toda alteração passa por aqui: é o que dá undo de graça. */
  commit(fn, { silent = false } = {}) {
    this._past.push(this._snapshot());
    if (this._past.length > HISTORY_MAX) this._past.shift();
    this._future.length = 0;
    fn();
    this.dirty = true;
    this.rebuild();
    if (!silent) this.dispatchEvent(new CustomEvent('commit'));
  }

  setContent(key, value) {
    this.commit(() => { this.content[key] = value; });
  }

  /** Altera propriedades de um layer — vira override. */
  setLayer(id, props, slideIndex = this.slideIndex) {
    this.commit(() => {
      const k = `${slideIndex}:${id}`;
      this.overrides[k] = deepMerge(this.overrides[k] || {}, props);
    });
  }

  /** Sem histórico: usado durante arraste, que emite dezenas
      de eventos por segundo. O commit vem no touchend. */
  setLayerLive(id, props, slideIndex = this.slideIndex) {
    const k = `${slideIndex}:${id}`;
    this.overrides[k] = deepMerge(this.overrides[k] || {}, props);
    this.rebuild();
  }
  beginLive() { this._past.push(this._snapshot()); this._future.length = 0; }
  endLive() { this.dirty = true; this.dispatchEvent(new CustomEvent('commit')); }

  resetLayer(id, slideIndex = this.slideIndex) {
    this.commit(() => { delete this.overrides[`${slideIndex}:${id}`]; });
  }

  resetAll() {
    this.commit(() => { this.overrides = {}; });
  }

  setTemplate(id) {
    this.commit(() => {
      const next = getTemplate(id);
      // Slots que existem nos dois templates atravessam a troca.
      const carried = {};
      for (const s of next.slots || []) {
        if (this.content[s.key] !== undefined && this.content[s.key] !== '') carried[s.key] = this.content[s.key];
      }
      this.template = id;
      this.content = { ...defaultContent(next), ...carried };
      // Overrides são posicionais e não sobrevivem à troca de
      // grade — mantê-los produziria layout quebrado em silêncio.
      this.overrides = {};
      this.slideIndex = 0;
      if (!next.formats.includes(this.formato)) this.formato = next.formats[0];
    });
  }

  setFormato(id) {
    this.commit(() => {
      this.formato = id;
      // Coordenadas são normalizadas, então a composição
      // atravessa. Mas o que foi movido na mão foi movido
      // para AQUELA proporção: limpamos só o que é geométrico.
      for (const k of Object.keys(this.overrides)) {
        const o = this.overrides[k];
        delete o.box;
        if (!Object.keys(o).length) delete this.overrides[k];
      }
    });
  }

  select(id) {
    if (this.selection === id) return;
    this.selection = id;
    this.dispatchEvent(new CustomEvent('select', { detail: { id } }));
  }

  goSlide(i) {
    const n = Math.max(0, Math.min(this.slideCount - 1, i));
    if (n === this.slideIndex) return;
    this.slideIndex = n;
    this.selection = null;
    this.dispatchEvent(new CustomEvent('slide', { detail: { index: n } }));
    this.dispatchEvent(new CustomEvent('change', { detail: { doc: this._doc } }));
  }

  /* ---------- carrossel ---------- */

  addBloco() {
    if (!Array.isArray(this.content.blocos)) return;
    this.commit(() => {
      this.content.blocos = [...this.content.blocos, { titulo: 'Novo slide', texto: '' }];
    });
    this.goSlide(this.content.blocos.length);
  }
  removeBloco(i) {
    if (!Array.isArray(this.content.blocos)) return;
    this.commit(() => {
      this.content.blocos = this.content.blocos.filter((_, k) => k !== i);
    });
  }
  moveBloco(from, to) {
    if (!Array.isArray(this.content.blocos)) return;
    this.commit(() => {
      const b = [...this.content.blocos];
      const [x] = b.splice(from, 1);
      b.splice(to, 0, x);
      this.content.blocos = b;
    });
  }

  /* ---------- histórico ---------- */

  _snapshot() {
    return JSON.stringify({
      content: this.content, overrides: this.overrides,
      template: this.template, formato: this.formato,
    });
  }
  _restore(s) {
    const d = JSON.parse(s);
    this.content = d.content; this.overrides = d.overrides;
    this.template = d.template; this.formato = d.formato;
  }
  get canUndo() { return this._past.length > 0; }
  get canRedo() { return this._future.length > 0; }
  undo() {
    if (!this._past.length) return;
    this._future.push(this._snapshot());
    this._restore(this._past.pop());
    this.dirty = true;
    this.selection = null;
    this.rebuild();
    this.dispatchEvent(new CustomEvent('commit'));
  }
  redo() {
    if (!this._future.length) return;
    this._past.push(this._snapshot());
    this._restore(this._future.pop());
    this.dirty = true;
    this.selection = null;
    this.rebuild();
    this.dispatchEvent(new CustomEvent('commit'));
  }

  /* ---------- serialização ---------- */

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      editoria: this.editoria,
      formato: this.formato,
      template: this.template,
      status: this.status,
      legenda: this.legenda,
      hashtags: this.hashtags,
      video: this.video,
      content: this.content,
      overrides: this.overrides,
    };
  }
}

/** Merge profundo só de objetos simples — não toca arrays. */
function deepMerge(base, patch) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v && typeof v === 'object' ? structuredClone(v) : v;
    }
  }
  return out;
}

/* =========================================================
   Sessão
   ========================================================= */
export const session = {
  user: null,
  editorias: null,
  /* O que ESTE servidor consegue fazer. Vem do /me e muda
     conforme o R2 estiver ativado ou não. O app nunca deve
     supor: sempre perguntar aqui. */
  recursos: {
    armazenamento: 'd1',
    video: false,
    limiteImagem: 800 * 1024,
    limiteVideo: 0,
  },
  set(user, recursos) {
    this.user = user;
    if (recursos) Object.assign(this.recursos, recursos);
  },
  get isAdmin() { return this.user?.role === 'admin'; },
  get temR2() { return this.recursos.armazenamento === 'r2'; },
};

/* =========================================================
   Rascunho local
   O celular perde aba, perde rede, perde bateria. O que foi
   digitado não pode depender de o servidor estar de pé.
   ========================================================= */
const LK = 'mz.draft.';
export const draft = {
  save(store) {
    try { localStorage.setItem(LK + (store.id || 'novo'), JSON.stringify({ ...store.toJSON(), _at: Date.now() })); } catch {}
  },
  load(id) {
    try {
      const raw = localStorage.getItem(LK + (id || 'novo'));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  drop(id) { try { localStorage.removeItem(LK + (id || 'novo')); } catch {} },
  /** Rascunhos com mais de 7 dias não servem para nada. */
  sweep() {
    try {
      for (const k of Object.keys(localStorage)) {
        if (!k.startsWith(LK)) continue;
        const d = JSON.parse(localStorage.getItem(k) || '{}');
        if (Date.now() - (d._at || 0) > 7 * 864e5) localStorage.removeItem(k);
      }
    } catch {}
  },
};
