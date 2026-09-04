/* =========================================================
   Mestiza Lab — Fila
   Tratamento editorial: a tela é uma página de índice, não
   uma grade de cards.

   As três decisões que sustentam o desenho:

   1. A manchete DIZ o estado da fila. Não é saudação — é a
      informação da tela em corpo de display. "Quatro
      esperando revisão." vale mais que "Bom dia, Vilker".

   2. A lista é sumário: número de índice, título em serif no
      tamanho de leitura, metadado em mono, chapa à direita.
      Régua entre as linhas, não card com sombra.

   3. O movimento responde à ROLAGEM, não a um cronômetro. As
      chapas ficam levemente para trás enquanto você rola —
      mesmo princípio das colunas de fundo do site do estúdio.
   ========================================================= */

import { el, clear, icon, fmtDate, toast } from '../ui.js';
import { api } from '../api.js';
import { STATUS } from '../config.js';
import { session } from '../store.js';
import { EDITORIAS, buildDoc } from '../templates.js';
import { getFormat } from '../formats.js';
import { renderSlide, resolveAll } from '../renderer.js';
import { canvasToBlob } from '../export.js';
import { iniciarLeituraDeScroll, orquestrar } from '../scroll.js';

const FILTROS = [
  { id: '', label: 'Tudo' },
  { id: 'revisao', label: 'Revisão' },
  { id: 'rascunho', label: 'Rascunho' },
  { id: 'aprovado', label: 'Aprovado' },
  { id: 'publicado', label: 'Publicado' },
];

const NUMEROS = ['Nenhuma', 'Uma', 'Duas', 'Três', 'Quatro', 'Cinco', 'Seis',
  'Sete', 'Oito', 'Nove', 'Dez', 'Onze', 'Doze'];

