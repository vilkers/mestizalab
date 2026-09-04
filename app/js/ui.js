/* =========================================================
   Mestiza Lab — kit de UI
   Sem framework. `el()` é o suficiente e mantém o bundle em
   zero — o app inteiro é ES modules servidos direto.
   ========================================================= */

/** el('div.classe#id', {attrs}, ...filhos) */
export function el(sel, attrs, ...kids) {
  const m = /^([a-z0-9-]+)?(#[\w-]+)?((?:\.[\w-]+)*)$/i.exec(sel) || [];
  const node = document.createElement(m[1] || 'div');
  if (m[2]) node.id = m[2].slice(1);
  if (m[3]) node.className = m[3].split('.').filter(Boolean).join(' ');

  if (attrs && (attrs.nodeType || typeof attrs === 'string' || Array.isArray(attrs))) {
    kids.unshift(attrs);
  } else if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = [node.className, v].filter(Boolean).join(' ');
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') node.value = v;
      else if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, v);
    }
  }
  add(node, kids);
  return node;
}

function add(node, kids) {
  for (const k of kids.flat(4)) {
    if (k == null || k === false) continue;
    node.appendChild(k.nodeType ? k : document.createTextNode(String(k)));
  }
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

/* ---------------------------------------------------------
   Ícones — traço de 1.25px, sem preenchimento. Mesma
   espessura das hairlines do layout, então tudo pertence
   ao mesmo desenho.
   --------------------------------------------------------- */
const PATHS = {
  fila:     'M3 6h18M3 12h18M3 18h12',
  novo:     'M12 5v14M5 12h14',
  midia:    'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6',
  brief:    'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5',
  admin:    'M3 20h18M6 20V10M11 20V5M16 20v-8M21 20v-4',
  voltar:   'M15 5l-7 7 7 7',
  fechar:   'M6 6l12 12M18 6L6 18',
  baixar:   'M12 4v11M7 11l5 5 5-5M4 20h16',
  imagem:   'M4 5h16v14H4zM4 16l4-4 3 3 3-3 6 6M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0',
  texto:    'M5 6h14M12 6v13M9 19h6',
  camadas:  'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  lixo:     'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copiar:   'M9 9h11v11H9zM5 15V4h11',
  play:     'M7 4l13 8-13 8z',
  video:    'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  mais:     'M12 5v14M5 12h14',
  menos:    'M5 12h14',
  check:    'M4 12l5 5L20 6',
  sair:     'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  seta:     'M5 12h14M13 6l6 6-6 6',
  desfazer: 'M9 7L4 12l5 5M4 12h10a6 6 0 0 1 0 12h-3',
  refazer:  'M15 7l5 5-5 5M20 12H10a6 6 0 0 0 0 12h3',
  grade:    'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  alerta:   'M12 4l9 16H3zM12 10v4M12 17h.01',
};

export function icon(name, size = 20) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.25');
  svg.setAttribute('stroke-linecap', 'square');
  svg.setAttribute('stroke-linejoin', 'miter');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', PATHS[name] || PATHS.fila);
  svg.appendChild(p);
  return svg;
}

export function iconBtn(name, label, onClick, extra = '') {
  return el(`button.iconbtn${extra}`, { type: 'button', 'aria-label': label, title: label, onClick }, icon(name));
}

/* ---------------------------------------------------------
   Toast
   --------------------------------------------------------- */
let rail;
export function toast(msg, kind = '') {
  if (!rail) document.body.appendChild((rail = el('.toast-rail')));
  const t = el(`.toast${kind ? ' toast--' + kind : ''}`, el('span.micro', msg));
  rail.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  setTimeout(() => {
    t.classList.remove('is-in');
    setTimeout(() => t.remove(), 320);
  }, kind === 'bad' ? 4200 : 2600);
  return t;
}

/* ---------------------------------------------------------
   Sheet — a folha que sobe. Único padrão modal do app:
   no celular, decisão acontece na zona do polegar.
   Arrastar para baixo fecha, como o usuário já espera.
   --------------------------------------------------------- */
