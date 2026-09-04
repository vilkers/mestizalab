/* =========================================================
   Mestiza Lab — renderer
   Um único motor de desenho. Ele alimenta:
     · o preview no editor
     · o export PNG
     · a máscara queimada por cima do vídeo
   Consequência prática: não existe "ficou diferente no
   export". O pixel do preview é o pixel do arquivo.

   Sistema de coordenadas
   ----------------------
   Tudo em layer.box é NORMALIZADO (0..1) sobre o artboard.
   Tamanho de tipo é normalizado sobre a LARGURA. Assim uma
   composição sobrevive à troca de formato e a qualquer
   escala de export sem recalcular nada.
   ========================================================= */

export const FONT_STACK = {
  serif: "'STIX Two Text', Georgia, 'Times New Roman', serif",
  mono: "'Spline Sans Mono', ui-monospace, 'SF Mono', Menlo, monospace",
};

export const LOGO_SRC = {
  flat: 'assets/logo/logo-site-flat-tight.png',        // lockup empilhado, ~1:1
  horizontal: 'assets/logo/logo-horizontal-tight.png', // ~4.06:1
};

/* ---------------------------------------------------------
   Fontes
   O canvas não espera webfont carregar: se você desenhar
   antes, ele cai no fallback e o texto sai errado — e sai
   errado em silêncio. Então bloqueamos até estarem prontas.
   --------------------------------------------------------- */
let fontsReady = null;
export function ensureFonts() {
  if (fontsReady) return fontsReady;
  const faces = [
    "400 100px 'STIX Two Text'",
    "600 100px 'STIX Two Text'",
    "700 100px 'STIX Two Text'",
    "italic 400 100px 'STIX Two Text'",
    "italic 600 100px 'STIX Two Text'",
    "400 100px 'Spline Sans Mono'",
    "500 100px 'Spline Sans Mono'",
    "600 100px 'Spline Sans Mono'",
  ];
  fontsReady = (document.fonts
    ? Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready)
    : Promise.resolve()
  ).catch(() => null);
  return fontsReady;
}

/* ---------------------------------------------------------
   Imagens — cache por src
   --------------------------------------------------------- */
const imgCache = new Map();
export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    // Necessário para o canvas não ser marcado como "tainted"
    // ao exportar. O Worker devolve os headers de CORS.
    if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imgCache.set(src, p);
  return p;
}
export function clearImage(src) { imgCache.delete(src); }

/** Carrega tudo que o documento referencia antes de desenhar. */
export async function preloadDoc(doc) {
  const srcs = new Set();
  for (const slide of doc.slides || []) {
    for (const l of slide.layers || []) {
      if (l.type === 'image' && l.src) srcs.add(l.src);
      if (l.type === 'logo') srcs.add(LOGO_SRC[l.variant] || LOGO_SRC.horizontal);
    }
  }
  await Promise.all([ensureFonts(), ...[...srcs].map(loadImage)]);
}

/* =========================================================
   Texto
   ========================================================= */

function fontString(l, W) {
  const px = Math.max(1, (l.size || 0.06) * W);
  const style = l.italic ? 'italic ' : '';
  const fam = FONT_STACK[l.font === 'mono' ? 'mono' : 'serif'];
  return `${style}${l.weight || 400} ${px}px ${fam}`;
}

function applyText(text, transform) {
  if (transform === 'upper') return String(text).toLocaleUpperCase('pt-BR');
  if (transform === 'lower') return String(text).toLocaleLowerCase('pt-BR');
  return String(text);
}

const supportsLetterSpacing = (() => {
  try {
    const c = document.createElement('canvas').getContext('2d');
    return 'letterSpacing' in c;
  } catch { return false; }
})();

/**
 * Mede uma linha respeitando tracking.
 *
 * Regra de craft: com tracking 0 usamos fillText nativo, que
 * preserva kerning e ligaturas — e as ligaturas do STIX são
 * metade da beleza do display. Só quando há tracking (ou
 * seja, nos micro-labels em mono, onde kerning não importa)
 * é que caímos no desenho caractere a caractere.
 */
function measureLine(ctx, text, trackPx) {
  if (!trackPx) return ctx.measureText(text).width;
  if (supportsLetterSpacing) return ctx.measureText(text).width;
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + trackPx;
  return w - trackPx;
}

function drawLine(ctx, text, x, y, trackPx, align, maxW) {
  if (!trackPx || supportsLetterSpacing) {
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return;
  }
  // Fallback manual: posicionamos à esquerda e compensamos
  // o alinhamento na mão para bater com a medição acima.
  const w = measureLine(ctx, text, trackPx);
  let cx = x;
  if (align === 'center') cx = x - w / 2;
  else if (align === 'right') cx = x - w;
  ctx.textAlign = 'left';
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + trackPx;
  }
}

/**
 * Quebra o texto na largura da caixa.
 * Respeita quebras manuais (\n) e não estoura no meio de
 * palavra, exceto quando uma palavra sozinha já não cabe.
 */
function wrapText(ctx, text, maxW, trackPx) {
  const out = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) { out.push(''); continue; }
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? line + ' ' + word : word;
      if (measureLine(ctx, test, trackPx) <= maxW || !line) {
        // Palavra única maior que a caixa: parte por caractere.
        if (!line && measureLine(ctx, word, trackPx) > maxW) {
          let chunk = '';
          for (const ch of word) {
            if (measureLine(ctx, chunk + ch, trackPx) > maxW && chunk) { out.push(chunk); chunk = ch; }
            else chunk += ch;
          }
          line = chunk;
        } else line = test;
      } else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}

/**
 * Layout completo de um layer de texto.
 * Devolve linhas, altura total e o tamanho efetivo — que
 * pode ser menor que o pedido quando fitMode = 'shrink'.
 */
export function layoutText(ctx, l, A) {
  const { W, H } = A;
  const box = l.box || { x: 0, y: 0, w: 1, h: 1 };
  const maxW = box.w * W;
  const maxH = (box.h || 1) * H;
  const text = applyText(l.text ?? '', l.transform);

  let size = l.size || 0.06;
  let lines, lineH, tracking;

  for (let pass = 0; pass < 24; pass++) {
    ctx.font = fontString({ ...l, size }, W);
    tracking = (l.tracking || 0) * size * W;
    if (supportsLetterSpacing) ctx.letterSpacing = `${tracking}px`;
    lineH = size * W * (l.leading || 1.1);
    lines = wrapText(ctx, text, maxW, tracking);
    if (l.maxLines && lines.length > l.maxLines) lines = lines.slice(0, l.maxLines);
    const total = lines.length * lineH;
    if (l.fitMode !== 'shrink' || total <= maxH || size <= 0.008) break;
    size *= 0.94;
  }
  if (supportsLetterSpacing) ctx.letterSpacing = '0px';

  return { lines, lineH, size, tracking, height: lines.length * lineH, box };
}

function drawText(ctx, l, A) {
  const { W, H } = A;
  const lay = layoutText(ctx, l, A);
  const box = lay.box;

  ctx.font = fontString({ ...l, size: lay.size }, W);
  if (supportsLetterSpacing) ctx.letterSpacing = `${lay.tracking}px`;
  ctx.fillStyle = l.color || '#f4f1ea';
  ctx.textBaseline = 'alphabetic';

  const align = l.align || 'left';
  const bx = box.x * W, by = box.y * H, bw = box.w * W, bh = (box.h || 0) * H;
  const x = align === 'center' ? bx + bw / 2 : align === 'right' ? bx + bw : bx;

  // Ancoragem vertical do bloco dentro da caixa.
  let top = by;
  if (l.valign === 'middle') top = by + (bh - lay.height) / 2;
  else if (l.valign === 'bottom') top = by + bh - lay.height;

  // Primeira baseline: aproximação de ascender em 0.78 do
  // corpo. Vale para os dois tipos usados aqui e mantém o
  // bloco opticamente dentro da caixa.
  let y = top + lay.size * W * 0.78;

  for (const line of lay.lines) {
    drawLine(ctx, line, x, y, lay.tracking, align, bw);
    y += lay.lineH;
  }
  if (supportsLetterSpacing) ctx.letterSpacing = '0px';
  return lay;
}

/* =========================================================
   Imagem
   ========================================================= */