export async function renderFila(container, { go, setHeader }) {
  let filtro = sessionStorage.getItem('mz.filtro') || '';
  let editoria = sessionStorage.getItem('mz.editoria') || '';
  let vista = sessionStorage.getItem('mz.vista') || 'indice';
  let todos = [];

  setHeader({
    right: el('button.iconbtn', { type: 'button', 'aria-label': 'Ajustes', onClick: () => go('/ajustes') }, icon('sair')),
  });

  const abertura = el('.abertura');
  const railStatus = el('.rail');
  const railEditoria = el('.rail');
  const barraVista = el('.row.row--between', { style: { padding: 'var(--s-4) 0 var(--s-2)' } });
  const corpo = el('div');

  container.appendChild(el('.page', abertura, railStatus, railEditoria, barraVista, corpo));
  const pararScroll = iniciarLeituraDeScroll();

  /* -------------------------------------------------------
     Abertura
     ------------------------------------------------------- */
  function desenharAbertura() {
    clear(abertura);
    const emRevisao = todos.filter((p) => p.status === 'revisao').length;
    const rascunhos = todos.filter((p) => p.status === 'rascunho').length;
    const aprovados = todos.filter((p) => p.status === 'aprovado').length;

    // A manchete é a informação da tela, não uma saudação.
    let linhas;
    if (emRevisao) {
      linhas = [[porExtenso(emRevisao) + (emRevisao === 1 ? ' peça' : ' peças')], ['esperando ', ac('revisão'), '.']];
    } else if (aprovados) {
      linhas = [[porExtenso(aprovados) + (aprovados === 1 ? ' aprovada,' : ' aprovadas,')], ['pronta', 's'.repeat(aprovados !== 1), ' pra ', ac('publicar'), '.']];
    } else if (rascunhos) {
      linhas = [[porExtenso(rascunhos) + (rascunhos === 1 ? ' peça' : ' peças')], ['em ', ac('rascunho'), '.']];
    } else if (todos.length) {
      linhas = [['Tudo'], [ac('publicado'), '.']];
    } else {
      linhas = [['A fila está'], [ac('limpa'), '.']];
    }

    abertura.append(
      el('.chapeu.micro', { 'data-entra': '0' },
        el('span', dataDeHoje()),
        el('.pt'),
        el('span', { style: { fontVariantNumeric: 'tabular-nums' } },
          String(todos.length).padStart(2, '0') + (todos.length === 1 ? ' peça' : ' peças')),
      ),
      el('h1.manchete', ...linhas.map((partes, i) =>
        el('span.linha', { 'data-entra': String(90 + i * 70) }, el('span', ...partes)))),
      el('p.lead.sobe', { 'data-entra': '260' },
        todos.length
          ? 'Toque em qualquer peça para abrir no editor.'
          : 'Comece do zero ou peça uma pro Claude — ela chega aqui montada.'),
    );
  }

  const ac = (t) => el('em', t);
  const porExtenso = (n) => (n <= 12 ? NUMEROS[n] : String(n));

  /* -------------------------------------------------------
     Trilhos
     ------------------------------------------------------- */
  function desenharTrilhos() {
    clear(railStatus);
    for (const f of FILTROS) {
      const n = f.id ? todos.filter((p) => p.status === f.id).length : todos.length;
      railStatus.appendChild(el(`button${filtro === f.id ? '.is-on' : ''}`, {
        type: 'button', dataset: { f: f.id },
        onClick: () => {
          filtro = f.id;
          sessionStorage.setItem('mz.filtro', filtro);
          [...railStatus.children].forEach((c) => c.classList.toggle('is-on', c.dataset.f === filtro));
          desenharLista();
        },
      }, f.label, el('span.n', String(n).padStart(2, '0'))));
    }

    clear(railEditoria);
    for (const ed of [{ id: '', name: 'Todas' }, ...EDITORIAS]) {
      const n = ed.id ? todos.filter((p) => p.editoria === ed.id).length : todos.length;
      railEditoria.appendChild(el(`button${editoria === ed.id ? '.is-on' : ''}`, {
        type: 'button', dataset: { e: ed.id },
        onClick: () => {
          editoria = ed.id;
          sessionStorage.setItem('mz.editoria', editoria);
          [...railEditoria.children].forEach((c) => c.classList.toggle('is-on', c.dataset.e === editoria));
          desenharLista();
        },
      }, ed.name, el('span.n', String(n).padStart(2, '0'))));
    }

    clear(barraVista);
    barraVista.append(
      el('span.nano', filtro || editoria ? 'Filtrado' : 'Tudo que o estúdio está produzindo'),
      el('.vista',
        ...[['indice', 'Índice'], ['contato', 'Contato']].map(([id, rot]) =>
          el(`button${vista === id ? '.is-on' : ''}`, {
            type: 'button',
            onClick: () => {
              vista = id;
              sessionStorage.setItem('mz.vista', vista);
              [...barraVista.querySelectorAll('.vista button')].forEach((b, i) =>
                b.classList.toggle('is-on', ['indice', 'contato'][i] === vista));
              desenharLista();
            },
          }, rot)),
      ),
    );
  }

  /* -------------------------------------------------------
     Lista
     ------------------------------------------------------- */
  function filtrados() {
    return todos.filter((p) =>
      (!filtro || p.status === filtro) && (!editoria || p.editoria === editoria));
  }

  function desenharLista() {
    clear(corpo);
    const itens = filtrados();

    if (!itens.length) {
      corpo.appendChild(el('.vazio',
        el('p.frase', filtro || editoria ? 'Nada com esse ' : 'Fila ',
          el('em', filtro || editoria ? 'filtro' : 'limpa'), '.'),
        el('p', filtro || editoria
          ? 'Tira o filtro pra ver o resto do que está em produção.'
          : 'Comece um post do zero, ou peça um pro Claude a partir de um briefing — ele chega aqui montado, com a legenda escrita.'),
        el('button.btn.btn--solid', {
          type: 'button',
          onClick: () => (filtro || editoria ? limparFiltros() : go('/novo')),
        }, filtro || editoria ? 'Limpar filtro' : 'Criar peça'),
      ));
      return;
    }

    const grupos = agrupar(itens);
    let indice = 0;
    for (const [st, lista] of grupos) {
      const info = STATUS[st] || { label: st, color: 'var(--dim)' };
      corpo.appendChild(el('.faixa',
        el('span.rot.micro', info.label),
        el('.pt'),
        el('span.cont', String(lista.length).padStart(2, '0')),
      ));
      corpo.appendChild(
        vista === 'indice'
          ? el('.idx-lista', lista.map((p) => linhaIndice(p, ++indice, info, go)))
          : el('.contato', lista.map((p) => celulaContato(p, info, go))),
      );
    }
    orquestrar(corpo, { passo: 45 });
  }

  function limparFiltros() {
    filtro = ''; editoria = '';
    sessionStorage.setItem('mz.filtro', '');
    sessionStorage.setItem('mz.editoria', '');
    desenharTrilhos();
    desenharLista();
  }

  /* -------------------------------------------------------
     Carga
     ------------------------------------------------------- */
  async function carregar() {
    clear(corpo);
    corpo.appendChild(el('.esq', el('i'), el('i'), el('i'), el('i')));
    try {
      const r = await api.listPosts({});
      todos = r.posts || [];
    } catch (e) {
      clear(corpo);
      corpo.appendChild(el('.vazio',
        el('p.frase', 'Não ', el('em', 'carregou'), '.'),
        el('p', e.message),
        el('button.btn.btn--solid', { type: 'button', onClick: carregar }, 'Tentar de novo'),
      ));
      return;
    }
    desenharAbertura();
    desenharTrilhos();
    desenharLista();
    orquestrar(abertura, { passo: 0 });
  }

  await carregar();
  return () => pararScroll();
}

