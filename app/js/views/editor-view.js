/* =========================================================
   Mestiza Lab — editor
   Palco em cima, painel embaixo. O palco nunca fica coberto:
   quando o teclado sobe, quem encolhe é o painel.
   ========================================================= */

import { el, clear, icon, iconBtn, toast, sheet, confirmSheet, debounce, copy, fmtBytes } from '../ui.js';
import { api } from '../api.js';
import { PostStore, draft, session } from '../store.js';
import { Stage } from '../editor-stage.js';
import { getFormat, isVideoFormat, FORMAT_LIST } from '../formats.js';
import { getTemplate, templatesFor, EDITORIAS } from '../templates.js';
import { FEATURES, STATUS } from '../config.js';
import { slideBlob, slideName, shareOrDownload, makeZip, downloadBlob, renderToCanvas, canvasToBlob } from '../export.js';
import { openMediaPicker } from './midia.js';
import { abrirPreviewCarrossel } from './carrossel-preview.js';
import { mountVideoPanel } from './video-panel.js';

export async function renderEditor(container, { go, params }) {
  const id = params[0];

  let post;
  try {
    const r = await api.getPost(id);
    post = r.post;
  } catch (e) {
    container.appendChild(el('.page', el('.empty',
      el('h2.h2', 'Post não encontrado'),
      el('p', e.message),
      el('button.btn.btn--solid', { type: 'button', onClick: () => go('/fila') }, 'Voltar pra fila'),
    )));
    return;
  }

  // Rascunho local mais novo que o servidor ganha: significa
  // que o app fechou antes de salvar.
  const local = draft.load(id);
  if (local && local._at && new Date(post.atualizado_em || 0).getTime() < local._at - 1500) {
    const usar = await confirmSheet({
      title: 'Rascunho local',
      message: 'Tem alterações neste aparelho que não chegaram no servidor. Quer recuperar?',
      confirmLabel: 'Recuperar',
    });
    if (usar) Object.assign(post, local);
    else draft.drop(id);
  }

  const store = new PostStore(post);

  /* ---------------------------------------------------------
     Estrutura
     --------------------------------------------------------- */
  const nameInput = el('input.ed-name', {
    value: store.titulo, 'aria-label': 'Nome do post',
    onInput: (e) => { store.titulo = e.target.value; markDirty(); },
  });

  const btnUndo = iconBtn('desfazer', 'Desfazer', () => { store.undo(); refreshAll(); });
  const btnRedo = iconBtn('refazer', 'Refazer', () => { store.redo(); refreshAll(); });
  const saveDot = el('i.dotst', { style: { background: 'var(--faint)' }, title: 'Salvo' });

  const bar = el('header.ed-bar',
    iconBtn('voltar', 'Voltar', async () => {
      await flush();
      go('/fila');
    }),
    nameInput,
    el('.ed-actions', btnUndo, btnRedo, saveDot,
      el('button.btn.btn--sm.btn--solid', { type: 'button', style: { marginLeft: 'var(--s-2)' }, onClick: openExport }, 'Exportar'),
    ),
  );

  const stageWrap = el('.ed-stage');
  const stage = new Stage(store, {
    onSelect: () => { if (tab === 'estilo') drawBody(); },
    onSlide: () => { drawSlideDots(); if (tab === 'conteudo' || tab === 'camadas') drawBody(); },
    onCommit: () => { markDirty(); if (tab === 'estilo' || tab === 'camadas') drawBody(); },
  });

  const slideDots = el('button.ed-slides', {
    type: 'button', 'aria-label': 'Ver como aparece no feed',
    title: 'Ver como aparece no feed',
    onClick: () => { if (store.slideCount > 1) abrirPreviewCarrossel(store); },
  });
  const navPrev = el('button.ed-nav.ed-nav--prev', { type: 'button', 'aria-label': 'Slide anterior', onClick: () => { store.goSlide(store.slideIndex - 1); } }, icon('voltar', 18));
  const navNext = el('button.ed-nav.ed-nav--next', { type: 'button', 'aria-label': 'Próximo slide', onClick: () => { store.goSlide(store.slideIndex + 1); } }, icon('seta', 18));

  const tabsBar = el('.ed-tabs');
  const bodyEl = el('.ed-body');
  const panel = el('.ed-panel', tabsBar, bodyEl);

  const ed = el('.ed', bar, stageWrap, panel);
  container.appendChild(ed);
  container.classList.remove('view');   // o editor tem transição própria

  stageWrap.append(navPrev, navNext, slideDots);
  stage.mount(stageWrap);

  store.addEventListener('change', () => { stage.draw(); drawSlideDots(); });
  store.addEventListener('slide', () => stage.draw());

  /* ---------------------------------------------------------
     Abas
     --------------------------------------------------------- */
  let tab = 'conteudo';
  function tabList() {
    const t = [
      { id: 'conteudo', label: 'Conteúdo' },
      { id: 'estilo',   label: 'Estilo' },
      { id: 'camadas',  label: 'Camadas' },
      { id: 'legenda',  label: 'Legenda' },
      { id: 'ajustes',  label: 'Formato' },
    ];
    if (isVideoFormat(store.formato) && FEATURES.video) t.splice(1, 0, { id: 'video', label: 'Vídeo' });
    return t;
  }
  function drawTabs() {
    clear(tabsBar);
    for (const t of tabList()) {
      tabsBar.appendChild(el(`button.ed-tab${t.id === tab ? '.is-on' : ''}`, {
        type: 'button',
        onClick: () => { tab = t.id; drawTabs(); drawBody(); },
      }, t.label));
    }
  }

  function drawBody() {
    clear(bodyEl);
    bodyEl.scrollTop = 0;
    ({
      conteudo: panelConteudo,
      estilo: panelEstilo,
      camadas: panelCamadas,
      legenda: panelLegenda,
      ajustes: panelFormato,
      video: panelVideo,
    }[tab] || panelConteudo)();
  }

  function refreshAll() { drawTabs(); drawBody(); drawSlideDots(); updateHistoryBtns(); stage.draw(); nameInput.value = store.titulo; }

  function drawSlideDots() {
    clear(slideDots);
    const n = store.slideCount;
    navPrev.disabled = n < 2 || store.slideIndex === 0;
    navNext.disabled = n < 2 || store.slideIndex === n - 1;
    if (n < 2) return;
    for (let i = 0; i < n; i++) {
      slideDots.appendChild(el(`i${i === store.slideIndex ? '.is-on' : ''}`));
    }
  }

  function updateHistoryBtns() {
    btnUndo.disabled = !store.canUndo;
    btnRedo.disabled = !store.canRedo;
  }

  /* =========================================================
     Painel: Conteúdo
     ========================================================= */
  function panelConteudo() {
    const tpl = store.tpl;
    for (const slot of tpl.slots || []) {
      if (slot.type === 'image') bodyEl.appendChild(fieldImagem(slot));
      else if (slot.type === 'list') bodyEl.appendChild(fieldLista(slot));
      else if (slot.type === 'blocks') bodyEl.appendChild(fieldBlocos(slot));
      else bodyEl.appendChild(fieldTexto(slot));
    }
    if (store.slideCount > 1) {
      bodyEl.appendChild(el('button.btn.btn--block', {
        type: 'button', style: { marginTop: 'var(--s-5)' },
        onClick: () => abrirPreviewCarrossel(store),
      }, icon('grade', 16), 'Ver como aparece no feed'));
      bodyEl.appendChild(el('p.ed-hint',
        'Carrossel não se lê um slide por vez. Aqui você vê a sequência inteira, arrastando, com a legenda cortada onde o feed corta.'));
    }
    bodyEl.appendChild(el('button.btn.btn--ghost.btn--block', {
      type: 'button', style: { marginTop: 'var(--s-4)' },
      onClick: async () => {
        if (await confirmSheet({ title: 'Restaurar', message: 'Isso desfaz tudo que você moveu ou recoloriu na mão. O texto continua.', confirmLabel: 'Restaurar layout' })) {
          store.resetAll(); refreshAll();
        }
      },
    }, 'Restaurar layout do template'));
  }

  function fieldTexto(slot) {
    const v = store.content[slot.key] ?? '';
    const input = slot.multiline
      ? el('textarea.ed-textarea', { rows: 3, value: v })
      : el('input.input', { value: v });
    input.addEventListener('input', () => {
      store.content[slot.key] = input.value;
      store.rebuild();
      markDirty();
    });
    input.addEventListener('change', () => store.commit(() => { store.content[slot.key] = input.value; }));
    return el('.ed-field',
      el('label', el('span.micro', slot.label)),
      input,
    );
  }

  function fieldLista(slot) {
    const arr = Array.isArray(store.content[slot.key]) ? store.content[slot.key] : [];
    const ta = el('textarea.ed-textarea', { rows: Math.max(3, arr.length), value: arr.join('\n') });
    ta.addEventListener('input', () => {
      store.content[slot.key] = ta.value.split('\n');
      store.rebuild(); markDirty();
    });
    return el('.ed-field',
      el('label', el('span.micro', slot.label), el('span.val', 'um por linha')),
      ta,
    );
  }

  function fieldBlocos(slot) {
    const arr = Array.isArray(store.content[slot.key]) ? store.content[slot.key] : [];
    const wrap = el('.ed-field',
      el('label', el('span.micro', slot.label), el('span.val', `${arr.length} slides`)),
      el('.blocos',
        arr.map((b, i) => {
          const t = el('input.input', { value: b.titulo || '', placeholder: 'Título do slide' });
          const x = el('textarea.ed-textarea', { rows: 3, value: b.texto || '', placeholder: 'Texto' });
          const upd = () => {
            const next = [...store.content[slot.key]];
            next[i] = { titulo: t.value, texto: x.value };
            store.content[slot.key] = next;
            store.rebuild(); markDirty();
          };
          t.addEventListener('input', upd);
          x.addEventListener('input', upd);
          return el('.bloco',
            el('.bh',
              el('span.micro.dim', `Slide ${String(i + 2).padStart(2, '0')}`),
              el('.row', { style: { gap: '2px' } },
                i > 0 ? iconBtn('voltar', 'Subir', () => { store.moveBloco(i, i - 1); drawBody(); }, '.btn--sm') : null,
                iconBtn('lixo', 'Remover', async () => {
                  if (await confirmSheet({ title: 'Remover slide', message: 'Esse slide sai do carrossel.', confirmLabel: 'Remover', danger: true })) {
                    store.removeBloco(i); refreshAll();
                  }
                }),
              ),
            ),
            t, el('div', { style: { height: 'var(--s-2)' } }), x,
          );
        }),
      ),
      el('button.btn.btn--block', { type: 'button', style: { marginTop: 'var(--s-3)' }, onClick: () => { store.addBloco(); refreshAll(); } },
        icon('mais', 16), 'Adicionar slide'),
    );
    return wrap;
  }

  function fieldImagem(slot) {
    const src = store.content[slot.key];
    const thumb = el('.frame', { style: { width: '72px', aspectRatio: '1', border: '1px solid var(--line)', overflow: 'hidden', flex: 'none', display: 'grid', placeItems: 'center' } },
      src ? el('img', { src, style: { width: '100%', height: '100%', objectFit: 'cover' } })
          : el('span', { style: { color: 'var(--faint)' } }, icon('imagem', 20)),
    );
    return el('.ed-field',
      el('label', el('span.micro', slot.label)),
      el('.row', { style: { gap: 'var(--s-3)' } },
        thumb,
        el('.grow.col', { style: { gap: 'var(--s-2)' } },
          el('button.btn.btn--sm.btn--block', {
            type: 'button',
            onClick: () => openMediaPicker({
              onPick: (m) => {
                store.setContent(slot.key, m.url);
                drawBody();
              },
            }),
          }, src ? 'Trocar imagem' : 'Escolher imagem'),
          src ? el('button.btn.btn--sm.btn--ghost.btn--block', {
            type: 'button', onClick: () => { store.setContent(slot.key, ''); drawBody(); },
          }, 'Remover') : null,
        ),
      ),
      src ? el('p.ed-hint', 'Arraste na imagem pra reenquadrar. Pinça dá zoom.') : null,
    );
  }

  /* =========================================================
     Painel: Estilo (propriedades do layer selecionado)
     ========================================================= */
  function panelEstilo() {
    const l = store.selected;
    if (!l) {
      bodyEl.appendChild(el('.empty', { style: { border: '1px dashed var(--line)', padding: 'var(--s-10) var(--s-4)' } },
        el('p', { style: { margin: 0 } }, 'Toque em qualquer elemento da peça pra ajustar.'),
      ));
      return;
    }
    bodyEl.appendChild(el('.row.row--between', { style: { marginBottom: 'var(--s-5)' } },
      el('span.micro', l.name || l.id),
      el('button.btn.btn--sm.btn--ghost', { type: 'button', onClick: () => { store.resetLayer(l.id); drawBody(); } }, 'Original'),
    ));

    if (l.type === 'text' || l.type === 'counter') {
      if (l.type === 'text') {
        const ta = el('textarea.ed-textarea', { rows: 2, value: l.text || '' });
        ta.addEventListener('input', () => { store.setLayerLive(l.id, { text: ta.value }); markDirty(); });
        ta.addEventListener('change', () => store.endLive());
        bodyEl.appendChild(el('.ed-field', el('label', el('span.micro', 'Texto')), ta));
      }
      bodyEl.append(
        slider('Corpo', l.size, 0.012, 0.28, 0.002, (v) => store.setLayerLive(l.id, { size: v }), (v) => (v * 1080).toFixed(0) + 'px'),
        slider('Entrelinha', l.leading ?? 1.1, 0.75, 2, 0.01, (v) => store.setLayerLive(l.id, { leading: v })),
        slider('Tracking', l.tracking ?? 0, -0.06, 0.35, 0.005, (v) => store.setLayerLive(l.id, { tracking: v })),
        seg('Alinhamento', ['left', 'center', 'right'], ['Esq', 'Centro', 'Dir'], l.align || 'left', (v) => { store.setLayer(l.id, { align: v }); drawBody(); }),
        seg('Vertical', ['top', 'middle', 'bottom'], ['Topo', 'Meio', 'Base'], l.valign || 'top', (v) => { store.setLayer(l.id, { valign: v }); drawBody(); }),
        seg('Peso', [400, 500, 600, 700], ['400', '500', '600', '700'], l.weight || 400, (v) => { store.setLayer(l.id, { weight: +v }); drawBody(); }),
        seg('Caixa', ['none', 'upper'], ['Normal', 'MAIÚSCULA'], l.transform || 'none', (v) => { store.setLayer(l.id, { transform: v }); drawBody(); }),
        toggle('Itálico', !!l.italic, (v) => { store.setLayer(l.id, { italic: v }); drawBody(); }),
        swatches('Cor', l.color || '#f4f1ea', (v) => { store.setLayer(l.id, { color: v }); drawBody(); }),
      );
    }

    if (l.type === 'image') {
      bodyEl.append(
        seg('Encaixe', ['cover', 'contain'], ['Preencher', 'Conter'], l.fit || 'cover', (v) => { store.setLayer(l.id, { fit: v }); drawBody(); }),
        slider('Zoom', l.zoom || 1, 1, 4, 0.02, (v) => store.setLayerLive(l.id, { zoom: v }), (v) => v.toFixed(2) + '×'),
        seg('Tratamento', ['none', 'bw', 'contrast', 'warm', 'duotone'], ['Original', 'P&B', 'Contraste', 'Quente', 'Duotone'],
          l.grade?.mode || 'none', (v) => { store.setLayer(l.id, { grade: { ...(l.grade || {}), mode: v, amount: l.grade?.amount ?? 1 } }); drawBody(); }),
        (l.grade?.mode && l.grade.mode !== 'none')
          ? slider('Intensidade', l.grade.amount ?? 1, 0, 1, 0.05, (v) => store.setLayerLive(l.id, { grade: { ...l.grade, amount: v } }))
          : null,
        el('button.btn.btn--sm.btn--block', {
          type: 'button', style: { marginTop: 'var(--s-3)' },
          onClick: () => { store.setLayer(l.id, { fx: 0.5, fy: 0.5, zoom: 1 }); drawBody(); },
        }, 'Centralizar enquadramento'),
      );
    }

    if (l.type === 'logo') {
      bodyEl.append(
        seg('Versão', ['horizontal', 'flat'], ['Horizontal', 'Empilhada'], l.variant || 'horizontal', (v) => { store.setLayer(l.id, { variant: v }); drawBody(); }),
        slider('Tamanho', l.size ?? l.box.w, 0.08, 0.9, 0.01, (v) => store.setLayerLive(l.id, { size: v }), (v) => (v * 100).toFixed(0) + '%'),
        seg('Alinhamento', ['left', 'center', 'right'], ['Esq', 'Centro', 'Dir'], l.align || 'left', (v) => { store.setLayer(l.id, { align: v }); drawBody(); }),
        swatches('Cor', l.color || '#f4f1ea', (v) => { store.setLayer(l.id, { color: v }); drawBody(); }),
      );
    }

    if (l.type === 'rect' || l.type === 'line' || l.type === 'scrim') {
      if (l.type === 'scrim') bodyEl.appendChild(slider('Força', l.strength ?? 0.7, 0, 1, 0.02, (v) => store.setLayerLive(l.id, { strength: v })));
      if (l.type === 'line') bodyEl.appendChild(swatches('Cor', l.color || '#232323', (v) => { store.setLayer(l.id, { color: v }); drawBody(); }));
      if (l.type === 'rect' && l.fill) bodyEl.appendChild(swatches('Preenchimento', l.fill, (v) => { store.setLayer(l.id, { fill: v }); drawBody(); }));
      if (l.type === 'rect' && l.stroke) bodyEl.appendChild(swatches('Traço', l.stroke, (v) => { store.setLayer(l.id, { stroke: v }); drawBody(); }));
    }

    bodyEl.append(
      slider('Opacidade', l.opacity ?? 1, 0, 1, 0.02, (v) => store.setLayerLive(l.id, { opacity: v }), (v) => (v * 100).toFixed(0) + '%'),
      seg('Mistura', ['normal', 'difference', 'multiply', 'screen', 'overlay'], ['Normal', 'Difference', 'Multiply', 'Screen', 'Overlay'],
        l.blend || 'normal', (v) => { store.setLayer(l.id, { blend: v }); drawBody(); }),
    );
  }

  /* =========================================================
     Painel: Camadas
     ========================================================= */
  function panelCamadas() {
    const layers = store.slide?.layers || [];
    bodyEl.appendChild(el('.layers',
      [...layers].reverse().map((l, i) =>
        el(`button.layer${store.selection === l.id ? '.is-on' : ''}`, {
          type: 'button',
          onClick: () => { store.select(l.id); tab = 'estilo'; drawTabs(); drawBody(); stage.drawOverlay(); },
        },
          el('span.k', icon(iconFor(l.type), 15)),
          el('span.nm' + (l.hidden ? '.off' : ''), l.name || l.id),
          el('span.nano', l.type),
          el('span', {
            onClick: (e) => {
              e.stopPropagation();
              store.setLayer(l.id, { hidden: !l.hidden });
              drawBody();
            },
            style: { color: l.hidden ? 'var(--faint)' : 'var(--accent)', padding: '4px' },
          }, icon(l.hidden ? 'menos' : 'check', 14)),
        ),
      ),
    ));
    bodyEl.appendChild(el('p.ed-hint',
      'Toque duplo direto na peça devolve um elemento ao original.'));
  }

  /* =========================================================
     Painel: Legenda
     ========================================================= */
  function panelLegenda() {
    const cap = el('textarea.ed-textarea', { rows: 7, value: store.legenda, placeholder: 'A legenda que vai no post…' });
    const tags = el('textarea.ed-textarea.ed-textarea--mono', { rows: 2, value: store.hashtags, placeholder: '#mestiza #direcaodearte' });
    const count = el('span.val');
    const upd = () => {
      const n = (cap.value + '\n\n' + tags.value).trim().length;
      count.textContent = `${n} / 2200`;
      count.style.color = n > 2200 ? 'var(--danger)' : 'var(--accent)';
    };
    cap.addEventListener('input', () => { store.legenda = cap.value; upd(); markDirty(); });
    tags.addEventListener('input', () => { store.hashtags = tags.value; upd(); markDirty(); });
    upd();

    bodyEl.append(
      el('.ed-field', el('label', el('span.micro', 'Legenda'), count), cap),
      el('.ed-field', el('label', el('span.micro', 'Hashtags')), tags),
      el('.row', { style: { gap: 'var(--s-2)' } },
        el('button.btn.btn--sm.grow', {
          type: 'button',
          onClick: async () => {
            const ok = await copy([store.legenda, store.hashtags].filter(Boolean).join('\n\n'));
            toast(ok ? 'Legenda copiada.' : 'Não consegui copiar.', ok ? 'gold' : 'bad');
          },
        }, icon('copiar', 15), 'Copiar tudo'),
      ),
    );

    // O redator vive atrás da chave de funcionalidade.
    bodyEl.appendChild(el('.cap-note', { style: { marginTop: 'var(--s-6)' } },
      FEATURES.redator
        ? 'Redator ativo.'
        : el('span', el('strong', 'Redator automático: desligado.'),
            ' Peça a legenda pro Claude na conversa — ela chega aqui pronta junto com o post. Pra ligar o redator dentro do app, é só pôr a chave da Anthropic no Worker e virar a flag em ',
            el('code', { style: { fontFamily: 'var(--mono)', fontSize: '0.8em', color: 'var(--fg)' } }, 'js/config.js'), '.'),
    ));
    if (FEATURES.redator) {
      bodyEl.appendChild(el('button.btn.btn--gold.btn--block', { type: 'button', style: { marginTop: 'var(--s-3)' } }, 'Gerar com o redator'));
    }
  }

  /* =========================================================
     Painel: Formato / template / status
     ========================================================= */
  function panelFormato() {
    const tpl = store.tpl;
    const outros = templatesFor(store.formato, store.editoria).filter((t) => t.id !== tpl.id);
    const formatos = FORMAT_LIST.filter((f) => tpl.formats.includes(f.id));

    bodyEl.append(
      el('.ed-field',
        el('label', el('span.micro', 'Formato')),
        el('.chips',
          formatos.map((f) => el(`button.chip${f.id === store.formato ? '.is-on' : ''}`, {
            type: 'button',
            onClick: () => { store.setFormato(f.id); refreshAll(); stage.fit(); },
          }, f.name)),
        ),
        el('p.ed-hint', getFormat(store.formato).hint),
      ),
      el('.ed-field',
        el('label', el('span.micro', 'Trocar desenho'), el('span.val', tpl.name)),
        el('.opt-list',
          outros.map((t) => el('button.opt.invert-row', {
            type: 'button',
            onClick: async () => {
              if (await confirmSheet({
                title: 'Trocar desenho',
                message: `Vai pra "${t.name}". O texto que couber atravessa; ajustes feitos na mão voltam ao padrão do template novo.`,
                confirmLabel: 'Trocar',
              })) { store.setTemplate(t.id); refreshAll(); stage.fit(); }
            },
          },
            el('span.idx', ''),
            el('div', el('.n', t.name), el('.h', t.hint)),
            el('.mark', icon('seta', 15)),
          )),
        ),
      ),
      el('.ed-field',
        el('label', el('span.micro', 'Status')),
        el('.chips',
          Object.entries(STATUS).map(([k, v]) => el(`button.chip${store.status === k ? '.is-on' : ''}`, {
            type: 'button',
            onClick: (e) => {
              store.status = k;
              [...e.currentTarget.parentElement.children].forEach((c) => c.classList.remove('is-on'));
              e.currentTarget.classList.add('is-on');
              markDirty();
            },
          }, v.label)),
        ),
      ),
      el('.ed-field',
        el('label', el('span.micro', 'Guias'), el('span.val', 'diagramação')),
        el('.row', { style: { gap: 'var(--s-2)', marginBottom: 'var(--s-2)' } },
          guia('Zona segura', 'safe'),
          guia('Grade', 'grid'),
        ),
        el('.row', { style: { gap: 'var(--s-2)', marginBottom: 'var(--s-2)' } },
          guia('Terços', 'thirds'),
          guia('Baseline', 'baseline'),
        ),
        el('.row', { style: { gap: 'var(--s-2)' } },
          guia('Imã', 'snap'),
          el('span.grow'),
        ),
        el('p.ed-hint',
          'Grade de 6 colunas dentro da zona segura. Com o imã ligado, o que você arrasta encosta na coluna, na linha e na margem — a guia dourada mostra onde. No computador, segure Alt para soltar.'),
      ),
      el('button.btn.btn--danger.btn--block', {
        type: 'button', style: { marginTop: 'var(--s-6)' },
        onClick: async () => {
          if (await confirmSheet({ title: 'Apagar post', message: 'Isso não volta.', confirmLabel: 'Apagar', danger: true })) {
            await api.deletePost(store.id);
            draft.drop(store.id);
            toast('Post apagado.');
            go('/fila');
          }
        },
      }, 'Apagar post'),
    );
  }

  /** Botão de guia — o estado visual É o estado da guia. */
  function guia(rotulo, chave) {
    const b = el(`button.btn.btn--sm.grow${stage.guides[chave] ? '.btn--solid' : ''}`, {
      type: 'button',
      onClick: () => {
        stage.guides[chave] = !stage.guides[chave];
        b.classList.toggle('btn--solid', stage.guides[chave]);
        stage.drawOverlay();
      },
    }, rotulo);
    return b;
  }

  /* =========================================================
     Painel: Vídeo
     ========================================================= */
  function panelVideo() {
    mountVideoPanel(bodyEl, { store, stage, markDirty });
  }

  /* =========================================================
     Salvamento
     ========================================================= */
  let saving = false;
  const autosave = debounce(save, 1200);

  function markDirty() {
    store.dirty = true;
    saveDot.style.background = 'var(--accent)';
    saveDot.title = 'Alterações não salvas';
    draft.save(store);
    updateHistoryBtns();
    autosave();
  }

  async function save() {
    if (saving || !store.dirty) return;
    saving = true;
    saveDot.style.background = 'var(--warn)';
    try {
      await api.updatePost(store.id, store.toJSON());
      // Miniatura da fila. Vai para uma chave fixa no R2
      // (thumbs/<id>.jpg), não para a biblioteca de mídia —
      // senão cada salvamento sujaria a biblioteca com lixo.
      // Falhar aqui não é motivo para dizer que não salvou.
      try {
        const c = await renderToCanvas(store.doc, 0, { scale: 320 / getFormat(store.formato).w });
        const b = await canvasToBlob(c, 'image/jpeg', 0.72);
        await api.uploadThumb(store.id, b);
      } catch {}
      store.dirty = false;
      draft.drop(store.id);
      saveDot.style.background = 'var(--ok)';
      saveDot.title = 'Salvo';
      setTimeout(() => { if (!store.dirty) saveDot.style.background = 'var(--faint)'; }, 1400);
    } catch (e) {
      saveDot.style.background = 'var(--danger)';
      saveDot.title = 'Falhou ao salvar — o rascunho está no aparelho';
      toast('Não salvou no servidor. O rascunho está guardado aqui.', 'bad');
    } finally {
      saving = false;
    }
  }

  async function flush() { autosave.cancel(); await save(); }

  /* =========================================================
     Export
     ========================================================= */
  function openExport() {
    const fmt = getFormat(store.formato);
    let escala = 1;

    const info = el('p.nano', { style: { marginBottom: 'var(--s-5)' } });
    const setInfo = () => {
      info.textContent = `${Math.round(fmt.w * escala)} × ${Math.round(fmt.h * escala)} px · ${store.slideCount} ${store.slideCount > 1 ? 'imagens' : 'imagem'}`;
    };
    setInfo();

    const escalas = el('.seg',
      [[1, '1×'], [2, '2×'], [0.5, '0,5×']].map(([v, lab]) =>
        el(`button${v === escala ? '.is-on' : ''}`, {
          type: 'button',
          onClick: (e) => {
            escala = v;
            [...escalas.children].forEach((c) => c.classList.remove('is-on'));
            e.currentTarget.classList.add('is-on');
            setInfo();
          },
        }, lab)),
    );

    const status = el('div');
    const s = sheet({
      title: 'Exportar',
      body: el('div',
        el('.ed-field', el('label', el('span.micro', 'Resolução')), escalas, info),
        el('p.nano', { style: { marginBottom: 'var(--s-5)' } },
          '1× já é 1080px de largura — o que o Instagram usa. 2× serve pra impressão ou pra reenquadrar depois.'),
        status,
      ),
      actions: el('.col', { style: { gap: 'var(--s-2)' } },
        el('button.btn.btn--solid.btn--block', { type: 'button', onClick: () => doExport({ escala, modo: 'share', status, close: () => s.close() }) },
          icon('baixar', 16), store.slideCount > 1 ? 'Salvar todas' : 'Salvar imagem'),
        store.slideCount > 1
          ? el('button.btn.btn--block', { type: 'button', onClick: () => doExport({ escala, modo: 'zip', status, close: () => s.close() }) }, 'Baixar .zip')
          : null,
        el('button.btn.btn--block', { type: 'button', onClick: () => doExport({ escala, modo: 'atual', status, close: () => s.close() }) },
          `Só o slide ${String(store.slideIndex + 1).padStart(2, '0')}`),
      ),
    });
  }

  async function doExport({ escala, modo, status, close }) {
    clear(status);
    const bar = el('i');
    status.appendChild(el('.progress', bar));
    const label = el('p.nano', { style: { marginTop: 'var(--s-2)' } }, 'Renderizando…');
    status.appendChild(label);

    try {
      const indices = modo === 'atual' ? [store.slideIndex] : store.doc.slides.map((_, i) => i);
      const blobs = [];
      const names = [];
      for (let k = 0; k < indices.length; k++) {
        const i = indices[k];
        blobs.push(await slideBlob(store.doc, i, { scale: escala }));
        names.push(slideName(store, i));
        bar.style.width = `${Math.round(((k + 1) / indices.length) * 100)}%`;
      }

      if (modo === 'zip') {
        const { downloadBloqueado } = await import('./salvar.js');
        if (downloadBloqueado()) {
          // Zip não dá para salvar segurando. Melhor dizer isso
          // do que baixar nada e deixar a pessoa achando que
          // funcionou.
          label.textContent = 'Neste navegador o .zip não pode ser baixado. Use "Salvar todas" — as imagens aparecem uma a uma para você salvar.';
          label.style.color = 'var(--warn)';
          bar.style.width = '100%';
          return;
        }
        const zip = await makeZip(blobs.map((b, i) => ({ name: names[i], blob: b })));
        downloadBlob(zip, slideName(store, 0, 'zip').replace('-01', ''));
        toast('Zip baixado.');
      } else {
        const r = await shareOrDownload(blobs, names, { title: store.titulo, text: store.legenda });
        if (r === 'shared') toast('Enviado.', 'gold');
        else if (r === 'downloaded') toast(`${blobs.length} ${blobs.length > 1 ? 'arquivos baixados' : 'arquivo baixado'}.`);
        else if (r === 'manual') toast('Segure a imagem para salvar no aparelho.', 'gold');
      }
      close();
    } catch (e) {
      label.textContent = e.message;
      label.style.color = 'var(--danger)';
    }
  }

  /* ---------------------------------------------------------
     Atalhos de teclado (desktop)
     --------------------------------------------------------- */
  const onKey = (e) => {
    if (e.target.matches('input, textarea')) return;
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? store.redo() : store.undo();
      refreshAll();
    }
    if (meta && e.key.toLowerCase() === 's') { e.preventDefault(); flush(); }
    if (e.key === 'ArrowLeft') store.goSlide(store.slideIndex - 1);
    if (e.key === 'ArrowRight') store.goSlide(store.slideIndex + 1);
    if (e.key === 'Escape') { store.select(null); stage.drawOverlay(); drawBody(); }
  };
  window.addEventListener('keydown', onKey);

  const onLeave = (e) => { if (store.dirty) { draft.save(store); e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', onLeave);

  drawTabs();
  drawBody();
  drawSlideDots();
  updateHistoryBtns();

  return () => {
    autosave.cancel();
    if (store.dirty) { draft.save(store); save(); }
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('beforeunload', onLeave);
    stage.destroy();
  };
}

/* =========================================================
   Controles reutilizáveis
   ========================================================= */

function slider(label, value, min, max, step, onInput, format) {
  const val = el('span.val', format ? format(value) : Number(value).toFixed(2));
  const input = el('input.range', { type: 'range', min, max, step, value });
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    val.textContent = format ? format(v) : v.toFixed(2);
    onInput(v);
  });
  return el('.ed-field', el('label', el('span.micro', label), val), input);
}

