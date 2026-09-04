/* =========================================================
   Mestiza Lab — boot e roteador
   Roteamento por hash: o app é servido como arquivo estático
   no Cloudflare Pages e hash não precisa de regra de
   reescrita nenhuma. Também sobrevive a "adicionar à tela
   de início" no iOS, que é como a equipe vai abrir isso.
   ========================================================= */

import { api } from './api.js';
import { session, draft } from './store.js';
import { el, clear, icon, toast, observe, autoObserve } from './ui.js';
import { APP, FEATURES } from './config.js';
import { ensureFonts } from './renderer.js';

import { renderGate } from './views/gate.js';
import { renderSetup } from './views/setup.js';
import { renderFila } from './views/fila.js';
import { renderNovo } from './views/novo.js';
import { renderEditor } from './views/editor-view.js';
import { renderMidia } from './views/midia.js';
import { renderBriefings } from './views/briefings.js';
import { renderAdmin } from './views/admin.js';
import { renderAjustes } from './views/ajustes.js';

const root = document.getElementById('app');

/* ---------------------------------------------------------
   Rotas
   --------------------------------------------------------- */
const ROUTES = [
  { re: /^\/?$/,               view: renderFila,      tab: 'fila' },
  { re: /^\/fila$/,            view: renderFila,      tab: 'fila' },
  { re: /^\/novo$/,            view: renderNovo,      tab: 'novo' },
  { re: /^\/editor\/(.+)$/,    view: renderEditor,    tab: null, bare: true },
  { re: /^\/midia$/,           view: renderMidia,     tab: 'midia' },
  { re: /^\/briefings$/,       view: renderBriefings, tab: 'brief' },
  { re: /^\/admin$/,           view: renderAdmin,     tab: null },
  { re: /^\/ajustes$/,         view: renderAjustes,   tab: null },
];

export function go(path, { replace = false } = {}) {
  const h = '#' + path;
  if (location.hash === h) return render();
  if (replace) history.replaceState(null, '', h);
  else location.hash = h;
}

