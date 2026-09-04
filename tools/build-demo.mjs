#!/usr/bin/env node
/* =========================================================
   Mestiza Lab — build de demonstração

   Empacota o app inteiro num único arquivo HTML, com a API
   trocada por uma simulação em localStorage. Serve para
   alguém abrir um link no celular e USAR a ferramenta antes
   de existir servidor.

   O que é inlinado: os módulos JS (esbuild), o CSS, as duas
   fontes, os dois logotipos e as fotos de exemplo — tudo como
   data URI, porque o Artifact serve um arquivo só.

   Uso:  node tools/build-demo.mjs [saida.html]
   ========================================================= */

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(RAIZ, 'app');
const SAIDA = process.argv[2] || path.join(RAIZ, 'demo', 'mestiza-lab-demo.html');

const MIME = {
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

function dataURI(arquivo) {
  const ext = path.extname(arquivo).toLowerCase();
  const b64 = fs.readFileSync(arquivo).toString('base64');
  return `data:${MIME[ext] || 'application/octet-stream'};base64,${b64}`;
}

/* ---------------------------------------------------------
   1. Bundle do JS, com a API apontando para a simulação
   --------------------------------------------------------- */
const trocaApi = {
  name: 'api-demo',
  setup(build) {
    build.onResolve({ filter: /(^|\/)api\.js$/ }, (args) => {
      if (args.importer.includes(path.join('demo', ''))) return null;
      return { path: path.join(RAIZ, 'demo', 'api-demo.js') };
    });
  },
};

const bundle = await esbuild.build({
  entryPoints: [path.join(APP, 'js', 'main.js')],
  bundle: true,
  format: 'iife',
  target: ['es2022'],
  minify: false,          // legível de propósito: é demonstração, não produção
  write: false,
  plugins: [trocaApi],
  logLevel: 'warning',
});
let js = bundle.outputFiles[0].text;

/* ---------------------------------------------------------
   2. CSS na ordem em que o index.html carrega
   --------------------------------------------------------- */
const ORDEM_CSS = ['fonts.css', 'tokens.css', 'base.css', 'motion.css', 'app.css', 'editor.css'];
let css = ORDEM_CSS
  .map((f) => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(APP, 'css', f), 'utf8'))
  .join('\n\n');

/* ---------------------------------------------------------
   3. Assets viram data URI
   O caminho mais LONGO primeiro: trocar 'assets/x' antes de
   '../assets/x' deixaria um '../' órfão grudado no data URI.
   --------------------------------------------------------- */
const assets = [];
for (const dir of ['fonts', 'logo', 'samples']) {
  const d = path.join(APP, 'assets', dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (f.endsWith('.md')) continue;
    assets.push({ rel: `assets/${dir}/${f}`, abs: path.join(d, f) });
  }
}
const favicon = path.join(APP, 'assets', 'favicon.svg');
if (fs.existsSync(favicon)) assets.push({ rel: 'assets/favicon.svg', abs: favicon });

let bytesInline = 0;
for (const a of assets) {
  const uri = dataURI(a.abs);
  bytesInline += fs.statSync(a.abs).size;
  for (const alvo of [`../${a.rel}`, a.rel]) {
    js = js.split(alvo).join(uri);
    css = css.split(alvo).join(uri);
  }
}

/* ---------------------------------------------------------
   4. HTML
   --------------------------------------------------------- */
const html = `<title>Mestiza Lab</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
<meta name="theme-color" content="#000000" />

<style>
${css}

/* ---- só na demonstração ---- */
#boot {
  position: fixed; inset: 0; z-index: 900;
  display: grid; place-items: center; background: var(--bg);
  transition: opacity 480ms var(--ease), visibility 480ms;
}
#boot.is-out { opacity: 0; visibility: hidden; }
#boot .mark { width: min(46vw, 170px); opacity: 0; animation: boot-in 900ms var(--ease) 80ms forwards; }
#boot .mark img { width: 100%; filter: brightness(0) invert(1) brightness(0.96) sepia(0.07); }
#boot .bar { width: 92px; height: 1px; background: var(--line); margin-top: var(--s-8); overflow: hidden; }
#boot .bar i { display: block; height: 100%; width: 40%; background: var(--accent); animation: boot-slide 1.1s var(--ease-soft) infinite; }
@keyframes boot-in { to { opacity: 1; } }
@keyframes boot-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }

</style>

<script>
/* O Artifact serve a página dentro de um iframe com sandbox,
   onde download é bloqueado em silêncio. Isto liga o terceiro
   degrau do export: mostrar a peça para salvar segurando. */
window.MZ_SEM_DOWNLOAD = true;
</script>

<div class="grain" aria-hidden="true"></div>
<div id="app"></div>
<div id="boot">
  <div style="display:grid;place-items:center">
    <div class="mark"><img src="LOGO_FLAT" alt="Mestiza" /></div>
    <div class="bar"><i></i></div>
  </div>
</div>

<script>
${js}
</script>

<script>
/* Preenche o login da demonstração assim que a porta aparece.
   Fica aqui, e não no gate.js, para não levar código de
   demonstração para dentro do app de verdade. */
(function () {
  const obs = new MutationObserver(function () {
    const e = document.querySelector('input[name=email]');
    const s = document.querySelector('input[name=senha]');
    if (!e || !s || e.dataset.pronto) return;
    e.dataset.pronto = '1';
    e.value = 'vilkervs@gmail.com';
    s.value = 'demonstracao';
    const main = document.querySelector('.gate-main');
    if (main && !main.querySelector('.demo-nota')) {
      const p = document.createElement('p');
      p.className = 'ed-hint demo-nota';
      p.style.marginTop = 'var(--s-4)';
      p.textContent = 'Demonstração: já está preenchido, é só tocar em Entrar. Tudo fica só neste aparelho.';
      main.appendChild(p);
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  /* Um aviso ao entrar, e não um selo fixo na tela: o selo
     colidia com o logotipo do cabeçalho e com a barra do
     editor, justamente as duas coisas que a demonstração
     existe para mostrar. */
  let avisou = false;
  const obs2 = new MutationObserver(function () {
    if (avisou || !document.querySelector('.tabbar')) return;
    avisou = true;
    obs2.disconnect();
    setTimeout(function () {
      const rail = document.createElement('div');
      rail.className = 'toast-rail';
      const t = document.createElement('div');
      t.className = 'toast toast--gold';
      const s = document.createElement('span');
      s.className = 'micro';
      s.textContent = 'Demonstração — tudo fica só neste aparelho';
      t.appendChild(s);
      rail.appendChild(t);
      document.body.appendChild(rail);
      requestAnimationFrame(function () { t.classList.add('is-in'); });
      setTimeout(function () {
        t.classList.remove('is-in');
        setTimeout(function () { rail.remove(); }, 400);
      }, 3600);
    }, 900);
  });
  obs2.observe(document.documentElement, { childList: true, subtree: true });

  /* Para zerar e voltar ao conteúdo original. */
  window.mzReiniciarDemo = function () {
    try { localStorage.removeItem('mz.demo.v1'); } catch (e) {}
    location.reload();
  };
})();
</script>
`.replace('LOGO_FLAT', dataURI(path.join(APP, 'assets', 'logo', 'logo-site-flat-tight.png')));

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, html);

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log('arquivo:  ', SAIDA);
console.log('tamanho:  ', kb(Buffer.byteLength(html)));
console.log('  js      ', kb(Buffer.byteLength(js)));
console.log('  css     ', kb(Buffer.byteLength(css)));
console.log('  assets  ', kb(bytesInline), `(${assets.length} arquivos, antes do base64)`);
