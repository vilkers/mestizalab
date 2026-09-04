/* =========================================================
   Mestiza Lab — preview de carrossel

   Por que isto existe: no editor você vê um slide por vez, e
   carrossel não se lê um slide por vez. Se lê arrastando, com
   a borda do próximo aparecendo — é essa borda que faz a
   pessoa continuar. Um carrossel pode ter cinco slides bons e
   uma sequência ruim, e isso é invisível slide a slide.

   Aqui a peça aparece como o Instagram mostra: faixa
   horizontal com scroll-snap, vizinhos espiando, legenda
   embaixo cortada no ponto exato do "mais".
   ========================================================= */

import { el, clear, icon, sheet } from '../ui.js';
import { getFormat } from '../formats.js';
import { renderSlide, resolveAll } from '../renderer.js';

/** O feed corta a legenda por volta daqui. Antes disso é o
    que decide se alguém abre o resto. */
const CORTE_LEGENDA = 125;

export async function abrirPreviewCarrossel(store) {
  const fmt = getFormat(store.formato);
  const total = store.slideCount;

  const faixa = el('.cx-faixa');
  const contador = el('span.val', `01 / ${String(total).padStart(2, '0')}`);
  const corpo = el('div',
    el('.cx-wrap', faixa),
    el('.cx-dots'),
    legendaPreview(store),
  );

  const s = sheet({
    title: `Como aparece no feed`,
    full: true,
    body: corpo,
    actions: null,
  });

  // Cabeçalho da folha ganha o contador de posição.
  const cab = s.panel.querySelector('.sheet-head > div');
  cab.style.display = 'flex';
  cab.style.alignItems = 'baseline';
  cab.style.gap = 'var(--s-3)';
  cab.appendChild(contador);

  // Render dos slides. Largura de 560px é o suficiente para
  // julgar sequência sem torrar memória num carrossel de 10.
  const W = 560;
  await resolveAll(store.doc);
  for (let i = 0; i < total; i++) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = Math.round((W * fmt.h) / fmt.w);
    const ctx = c.getContext('2d');
    ctx.scale(W / fmt.w, W / fmt.w);
    renderSlide(ctx, store.doc, i, { W: fmt.w, H: fmt.h });
    faixa.appendChild(el('.cx-slide', c, el('span.cx-n.nano', String(i + 1).padStart(2, '0'))));
  }

  // Pontos de posição, iguais aos do Instagram.
  const dots = corpo.querySelector('.cx-dots');
  for (let i = 0; i < total; i++) dots.appendChild(el(`i${i === 0 ? '.is-on' : ''}`));

  // O contador segue o scroll — é o feedback que diz em que
  // ponto da sequência você está olhando.
  let raf = 0;
  faixa.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const largura = faixa.scrollWidth / total;
      const i = Math.max(0, Math.min(total - 1, Math.round(faixa.scrollLeft / largura)));
      contador.textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      [...dots.children].forEach((d, k) => d.classList.toggle('is-on', k === i));
    });
  }, { passive: true });

  return s;
}

/** A legenda como o feed mostra: cortada, com o "mais". */
function legendaPreview(store) {
  const texto = [store.legenda, store.hashtags].filter(Boolean).join('\n\n').trim();
  if (!texto) {
    return el('.cx-legenda',
      el('p.ed-hint', 'Sem legenda ainda. A primeira linha é o que aparece antes do “mais” — ela sozinha tem que valer.'),
    );
  }
  const cortou = texto.length > CORTE_LEGENDA;
  const visivel = cortou ? texto.slice(0, CORTE_LEGENDA).trimEnd() : texto;
  return el('.cx-legenda',
    el('span.micro.dim', { style: { display: 'block', marginBottom: 'var(--s-2)' } }, 'mestiza'),
    el('p.cx-cap', visivel, cortou ? el('span.cx-mais', '… mais') : null),
    cortou
      ? el('p.ed-hint', `A legenda tem ${texto.length} caracteres. Só os primeiros ${CORTE_LEGENDA} aparecem antes de alguém tocar em “mais”.`)
      : null,
  );
}