export function sheet({ title, body, actions, onClose, dismissable = true, full = false }) {
  const scrim = el('.sheet-scrim');
  const bodyEl = el('.sheet-body', body);
  const head = el('.sheet-head',
    el('div',
      el('span.micro.dim', title || ''),
    ),
    dismissable ? iconBtn('fechar', 'Fechar', () => close()) : null,
  );
  const panel = el('.sheet', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Painel' },
    el('.sheet-grip'), head, bodyEl,
    actions ? el('.sheet-foot', { style: { padding: '0 var(--gutter) var(--s-6)' } }, actions) : null,
  );
  if (full) panel.style.height = '88svh';

  let closed = false;
  function close() {
    if (closed) return; closed = true;
    panel.classList.remove('is-open');
    scrim.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    setTimeout(() => { panel.remove(); scrim.remove(); }, 620);
    onClose && onClose();
  }
  if (dismissable) scrim.addEventListener('click', close);

  // Arrastar a folha para baixo. Só puxa quando o corpo já
  // está no topo do scroll — senão brigaria com a rolagem.
  let y0 = null, dy = 0;
  panel.addEventListener('touchstart', (e) => {
    if (!dismissable) return;
    if (bodyEl.scrollTop > 0 && !e.target.closest('.sheet-grip, .sheet-head')) return;
    y0 = e.touches[0].clientY; dy = 0;
    panel.classList.add('is-dragging');
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    panel.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  panel.addEventListener('touchend', () => {
    if (y0 == null) return;
    panel.classList.remove('is-dragging');
    panel.style.transform = '';
    if (dy > 110) close();
    y0 = null;
  });

  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape' && dismissable) { close(); document.removeEventListener('keydown', esc); }
    if (closed) document.removeEventListener('keydown', esc);
  });

  document.body.append(scrim, panel);
  observe(panel);
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    scrim.classList.add('is-open');
    panel.classList.add('is-open');
  });
  return { close, panel, body: bodyEl };
}

/** Confirmação. Devolve Promise<boolean>. */
export function confirmSheet({ title = 'Confirmar', message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); s.close(); } };
    const s = sheet({
      title,
      body: el('p', { style: { fontSize: '1.05rem', lineHeight: '1.45', marginBottom: 'var(--s-6)' } }, message),
      actions: el('.row', { style: { gap: 'var(--s-3)' } },
        el('button.btn.grow', { type: 'button', onClick: () => finish(false) }, 'Cancelar'),
        el(`button.btn.grow.${danger ? 'btn--danger' : 'btn--solid'}`, { type: 'button', onClick: () => finish(true) }, confirmLabel),
      ),
      onClose: () => { if (!done) { done = true; resolve(false); } },
    });
  });
}

/* ---------------------------------------------------------
   Reveal ao entrar na viewport
   --------------------------------------------------------- */
const SEL_REVEAL = '.reveal, .rise, .wipe, [data-reveal]';

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
  : null;

/**
 * Marca os elementos animáveis de uma subárvore.
 *
 * Rede de segurança deliberada: um elemento que fica 1,4s
 * sem entrar na viewport é forçado a aparecer. Motivo — todo
 * estado inicial aqui é `opacity: 0` ou `translateY(105%)`.
 * Se por qualquer razão o observer não disparar (elemento
 * dentro de container com overflow, aba oculta, lista
 * carregada tarde), o conteúdo simplesmente não existiria
 * para o usuário. Animação nunca pode ser condição para o
 * conteúdo ser visível.
 */
export function observe(root) {
  if (!root || !root.querySelectorAll) return;
  const nodes = root.matches?.(SEL_REVEAL) ? [root, ...root.querySelectorAll(SEL_REVEAL)] : [...root.querySelectorAll(SEL_REVEAL)];
  for (const n of nodes) {
    if (n.classList.contains('is-in')) continue;
    if (io) {
      io.observe(n);
      setTimeout(() => { n.classList.add('is-in'); io.unobserve(n); }, 1400);
    } else {
      n.classList.add('is-in');
    }
  }
}

/**
 * Observa também o que for inserido depois — listas que
 * chegam da API, painéis remontados, sheets. Sem isto, todo
 * conteúdo assíncrono nasceria invisível.
 */
export function autoObserve(root) {
  observe(root);
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) observe(n);
      }
    }
  });
  mo.observe(root, { childList: true, subtree: true });
  return () => mo.disconnect();
}

/** Carimba --delay incremental num conjunto de elementos. */
export function stagger(nodes, step = 55, start = 0) {
  [...nodes].forEach((n, i) => n.style.setProperty('--delay', `${start + i * step}ms`));
}

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
export function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
}

export function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

export function debounce(fn, ms = 250) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.cancel = () => clearTimeout(t);
  d.flush = (...a) => { clearTimeout(t); fn(...a); };
  return d;
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Safari fora de HTTPS e webviews antigas caem aqui.
    const ta = el('textarea', { style: { position: 'fixed', opacity: '0' } });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand?.('copy');
    ta.remove();
    return !!ok;
  }
}

/** Barra de progresso simples que se auto-remove. */
export function progressBar() {
  const bar = el('i');
  const wrap = el('.progress', bar);
  return { node: wrap, set: (v) => { bar.style.width = Math.round(v * 100) + '%'; }, done: () => wrap.remove() };
}
