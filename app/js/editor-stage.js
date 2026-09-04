/* =========================================================
   Mestiza Lab — palco do editor
   Canvas + gestos. Separado da view porque interação de
   toque é um assunto inteiro: seleção, arraste, pinça,
   troca de slide, guias.

   Regras de toque adotadas
   ------------------------
   · toque simples seleciona o que está por baixo
   · arrastar uma IMAGEM move o enquadramento (o recorte),
     não a caixa — é isso que o usuário quer 9 de 10 vezes
   · arrastar um TEXTO move a caixa
   · pinçar sobre imagem dá zoom no recorte
   · com nada selecionado, arrastar na horizontal troca o
     slide do carrossel
   · toque duplo devolve o layer ao original do template
   ========================================================= */

import { renderSlide, hitTest, resolveAll } from './renderer.js';
import { getFormat, safeBox } from './formats.js';

const NS = 'http://www.w3.org/2000/svg';

export class Stage {
  constructor(store, { onSelect, onSlide, onCommit } = {}) {
    this.store = store;
    this.onSelect = onSelect || (() => {});
    this.onSlide = onSlide || (() => {});
    this.onCommit = onCommit || (() => {});

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ed-canvas';
    this.overlay = document.createElementNS(NS, 'svg');
    this.overlay.setAttribute('class', 'ed-overlay');
    this.overlay.setAttribute('preserveAspectRatio', 'none');

    this.wrap = document.createElement('div');
    this.wrap.className = 'ed-canvas-wrap';
    this.wrap.append(this.canvas, this.overlay);

    // Grade e imã. `grid` desligado por padrão: quem só preenche
    // template não precisa vê-la; quem vai diagramar liga.
    // `snap` LIGADO por padrão — imantar é o comportamento que
    // as pessoas esperam mesmo sem saber que existe.
    this.guides = { safe: true, thirds: false, grid: false, baseline: false, snap: true };
    this._snapAtivo = { x: null, y: null };
    this._raf = 0;
    this._pending = false;
    this._bind();
  }

  mount(parent) {
    parent.appendChild(this.wrap);
    this._ro = new ResizeObserver(() => this.fit());
    this._ro.observe(parent);
    this.fit();
    return this;
  }

  destroy() {
    this._ro?.disconnect();
    cancelAnimationFrame(this._raf);
    this.wrap.remove();
  }

  /* ---------------------------------------------------------
     Dimensionamento
     O canvas é desenhado na resolução do aparelho (DPR) mas
     limitado a 2x: em 3x um 1080×1920 vira 3240×5760 e o
     celular engasga a cada toque, sem ganho visível.
     --------------------------------------------------------- */
  fit() {
    const parent = this.wrap.parentElement;
    if (!parent) return;
    const fmt = getFormat(this.store.formato);
    const pad = 0;
    const availW = parent.clientWidth - pad;
    const availH = parent.clientHeight - pad;
    if (availW <= 0 || availH <= 0) return;

    const ratio = fmt.w / fmt.h;
    let w = availW, h = w / ratio;
    if (h > availH) { h = availH; w = h * ratio; }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cssW = w; this.cssH = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.wrap.style.width = w + 'px';
    this.wrap.style.height = h + 'px';
    this.overlay.setAttribute('viewBox', `0 0 ${fmt.w} ${fmt.h}`);
    this.overlay.setAttribute('width', w);
    this.overlay.setAttribute('height', h);
    this.draw();
  }

  /* ---------------------------------------------------------
     Desenho — sempre agendado num rAF. Digitar num textarea
     dispara um input por tecla; sem isso, redesenharíamos
     1080×1350 a cada letra.
     --------------------------------------------------------- */
  draw() {
    if (this._pending) return;
    this._pending = true;
    this._raf = requestAnimationFrame(async () => {
      this._pending = false;
      const doc = this.store.doc;
      const fmt = getFormat(doc.format);
      await resolveAll(doc);
      const ctx = this.canvas.getContext('2d');
      const s = this.canvas.width / fmt.w;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      renderSlide(ctx, doc, this.store.slideIndex, { W: fmt.w, H: fmt.h });
      // Devolver o contexto neutro é obrigatório: o preview de
      // vídeo desenha neste mesmo canvas e herdaria a escala,
      // aplicando-a duas vezes.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.drawOverlay();
    });
  }

