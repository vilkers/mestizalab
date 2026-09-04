/* =========================================================
   Mestiza Lab — export
   O mesmo renderer do preview, só que em escala cheia.
   ========================================================= */

import { getFormat } from './formats.js';
import { renderSlide, resolveAll } from './renderer.js';

/** Canvas do slide em escala. scale 1 = 1080px de largura. */
export async function renderToCanvas(doc, index, { scale = 1, transparent = false } = {}) {
  const fmt = getFormat(doc.format);
  await resolveAll(doc);
  const c = document.createElement('canvas');
  c.width = Math.round(fmt.w * scale);
  c.height = Math.round(fmt.h * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);
  renderSlide(ctx, doc, index, { W: fmt.w, H: fmt.h }, { transparent });
  return c;
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((res) => canvas.toBlob((b) => res(b), type, quality));
}

export async function slideBlob(doc, index, opts = {}) {
  return canvasToBlob(await renderToCanvas(doc, index, opts), opts.type || 'image/png', opts.quality);
}

/** Nome de arquivo previsível: ordena sozinho no rolo da câmera. */
export function slideName(store, index, ext = 'png') {
  const base = (store.titulo || 'post')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'post';
  const n = store.slideCount > 1 ? `-${String(index + 1).padStart(2, '0')}` : '';
  return `mestiza-${base}${n}.${ext}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * No celular, "baixar" some numa pasta que ninguém acha.
 * Web Share nível 2 entrega o arquivo direto pro Instagram,
 * pro WhatsApp ou pro rolo da câmera. É o caminho certo lá.
 */
export function canShareFiles(files) {
  return !!(navigator.canShare && navigator.share && navigator.canShare({ files }));
}

/**
 * Três degraus, nesta ordem:
 *   1. Web Share  — entrega direto pro Instagram ou pro rolo
 *   2. Download   — o caminho de desktop
 *   3. Visual     — mostra a peça para salvar segurando
 *
 * O degrau 3 não é enfeite: em navegador embutido o download
 * é bloqueado pelo sandbox e o `<a download>` não faz nada,
 * em silêncio. Sem esse degrau, o botão Exportar pareceria
 * quebrado sem dar nenhuma pista.
 */
export async function shareOrDownload(blobs, names, { title = 'Mestiza', text = '' } = {}) {
  const files = blobs.map((b, i) => new File([b], names[i], { type: b.type }));
  if (canShareFiles(files)) {
    try {
      await navigator.share({ files, title, text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // Share falhou por outro motivo: desce um degrau.
    }
  }

  const { downloadBloqueado, abrirParaSalvar, abrirVideoParaSalvar } = await import('./views/salvar.js');
  if (downloadBloqueado()) {
    if (blobs[0] && blobs[0].type.startsWith('video')) abrirVideoParaSalvar(blobs[0], names[0]);
    else abrirParaSalvar(blobs, names, { title });
    return 'manual';
  }

  blobs.forEach((b, i) => downloadBlob(b, names[i]));
  return 'downloaded';
}

/* =========================================================
   ZIP
   Método STORE (sem compressão). PNG já vem comprimido — 
   deflate aqui gastaria CPU do celular para economizar ~1%.
   Escrito à mão para o app continuar sem dependências.
   ========================================================= */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

/** @param {{name:string, blob:Blob}[]} entries */
export async function makeZip(entries) {
  const enc = new TextEncoder();
  const { time, date } = dosTime();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const data = new Uint8Array(await e.blob.arrayBuffer());
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);      // versão necessária
    local.setUint16(6, 0x0800, true);  // flag UTF-8 no nome
    local.setUint16(8, 0, true);       // método: store
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, time, true);
    cd.setUint16(14, date, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const centralSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
