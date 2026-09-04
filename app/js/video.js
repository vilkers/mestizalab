/* =========================================================
   Mestiza Lab — vídeo
   Queima a máscara do template por cima do clipe, no próprio
   aparelho. Sem servidor, sem upload de render, sem fila.

   Como funciona
   -------------
   1. o <video> toca do início ao fim, mudo
   2. cada quadro é desenhado num canvas do tamanho do artboard
   3. a máscara (o mesmo doc do editor) é desenhada por cima
   4. canvas.captureStream() vira a trilha de vídeo
   5. o áudio original é capturado pela WebAudio e vira a
      trilha de áudio
   6. MediaRecorder grava as duas em MP4 (ou WebM, se o
      aparelho não tiver MP4)

   Por que não ffmpeg.wasm: transcodificar em JavaScript num
   celular leva minutos. Isto roda em tempo real e é o
   encoder de hardware do aparelho fazendo o trabalho.

   Por que não WebCodecs puro: VideoEncoder é mais rápido que
   tempo real, mas para levar o ÁUDIO junto seria preciso
   demuxar o MP4 de entrada na mão. Um Reels sem áudio não
   serve. MediaRecorder resolve os dois com uma API só.
   ========================================================= */

import { getFormat } from './formats.js';
import { renderSlide, resolveAll } from './renderer.js';

/* ---------------------------------------------------------
   Capacidades — decidido uma vez, no carregamento
   --------------------------------------------------------- */
const MP4_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1.4d002a,mp4a.40.2',
  'video/mp4',
];
const WEBM_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const m of MP4_CANDIDATES) if (MediaRecorder.isTypeSupported(m)) return { mime: m, ext: 'mp4' };
  for (const m of WEBM_CANDIDATES) if (MediaRecorder.isTypeSupported(m)) return { mime: m, ext: 'webm' };
  return null;
}

export function videoSupport() {
  const rec = pickMime();
  const canCapture = typeof HTMLCanvasElement !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
  return {
    /** Consegue gerar o arquivo final no aparelho? */
    burnIn: !!rec && canCapture,
    /** Sai em MP4 (aceito direto pelo Instagram) ou WebM? */
    container: rec?.ext || null,
    mime: rec?.mime || null,
  };
}

/* ---------------------------------------------------------
   Carregar o clipe
   --------------------------------------------------------- */
/**
 * Carrega o clipe e só resolve quando existe QUADRO
 * decodificado — não apenas metadados.
 *
 * Isto não é preciosismo. Em `loadedmetadata` o readyState é
 * 1 (HAVE_METADATA): largura e altura já existem, mas
 * `drawImage` desenha NADA, e desenha nada em silêncio. Era
 * exatamente por isso que o vídeo saía preto no export com a
 * máscara perfeita por cima.
 *
 * A segunda armadilha: `currentTime = 0` quando o vídeo já
 * está em 0 não dispara seek nenhum. Por isso forçamos
 * 0.001 — um milissegundo que ninguém vê e que obriga o
 * decodificador a entregar o primeiro quadro.
 */
export function loadVideo(src) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'auto';
    v.playsInline = true;
    v.muted = true;
    v.crossOrigin = 'anonymous';

    let pronto = false;
    const ok = () => { if (!pronto) { pronto = true; resolve(v); } };

    v.addEventListener('loadeddata', ok);
    v.addEventListener('canplay', ok);
    v.addEventListener('loadedmetadata', () => {
      if (v.readyState < 2) { try { v.currentTime = 0.001; } catch {} }
    });
    v.addEventListener('error', () => {
      if (!pronto) reject(new Error('Não consegui ler esse vídeo. Tente MP4 (H.264) ou MOV.'));
    });
    // Rede de segurança: metadados chegaram, quadro não. Vale
    // devolver o elemento — o painel ainda mostra duração e
    // dimensão, e o export chama ensureFrame antes de gravar.
    setTimeout(() => { if (!pronto && v.videoWidth) ok(); }, 8000);

    v.src = src;
    v.load();
  });
}

