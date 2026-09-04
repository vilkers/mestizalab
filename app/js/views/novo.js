/* =========================================================
   Mestiza Lab — criar
   Três passos: editoria → formato → template.

   Os preview dos templates são renderizados de VERDADE, ao
   vivo, pelo mesmo motor do editor. Escolher template lendo
   nome é chute; escolher olhando é direção de arte.
   ========================================================= */

import { el, clear, icon, toast, stagger } from '../ui.js';
import { api } from '../api.js';
import { EDITORIAS, TEMPLATES, templatesFor, defaultContent } from '../templates.js';
import { FORMAT_LIST, getFormat } from '../formats.js';
import { buildDoc } from '../templates.js';
import { renderSlide, resolveAll } from '../renderer.js';

/* Fotos de exemplo só para o preview do seletor. */
const DEMO = ['assets/samples/02.jpg', 'assets/samples/01.jpg', 'assets/samples/06.jpg', 'assets/samples/04.jpg'];

export async function renderNovo(container, { go, setHeader }) {
  setHeader({ title: 'Novo post' });

  let editoria = EDITORIAS[0].id;
  let formato = null;
  let template = null;

  const page = el('.page');
  const stepEd = el('div');
  const stepFmt = el('div');
  const stepTpl = el('div');
  const cta = el('div', { style: { marginTop: 'var(--s-8)' } });

  page.append(
    el('.page-head',
      el('span.page-kicker.micro', 'Passo a passo'),
      el('.reveal', el('h1.h1.page-title', 'Criar')),
      el('p.page-sub', 'Escolhe a editoria, o formato e o desenho. Dá pra trocar tudo depois sem perder o texto.'),
    ),
    stepEd, stepFmt, stepTpl, cta,
  );
  container.appendChild(page);

  /* ---------- 1. editoria ---------- */
  function drawEditorias() {
    clear(stepEd);
    stepEd.append(
      el('.sec', el('span.micro', '01 — Editoria'), el('.line')),
      el('.opt-list',
        EDITORIAS.map((ed, i) =>
          el(`button.opt.invert-row${ed.id === editoria ? '.is-on' : ''}`, {
            type: 'button',
            onClick: () => { editoria = ed.id; formato = null; template = null; drawEditorias(); drawFormatos(); },
          },
            el('span.idx', String(i + 1).padStart(2, '0')),
            el('div',
              el('.n', ed.name),
              el('.h', ed.desc),
            ),
            el('.mark', icon('check', 16)),
          ),
        ),
      ),
    );
  }

  /* ---------- 2. formato ---------- */
  function drawFormatos() {
    clear(stepFmt);
    clear(stepTpl);
    clear(cta);

    const disponiveis = FORMAT_LIST.filter((f) =>
      TEMPLATES.some((t) => t.editoria === editoria && t.formats.includes(f.id)));
    if (!disponiveis.length) return;
    if (!disponiveis.some((f) => f.id === formato)) formato = disponiveis[0].id;

    stepFmt.append(
      el('.sec', el('span.micro', '02 — Formato'), el('.line')),
      el('.chips',
        disponiveis.map((f) =>
          el(`button.chip${f.id === formato ? '.is-on' : ''}`, {
            type: 'button', dataset: { f: f.id },
            onClick: () => {
              formato = f.id; template = null;
              [...stepFmt.querySelectorAll('.chip')].forEach((c) => c.classList.toggle('is-on', c.dataset.f === formato));
              stepFmt.querySelector('.fhint').textContent = getFormat(formato).hint;
              drawTemplates();
            },
          }, f.name),
        ),
      ),
      el('p.fhint.nano', { style: { marginTop: 'var(--s-3)' } }, getFormat(formato).hint),
    );
    drawTemplates();
  }

  /* ---------- 3. template, com preview de verdade ---------- */
  function drawTemplates() {
    clear(stepTpl);
    clear(cta);
    const lista = templatesFor(formato, editoria);
    if (!template || !lista.some((t) => t.id === template)) template = lista[0]?.id || null;

    const grid = el('.tpl-grid');
    stepTpl.append(
      el('.sec', el('span.micro', '03 — Desenho'), el('.line'), el('span.nano', String(lista.length).padStart(2, '0'))),
      grid,
    );

    lista.forEach((t, i) => {
      const frame = el('.frame');
      const node = el(`button.tpl${t.id === template ? '.is-on' : ''}`, {
        type: 'button', dataset: { t: t.id },
        onClick: () => {
          template = t.id;
          [...grid.querySelectorAll('.tpl')].forEach((c) => c.classList.toggle('is-on', c.dataset.t === template));
          drawCta();
        },
      },
        frame,
        el('.cap',
          el('span.micro', t.name),
        ),
      );
      grid.appendChild(node);
      // Renderiza fora do caminho crítico para a lista aparecer já.
      queueMicrotask(() => previewInto(frame, t, formato, DEMO[i % DEMO.length]));
    });
    stagger(grid.querySelectorAll('.tpl'), 40);
    drawCta();
  }

  function drawCta() {
    clear(cta);
    const t = TEMPLATES.find((x) => x.id === template);
    if (!t) return;
    cta.append(
      el('p.nano', { style: { marginBottom: 'var(--s-3)' } }, t.hint),
      el('button.btn.btn--solid.btn--block', {
        type: 'button',
        onClick: async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          btn.textContent = '';
          btn.append(el('.spin'), el('span', 'Criando'));
          try {
            const r = await api.createPost({
              titulo: sugerirTitulo(t),
              editoria, formato, template,
              content: defaultContent(t),
              status: 'rascunho',
            });
            go('/editor/' + r.post.id);
          } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Abrir no editor';
            toast(err.message, 'bad');
          }
        },
      }, 'Abrir no editor'),
    );
  }

  drawEditorias();
  drawFormatos();
}

function sugerirTitulo(t) {
  const d = new Date();
  return `${t.name} — ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Miniatura real do template, desenhada pelo renderer. */
async function previewInto(frame, tpl, formatoId, demoImg) {
  const fmt = getFormat(tpl.formats.includes(formatoId) ? formatoId : tpl.formats[0]);
  const content = defaultContent(tpl);
  if ('imagem' in content) content.imagem = demoImg;
  const doc = buildDoc(tpl.id, fmt.id, content);
  await resolveAll(doc);

  const W = 320;
  const c = el('canvas');
  c.width = W;
  c.height = Math.round((W * fmt.h) / fmt.w);
  const ctx = c.getContext('2d');
  const s = W / fmt.w;
  ctx.scale(s, s);
  renderSlide(ctx, doc, 0, { W: fmt.w, H: fmt.h });
  clear(frame);
  frame.appendChild(c);
}