/* =========================================================
   Linha de índice
   ========================================================= */
function linhaIndice(p, n, info, go) {
  const chapa = plate(p);
  return el('button.idx-row', {
    type: 'button', 'data-entra': '',
    onClick: () => go('/editor/' + p.id),
  },
    el('span.num', String(n).padStart(2, '0')),
    el('div',
      el('.t', p.titulo || 'Sem título'),
      el('.meta',
        el('i.pstatus', { style: { background: info.color } }),
        el('span', info.label),
        el('span', '·'),
        el('span', fmtDate(p.atualizado_em || p.criado_em)),
        p.origem === 'claude' ? el('span', { style: { color: 'var(--accent)' } }, '· Claude') : null,
      ),
    ),
    chapa,
  );
}

function celulaContato(p, info, go) {
  return el('button.cel', {
    type: 'button', 'data-entra': '',
    onClick: () => go('/editor/' + p.id),
  },
    plate(p),
    el('.t.clamp-2', p.titulo || 'Sem título'),
    el('.meta',
      el('i.pstatus', { style: { background: info.color } }),
      el('span', fmtDate(p.atualizado_em || p.criado_em)),
    ),
  );
}

/* =========================================================
   Chapa — a miniatura
   ========================================================= */
function plate(p) {
  const nó = el('.plate', { 'data-entra': '' });
  if (p.thumb) {
    nó.appendChild(el('img', { src: p.thumb, alt: '', loading: 'lazy', decoding: 'async' }));
  } else if (p.content) {
    nó.appendChild(el('.vazia', icon('imagem', 16)));
    desenharChapa(nó, p);
  } else {
    nó.appendChild(el('.vazia', icon('imagem', 16)));
  }
  if (p.origem === 'claude') nó.appendChild(el('.selo', 'IA'));
  return nó;
}

/* ---------------------------------------------------------
   Miniatura desenhada no cliente, sob demanda.
   Post que chegou pela API nunca passou pelo editor e não tem
   miniatura. Em vez de um ícone cinza, o app desenha a peça —
   e devolve pro servidor, pra na próxima já vir pronta.
   --------------------------------------------------------- */
const fila = [];
let ocupado = false;

function desenharChapa(nó, p) {
  const agenda = () => { fila.push({ nó, p }); bombear(); };
  if (!('IntersectionObserver' in window)) return agenda();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.disconnect(); agenda(); }
  }, { rootMargin: '250px' });
  io.observe(nó);
}

async function bombear() {
  if (ocupado) return;
  ocupado = true;
  while (fila.length) {
    const { nó, p } = fila.shift();
    try {
      const fmt = getFormat(p.formato);
      const doc = buildDoc(p.template, p.formato, p.content || {});
      (doc.slides || []).forEach((sl, si) => {
        sl.layers = sl.layers.map((l) => {
          const o = (p.overrides || {})[`${si}:${l.id}`];
          return o ? { ...l, ...o, box: { ...l.box, ...(o.box || {}) } } : l;
        });
      });
      await resolveAll(doc);

      const W = 260;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = Math.round((W * fmt.h) / fmt.w);
      const ctx = c.getContext('2d');
      ctx.scale(W / fmt.w, W / fmt.w);
      renderSlide(ctx, doc, 0, { W: fmt.w, H: fmt.h });

      const vazia = nó.querySelector('.vazia');
      if (vazia) vazia.remove();
      nó.insertBefore(c, nó.firstChild);

      const blob = await canvasToBlob(c, 'image/jpeg', 0.72);
      api.uploadThumb(p.id, blob).catch(() => {});
    } catch {
      // Miniatura é conforto, não função.
    }
    await new Promise((r) => setTimeout(r, 16));
  }
  ocupado = false;
}

/* =========================================================
   Utilidades
   ========================================================= */
function agrupar(posts) {
  const ordem = ['revisao', 'rascunho', 'aprovado', 'publicado'];
  const m = new Map();
  for (const p of posts) {
    if (!m.has(p.status)) m.set(p.status, []);
    m.get(p.status).push(p);
  }
  for (const lista of m.values()) {
    lista.sort((a, b) => (b.atualizado_em || '').localeCompare(a.atualizado_em || ''));
  }
  return [...m.entries()].sort((a, b) => ordem.indexOf(a[0]) - ordem.indexOf(b[0]));
}

function dataDeHoje() {
  const d = new Date();
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0];
  const resto = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  return `${dia} · ${resto}`.toUpperCase();
}
