/* =========================================================
   Mestiza Lab — templates
   Cada template é uma FUNÇÃO que constrói layers a partir
   da zona segura do formato. Por isso o mesmo template
   serve 4:5, 1:1, 9:16 e Stories sem virar outro desenho:
   ele recalcula, não estica.

   Duas famílias, por decisão de marca:
   · INSTITUCIONAL — voz oficial. Grade rígida, hairline,
     serif com itálico dourado pontual, mono só em micro.
   · LIVRE — a editoria solta. Tipo sangrando, difference,
     duotone. Continua sendo Mestiza, mas sem a régua.
   ========================================================= */

import { safeBox, getFormat } from './formats.js';

const C = {
  bg: '#000000',
  fg: '#f4f1ea',
  dim: '#8a867d',
  faint: '#4a4843',
  line: '#232323',
  accent: '#c9a86a',
};

/* ---------------------------------------------------------
   Editorias — dado, não código. A que você criar depois
   entra aqui (ou vem do banco) e ganha área própria no app.
   --------------------------------------------------------- */
export const EDITORIAS = [
  {
    id: 'institucional',
    name: 'Institucional',
    kicker: 'Voz oficial do estúdio',
    desc: 'Grade rígida, hairline, serif com itálico dourado. É o que sustenta a marca.',
    accent: C.accent,
  },
  {
    id: 'livre',
    name: 'Livre',
    kicker: 'Fora do layout institucional',
    desc: 'Experimental. Tipo sangrando, blend difference, duotone. Continua sendo Mestiza — sem a régua.',
    accent: C.fg,
  },
  {
    id: 'video',
    name: 'Vídeo',
    kicker: 'Máscaras sobre Reels e Stories',
    desc: 'Molduras e faixas que entram por cima do vídeo. Nada invade a UI do Instagram.',
    accent: C.accent,
  },
];

/* ---------------------------------------------------------
   Peças recorrentes — o vocabulário da marca.
   Escrevo uma vez, todo template usa.
   --------------------------------------------------------- */

// `size` = largura da marca. `box` = a caixa em que ela se
// alinha. Manter os dois separados é o que deixa alinhar à
// direita sem o logo esticar até a borda.
const logoTop = (s, { w = 0.26, align = 'left', color = C.fg, y = null } = {}) => ({
  id: 'logo', type: 'logo', name: 'Marca', variant: 'horizontal', color, align,
  size: w, box: { x: s.x, y: y ?? s.y, w: s.w, h: w * 0.246 },
});

const kicker = (s, text, y, { color = C.dim, align = 'left', size = 0.0235 } = {}) => ({
  id: 'kicker', type: 'text', name: 'Chapéu', text, font: 'mono', size,
  weight: 500, tracking: 0.16, leading: 1.2, transform: 'upper',
  color, align, valign: 'top', box: { x: s.x, y, w: s.w, h: 0.06 },
});

const hairline = (s, y, { color = C.line, id = 'rule' } = {}) => ({
  id, type: 'line', name: 'Régua', orient: 'h', color, thickness: 0.0014,
  box: { x: s.x, y, w: s.w, h: 0.002 },
});

const scrimBottom = (strength = 0.86, from = 0.34) => ({
  id: 'scrim', type: 'scrim', name: 'Scrim', direction: 'bottom', color: '#000000',
  strength, box: { x: 0, y: from, w: 1, h: 1 - from },
});

const bleedImage = (src, extra = {}) => ({
  id: 'img', type: 'image', name: 'Imagem', src: src || '', fit: 'cover',
  fx: 0.5, fy: 0.5, zoom: 1, grade: { mode: 'none', amount: 1 },
  box: { x: 0, y: 0, w: 1, h: 1 }, ...extra,
});

/* =========================================================
   Templates
   ========================================================= */

