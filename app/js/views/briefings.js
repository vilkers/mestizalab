/* =========================================================
   Mestiza Lab — briefings
   Aqui chega o que você pediu pro Claude na conversa. Ele
   escreve na API, o briefing aparece nesta lista e vira post
   com um toque — ou já chega como post pronto na fila.
   ========================================================= */

import { el, clear, icon, toast, fmtDate, confirmSheet, copy } from '../ui.js';
import { api } from '../api.js';
import { EDITORIAS } from '../templates.js';

export async function renderBriefings(container, { go, setHeader }) {
  setHeader({ title: 'Briefings' });

  const page = el('.page');
  const lista = el('div');

  page.append(
    el('.page-head',
      el('span.page-kicker.micro', 'Entrada'),
      el('.reveal', el('h1.h1.page-title', 'Briefings')),
      el('p.page-sub', 'O que chega do Claude. Peça na conversa e o material aparece aqui.'),
    ),
    comoUsar(),
    el('.sec', el('span.micro', 'Recebidos'), el('.line')),
    lista,
  );
  container.appendChild(page);

  async function load() {
    clear(lista);
    lista.appendChild(el('.row', { style: { padding: 'var(--s-8) 0', color: 'var(--dim)' } }, el('.spin'), el('span.micro', 'Carregando')));
    let itens = [];
    try {
      const r = await api.listBriefings({});
      itens = r.briefings || [];
    } catch (e) {
      clear(lista);
      lista.appendChild(el('p.micro', { style: { color: 'var(--danger)' } }, e.message));
      return;
    }
    clear(lista);
    if (!itens.length) {
      lista.appendChild(el('.empty',
        el('h2.h2', 'Caixa vazia'),
        el('p', 'Assim que você pedir um conteúdo pro Claude, ele aparece aqui — com a legenda escrita e o post já montado.'),
      ));
      return;
    }
    for (const b of itens) lista.appendChild(cartao(b, go, load));
  }

  await load();
}

function cartao(b, go, reload) {
  const corpo = el('.b.is-clamped', b.corpo || '');
  const ed = EDITORIAS.find((e) => e.id === b.editoria);
  return el('.brief.rise',
    el('.row.row--between', { style: { marginBottom: 'var(--s-2)' } },
      el('span.src.micro', el('i.dotst', { style: { background: 'var(--accent)' } }), b.origem === 'claude' ? 'Claude' : 'Manual'),
      el('span.nano', fmtDate(b.criado_em)),
    ),
    el('h3.h3', { style: { marginBottom: 'var(--s-2)' } }, b.titulo || 'Sem título'),
    ed ? el('span.nano', { style: { display: 'block', marginBottom: 'var(--s-3)' } }, ed.name) : null,
    corpo,
    el('button.btn.btn--sm.btn--ghost', {
      type: 'button', style: { marginTop: 'var(--s-2)', paddingInline: 0 },
      onClick: (e) => {
        corpo.classList.toggle('is-clamped');
        e.currentTarget.textContent = corpo.classList.contains('is-clamped') ? 'Ler tudo' : 'Recolher';
      },
    }, 'Ler tudo'),
    el('.row', { style: { gap: 'var(--s-2)', marginTop: 'var(--s-4)' } },
      b.post_id
        ? el('button.btn.btn--sm.btn--solid.grow', { type: 'button', onClick: () => go('/editor/' + b.post_id) }, 'Abrir o post')
        : el('button.btn.btn--sm.grow', { type: 'button', onClick: () => go('/novo') }, 'Criar post'),
      el('button.btn.btn--sm', {
        type: 'button',
        onClick: async () => { await copy(b.corpo || ''); toast('Briefing copiado.'); },
      }, icon('copiar', 14)),
      b.status !== 'arquivado'
        ? el('button.btn.btn--sm', {
            type: 'button',
            onClick: async () => {
              await api.updateBriefing(b.id, { status: 'arquivado' });
              toast('Arquivado.');
              reload();
            },
          }, icon('check', 14))
        : null,
    ),
  );
}

function comoUsar() {
  return el('.cap-note', { style: { marginBottom: 'var(--s-6)' } },
    el('strong', 'Como pedir. '),
    'Na conversa com o Claude: “monta um carrossel institucional sobre X, três slides, com a legenda”. Ele cria o post, escreve a legenda e manda pra sua fila. Você só ajusta e exporta.',
  );
}
