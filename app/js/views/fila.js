/* =========================================================
   Mestiza Lab — fila
   A tela que abre. Precisa responder em um olhar:
   o que está pronto, o que falta e o que chegou do Claude.
   ========================================================= */

import { el, clear, icon, fmtDate, stagger, toast } from '../ui.js';
import { api } from '../api.js';
import { STATUS } from '../config.js';
import { session } from '../store.js';
import { EDITORIAS, buildDoc } from '../templates.js';
import { getFormat } from '../formats.js';
import { renderSlide, resolveAll } from '../renderer.js';
import { canvasToBlob } from '../export.js';

const FILTROS = [
  { id: '',          label: 'Tudo' },
  { id: 'rascunho',  label: 'Rascunho' },
  { id: 'revisao',   label: 'Revisão' },
  { id: 'aprovado',  label: 'Aprovado' },
  { id: 'publicado', label: 'Publicado' },
];

export async function renderFila(container, { go, setHeader }) {
  let filtro = sessionStorage.getItem('mz.filtro') || '';
  let editoria = sessionStorage.getItem('mz.editoria') || '';

  setHeader({
    right: el('button.iconbtn', { type: 'button', 'aria-label': 'Ajustes', onClick: () => go('/ajustes') }, icon('sair')),
  });

  const page = el('.page');
  const listWrap = el('div');
  const nome = (session.user?.nome || '').split(' ')[0];

  const chips = el('.chips',
    FILTROS.map((f) =>
      el(`button.chip${filtro === f.id ? '.is-on' : ''}`, {
        type: 'button', dataset: { f: f.id },
        onClick: (e) => {
          filtro = f.id;
          sessionStorage.setItem('mz.filtro', filtro);
          [...chips.children].forEach((c) => c.classList.toggle('is-on', c.dataset.f === filtro));
          load();
        },
      }, f.label),
    ),
  );

  const edChips = el('.chips', { style: { marginTop: 'var(--s-2)' } },
    [{ id: '', name: 'Todas editorias' }, ...EDITORIAS].map((ed) =>
      el(`button.chip${editoria === ed.id ? '.is-on' : ''}`, {
        type: 'button', dataset: { e: ed.id },
        onClick: () => {
          editoria = ed.id;
          sessionStorage.setItem('mz.editoria', editoria);
          [...edChips.children].forEach((c) => c.classList.toggle('is-on', c.dataset.e === editoria));
          load();
        },
      }, ed.name),
    ),
  );

  page.append(
    el('.page-head',
      el('span.page-kicker.micro', saudacao()),
      el('.reveal', el('h1.h1.page-title', nome ? nome : 'Fila')),
      el('p.page-sub', 'Tudo que o estúdio está produzindo. Toque para abrir no editor.'),
    ),
    chips,
    edChips,
    listWrap,
  );
  container.appendChild(page);

  async function load() {
    clear(listWrap);
    listWrap.appendChild(el('.row', { style: { padding: 'var(--s-10) 0', color: 'var(--dim)' } },
      el('.spin'), el('span.micro', 'Carregando')));

    let posts = [];
    try {
      const r = await api.listPosts({ status: filtro, editoria });
      posts = r.posts || [];
    } catch (e) {
      clear(listWrap);
      listWrap.appendChild(el('.empty',
        el('h2.h2', 'Não carregou'),
        el('p', e.message),
        el('button.btn.btn--solid', { type: 'button', onClick: load }, 'Tentar de novo'),
      ));
      return;
    }

    clear(listWrap);

    if (!posts.length) {
      listWrap.appendChild(el('.empty',
        el('h2.h2', filtro || editoria ? 'Nada com esse filtro' : 'Fila limpa'),
        el('p', filtro || editoria
          ? 'Tira o filtro pra ver o resto.'
          : 'Comece um post do zero ou peça um pro Claude a partir de um briefing — ele cai aqui pronto pra ajustar.'),
        el('button.btn.btn--solid', { type: 'button', onClick: () => go('/novo') }, 'Criar post'),
      ));
      return;
    }

    const porStatus = agrupar(posts);
    for (const [st, itens] of porStatus) {
      const info = STATUS[st] || { label: st, color: 'var(--dim)' };
      listWrap.appendChild(el('.sec',
        el('span.micro', info.label),
        el('.line'),
        el('span.nano', String(itens.length).padStart(2, '0')),
      ));
      const grid = el('.grid-posts',
        itens.map((p) => card(p, go)),
      );
      stagger(grid.querySelectorAll('.pcard'), 45);
      listWrap.appendChild(grid);
    }
  }

  await load();
}