export const TEMPLATES = [

  /* ---------- INSTITUCIONAL ---------- */

  {
    id: 'inst-declaracao',
    name: 'Declaração',
    editoria: 'institucional',
    hint: 'Foto + frase de campanha. O carro-chefe.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'imagem', type: 'image', label: 'Imagem de fundo' },
      { key: 'chapeu', type: 'text', label: 'Chapéu', default: 'Mestiza · ai estudio' },
      { key: 'titulo', type: 'text', label: 'Frase', multiline: true, default: 'A ideia continua\nsendo a parte\ndifícil.' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      // A frase come de baixo pra cima: o bloco de texto
      // ancora no rodapé da safe, a régua sobe com ele.
      const titleH = 0.34;
      const titleY = s.y + s.h - titleH;
      return [
        bleedImage(c.imagem, { grade: { mode: 'contrast', amount: 0.5 } }),
        // A rampa começa cedo e fecha em 0.95: o chapéu fica
        // sobre 60% de preto mesmo quando a foto é clara.
        scrimBottom(0.95, 0.24),
        { id: 'scrim-top', type: 'scrim', name: 'Scrim topo', direction: 'top', color: '#000000', strength: 0.5, box: { x: 0, y: 0, w: 1, h: 0.2 } },
        logoTop(s),
        hairline(s, titleY - 0.045, { color: 'rgba(244,241,234,0.35)' }),
        kicker(s, c.chapeu, titleY - 0.032, { color: C.fg }),
        {
          id: 'titulo', type: 'text', name: 'Frase', text: c.titulo,
          font: 'serif', size: 0.105, weight: 600, tracking: -0.028, leading: 0.96,
          color: C.fg, align: 'left', valign: 'bottom', fitMode: 'shrink',
          box: { x: s.x, y: titleY, w: s.w, h: titleH },
        },
      ];
    },
  },

  {
    id: 'inst-capa-projeto',
    name: 'Capa de projeto',
    editoria: 'institucional',
    hint: 'Imagem em cima, ficha técnica na faixa preta.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'imagem', type: 'image', label: 'Imagem' },
      { key: 'cliente', type: 'text', label: 'Cliente', default: 'Cliente' },
      { key: 'projeto', type: 'text', label: 'Projeto', multiline: true, default: 'Nome do projeto' },
      { key: 'ficha', type: 'text', label: 'Ficha técnica', default: 'Direção de arte · Still · 2026' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      const split = 0.665;   // a imagem fica com dois terços — proporção que não briga com o 4:5
      return [
        { ...bleedImage(c.imagem), box: { x: 0, y: 0, w: 1, h: split } },
        { id: 'faixa', type: 'rect', name: 'Faixa', fill: C.bg, box: { x: 0, y: split, w: 1, h: 1 - split } },
        { id: 'rule-top', type: 'line', name: 'Régua', orient: 'h', color: C.accent, thickness: 0.0018, box: { x: 0, y: split, w: 1, h: 0.002 } },
        kicker(s, c.cliente, split + 0.045, { color: C.accent }),
        {
          id: 'projeto', type: 'text', name: 'Projeto', text: c.projeto,
          font: 'serif', size: 0.072, weight: 600, tracking: -0.025, leading: 1.0,
          color: C.fg, align: 'left', valign: 'top', fitMode: 'shrink', maxLines: 3,
          box: { x: s.x, y: split + 0.085, w: s.w * 0.82, h: 0.17 },
        },
        { id: 'rule-foot', type: 'line', name: 'Régua rodapé', orient: 'h', color: C.line, thickness: 0.0014,
          box: { x: s.x, y: s.y + s.h - 0.072, w: s.w, h: 0.002 } },
        {
          id: 'ficha', type: 'text', name: 'Ficha', text: c.ficha,
          font: 'mono', size: 0.0195, weight: 400, tracking: 0.12, leading: 1.4, transform: 'upper',
          color: C.dim, align: 'left', valign: 'top',
          box: { x: s.x, y: s.y + s.h - 0.048, w: s.w * 0.62, h: 0.06 },
        },
        logoTop(s, { w: 0.17, align: 'right', color: C.fg, y: s.y + s.h - 0.052 }),
      ];
    },
  },

  {
    id: 'inst-citacao',
    name: 'Citação',
    editoria: 'institucional',
    hint: 'Preto puro, sem imagem. Só a fala.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'texto', type: 'text', label: 'Citação', multiline: true, default: 'Todo brief bom começa com uma pergunta que ninguém quer responder.' },
      { key: 'autor', type: 'text', label: 'Quem disse', default: 'Vilker Silva · Mestiza' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      return [
        // Aspa tipográfica gigante em 12% de opacidade: dá
        // profundidade ao preto chapado sem virar elemento.
        {
          id: 'aspa', type: 'text', name: 'Aspa', text: '“',
          font: 'serif', size: 0.62, weight: 400, italic: true, leading: 1,
          color: C.accent, opacity: 0.13, align: 'left', valign: 'top',
          box: { x: s.x - 0.02, y: s.y - 0.03, w: s.w, h: 0.5 },
        },
        logoTop(s, { w: 0.22 }),
        {
          id: 'texto', type: 'text', name: 'Citação', text: c.texto,
          font: 'serif', size: 0.062, weight: 500, tracking: -0.015, leading: 1.24,
          color: C.fg, align: 'left', valign: 'middle', fitMode: 'shrink',
          box: { x: s.x, y: s.y + 0.12, w: s.w, h: s.h - 0.26 },
        },
        hairline(s, s.y + s.h - 0.075, { color: C.accent, id: 'rule' }),
        {
          id: 'autor', type: 'text', name: 'Autor', text: c.autor,
          font: 'mono', size: 0.023, weight: 500, tracking: 0.16, leading: 1.2, transform: 'upper',
          color: C.dim, align: 'left', valign: 'top',
          box: { x: s.x, y: s.y + s.h - 0.05, w: s.w, h: 0.05 },
        },
      ];
    },
  },

  {
    id: 'inst-bastidores',
    name: 'Bastidores',
    editoria: 'institucional',
    hint: 'A foto manda. Só metadado em volta.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'imagem', type: 'image', label: 'Foto' },
      { key: 'label', type: 'text', label: 'Etiqueta', default: 'Bastidores' },
      { key: 'local', type: 'text', label: 'Local', default: 'São Paulo, BR' },
      { key: 'data', type: 'text', label: 'Data', default: '2026' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      const footY = s.y + s.h - 0.055;
      return [
        bleedImage(c.imagem, { grade: { mode: 'contrast', amount: 0.35 } }),
        { id: 'scrim-top', type: 'scrim', name: 'Scrim topo', direction: 'top', color: '#000000', strength: 0.6, box: { x: 0, y: 0, w: 1, h: 0.28 } },
        scrimBottom(0.7, 0.66),
        kicker(s, c.label, s.y, { color: C.fg }),
        // O ponto dourado é o mesmo do header do site.
        { id: 'dot', type: 'rect', name: 'Ponto', fill: C.accent,
          box: { x: s.x + s.w - 0.012, y: s.y + 0.004, w: 0.012, h: 0.012 * (fmt.w / fmt.h) } },
        hairline(s, footY - 0.02, { color: 'rgba(244,241,234,0.25)' }),
        {
          id: 'local', type: 'text', name: 'Local', text: c.local,
          font: 'mono', size: 0.021, weight: 400, tracking: 0.14, transform: 'upper',
          color: C.fg, align: 'left', valign: 'top', box: { x: s.x, y: footY, w: s.w * 0.6, h: 0.05 },
        },
        {
          id: 'data', type: 'text', name: 'Data', text: c.data,
          font: 'mono', size: 0.021, weight: 400, tracking: 0.14, transform: 'upper',
          color: C.fg, align: 'right', valign: 'top', box: { x: s.x, y: footY, w: s.w, h: 0.05 },
        },
      ];
    },
  },

  {
    id: 'inst-lista',
    name: 'Lista numerada',
    editoria: 'institucional',
    hint: 'Título + itens com hairline entre eles.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'chapeu', type: 'text', label: 'Chapéu', default: 'Como a gente trabalha' },
      { key: 'titulo', type: 'text', label: 'Título', multiline: true, default: 'Quatro etapas,\nnenhuma pulada.' },
      { key: 'itens', type: 'list', label: 'Itens', default: ['Briefing', 'Direção', 'Produção', 'Entrega'] },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      const items = (Array.isArray(c.itens) ? c.itens : String(c.itens || '').split('\n')).filter(Boolean).slice(0, 6);
      const listTop = s.y + 0.31;
      const listH = s.y + s.h - listTop - 0.06;
      const step = items.length ? listH / items.length : 0;
      const layers = [
        logoTop(s, { w: 0.22 }),
        kicker(s, c.chapeu, s.y + 0.1, { color: C.accent }),
        {
          id: 'titulo', type: 'text', name: 'Título', text: c.titulo,
          font: 'serif', size: 0.082, weight: 600, tracking: -0.028, leading: 0.98,
          color: C.fg, align: 'left', valign: 'top', fitMode: 'shrink',
          box: { x: s.x, y: s.y + 0.15, w: s.w, h: 0.16 },
        },
      ];
      items.forEach((t, i) => {
        const y = listTop + i * step;
        layers.push(hairline(s, y, { id: `rule-${i}` }));
        layers.push({
          id: `n-${i}`, type: 'text', name: `Nº ${i + 1}`, text: String(i + 1).padStart(2, '0'),
          font: 'mono', size: 0.022, weight: 500, tracking: 0.1,
          color: C.accent, align: 'left', valign: 'top',
          box: { x: s.x, y: y + 0.022, w: 0.1, h: 0.05 },
        });
        layers.push({
          id: `t-${i}`, type: 'text', name: `Item ${i + 1}`, text: t,
          font: 'serif', size: 0.044, weight: 500, tracking: -0.01, leading: 1.1,
          color: C.fg, align: 'left', valign: 'top', maxLines: 2,
          box: { x: s.x + 0.11, y: y + 0.016, w: s.w - 0.11, h: step - 0.02 },
        });
      });
      layers.push(hairline(s, s.y + s.h - 0.035));
      return layers;
    },
  },

  {
    id: 'inst-anuncio',
    name: 'Anúncio',
    editoria: 'institucional',
    hint: 'Display gigante em difference sobre a foto. Data e CTA.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'imagem', type: 'image', label: 'Imagem' },
      { key: 'titulo', type: 'text', label: 'Manchete', multiline: true, default: 'Vem aí' },
      { key: 'data', type: 'text', label: 'Data / info', default: '12 · 03 · 2026' },
      { key: 'cta', type: 'text', label: 'Botão', default: 'Saiba mais' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      const ctaW = 0.42, ctaH = 0.055;
      return [
        // difference só rende sobre base contrastada: em meio-tom
        // ele devolve meio-tom. Por isso b&w + contraste antes.
        bleedImage(c.imagem, { grade: { mode: 'bw', amount: 1 } }),
        { id: 'scrim', type: 'scrim', name: 'Scrim', direction: 'full', color: '#000000', strength: 0.55, box: { x: 0, y: 0, w: 1, h: 1 } },
        scrimBottom(0.85, 0.6),
        logoTop(s, { w: 0.24 }),
        {
          // difference faz o tipo se recortar contra a foto
          // em vez de ficar "colado" por cima. É o gesto do site.
          id: 'titulo', type: 'text', name: 'Manchete', text: c.titulo,
          font: 'serif', size: 0.17, weight: 700, tracking: -0.04, leading: 0.86,
          color: '#ffffff', blend: 'difference', align: 'left', valign: 'middle', fitMode: 'shrink',
          box: { x: s.x, y: s.y + 0.14, w: s.w, h: s.h - 0.34 },
        },
        hairline(s, s.y + s.h - 0.14, { color: 'rgba(244,241,234,0.3)' }),
        {
          id: 'data', type: 'text', name: 'Data', text: c.data,
          font: 'mono', size: 0.026, weight: 500, tracking: 0.16, transform: 'upper',
          color: C.accent, align: 'left', valign: 'top',
          box: { x: s.x, y: s.y + s.h - 0.115, w: s.w, h: 0.05 },
        },
        { id: 'cta-box', type: 'rect', name: 'Botão', stroke: C.fg, strokeW: 0.0014, box: { x: s.x, y: s.y + s.h - ctaH, w: ctaW, h: ctaH } },
        {
          id: 'cta', type: 'text', name: 'Texto do botão', text: c.cta,
          font: 'mono', size: 0.0225, weight: 500, tracking: 0.16, transform: 'upper',
          color: C.fg, align: 'center', valign: 'middle',
          box: { x: s.x, y: s.y + s.h - ctaH, w: ctaW, h: ctaH },
        },
      ];
    },
  },

  /* ---------- CARROSSEL ---------- */

  {
    id: 'inst-carrossel',
    name: 'Carrossel editorial',
    editoria: 'institucional',
    hint: 'Capa + slides de conteúdo + slide de fecho. Numeração automática.',
    formats: ['carrossel-45', 'carrossel-11'],
    multi: true,
    slots: [
      { key: 'imagem', type: 'image', label: 'Imagem da capa' },
      { key: 'chapeu', type: 'text', label: 'Chapéu', default: 'Editorial' },
      { key: 'titulo', type: 'text', label: 'Título da capa', multiline: true, default: 'Três coisas que\na gente aprendeu\nem 2026.' },
      { key: 'blocos', type: 'blocks', label: 'Slides de conteúdo', default: [
        { titulo: 'Primeira', texto: 'O texto do slide entra aqui. Serif, respirando, no máximo cinco linhas.' },
        { titulo: 'Segunda', texto: 'Cada slide sustenta uma ideia só. Se tem duas, vira dois slides.' },
        { titulo: 'Terceira', texto: 'O fecho pede ação: comentar, salvar, chamar no direct.' },
      ] },
      { key: 'fecho', type: 'text', label: 'Fecho', default: 'Salva esse post.' },
    ],
    buildSlides(fmt, c) {
      const s = safeBox(fmt);
      const blocos = Array.isArray(c.blocos) ? c.blocos : [];
      const slides = [];

      // 01 — capa
      slides.push({ bg: C.bg, layers: [
        bleedImage(c.imagem, { grade: { mode: 'contrast', amount: 0.5 } }),
        scrimBottom(0.92, 0.28),
        logoTop(s),
        hairline(s, s.y + s.h - 0.375),
        kicker(s, c.chapeu, s.y + s.h - 0.362, { color: C.accent }),
        {
          id: 'titulo', type: 'text', name: 'Título', text: c.titulo,
          font: 'serif', size: 0.098, weight: 600, tracking: -0.028, leading: 0.98,
          color: C.fg, align: 'left', valign: 'bottom', fitMode: 'shrink',
          box: { x: s.x, y: s.y + s.h - 0.33, w: s.w, h: 0.28 },
        },
        {
          id: 'swipe', type: 'text', name: 'Arrasta', text: 'arrasta →',
          font: 'mono', size: 0.021, weight: 400, tracking: 0.16, transform: 'upper',
          color: C.dim, align: 'right', valign: 'bottom',
          box: { x: s.x, y: s.y + s.h - 0.04, w: s.w, h: 0.04 },
        },
      ]});

      // 02..n — conteúdo
      blocos.forEach((b, i) => {
        slides.push({ bg: C.bg, layers: [
          hairline(s, s.y + 0.055),
          {
            id: 'n', type: 'text', name: 'Número', text: String(i + 1).padStart(2, '0'),
            font: 'mono', size: 0.028, weight: 500, tracking: 0.1,
            color: C.accent, align: 'left', valign: 'top',
            box: { x: s.x, y: s.y, w: 0.2, h: 0.05 },
          },
          {
            id: 'titulo', type: 'text', name: 'Título', text: b.titulo || '',
            font: 'serif', size: 0.072, weight: 600, tracking: -0.025, leading: 1.0,
            color: C.fg, align: 'left', valign: 'top', fitMode: 'shrink', maxLines: 3,
            box: { x: s.x, y: s.y + 0.1, w: s.w, h: 0.22 },
          },
          {
            // valign 'bottom' é a decisão que salva este slide.
            // Com o texto ancorado no topo de uma caixa alta,
            // sobrava um buraco morto no meio da peça. Ancorado
            // embaixo, o vazio passa a ser tensão entre título
            // (topo) e corpo (base) — que é o gesto editorial.
            id: 'texto', type: 'text', name: 'Texto', text: b.texto || '',
            font: 'serif', size: 0.048, weight: 400, tracking: -0.008, leading: 1.32,
            color: C.dim, align: 'left', valign: 'bottom', fitMode: 'shrink',
            box: { x: s.x, y: s.y + 0.34, w: s.w * 0.92, h: s.h - 0.42 },
          },
          hairline(s, s.y + s.h - 0.045),
          { id: 'counter', type: 'counter', name: 'Contador', template: '{n} / {total}',
            font: 'mono', size: 0.02, weight: 400, tracking: 0.16, color: C.faint,
            align: 'right', valign: 'top', box: { x: s.x, y: s.y + s.h - 0.03, w: s.w, h: 0.04 } },
        ]});
      });

      // último — fecho com o lockup empilhado
      slides.push({ bg: C.bg, layers: [
        {
          id: 'fecho', type: 'text', name: 'Fecho', text: c.fecho,
          font: 'serif', size: 0.095, weight: 600, tracking: -0.03, leading: 1.0,
          color: C.fg, align: 'center', valign: 'top', fitMode: 'shrink',
          box: { x: s.x, y: s.y + 0.06, w: s.w, h: 0.24 },
        },
        { id: 'logo', type: 'logo', name: 'Marca', variant: 'flat', color: C.fg, align: 'center',
          size: 0.4, box: { x: s.x, y: s.y + s.h - 0.46, w: s.w, h: 0.4 } },
        hairline(s, s.y + s.h - 0.045),
        {
          id: 'site', type: 'text', name: 'Site', text: 'mestiza.work',
          font: 'mono', size: 0.022, weight: 500, tracking: 0.18, transform: 'upper',
          color: C.accent, align: 'center', valign: 'top',
          box: { x: s.x, y: s.y + s.h - 0.028, w: s.w, h: 0.04 },
        },
      ]});

      return slides;
    },
  },

  /* ---------- VÍDEO ---------- */

  {
    id: 'video-moldura',
    name: 'Moldura',
    editoria: 'video',
    hint: 'Só a moldura hairline e a marca. O vídeo respira.',
    formats: ['reels-916'],
    video: true,
    slots: [
      { key: 'handle', type: 'text', label: 'Assinatura', default: 'mestiza.work' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      return [
        { id: 'frame', type: 'rect', name: 'Moldura', stroke: 'rgba(244,241,234,0.55)', strokeW: 0.0016,
          box: { x: s.x, y: s.y, w: s.w, h: s.h } },
        { id: 'logo', type: 'logo', name: 'Marca', variant: 'horizontal', color: C.fg, align: 'center',
          size: 0.3, box: { x: s.x, y: s.y + 0.028, w: s.w, h: 0.074 } },
        { id: 'rule', type: 'line', name: 'Régua', orient: 'h', color: 'rgba(244,241,234,0.4)', thickness: 0.0014,
          box: { x: s.x + 0.06, y: s.y + s.h - 0.05, w: s.w - 0.12, h: 0.002 } },
        {
          id: 'handle', type: 'text', name: 'Assinatura', text: c.handle,
          font: 'mono', size: 0.019, weight: 500, tracking: 0.2, transform: 'upper',
          color: C.fg, align: 'center', valign: 'top',
          box: { x: s.x, y: s.y + s.h - 0.036, w: s.w, h: 0.04 },
        },
      ];
    },
  },

  {
    id: 'video-manchete',
    name: 'Manchete',
    editoria: 'video',
    hint: 'Headline grande no rodapé, dentro da área segura do Reels.',
    formats: ['reels-916'],
    video: true,
    slots: [
      { key: 'chapeu', type: 'text', label: 'Chapéu', default: 'Bastidores' },
      { key: 'titulo', type: 'text', label: 'Manchete', multiline: true, default: 'O set às\nseis da manhã.' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      const h = 0.2;
      const y = s.y + s.h - h;
      return [
        scrimBottom(0.9, y - 0.14),
        { id: 'logo', type: 'logo', name: 'Marca', variant: 'horizontal', color: C.fg, align: 'left',
          size: 0.26, box: { x: s.x, y: s.y, w: s.w, h: 0.064 } },
        hairline(s, y - 0.035, { color: C.accent }),
        kicker(s, c.chapeu, y - 0.024, { color: C.accent, size: 0.019 }),
        {
          id: 'titulo', type: 'text', name: 'Manchete', text: c.titulo,
          font: 'serif', size: 0.078, weight: 600, tracking: -0.028, leading: 1.0,
          color: C.fg, align: 'left', valign: 'bottom', fitMode: 'shrink',
          box: { x: s.x, y, w: s.w, h },
        },
      ];
    },
  },

  {
    id: 'video-legenda',
    name: 'Faixa de legenda',
    editoria: 'video',
    hint: 'Bloco sólido embaixo para fala ou tradução.',
    formats: ['reels-916'],
    video: true,
    slots: [
      { key: 'texto', type: 'text', label: 'Legenda', multiline: true, default: 'A frase que precisa ser lida com o som desligado.' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      const h = 0.155;
      const y = s.y + s.h - h;
      return [
        { id: 'bloco', type: 'rect', name: 'Bloco', fill: 'rgba(0,0,0,0.9)', box: { x: 0, y: y - 0.025, w: 1, h: h + 0.06 } },
        { id: 'rule', type: 'line', name: 'Régua', orient: 'h', color: C.accent, thickness: 0.002, box: { x: 0, y: y - 0.025, w: 1, h: 0.003 } },
        { id: 'logo', type: 'logo', name: 'Marca', variant: 'horizontal', color: C.fg, align: 'left',
          size: 0.24, box: { x: s.x, y: s.y, w: s.w, h: 0.059 } },
        {
          id: 'texto', type: 'text', name: 'Legenda', text: c.texto,
          font: 'serif', size: 0.052, weight: 500, tracking: -0.015, leading: 1.18,
          color: C.fg, align: 'left', valign: 'middle', fitMode: 'shrink',
          box: { x: s.x, y, w: s.w, h },
        },
      ];
    },
  },

  /* ---------- LIVRE ---------- */

  {
    id: 'livre-poster',
    name: 'Pôster',
    editoria: 'livre',
    hint: 'Tipo sangrando em difference. Sem régua, sem grade.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'imagem', type: 'image', label: 'Imagem' },
      { key: 'palavra', type: 'text', label: 'Palavra', multiline: true, default: 'HAZ LO\nQUE\nQUIERAS' },
      { key: 'nota', type: 'text', label: 'Nota de rodapé', default: 'mestiza · ai estudio' },
    ],
    build(fmt, c) {
      return [
        // Base neutra de propósito: difference sobre dourado
        // devolve azul-lavanda, que não existe na marca.
        // Sobre preto e branco ele devolve inversão limpa.
        bleedImage(c.imagem, { grade: { mode: 'bw', amount: 1 } }),
        { id: 'scrim', type: 'scrim', name: 'Scrim', direction: 'full', color: '#000000', strength: 0.3, box: { x: 0, y: 0, w: 1, h: 1 } },
        {
          // -0.06 de x é sangria proposital: a palavra sai
          // do quadro. É o que separa pôster de post.
          id: 'palavra', type: 'text', name: 'Palavra', text: c.palavra,
          font: 'serif', size: 0.2, weight: 700, tracking: -0.05, leading: 0.82,
          color: '#ffffff', blend: 'difference', align: 'left', valign: 'middle', fitMode: 'shrink',
          box: { x: -0.06, y: 0.1, w: 1.12, h: 0.8 },
        },
        {
          id: 'nota', type: 'text', name: 'Nota', text: c.nota,
          font: 'mono', size: 0.022, weight: 500, tracking: 0.2, transform: 'upper',
          color: C.fg, align: 'center', valign: 'bottom',
          box: { x: 0, y: 0.9, w: 1, h: 0.06 },
        },
      ];
    },
  },

  {
    id: 'livre-split',
    name: 'Split',
    editoria: 'livre',
    hint: 'Metade imagem, metade cor. O título atravessa a divisa.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'imagem', type: 'image', label: 'Imagem' },
      { key: 'titulo', type: 'text', label: 'Título', multiline: true, default: 'Meio\ndentro,\nmeio fora.' },
      { key: 'legenda', type: 'text', label: 'Legenda', default: 'Série · 01' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      return [
        // Chapa off-white e não dourada: é ela que faz o
        // difference do título virar preto puro na metade de
        // baixo e inversão limpa na foto em cima.
        { id: 'chapa', type: 'rect', name: 'Chapa', fill: C.fg, box: { x: 0, y: 0, w: 1, h: 1 } },
        { ...bleedImage(c.imagem, { grade: { mode: 'bw', amount: 1 } }), box: { x: 0, y: 0, w: 1, h: 0.52 } },
        // Escurecer a foto não é estética, é o que faz o
        // difference funcionar: sobre meio-tom ele devolve
        // meio-tom, e a primeira palavra do título sumia em
        // cinza sobre cinza. Sobre esta base, inverte limpo.
        { id: 'scrim-img', type: 'scrim', name: 'Scrim da foto', direction: 'full', color: '#000000',
          strength: 0.5, box: { x: 0, y: 0, w: 1, h: 0.52 } },
        { id: 'rule-split', type: 'line', name: 'Régua da divisa', orient: 'h', color: C.accent, thickness: 0.004,
          box: { x: 0, y: 0.52, w: 1, h: 0.005 } },
        {
          id: 'titulo', type: 'text', name: 'Título', text: c.titulo,
          font: 'serif', size: 0.13, weight: 700, tracking: -0.04, leading: 0.88,
          color: '#ffffff', blend: 'difference', align: 'left', valign: 'middle', fitMode: 'shrink',
          box: { x: s.x, y: 0.25, w: s.w, h: 0.5 },
        },
        {
          id: 'legenda', type: 'text', name: 'Legenda', text: c.legenda,
          font: 'mono', size: 0.022, weight: 600, tracking: 0.2, transform: 'upper',
          color: C.bg, align: 'left', valign: 'bottom',
          box: { x: s.x, y: s.y + s.h - 0.06, w: s.w, h: 0.06 },
        },
        { id: 'logo', type: 'logo', name: 'Marca', variant: 'horizontal', color: C.bg, align: 'right',
          size: 0.18, box: { x: s.x, y: s.y + s.h - 0.05, w: s.w, h: 0.045 } },
      ];
    },
  },

  {
    id: 'livre-duotone',
    name: 'Duotone',
    editoria: 'livre',
    hint: 'Imagem em preto e dourado, marca em difference.',
    formats: ['feed-45', 'feed-11', 'feed-916', 'story-916'],
    slots: [
      { key: 'imagem', type: 'image', label: 'Imagem' },
      { key: 'texto', type: 'text', label: 'Texto curto', default: 'estudio' },
    ],
    build(fmt, c) {
      const s = safeBox(fmt);
      return [
        bleedImage(c.imagem, { grade: { mode: 'duotone', amount: 1, shadow: '#000000', light: '#c9a86a' } }),
        // Preto chapado sobre o duotone dourado. Sólido lê
        // como marca; difference aqui viraria ruído azul.
        { id: 'logo', type: 'logo', name: 'Marca', variant: 'flat', color: C.bg, align: 'center',
          size: 0.56, box: { x: 0, y: 0.2, w: 1, h: 0.56 } },
        {
          id: 'texto', type: 'text', name: 'Texto', text: c.texto,
          font: 'mono', size: 0.026, weight: 500, tracking: 0.28, transform: 'upper',
          color: C.fg, align: 'center', valign: 'bottom',
          box: { x: s.x, y: s.y + s.h - 0.05, w: s.w, h: 0.05 },
        },
      ];
    },
  },
];

/* =========================================================
   API do módulo
   ========================================================= */

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id) { return TEMPLATE_MAP[id] || TEMPLATES[0]; }

export function templatesFor(formatId, editoriaId) {
  return TEMPLATES.filter(
    (t) => t.formats.includes(formatId) && (!editoriaId || t.editoria === editoriaId)
  );
}

export function editoriaOf(id) { return EDITORIAS.find((e) => e.id === id) || EDITORIAS[0]; }

/** Conteúdo inicial a partir dos defaults declarados nos slots. */
export function defaultContent(tpl) {
  const c = {};
  for (const s of tpl.slots || []) {
    c[s.key] = Array.isArray(s.default) ? JSON.parse(JSON.stringify(s.default)) : (s.default ?? '');
  }
  return c;
}

/**
 * Monta o documento completo.
 * Templates de slide único usam build(); multi usa buildSlides().
 */
export function buildDoc(templateId, formatId, content) {
  const tpl = getTemplate(templateId);
  const fmt = getFormat(formatId);
  const c = { ...defaultContent(tpl), ...(content || {}) };
  const slides = tpl.buildSlides
    ? tpl.buildSlides(fmt, c)
    : [{ bg: '#000000', layers: tpl.build(fmt, c) }];
  return { template: tpl.id, format: fmt.id, editoria: tpl.editoria, content: c, bg: '#000000', slides };
}
