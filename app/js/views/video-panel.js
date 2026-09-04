/* =========================================================
   Mestiza Lab — painel de vídeo
   Sobe o clipe, aplica a máscara do template e exporta o
   arquivo final no próprio aparelho.
   ========================================================= */

import { el, clear, icon, toast, confirmSheet } from '../ui.js';
import { uploadControl } from './midia.js';
import { api } from '../api.js';
import { session } from '../store.js';
import {
  loadVideo, startPreview, burnIn, maskPNG, videoSupport, fmtDuration, seek,
} from '../video.js';
import { getFormat } from '../formats.js';
import { downloadBlob, shareOrDownload, slideName } from '../export.js';

export function mountVideoPanel(bodyEl, { store, stage, markDirty }) {
  const sup = videoSupport();
  const framing = store.video?.framing || { fx: 0.5, fy: 0.5, zoom: 1 };

  /* ---------- servidor sem armazenamento de vídeo ---------- */
  // Sem o R2 ativado o clipe não tem onde morar. Em vez de
  // mostrar um botão que vai falhar, dizemos o que dá pra
  // fazer — que continua sendo bastante.
  if (!store.video?.src && !session.recursos.video) {
    bodyEl.append(
      el('.cap-note',
        el('strong', 'Upload de vídeo precisa do R2 ativado. '),
        'Ele não está — por escolha, para a plataforma não pedir cartão. Isso não impede o trabalho:',
      ),
      el('ul.flist', { style: { marginTop: 'var(--s-4)' } },
        el('li', el('span.idx.n', '01'), el('div',
          el('div', { style: { fontSize: '1.02rem', fontWeight: 500 } }, 'Baixe a máscara em PNG'),
          el('.d', 'Transparente, 1080×1920, com a moldura e a manchete deste template já compostas.'))),
        el('li', el('span.idx.n', '02'), el('div',
          el('div', { style: { fontSize: '1.02rem', fontWeight: 500 } }, 'Ponha por cima do clipe'),
          el('.d', 'No CapCut ou no Premiere, como uma camada. Leva 30 segundos e o resultado é idêntico.'))),
        el('li', el('span.idx.n', '03'), el('div',
          el('div', { style: { fontSize: '1.02rem', fontWeight: 500 } }, 'A legenda fica aqui'),
          el('.d', 'Escreva na aba Legenda e copie com um toque na hora de publicar.'))),
      ),
      el('button.btn.btn--solid.btn--block', {
        type: 'button', style: { marginTop: 'var(--s-6)' },
        onClick: exportarMascaraSemClipe,
      }, icon('baixar', 16), 'Baixar a máscara em PNG'),
    );

    async function exportarMascaraSemClipe() {
      try {
        const { maskPNG } = await import('../video.js');
        const { shareOrDownload, slideName } = await import('../export.js');
        const blob = await maskPNG(store.doc, { scale: 1 });
        const nome = slideName(store, 0, 'png').replace('.png', '-mascara.png');
        await shareOrDownload([blob], [nome], { title: 'Máscara' });
        toast('Máscara salva. Ela é transparente — é só pôr por cima do clipe.', 'gold');
      } catch (e) { toast(e.message, 'bad'); }
    }
    return;
  }

  /* ---------- sem clipe ainda ---------- */
  if (!store.video?.src) {
    const up = uploadControl({
      tipo: 'video',
      accept: 'video/mp4,video/quicktime,video/webm,video/*',
      onDone: async (novos) => {
        const m = novos[0];
        if (!m) return;
        store.video = { src: m.url, mediaId: m.id, framing };
        markDirty();
        clear(bodyEl);
        mountVideoPanel(bodyEl, { store, stage, markDirty });
      },
    });
    bodyEl.append(
      el('.cap-note',
        el('strong', 'Máscara sobre vídeo. '),
        'A moldura do template entra por cima do clipe e o arquivo final sai daqui, sem passar por servidor.',
      ),
      up.node,
      capNote(sup),
    );
    return;
  }

  /* ---------- com clipe ---------- */
  const wrap = el('div');
  bodyEl.appendChild(wrap);
  const meta = el('.vid-meta');
  const controls = el('div');
  wrap.append(meta, controls);

  let videoEl = null;
  let stopPreview = null;
  let restaurarPalco = null;

  (async () => {
    try {
      videoEl = await loadVideo(store.video.src);
    } catch (e) {
      clear(wrap);
      wrap.append(
        el('p.micro', { style: { color: 'var(--danger)', marginBottom: 'var(--s-4)' } }, e.message),
        el('button.btn.btn--block', { type: 'button', onClick: trocar }, 'Escolher outro vídeo'),
      );
      return;
    }

    const fmt = getFormat(store.formato);
    const d = videoEl.duration;

    clear(meta);
    meta.append(
      el('div', el('span.nano.k', 'Duração'), el('span.v', fmtDuration(d))),
      el('div', el('span.nano.k', 'Origem'), el('span.v', `${videoEl.videoWidth}×${videoEl.videoHeight}`)),
      el('div', el('span.nano.k', 'Saída'), el('span.v', `${fmt.w}×${fmt.h}`)),
    );

    // O palco passa a mostrar o vídeo ao vivo com a máscara.
    // Enquanto o preview roda, o Stage não pode redesenhar por
    // cima: os dois disputariam o mesmo canvas e a peça
    // apareceria duplicada. Silenciamos o draw do palco e
    // devolvemos no cleanup.
    const drawOriginal = stage.draw.bind(stage);
    stage.draw = () => stage.drawOverlay();
    stopPreview = startPreview(
      stage.canvas, videoEl,
      () => store.doc,
      () => store.video.framing || framing,
    );
    restaurarPalco = () => { stage.draw = drawOriginal; };
    stage.drawOverlay();

    const scrub = el('input.range', { type: 'range', min: 0, max: Math.max(0.1, d), step: 0.05, value: 0 });
    scrub.addEventListener('input', () => { videoEl.currentTime = parseFloat(scrub.value); });

    const tempo = el('span.val', '0:00');
    videoEl.addEventListener('timeupdate', () => {
      scrub.value = videoEl.currentTime;
      tempo.textContent = fmtDuration(videoEl.currentTime);
    });

    const play = el('button.btn.btn--sm.grow', { type: 'button' }, icon('play', 15), 'Reproduzir');
    play.addEventListener('click', () => {
      if (videoEl.paused) { videoEl.play(); play.lastChild.textContent = 'Pausar'; }
      else { videoEl.pause(); play.lastChild.textContent = 'Reproduzir'; }
    });

    const zoom = el('input.range', { type: 'range', min: 1, max: 3, step: 0.02, value: (store.video.framing || framing).zoom || 1 });
    zoom.addEventListener('input', () => {
      store.video.framing = { ...(store.video.framing || framing), zoom: parseFloat(zoom.value) };
      markDirty();
    });

    const progresso = el('div');

    clear(controls);
    controls.append(
      el('.ed-field', el('label', el('span.micro', 'Posição'), tempo), scrub),
      el('.row', { style: { gap: 'var(--s-2)', marginBottom: 'var(--s-5)' } }, play,
        el('button.btn.btn--sm', { type: 'button', onClick: () => seek(videoEl, 0) }, 'Início')),
      el('.ed-field', el('label', el('span.micro', 'Enquadramento'), el('span.val', 'zoom')), zoom),
      capNote(sup),
      progresso,
      el('.col', { style: { gap: 'var(--s-2)' } },
        sup.burnIn
          ? el('button.btn.btn--solid.btn--block', { type: 'button', onClick: () => exportar(progresso) },
              icon('video', 16), `Exportar vídeo (.${sup.container})`)
          : null,
        el('button.btn.btn--block', { type: 'button', onClick: exportarMascara },
          icon('baixar', 16), 'Baixar só a máscara (PNG)'),
        el('button.btn.btn--ghost.btn--block', { type: 'button', onClick: trocar }, 'Trocar vídeo'),
      ),
    );
  })();

  async function exportar(progresso) {
    clear(progresso);
    const bar = el('i');
    const label = el('p.nano', { style: { marginTop: 'var(--s-2)' } },
      'Gravando em tempo real — o clipe vai tocar inteiro uma vez. Não saia desta tela.');
    const cancelar = el('button.btn.btn--sm.btn--ghost', { type: 'button' }, 'Cancelar');
    progresso.append(el('.progress', bar), label, el('.row', { style: { marginTop: 'var(--s-2)' } }, cancelar));

    const ac = new AbortController();
    cancelar.addEventListener('click', () => ac.abort());

    try {
      const { blob, ext } = await burnIn(videoEl, store.doc, {
        scale: 1,
        framing: store.video.framing || framing,
        signal: ac.signal,
        onProgress: (p) => {
          bar.style.width = `${Math.round(p * 100)}%`;
          label.textContent = `Gravando — ${Math.round(p * 100)}%`;
        },
      });
      clear(progresso);
      const nome = slideName(store, 0, ext);
      const r = await shareOrDownload([blob], [nome], { title: store.titulo, text: store.legenda });
      toast(r === 'shared' ? 'Vídeo enviado.' : r === 'manual' ? 'Vídeo pronto — veja como salvar.' : 'Vídeo salvo.', 'gold');
    } catch (e) {
      clear(progresso);
      if (e.name !== 'AbortError') {
        progresso.appendChild(el('p.micro', { style: { color: 'var(--danger)' } }, e.message));
      }
    }
  }

  async function exportarMascara() {
    try {
      const blob = await maskPNG(store.doc, { scale: 1 });
      const nome = slideName(store, 0, 'png').replace('.png', '-mascara.png');
      const r = await shareOrDownload([blob], [nome], { title: 'Máscara' });
      if (r !== 'manual') toast('Máscara salva. Ela é transparente — é só pôr por cima do clipe.', 'gold');
    } catch (e) { toast(e.message, 'bad'); }
  }

  async function trocar() {
    if (!(await confirmSheet({ title: 'Trocar vídeo', message: 'O clipe atual sai deste post.', confirmLabel: 'Trocar' }))) return;
    stopPreview && stopPreview();
    restaurarPalco && restaurarPalco();
    store.video = null;
    markDirty();
    clear(bodyEl);
    mountVideoPanel(bodyEl, { store, stage, markDirty });
    stage.draw();
  }

  // Sair da aba encerra o preview e devolve o palco ao editor.
  const obs = new MutationObserver(() => {
    if (!bodyEl.contains(wrap)) {
      stopPreview && stopPreview();
      restaurarPalco && restaurarPalco();
      videoEl && videoEl.pause();
      obs.disconnect();
      stage.draw();
    }
  });
  obs.observe(bodyEl, { childList: true });
}

/** Diz a verdade sobre o que este aparelho consegue fazer. */
function capNote(sup) {
  if (sup.burnIn && sup.container === 'mp4') {
    return el('.cap-note',
      el('strong', 'Este aparelho exporta MP4. '),
      'O arquivo sai pronto pro Instagram, com o áudio original, sem passar por servidor.',
    );
  }
  if (sup.burnIn) {
    return el('.cap-note',
      el('strong', 'Este aparelho exporta WebM. '),
      'Funciona, mas o Instagram prefere MP4 — em iPhone ou Chrome recente a saída já sai em MP4. Se precisar agora, baixe a máscara em PNG e feche no CapCut.',
    );
  }
  return el('.cap-note',
    el('strong', 'Este navegador não grava vídeo. '),
    'Baixe a máscara em PNG (transparente, 1080×1920) e componha por cima do clipe no CapCut ou no Premiere — leva 30 segundos.',
  );
}