/** Retângulo-fonte para cover/contain com foco e zoom. */
export function imageRect(img, l, A) {
  const { W, H } = A;
  const box = l.box || { x: 0, y: 0, w: 1, h: 1 };
  const dx = box.x * W, dy = box.y * H, dw = box.w * W, dh = box.h * H;
  const zoom = Math.max(1, l.zoom || 1);
  const ir = img.naturalWidth / img.naturalHeight;
  const br = dw / dh;

  let sw, sh;
  if (l.fit === 'contain') {
    // contain nunca corta: a caixa é preenchida pelo fundo.
    const s = Math.min(dw / img.naturalWidth, dh / img.naturalHeight) * zoom;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    return { mode: 'contain', dx, dy, dw, dh, ox: dx + (dw - w) / 2, oy: dy + (dh - h) / 2, ow: w, oh: h };
  }
  if (ir > br) { sh = img.naturalHeight / zoom; sw = sh * br; }
  else { sw = img.naturalWidth / zoom; sh = sw / br; }

  // focal 0..1 escolhe QUAL parte da imagem sobrevive ao corte.
  const fx = l.fx ?? 0.5, fy = l.fy ?? 0.5;
  const sx = Math.max(0, Math.min(img.naturalWidth - sw, fx * img.naturalWidth - sw / 2));
  const sy = Math.max(0, Math.min(img.naturalHeight - sh, fy * img.naturalHeight - sh / 2));
  return { mode: 'cover', sx, sy, sw, sh, dx, dy, dw, dh };
}

/** Grades de cor. Composite ops em vez de ctx.filter:
    funcionam igual em todo browser que nos interessa. */
function gradeCanvas(src, w, h, grade) {
  const g = grade && grade.mode ? grade.mode : 'none';
  if (g === 'none') return src;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0, w, h);
  const amt = grade.amount ?? 1;

  if (g === 'bw' || g === 'duotone') {
    x.globalCompositeOperation = 'saturation';
    x.globalAlpha = amt;
    x.fillStyle = '#808080';
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
  }
  if (g === 'duotone') {
    // Sombra puxa pro preto da marca, luz pro dourado.
    x.globalCompositeOperation = 'multiply';
    x.globalAlpha = 0.9 * amt;
    x.fillStyle = grade.shadow || '#0a0a0a';
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'screen';
    x.globalAlpha = 0.55 * amt;
    x.fillStyle = grade.light || '#c9a86a';
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
  }
  if (g === 'warm') {
    x.globalCompositeOperation = 'overlay';
    x.globalAlpha = 0.28 * amt;
    x.fillStyle = '#c9a86a';
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
  }
  if (g === 'contrast') {
    x.globalCompositeOperation = 'overlay';
    x.globalAlpha = 0.45 * amt;
    x.drawImage(src, 0, 0, w, h);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
  }
  return c;
}

function drawImageLayer(ctx, l, A) {
  const img = imgSync(l.src);
  const r = imageRect(img || { naturalWidth: 1, naturalHeight: 1 }, l, A);

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.dx, r.dy, r.dw, r.dh);
  ctx.clip();

  if (!img) {
    // Placeholder: nunca uma caixa cinza sem informação.
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(r.dx, r.dy, r.dw, r.dh);
    ctx.strokeStyle = '#232323';
    ctx.lineWidth = Math.max(1, A.W * 0.001);
    ctx.strokeRect(r.dx, r.dy, r.dw, r.dh);
    ctx.fillStyle = '#4a4843';
    ctx.font = `500 ${A.W * 0.022}px ${FONT_STACK.mono}`;
    ctx.textAlign = 'center';
    ctx.fillText('SEM IMAGEM', r.dx + r.dw / 2, r.dy + r.dh / 2);
    ctx.restore();
    return;
  }

  const graded = gradeCanvas(img, img.naturalWidth, img.naturalHeight, l.grade);
  if (r.mode === 'contain') {
    if (l.bg) { ctx.fillStyle = l.bg; ctx.fillRect(r.dx, r.dy, r.dw, r.dh); }
    ctx.drawImage(graded, r.ox, r.oy, r.ow, r.oh);
  } else {
    ctx.drawImage(graded, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
  }
  ctx.restore();
}