function seg(label, values, labels, current, onPick) {
  const wrap = el('.seg',
    values.map((v, i) => el(`button${String(v) === String(current) ? '.is-on' : ''}`, {
      type: 'button',
      onClick: () => onPick(v),
    }, labels[i])),
  );
  return el('.ed-field', el('label', el('span.micro', label)), wrap);
}

function toggle(label, on, onChange) {
  const input = el('input', { type: 'checkbox', checked: on });
  input.addEventListener('change', () => onChange(input.checked));
  return el('.ed-field',
    el('.row.row--between',
      el('span.micro.dim', label),
      el('label.switch', input, el('.track'), el('.knob')),
    ),
  );
}

/* A paleta é fechada de propósito. Um color picker livre num
   editor de marca é convite pra peça fora do sistema. */
const PALETA = [
  ['#f4f1ea', 'Off-white'],
  ['#c9a86a', 'Dourado'],
  ['#000000', 'Preto'],
  ['#8a867d', 'Cinza'],
  ['#4a4843', 'Cinza escuro'],
  ['#ffffff', 'Branco puro'],
];

function swatches(label, current, onPick) {
  const wrap = el('.swatches',
    PALETA.map(([hex, nome]) =>
      el(`button.sw${hex.toLowerCase() === String(current).toLowerCase() ? '.is-on' : ''}`, {
        type: 'button', title: nome, 'aria-label': nome,
        style: { background: hex },
        onClick: () => onPick(hex),
      })),
  );
  return el('.ed-field', el('label', el('span.micro', label)), wrap);
}

function iconFor(type) {
  return { text: 'texto', counter: 'texto', image: 'imagem', logo: 'grade', rect: 'grade', line: 'menos', scrim: 'camadas' }[type] || 'camadas';
}