  /**
   * A grade vive DENTRO da zona segura, não do artboard.
   * É o que faz a mesma grade servir 4:5 e Stories sem virar
   * outra grade. Spec em docs/04-DESIGN-SYSTEM.md.
   */
  gridSpec(fmt) {
    const s = safeBox(fmt);
    const cols = 6;
    const gutter = 0.022;                       // fração da LARGURA
    const colW = (s.w - gutter * (cols - 1)) / cols;
    // A calha vertical vale o mesmo em PIXELS, não em fração —
    // senão em 9:16 ela ficaria quase o dobro da horizontal.
    const gutterY = gutter * (fmt.w / fmt.h);
    const rows = fmt.h / fmt.w > 1.2 ? 8 : 6;
    const rowH = (s.h - gutterY * (rows - 1)) / rows;
    // Baseline como fração da ALTURA ÚTIL, não da largura.
    // Em fração da largura ela virava ~75 linhas num 4:5 e o
    // canvas lia como textura, não como ritmo. 24 divisões é
    // o que se enxerga como grade.
    return { safe: s, cols, rows, gutter, gutterY, colW, rowH,
             baseline: s.h / 24 };
  }

  /** Linhas verticais em que um elemento pode imantar. */
  _alvosX(fmt) {
    const g = this.gridSpec(fmt);
    const out = [g.safe.x, g.safe.x + g.safe.w, 0.5];
    for (let i = 0; i < g.cols; i++) {
      const x = g.safe.x + i * (g.colW + g.gutter);
      out.push(x, x + g.colW);
    }
    return out;
  }

  _alvosY(fmt) {
    const g = this.gridSpec(fmt);
    const out = [g.safe.y, g.safe.y + g.safe.h, 0.5];
    for (let i = 0; i < g.rows; i++) {
      const y = g.safe.y + i * (g.rowH + g.gutterY);
      out.push(y, y + g.rowH);
    }
    if (this.guides.baseline) {
      for (let y = g.safe.y; y <= g.safe.y + g.safe.h + 1e-6; y += g.baseline) out.push(y);
    }
    return out;
  }

  /**
   * Imanta uma das três referências da caixa (borda inicial,
   * centro, borda final) ao alvo mais próximo. Devolve o
   * deslocamento a aplicar e a linha que deve acender.
   */
  _imantar(pos, tam, alvos, tol) {
    let melhor = null;
    for (const a of alvos) {
      for (const [ref, delta] of [[pos, 0], [pos + tam / 2, tam / 2], [pos + tam, tam]]) {
        const d = Math.abs(ref - a);
        if (d < tol && (!melhor || d < melhor.d)) melhor = { d, pos: a - delta, guia: a };
      }
    }
    return melhor;
  }