// Acesso síncrono ao cache — o renderer só roda depois de preloadDoc.
const resolved = new Map();
export function primeResolved(src, img) { if (img) resolved.set(src, img); }
function imgSync(src) { return resolved.get(src) || null; }

/* =========================================================
   Outros layers
   ========================================================= */

function drawScrim(ctx, l, A) {
  const { W, H } = A;
  const box = l.box || { x: 0, y: 0, w: 1, h: 1 };
  const x = box.x * W, y = box.y * H, w = box.w * W, h = box.h * H;
  const c = l.color || '#000000';
  const s = l.strength ?? 0.72;
  let grad;
  if (l.direction === 'top') {
    grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, hexA(c, s)); grad.addColorStop(1, hexA(c, 0));
  } else if (l.direction === 'radial') {
    grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, hexA(c, s * 0.75)); grad.addColorStop(1, hexA(c, s));
  } else if (l.direction === 'full') {
    grad = null; ctx.fillStyle = hexA(c, s);
  } else {
    grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, hexA(c, 0));
    grad.addColorStop(0.55, hexA(c, s * 0.72));
    grad.addColorStop(1, hexA(c, s));
  }
  if (grad) ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function drawRect(ctx, l, A) {
  const { W, H } = A;
  const b = l.box;
  const x = b.x * W, y = b.y * H, w = b.w * W, h = b.h * H;
  if (l.fill) { ctx.fillStyle = l.fill; ctx.fillRect(x, y, w, h); }
  if (l.stroke) {
    const lw = Math.max(1, (l.strokeW ?? 0.0012) * W);
    ctx.strokeStyle = l.stroke;
    ctx.lineWidth = lw;
    ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
  }
}

function drawLineLayer(ctx, l, A) {
  const { W, H } = A;
  const b = l.box;
  const t = Math.max(1, (l.thickness ?? 0.0012) * W);
  ctx.fillStyle = l.color || '#232323';
  if (l.orient === 'v') ctx.fillRect(b.x * W, b.y * H, t, b.h * H);
  else ctx.fillRect(b.x * W, b.y * H, b.w * W, t);
}

/**
 * Logo: recolorido por source-in. A arte original é branca
 * sobre transparente, então qualquer cor da marca funciona.
 *
 * `box` é a CAIXA DE ALINHAMENTO (normalmente a largura da
 * zona segura) e `size` é a largura da MARCA dentro dela.
 * Separar os dois é o que permite alinhar à direita sem que
 * o logo cresça até a largura da caixa.
 */
function drawLogo(ctx, l, A) {
  const { W, H } = A;
  const src = LOGO_SRC[l.variant] || LOGO_SRC.horizontal;
  const img = imgSync(src);
  if (!img) return;
  const b = l.box;
  const bw = (l.size ?? b.w) * W;
  const ratio = img.naturalHeight / img.naturalWidth;
  const bh = bw * ratio;
  let x = b.x * W;
  const align = l.align || 'left';
  if (align === 'center') x = b.x * W + (b.w * W - bw) / 2;
  if (align === 'right') x = b.x * W + b.w * W - bw;
  const y = b.y * H;

  const t = document.createElement('canvas');
  t.width = Math.max(1, Math.round(bw)); t.height = Math.max(1, Math.round(bh));
  const tx = t.getContext('2d');
  tx.drawImage(img, 0, 0, t.width, t.height);
  tx.globalCompositeOperation = 'source-in';
  tx.fillStyle = l.color || '#f4f1ea';
  tx.fillRect(0, 0, t.width, t.height);
  ctx.drawImage(t, x, y, bw, bh);
}