/** Garante que existe um quadro pintável antes de desenhar. */
export async function ensureFrame(v) {
  if (v.readyState >= 2) return;
  await seek(v, 0.001);
  if (v.readyState < 2) await new Promise((r) => setTimeout(r, 300));
}

/** Retângulo de recorte cover do vídeo dentro do artboard. */
export function coverRect(vw, vh, W, H, { fx = 0.5, fy = 0.5, zoom = 1 } = {}) {
  const br = W / H;
  const vr = vw / vh;
  let sw, sh;
  if (vr > br) { sh = vh / zoom; sw = sh * br; }
  else { sw = vw / zoom; sh = sw / br; }
  const sx = Math.max(0, Math.min(vw - sw, fx * vw - sw / 2));
  const sy = Math.max(0, Math.min(vh - sh, fy * vh - sh / 2));
  return { sx, sy, sw, sh };
}

/**
 * Desenha um quadro completo: vídeo recortado + máscara.
 * Usado tanto no preview quanto na gravação — de novo, o que
 * se vê é o que sai.
 */
export function drawFrame(ctx, videoEl, doc, A, framing) {
  ctx.save();
  ctx.clearRect(0, 0, A.W, A.H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, A.W, A.H);
  if (videoEl && videoEl.videoWidth) {
    const r = coverRect(videoEl.videoWidth, videoEl.videoHeight, A.W, A.H, framing);
    ctx.drawImage(videoEl, r.sx, r.sy, r.sw, r.sh, 0, 0, A.W, A.H);
  }
  ctx.restore();
  // A máscara entra por cima, com fundo transparente.
  renderSlide(ctx, doc, 0, A, { transparent: true });
}

/* ---------------------------------------------------------
   Preview em tempo real
   --------------------------------------------------------- */
export function startPreview(canvas, videoEl, getDoc, getFraming) {
  const ctx = canvas.getContext('2d');
  let raf = 0, alive = true;
  // Sem quadro decodificado o preview fica preto e parece que
  // o vídeo não subiu. Forçamos a decodificação uma vez.
  ensureFrame(videoEl).catch(() => {});
  function loop() {
    if (!alive) return;
    const doc = getDoc();
    const fmt = getFormat(doc.format);
    const scale = canvas.width / fmt.w;
    // setTransform, e não save/scale: qualquer transform que
    // o palco tenha deixado no contexto se somaria à nossa e
    // o desenho sairia em escala ao quadrado.
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawFrame(ctx, videoEl, doc, { W: fmt.w, H: fmt.h }, getFraming());
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    raf = requestAnimationFrame(loop);
  }
  loop();
  return () => { alive = false; cancelAnimationFrame(raf); };
}

/* ---------------------------------------------------------
   Export
   --------------------------------------------------------- */

/**
 * Grava o clipe com a máscara queimada.
 * @returns {Promise<{blob:Blob, ext:string, mime:string}>}
 */
export async function burnIn(videoEl, doc, {
  scale = 1,
  fps = 30,
  framing = {},
  bitrate,
  onProgress,
  signal,
} = {}) {
  const sup = videoSupport();
  if (!sup.burnIn) throw new Error('Este navegador não grava vídeo. Use a saída em PNG da máscara.');

  const fmt = getFormat(doc.format);
  await resolveAll(doc);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(fmt.w * scale);
  canvas.height = Math.round(fmt.h * scale);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingQuality = 'high';

  const stream = canvas.captureStream(fps);

  // Áudio pela WebAudio: funciona onde video.captureStream()
  // não existe, e não deixa o som vazar pelos alto-falantes
  // durante a gravação (só ligamos no destino do stream).
  let audioCtx = null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audioCtx = new AC();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const src = audioCtx.createMediaElementSource(videoEl);
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest);
      for (const t of dest.stream.getAudioTracks()) stream.addTrack(t);
    }
  } catch {
    // Vídeo sem áudio, ou o elemento já tinha sido conectado.
    // Não é motivo para abortar o export.
  }

  const kbps = bitrate ?? Math.round(canvas.width * canvas.height * fps * 0.09);
  const rec = new MediaRecorder(stream, {
    mimeType: sup.mime,
    videoBitsPerSecond: Math.min(Math.max(kbps, 2_000_000), 16_000_000),
  });

  const parts = [];
  rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };

  const done = new Promise((resolve, reject) => {
    rec.onstop = () => resolve();
    rec.onerror = (e) => reject(e.error || new Error('Falha ao gravar.'));
  });

  const A = { W: fmt.w, H: fmt.h };
  let raf = 0, stopped = false;
  const duration = videoEl.duration || 0;

  function tick() {
    if (stopped) return;
    ctx.save();
    ctx.scale(scale, scale);
    drawFrame(ctx, videoEl, doc, A, framing);
    ctx.restore();
    if (onProgress && duration) onProgress(Math.min(1, videoEl.currentTime / duration));
    raf = requestAnimationFrame(tick);
  }

  function finish() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    try { rec.stop(); } catch {}
  }

  videoEl.muted = false;
  videoEl.volume = 1;
  // Voltar ao começo COM seek de verdade. Atribuir 0 quando
  // já se está em 0 é um no-op e deixaria o decodificador sem
  // quadro — a origem do export preto.
  await ensureFrame(videoEl);
  if (videoEl.currentTime > 0.05) await seek(videoEl, 0.001);
  videoEl.onended = finish;
  if (signal) signal.addEventListener('abort', finish);

  // Um quadro desenhado ANTES do start: sem isso o primeiro
  // frame do arquivo pode sair preto em alguns aparelhos.
  ctx.save(); ctx.scale(scale, scale);
  drawFrame(ctx, videoEl, doc, A, framing);
  ctx.restore();

  rec.start(250);
  tick();
  try {
    await videoEl.play();
  } catch (e) {
    finish();
    throw new Error('O navegador bloqueou a reprodução. Toque em play uma vez antes de exportar.');
  }

  // Rede de segurança: se `ended` não disparar (acontece em
  // alguns MOVs), paramos pela duração + folga.
  const guard = duration ? setTimeout(finish, duration * 1000 + 1200) : null;

  await done;
  if (guard) clearTimeout(guard);
  videoEl.onended = null;
  videoEl.pause();
  videoEl.muted = true;
  try { audioCtx && (await audioCtx.close()); } catch {}
  for (const t of stream.getTracks()) t.stop();

  if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
  onProgress && onProgress(1);
  return { blob: new Blob(parts, { type: sup.mime }), ext: sup.container, mime: sup.mime };
}

/**
 * Saída alternativa: a máscara sozinha, PNG transparente em
 * escala cheia. É o que salva o dia num aparelho antigo — e
 * também o que a equipe usa quando quer finalizar no CapCut
 * ou no Premiere.
 */
export async function maskPNG(doc, { scale = 1 } = {}) {
  const fmt = getFormat(doc.format);
  await resolveAll(doc);
  const c = document.createElement('canvas');
  c.width = Math.round(fmt.w * scale);
  c.height = Math.round(fmt.h * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  renderSlide(ctx, doc, 0, { W: fmt.w, H: fmt.h }, { transparent: true });
  return new Promise((res) => c.toBlob(res, 'image/png'));
}

/** Primeiro quadro utilizável como capa/poster do post. */
export async function grabPoster(videoEl, doc, { scale = 0.5, at = 0.1, framing = {} } = {}) {
  const fmt = getFormat(doc.format);
  await resolveAll(doc);
  await seek(videoEl, Math.min(at, (videoEl.duration || 1) * 0.1));
  const c = document.createElement('canvas');
  c.width = Math.round(fmt.w * scale);
  c.height = Math.round(fmt.h * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  drawFrame(ctx, videoEl, doc, { W: fmt.w, H: fmt.h }, framing);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82));
}

export function seek(videoEl, t) {
  return new Promise((res) => {
    let feito = false;
    const done = () => {
      if (feito) return;
      feito = true;
      videoEl.removeEventListener('seeked', done);
      res();
    };
    videoEl.addEventListener('seeked', done);
    try { videoEl.currentTime = t; } catch { return done(); }
    // Se já estava exatamente nessa posição, `seeked` não
    // dispara — o timeout é o que impede travar aqui.
    setTimeout(done, 900);
  });
}

export function fmtDuration(s) {
  if (!isFinite(s)) return '—';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