function currentPath() {
  return decodeURIComponent(location.hash.replace(/^#/, '')) || '/fila';
}

/* ---------------------------------------------------------
   Chrome: header + tab bar
   --------------------------------------------------------- */
const TABS = [
  { id: 'fila',  path: '/fila',      label: 'Fila',     icon: 'fila' },
  { id: 'midia', path: '/midia',     label: 'Mídia',    icon: 'midia' },
  { id: 'novo',  path: '/novo',      label: 'Criar',    icon: 'novo', primary: true },
  { id: 'brief', path: '/briefings', label: 'Briefings', icon: 'brief' },
  { id: 'admin', path: '/admin',     label: 'Studio',   icon: 'admin' },
];

function buildTabbar(active) {
  return el('nav.tabbar', { 'aria-label': 'Navegação principal' },
    TABS.map((t) => {
      const on = t.id === active;
      return el(`button.tab${t.primary ? '.tab--new' : ''}${on ? '.is-on' : ''}`, {
        type: 'button',
        'aria-current': on ? 'page' : null,
        onClick: () => go(t.path),
      },
        t.primary ? el('.cap', icon(t.icon, 18)) : icon(t.icon, 20),
        el('span.micro', t.label),
      );
    }),
  );
}

function buildHeader({ title, left, right }) {
  const hdr = el('header.hdr',
    left || el('div'),
    title
      ? el('.hdr-title.micro', title)
      : el('img.hdr-logo', { src: 'assets/logo/logo-horizontal-tight.png', alt: 'Mestiza', style: { filter: 'brightness(0) invert(1)' } }),
    right || el('div'),
  );
  return hdr;
}

/** Rodapé com o marquee da assinatura. */
export function appFooter() {
  const line = () => el('div', Array.from({ length: 6 }, () => el('span', APP.tagline)));
  return el('footer.appfoot',
    el('.marquee', line(), line()),
    el('.row.row--between.wrap-pad', { style: { marginTop: 'var(--s-6)' } },
      el('span.nano', `© ${new Date().getFullYear()} Mestiza`),
      el('button.nano', {
        type: 'button',
        style: { color: 'var(--dim)', letterSpacing: 'var(--track-nano)' },
        onClick: () => go('/ajustes'),
      }, 'Ajustes'),
    ),
  );
}

/* ---------------------------------------------------------
   Render
   --------------------------------------------------------- */
let currentCleanup = null;

async function render() {
  const path = currentPath();
  const match = ROUTES.map((r) => ({ r, m: r.re.exec(path) })).find((x) => x.m);
  const route = match ? match.r : ROUTES[0];
  const params = match ? match.m.slice(1) : [];

  if (currentCleanup) { try { currentCleanup(); } catch {} currentCleanup = null; }
  clear(root);

  const ctx = {
    go,
    params,
    setHeader: (opts) => {
      const old = root.querySelector('.hdr');
      const h = buildHeader(opts);
      if (old) old.replaceWith(h); else root.prepend(h);
    },
  };

  if (!route.bare) {
    root.appendChild(buildHeader({}));
    root.appendChild(buildTabbar(route.tab));
  }

  const container = el('main.view');
  root.appendChild(container);

  try {
    currentCleanup = (await route.view(container, ctx)) || null;
  } catch (e) {
    console.error(e);
    clear(container);
    container.appendChild(el('.page',
      el('.empty',
        el('h2.h2', 'Deu ruim aqui'),
        el('p', e.message || 'Não consegui carregar esta tela.'),
        el('button.btn.btn--solid', { type: 'button', onClick: () => render() }, 'Tentar de novo'),
      ),
    ));
  }

  const stopObserve = autoObserve(container);
  if (!route.bare) container.appendChild(appFooter());

  // Header ganha a hairline só depois que a página rolou.
  const hdr = root.querySelector('.hdr');
  if (hdr) {
    const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const prev = currentCleanup;
    currentCleanup = () => { window.removeEventListener('scroll', onScroll); stopObserve(); prev && prev(); };
  } else {
    const prev = currentCleanup;
    currentCleanup = () => { stopObserve(); prev && prev(); };
  }
  window.scrollTo(0, 0);
}

/* ---------------------------------------------------------
   Sessão
   --------------------------------------------------------- */
async function boot() {
  draft.sweep();
  ensureFonts();

  let me = null;
  try {
    me = await api.me();
  } catch (e) {
    if (e.status !== 401 && e.status !== 0) console.warn(e);
  }

  // Plataforma recém-publicada, sem ninguém cadastrado: em vez
  // de uma tela de login que ainda não aceita ninguém, mostramos
  // o primeiro acesso. É o que permite publicar e configurar
  // tudo pelo celular, sem terminal.
  if (!me || !me.user) {
    let precisa = false;
    try { precisa = (await api.precisaSetup()).necessario === true; } catch {}
    hideBoot();
    const entrar = async (user) => { session.set(user); await afterLogin(); };
    if (precisa) renderSetup(root, { onSuccess: entrar });
    else renderGate(root, { onSuccess: entrar });
    return;
  }

  hideBoot();
  session.set(me.user);
  session.editorias = me.editorias || null;
  await afterLogin();
}

async function afterLogin() {
  window.addEventListener('hashchange', render);
  if (!location.hash) history.replaceState(null, '', '#/fila');
  await render();
}

function hideBoot() {
  const b = document.getElementById('boot');
  if (!b) return;
  b.classList.add('is-out');
  setTimeout(() => b.remove(), 600);
}

window.addEventListener('mz:unauthorized', () => {
  // Durante o boot, o 401 do /me é esperado: ainda não há
  // sessão e o gate já vai ser desenhado por boot(). Sem esta
  // guarda, o app monta DOIS gates empilhados.
  if (!session.user) return;
  session.set(null);
  clear(root);
  renderGate(root, { onSuccess: async (user) => { session.set(user); await afterLogin(); },
    message: 'Sua sessão expirou. Entra de novo.' });
});

/* Um lembrete honesto: o app inteiro depende de rede para
   salvar. Quando ela cai, avisamos — o rascunho local segura. */
window.addEventListener('offline', () => toast('Sem conexão. O rascunho fica salvo no aparelho.', 'bad'));
window.addEventListener('online', () => toast('De volta.', 'gold'));

export { FEATURES };
boot();