  drawOverlay() {
    const fmt = getFormat(this.store.formato);
    while (this.overlay.firstChild) this.overlay.removeChild(this.overlay.firstChild);

    // A grade entra ANTES da zona segura para ficar por baixo:
    // a régua dourada da safe tem que continuar sendo a mais
    // legível das guias.
    if (this.guides.grid) {
      const g = this.gridSpec(fmt);
      for (let i = 0; i < g.cols; i++) {
        const x = (g.safe.x + i * (g.colW + g.gutter)) * fmt.w;
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('class', 'col');
        r.setAttribute('x', x); r.setAttribute('y', g.safe.y * fmt.h);
        r.setAttribute('width', g.colW * fmt.w); r.setAttribute('height', g.safe.h * fmt.h);
        this.overlay.appendChild(r);
      }
      for (let i = 1; i < g.rows; i++) {
        const y = (g.safe.y + i * (g.rowH + g.gutterY) - g.gutterY / 2) * fmt.h;
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('class', 'rowline');
        l.setAttribute('x1', g.safe.x * fmt.w); l.setAttribute('x2', (g.safe.x + g.safe.w) * fmt.w);
        l.setAttribute('y1', y); l.setAttribute('y2', y);
        this.overlay.appendChild(l);
      }
      if (this.guides.baseline) {
        for (let y = g.safe.y; y <= g.safe.y + g.safe.h + 1e-6; y += g.baseline) {
          const l = document.createElementNS(NS, 'line');
          l.setAttribute('class', 'baseline');
          l.setAttribute('x1', g.safe.x * fmt.w); l.setAttribute('x2', (g.safe.x + g.safe.w) * fmt.w);
          l.setAttribute('y1', y * fmt.h); l.setAttribute('y2', y * fmt.h);
          this.overlay.appendChild(l);
        }
      }
    }

    if (this.guides.safe) {
      const s = safeBox(fmt);
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('class', 'safe');
      r.setAttribute('x', s.x * fmt.w); r.setAttribute('y', s.y * fmt.h);
      r.setAttribute('width', s.w * fmt.w); r.setAttribute('height', s.h * fmt.h);
      this.overlay.appendChild(r);
    }
    if (this.guides.thirds) {
      for (const f of [1 / 3, 2 / 3]) {
        const v = document.createElementNS(NS, 'line');
        v.setAttribute('class', 'thirds');
        v.setAttribute('x1', fmt.w * f); v.setAttribute('x2', fmt.w * f);
        v.setAttribute('y1', 0); v.setAttribute('y2', fmt.h);
        const h = document.createElementNS(NS, 'line');
        h.setAttribute('class', 'thirds');
        h.setAttribute('y1', fmt.h * f); h.setAttribute('y2', fmt.h * f);
        h.setAttribute('x1', 0); h.setAttribute('x2', fmt.w);
        this.overlay.append(v, h);
      }
    }
    const sel = this.store.selected;
    if (sel && sel.box) {
      let b = sel.box;
      if (sel.type === 'logo' && sel.size != null) {
        const a = sel.align || 'left';
        const x = a === 'center' ? b.x + (b.w - sel.size) / 2 : a === 'right' ? b.x + b.w - sel.size : b.x;
        b = { x, y: b.y, w: sel.size, h: b.h };
      }
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('class', 'sel');
      r.setAttribute('x', b.x * fmt.w); r.setAttribute('y', b.y * fmt.h);
      r.setAttribute('width', b.w * fmt.w); r.setAttribute('height', (b.h || 0.05) * fmt.h);
      this.overlay.appendChild(r);
    }

    // A guia de imã é a única que grita. As outras existem
    // para serem ignoradas até você precisar delas.
    if (this._snapAtivo.x != null) {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('class', 'snap');
      l.setAttribute('x1', this._snapAtivo.x * fmt.w); l.setAttribute('x2', this._snapAtivo.x * fmt.w);
      l.setAttribute('y1', 0); l.setAttribute('y2', fmt.h);
      this.overlay.appendChild(l);
    }
    if (this._snapAtivo.y != null) {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('class', 'snap');
      l.setAttribute('y1', this._snapAtivo.y * fmt.h); l.setAttribute('y2', this._snapAtivo.y * fmt.h);
      l.setAttribute('x1', 0); l.setAttribute('x2', fmt.w);
      this.overlay.appendChild(l);
    }
  }

