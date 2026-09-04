/* =========================================================
   Mestiza Lab — formatos
   Formato é DADO, não código. Adicionar um formato novo é
   acrescentar um objeto aqui; nada mais no app muda.
   Todo o resto do sistema (renderer, editor, export) lê
   apenas w/h e trabalha em coordenadas normalizadas 0..1.
   ========================================================= */

export const FORMATS = {
  'feed-45': {
    id: 'feed-45',
    name: 'Feed 4:5',
    hint: 'O formato de maior alcance no Instagram',
    group: 'Feed',
    kind: 'still',
    w: 1080, h: 1350,
    // Zona segura: margem de composição. Não é regra da
    // plataforma, é disciplina de diagramação — nada de
    // texto encostando na borda de uma peça de campanha.
    safe: { t: 0.055, r: 0.062, b: 0.055, l: 0.062 },
  },
  'feed-11': {
    id: 'feed-11',
    name: 'Quadrado 1:1',
    hint: 'LinkedIn, grid e reaproveitamento',
    group: 'Feed',
    kind: 'still',
    w: 1080, h: 1080,
    safe: { t: 0.065, r: 0.065, b: 0.065, l: 0.065 },
  },
  'feed-916': {
    id: 'feed-916',
    name: 'Vertical 9:16',
    hint: 'Post vertical cheio',
    group: 'Feed',
    kind: 'still',
    w: 1080, h: 1920,
    safe: { t: 0.05, r: 0.06, b: 0.05, l: 0.06 },
  },
  'story-916': {
    id: 'story-916',
    name: 'Stories 9:16',
    hint: 'Respeita a UI do Instagram em cima e embaixo',
    group: 'Stories',
    kind: 'still',
    w: 1080, h: 1920,
    // Assimétrico de propósito: o topo perde ~250px pro
    // avatar/barra e a base ~340px pro campo de resposta.
    safe: { t: 0.135, r: 0.06, b: 0.185, l: 0.06 },
  },
  'reels-916': {
    id: 'reels-916',
    name: 'Reels / vídeo 9:16',
    hint: 'Máscara sobre vídeo — legenda e perfil não invadem',
    group: 'Vídeo',
    kind: 'video',
    w: 1080, h: 1920,
    // Reels come mais da direita (coluna de ícones) e da
    // base (legenda + áudio) do que Stories.
    safe: { t: 0.09, r: 0.155, b: 0.21, l: 0.06 },
  },
  'carrossel-45': {
    id: 'carrossel-45',
    name: 'Carrossel 4:5',
    hint: 'Capa + slides, numeração automática',
    group: 'Carrossel',
    kind: 'still',
    multi: true,
    w: 1080, h: 1350,
    safe: { t: 0.055, r: 0.062, b: 0.055, l: 0.062 },
  },
  'carrossel-11': {
    id: 'carrossel-11',
    name: 'Carrossel 1:1',
    hint: 'Capa + slides no quadrado',
    group: 'Carrossel',
    kind: 'still',
    multi: true,
    w: 1080, h: 1080,
    safe: { t: 0.065, r: 0.065, b: 0.065, l: 0.065 },
  },
};

export const FORMAT_LIST = Object.values(FORMATS);

export function getFormat(id) {
  return FORMATS[id] || FORMATS['feed-45'];
}

/** Formatos agrupados, na ordem em que os grupos aparecem acima. */
export function formatsByGroup() {
  const groups = [];
  for (const f of FORMAT_LIST) {
    let g = groups.find((x) => x.name === f.group);
    if (!g) groups.push((g = { name: f.group, items: [] }));
    g.items.push(f);
  }
  return groups;
}

/** Retângulo da zona segura em coordenadas normalizadas. */
export function safeBox(format) {
  const s = format.safe;
  return { x: s.l, y: s.t, w: 1 - s.l - s.r, h: 1 - s.t - s.b };
}

/**
 * Um formato só pode virar outro sem quebrar a composição
 * porque tudo é normalizado. A troca preserva os layers e
 * apenas reancora o que estava colado na zona segura.
 */
export function isVideoFormat(id) {
  return getFormat(id).kind === 'video';
}