function card(p, go) {
  const info = STATUS[p.status] || { label: p.status, color: 'var(--dim)' };
  const frame = el('.frame');
  if (p.thumb) {
    frame.appendChild(el('img', { src: p.thumb, alt: '', loading: 'lazy', decoding: 'async' }));
  } else if (p.content) {
    // Post que chegou pela API (do Claude, por exemplo) nunca
    // passou pelo editor e por isso não tem miniatura. Em vez
    // de mostrar um ícone cinza, o app desenha a peça aqui
    // mesmo — e devolve a miniatura pro servidor, pra que da
    // próxima vez venha pronta.
    frame.appendChild(el('.row', { style: { height: '100%', placeContent: 'center', color: 'var(--faint)' } }, icon('imagem', 22)));
    desenharThumb(frame, p);
  } else {
    frame.appendChild(el('.row', { style: { height: '100%', placeContent: 'center', color: 'var(--faint)' } }, icon('imagem', 22)));
  }
  if (p.origem === 'claude') {
    frame.appendChild(el('.badge.nano', { style: { color: 'var(--accent)' } }, 'Claude'));
  }
  return el('button.pcard.rise', {
    type: 'button',
    onClick: () => go('/editor/' + p.id),
  },
    frame,
    el('.cap',
      el('div.truncate', { style: { fontSize: '0.92rem', fontWeight: 500, letterSpacing: '-0.01em' } }, p.titulo || 'Sem título'),
      el('.row', { style: { gap: '6px', marginTop: '4px' } },
        el('i.dotst', { style: { background: info.color } }),
        el('span.nano', fmtDate(p.atualizado_em || p.criado_em)),
      ),
    ),
  );
}

function agrupar(posts) {
  const ordem = ['revisao', 'rascunho', 'aprovado', 'publicado'];
  const m = new Map();
  for (const p of posts) {
    if (!m.has(p.status)) m.set(p.status, []);
    m.get(p.status).push(p);
  }
  return [...m.entries()].sort((a, b) => ordem.indexOf(a[0]) - ordem.indexOf(b[0]));
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}


/* ---------------------------------------------------------
   Miniatura desenhada no cliente, sob demanda.
   Só roda quando o card entra na tela: numa fila de 40 posts
   ninguém precisa renderizar os 40 de uma vez.
   --------------------------------------------------------- */
const filaThumb = [];
let desenhando = false;

function desenharThumb(frame, p) {
  const agenda = () => { filaThumb.push({ frame, p }); bombear(); };
  if (!('IntersectionObserver' in window)) return agenda();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { io.disconnect(); agenda(); }
    }
  }, { rootMargin: '200px' });
  io.observe(frame);
}

async function bombear() {
  if (desenhando) return;
  desenhando = true;
  while (filaThumb.length) {
    const { frame, p } = filaThumb.shift();
    try {
      const fmt = getFormat(p.formato);
      const doc = buildDoc(p.template, p.formato, p.content || {});
      // Overrides são por slide+id, como no editor.
      (doc.slides || []).forEach((sl, si) => {
        sl.layers = sl.layers.map((l) => {
          const o = (p.overrides || {})[`${si}:${l.id}`];
          return o ? { ...l, ...o, box: { ...l.box, ...(o.box || {}) } } : l;
        });
      });
      await resolveAll(doc);

      const W = 320;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = Math.round((W * fmt.h) / fmt.w);
      const ctx = c.getContext('2d');
      ctx.scale(W / fmt.w, W / fmt.w);
      renderSlide(ctx, doc, 0, { W: fmt.w, H: fmt.h });

      clear(frame);
      frame.appendChild(c);

      // Devolve pro servidor pra não repetir esse trabalho.
      const blob = await canvasToBlob(c, 'image/jpeg', 0.72);
      api.uploadThumb(p.id, blob).catch(() => {});
    } catch {
      // Miniatura é conforto, não função. Falhar aqui não
      // pode derrubar a fila.
    }
    await new Promise((r) => setTimeout(r, 16));
  }
  desenhando = false;
}
