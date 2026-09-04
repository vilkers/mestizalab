/* =========================================================
   Mestiza Lab — salvar quando o download não é possível

   Existe por dois motivos reais:

   1. Em navegador embutido (o link de demonstração, um webview
      dentro de outro app), o download é bloqueado pelo sandbox
      e o `<a download>` simplesmente não faz nada — em
      silêncio, que é o pior tipo de falha.

   2. No iPhone, mesmo fora de sandbox, "baixar" joga o arquivo
      numa pasta que a pessoa não acha. Segurar a imagem e
      tocar em "Adicionar às Fotos" é o gesto que ela já
      conhece e que põe a peça no rolo da câmera, pronta para
      o Instagram.
   ========================================================= */

import { el, sheet, toast } from '../ui.js';

/**
 * Mostra as peças em tamanho de tela para salvar segurando.
 * @param {Blob[]} blobs
 * @param {string[]} nomes
 */
export function abrirParaSalvar(blobs, nomes, { titulo = 'Salvar' } = {}) {
  const urls = blobs.map((b) => URL.createObjectURL(b));
  const varias = blobs.length > 1;

  const corpo = el('div',
    el('.cap-note', { style: { marginBottom: 'var(--s-5)' } },
      el('strong', varias ? 'Segure cada imagem ' : 'Segure a imagem '),
      'e toque em ',
      el('strong', 'Adicionar às Fotos'),
      ' (iPhone) ou ',
      el('strong', 'Baixar imagem'),
      ' (Android). Elas saem no tamanho cheio, 1080px.',
    ),
    ...urls.map((u, i) =>
      el('.salvar-item',
        varias ? el('span.nano', { style: { display: 'block', marginBottom: 'var(--s-2)' } },
          `${String(i + 1).padStart(2, '0')} / ${String(urls.length).padStart(2, '0')}`) : null,
        el('img', {
          src: u, alt: nomes[i] || '',
          // Sem isto o iOS trata como elemento de interface e
          // não oferece o menu de salvar.
          style: { width: '100%', border: '1px solid var(--line)', webkitTouchCallout: 'default', userSelect: 'auto' },
        }),
      ),
    ),
  );

  const s = sheet({
    title: titulo,
    full: true,
    body: corpo,
    onClose: () => setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 30_000),
  });
  return s;
}

/**
 * Vídeo não dá para salvar segurando — o menu do iOS não
 * oferece isso para <video>. Abrimos num player com a
 * instrução honesta do que fazer.
 */
export function abrirVideoParaSalvar(blob, nome) {
  const url = URL.createObjectURL(blob);
  const s = sheet({
    title: 'Vídeo pronto',
    full: true,
    body: el('div',
      el('video', {
        src: url, controls: true, playsinline: true,
        style: { width: '100%', border: '1px solid var(--line)', marginBottom: 'var(--s-5)' },
      }),
      el('.cap-note',
        el('strong', 'Para salvar no aparelho: '),
        'toque nos três pontinhos do player e escolha Baixar. ',
        'Se o navegador não oferecer, abra esta ferramenta fora de qualquer app embutido — ',
        'no Safari ou no Chrome direto — e exporte de novo.',
      ),
    ),
    onClose: () => setTimeout(() => URL.revokeObjectURL(url), 60_000),
  });
  return s;
}

/**
 * O ambiente consegue entregar um arquivo?
 * Não existe API que responda isso, então tratamos os dois
 * casos que sabemos: a flag que o build de demonstração liga,
 * e a página rodando dentro de um iframe de outra origem.
 */
export function downloadBloqueado() {
  if (typeof window === 'undefined') return false;
  if (window.MZ_SEM_DOWNLOAD) return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;   // acesso negado ao topo = iframe cross-origin
  }
}