/** Numeração de carrossel: 01 / 05 */
function drawCounter(ctx, l, A, ctxInfo) {
  const n = String((ctxInfo.index ?? 0) + 1).padStart(2, '0');
  const total = String(ctxInfo.total ?? 1).padStart(2, '0');
  drawText(ctx, { ...l, type: 'text', text: l.template ? l.template.replace('{n}', n).replace('{total}', total) : `${n} / ${total}` }, A);
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* =========================================================
   Render
   ========================================================= */

const BLEND_OK = new Set(['normal', 'multiply', 'screen', 'overlay', 'difference', 'exclusion', 'soft-light', 'hard-light', 'color-dodge', 'luminosity']);

export function drawLayer(ctx, l, A, info = {}) {
  if (l.hidden) return;
  ctx.save();
  ctx.globalAlpha = l.opacity ?? 1;
  const blend = l.blend && BLEND_OK.has(l.blend) ? l.blend : 'source-over';
  ctx.globalCompositeOperation = blend === 'normal' ? 'source-over' : blend;

  if (l.rotate) {
    const b = l.box || { x: 0, y: 0, w: 1, h: 1 };
    const cx = (b.x + b.w / 2) * A.W, cy = (b.y + (b.h || 0) / 2) * A.H;
    ctx.translate(cx, cy); ctx.rotate((l.rotate * Math.PI) / 180); ctx.translate(-cx, -cy);
  }

  switch (l.type) {
    case 'image':   drawImageLayer(ctx, l, A); break;
    case 'text':    drawText(ctx, l, A); break;
    case 'counter': drawCounter(ctx, l, A, info); break;
    case 'scrim':   drawScrim(ctx, l, A); break;
    case 'rect':    drawRect(ctx, l, A); break;
    case 'line':    drawLineLayer(ctx, l, A); break;
    case 'logo':    drawLogo(ctx, l, A); break;
  }
  ctx.restore();
}

/**
 * Desenha um slide num canvas já dimensionado.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} doc
 * @param {number} index
 * @param {{W:number,H:number}} A  dimensões do artboard em px de destino
 */
export function renderSlide(ctx, doc, index, A, opts = {}) {
  const slide = (doc.slides || [])[index];
  ctx.save();

  if (!opts.transparent) {
    // Peça fechada: limpa e pinta o fundo. Um PNG de campanha
    // não sai com fundo transparente por acidente.
    ctx.clearRect(0, 0, A.W, A.H);
    ctx.fillStyle = (slide && slide.bg) || doc.bg || '#000000';
    ctx.fillRect(0, 0, A.W, A.H);
  }
  // Em modo transparente NÃO se limpa nada — este é o caminho
  // da máscara sobre vídeo, onde o quadro do clipe já está no
  // canvas e um clearRect aqui apagaria a imagem, deixando a
  // moldura perfeita sobre um retângulo preto. Num canvas novo
  // (export da máscara em PNG) não limpar é inócuo: ele já
  // nasce transparente.

  if (!slide) { ctx.restore(); return; }

  const info = { index, total: (doc.slides || []).length };
  for (const l of slide.layers || []) drawLayer(ctx, l, A, info);
  ctx.restore();
}

/** Resolve as imagens do cache assíncrono para o cache síncrono. */
export async function resolveAll(doc) {
  const srcs = new Set();
  for (const slide of doc.slides || []) {
    for (const l of slide.layers || []) {
      if (l.type === 'image' && l.src) srcs.add(l.src);
      if (l.type === 'logo') srcs.add(LOGO_SRC[l.variant] || LOGO_SRC.horizontal);
    }
  }
  await ensureFonts();
  await Promise.all([...srcs].map(async (s) => primeResolved(s, await loadImage(s))));
}

/* ---------------------------------------------------------
   Hit-testing — usado pelo editor para selecionar no toque.
   Percorre de cima para baixo: o layer visualmente na
   frente ganha o toque.
   --------------------------------------------------------- */
export function hitTest(doc, index, nx, ny) {
  const slide = (doc.slides || [])[index];
  if (!slide) return null;
  const layers = slide.layers || [];
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (l.hidden || l.locked) continue;
    let b = l.box;
    if (!b) continue;
    if (l.type === 'logo' && l.size != null && l.size !== b.w) {
      // A caixa do logo é só alinhamento — o alvo de toque é a marca.
      const align = l.align || 'left';
      const x = align === 'center' ? b.x + (b.w - l.size) / 2
              : align === 'right'  ? b.x + b.w - l.size
              : b.x;
      b = { x, y: b.y, w: l.size, h: b.h };
    }
    const h = b.h || 0.06;
    // Folga de 1.5% para o dedo, que não é um cursor.
    const pad = 0.015;
    if (nx >= b.x - pad && nx <= b.x + b.w + pad && ny >= b.y - pad && ny <= b.y + h + pad) return l;
  }
  return null;
}