  /* ---------------------------------------------------------
     Gestos
     --------------------------------------------------------- */
  _norm(e) {
    const r = this.canvas.getBoundingClientRect();
    return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height };
  }

  _bind() {
    const pointers = new Map();
    let mode = null;          // 'layer' | 'swipe' | 'pinch'
    let start = null;
    let pinchStart = 0;
    let lastTap = 0;
    let moved = false;

    const el = this.wrap;

    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, e);
      moved = false;

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const l = this.store.selected;
        if (l && (l.type === 'image')) {
          mode = 'pinch';
          start = { zoom: l.zoom || 1, id: l.id };
          this.store.beginLive();
        }
        return;
      }

      const { nx, ny } = this._norm(e);
      const hit = hitTest(this.store.doc, this.store.slideIndex, nx, ny);
      const now = Date.now();

      // Toque duplo no mesmo layer: devolve ao original.
      if (hit && now - lastTap < 320 && this.store.selection === hit.id) {
        this.store.resetLayer(hit.id);
        this.onCommit();
        lastTap = 0;
        return;
      }
      lastTap = now;

      if (hit) {
        this.store.select(hit.id);
        this.onSelect(hit.id);
        mode = 'layer';
        const l = this.store.layer(hit.id);
        start = {
          id: hit.id, nx, ny,
          box: { ...l.box },
          fx: l.fx ?? 0.5, fy: l.fy ?? 0.5,
          type: l.type, zoom: l.zoom || 1,
        };
        this.store.beginLive();
      } else {
        this.store.select(null);
        this.onSelect(null);
        mode = this.store.slideCount > 1 ? 'swipe' : null;
        start = { nx, ny, x0: e.clientX };
        this.drawOverlay();
      }
    });

    el.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e);

      if (mode === 'pinch' && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const zoom = Math.max(1, Math.min(4, start.zoom * (d / pinchStart)));
        this.store.setLayerLive(start.id, { zoom });
        moved = true;
        return;
      }
      if (mode !== 'layer' && mode !== 'swipe') return;

      const { nx, ny } = this._norm(e);
      const dx = nx - start.nx, dy = ny - start.ny;
      if (Math.abs(dx) > 0.008 || Math.abs(dy) > 0.008) moved = true;
      if (!moved) return;

      if (mode === 'layer') {
        if (start.type === 'image') {
          // Move o RECORTE. O sinal é invertido: arrastar a
          // imagem para a esquerda revela o que está à direita.
          const z = start.zoom;
          this.store.setLayerLive(start.id, {
            fx: clamp(start.fx - dx * (1.15 / z)),
            fy: clamp(start.fy - dy * (1.15 / z)),
          });
        } else {
          let nx = start.box.x + dx;
          let ny = start.box.y + dy;
          this._snapAtivo = { x: null, y: null };

          // Alt segura o imã no desktop. No celular não existe
          // modificador no dedo — lá o toggle fica no painel.
          if (this.guides.snap && !e.altKey) {
            const fmt = getFormat(this.store.formato);
            const tolX = 0.008;
            const tolY = tolX * (fmt.w / fmt.h);   // mesma folga em PIXELS
            const bw = start.box.w;
            const bh = start.box.h || 0.05;

            const sx = this._imantar(nx, bw, this._alvosX(fmt), tolX);
            if (sx) { nx = sx.pos; this._snapAtivo.x = sx.guia; }
            const sy = this._imantar(ny, bh, this._alvosY(fmt), tolY);
            if (sy) { ny = sy.pos; this._snapAtivo.y = sy.guia; }
          }
          this.store.setLayerLive(start.id, { box: { ...start.box, x: nx, y: ny } });
        }
      }
    });

    const up = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);

      if (mode === 'swipe' && moved) {
        const dx = e.clientX - start.x0;
        if (Math.abs(dx) > 44) this.store.goSlide(this.store.slideIndex + (dx < 0 ? 1 : -1));
        this.onSlide(this.store.slideIndex);
      }
      if ((mode === 'layer' || mode === 'pinch') && moved) {
        this._snapAtivo = { x: null, y: null };
        this.store.endLive();
        this.onCommit();
        this.drawOverlay();
      }
      if (pointers.size === 0) { mode = null; start = null; }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    // Roda do mouse dá zoom no recorte da imagem selecionada.
    el.addEventListener('wheel', (e) => {
      const l = this.store.selected;
      if (!l || l.type !== 'image') return;
      e.preventDefault();
      const zoom = Math.max(1, Math.min(4, (l.zoom || 1) * (e.deltaY < 0 ? 1.06 : 0.94)));
      this.store.setLayer(l.id, { zoom });
      this.onCommit();
    }, { passive: false });
  }
}

function clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }
