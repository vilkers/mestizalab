/* =========================================================
   Mestiza Lab — biblioteca de mídia
   Serve como tela própria e como seletor dentro do editor.

   Coleções são texto livre, não tabela: criar uma coleção é
   digitar um nome na hora de subir. Não existe o passo
   "criar pasta antes" — que é onde 90% das bibliotecas
   perdem o usuário e viram um monte de arquivo solto.
   ========================================================= */

import { el, clear, icon, iconBtn, toast, sheet, confirmSheet, fmtBytes, fmtDate } from '../ui.js';
import { api } from '../api.js';
import { LIMITS } from '../config.js';

/* ---------------------------------------------------------
   Coleções
   --------------------------------------------------------- */
async function carregarColecoes() {
  try {
    const r = await api.listColecoes();
    return { colecoes: r.colecoes || [], soltas: r.soltas || 0 };
  } catch {
    return { colecoes: [], soltas: 0 };
  }
}

/**
 * Barra de coleções. `null` = todas; `''` = as soltas;
 * qualquer outra string = aquela coleção.
 */
function barraColecoes({ atual, onPick }) {
  const barra = el('.chips');
  async function desenhar() {
    clear(barra);
    const { colecoes, soltas } = await carregarColecoes();
    const itens = [
      { id: null, rotulo: 'Tudo' },
      ...colecoes.map((c) => ({ id: c.nome, rotulo: c.nome, n: c.itens })),
      ...(soltas ? [{ id: '', rotulo: 'Sem coleção', n: soltas }] : []),
    ];
    for (const it of itens) {
      barra.appendChild(el(`button.chip${it.id === atual ? '.is-on' : ''}`, {
        type: 'button',
        onClick: () => {
          atual = it.id;
          [...barra.children].forEach((c, k) => c.classList.toggle('is-on', itens[k].id === atual));
          onPick(atual);
        },
      }, it.n != null ? `${it.rotulo} · ${it.n}` : it.rotulo));
    }
  }
  desenhar();
  return { node: barra, recarregar: desenhar, get atual() { return atual; } };
}

/* ---------------------------------------------------------
   Grade
   --------------------------------------------------------- */
function mediaGrid({ onPick, selected, tipo = 'image' } = {}) {
  const grid = el('.media-grid');
  const state = { itens: [], sel: selected || null, colecao: null };

  async function load() {
    clear(grid);
    grid.appendChild(el('.row', { style: { padding: 'var(--s-8) 0', gridColumn: '1/-1', color: 'var(--dim)' } },
      el('.spin'), el('span.micro', 'Carregando')));
    try {
      const q = { tipo };
      if (state.colecao !== null) q.colecao = state.colecao;
      const r = await api.listMedia(q);
      state.itens = r.media || [];
    } catch (e) {
      clear(grid);
      grid.appendChild(el('p.micro', { style: { gridColumn: '1/-1', color: 'var(--danger)' } }, e.message));
      return;
    }
    draw();
  }

  function draw() {
    clear(grid);
    if (!state.itens.length) {
      grid.appendChild(el('p.micro.dim', { style: { gridColumn: '1/-1', padding: 'var(--s-8) 0', textAlign: 'center' } },
        state.colecao ? 'Coleção vazia.' : 'Nada aqui ainda. Sobe as primeiras fotos.'));
      return;
    }
    for (const m of state.itens) {
      grid.appendChild(el(`button.mcell${state.sel === m.id ? '.is-on' : ''}`, {
        type: 'button',
        onClick: () => { state.sel = m.id; draw(); onPick && onPick(m); },
      },
        el('img', { src: m.url, alt: m.nome || '', loading: 'lazy', decoding: 'async' }),
        el('.pick', icon('check', 12)),
      ));
    }
  }

  load();
  return {
    node: grid,
    reload: load,
    state,
    setColecao: (c) => { state.colecao = c; load(); },
  };
}

/* ---------------------------------------------------------
   Upload
   --------------------------------------------------------- */
export function uploadControl({ onDone, accept = 'image/*', tipo = 'image', getColecao } = {}) {
  const input = el('input', {
    type: 'file', accept, multiple: tipo === 'image', hidden: true,
    // `capture` ausente de propósito: no iOS ele abre a câmera
    // direto e tira do usuário a escolha de pegar do rolo.
  });
  const status = el('div');
  const alvo = el('span.val');

  const drop = el('.drop',
    el('div', { style: { color: 'var(--fg)', marginBottom: 'var(--s-2)' } }, icon('baixar', 24)),
    el('p.micro', { style: { marginBottom: 'var(--s-1)' } }, tipo === 'image' ? 'Subir fotos' : 'Subir vídeo'),
    el('p.nano', tipo === 'image'
      ? `JPG, PNG ou WebP · até ${LIMITS.imageMB} MB · dá pra soltar várias de uma vez`
      : `MP4, MOV ou WebM · até ${LIMITS.videoMB} MB`),
    tipo === 'image' ? el('p.ed-hint', { style: { marginTop: 'var(--s-3)' } }, alvo) : null,
  );

  function atualizarAlvo() {
    if (!getColecao) return;
    const c = getColecao();
    alvo.textContent = c ? `vai para: ${c}` : 'vai para: sem coleção';
  }
  atualizarAlvo();

  async function send(files) {
    const list = [...files];
    if (!list.length) return;
    const colecao = getColecao ? getColecao() : '';
    clear(status);
    const bar = el('i');
    const label = el('p.ed-hint');
    status.append(el('.progress', bar), label);

    const enviados = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const maxMB = tipo === 'image' ? LIMITS.imageMB : LIMITS.videoMB;
      if (f.size > maxMB * 1048576) {
        toast(`${f.name} tem ${fmtBytes(f.size)} — o limite é ${maxMB} MB.`, 'bad');
        continue;
      }
      label.textContent = `${i + 1} de ${list.length} — ${f.name}`;
      try {
        const r = await api.uploadMedia(f, {
          colecao,
          onProgress: (p) => { bar.style.width = `${Math.round(((i + p) / list.length) * 100)}%`; },
        });
        enviados.push(r.media);
      } catch (e) {
        toast(`${f.name}: ${e.message}`, 'bad');
      }
    }
    clear(status);
    if (enviados.length) {
      toast(
        `${enviados.length} ${enviados.length > 1 ? 'arquivos enviados' : 'arquivo enviado'}${colecao ? ' em ' + colecao : ''}.`,
        'gold',
      );
      onDone && onDone(enviados);
    }
  }

  input.addEventListener('change', () => { send(input.files); input.value = ''; });
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('is-over');
    send(e.dataTransfer.files);
  });

  return { node: el('div', input, drop, status), open: () => input.click(), atualizarAlvo };
}

/* ---------------------------------------------------------
   Tela
   --------------------------------------------------------- */
export async function renderMidia(container, { setHeader }) {
  setHeader({ title: 'Mídia' });

  let destino = '';   // coleção para onde os próximos uploads vão

  const grid = mediaGrid({ onPick: (m) => abrirDetalhe(m, atualizarTudo) });

  const barra = barraColecoes({
    atual: null,
    onPick: (c) => {
      grid.setColecao(c);
      // Selecionar uma coleção também define o destino do
      // upload. É o que a pessoa espera: "estou nesta pasta,
      // então o que eu subir cai aqui".
      if (c) { destino = c; up.atualizarAlvo(); }
    },
  });

  const up = uploadControl({
    getColecao: () => destino,
    onDone: () => atualizarTudo(),
  });

  function atualizarTudo() { grid.reload(); barra.recarregar(); }

  const btnDestino = el('button.btn.btn--sm.btn--block', {
    type: 'button',
    style: { marginBottom: 'var(--s-4)' },
    onClick: () => escolherDestino(),
  }, icon('mais', 14), 'Escolher coleção de destino');

  function escolherDestino() {
    (async () => {
      const { colecoes } = await carregarColecoes();
      const campo = el('input.input', { value: destino, placeholder: 'Ex.: Boticário — Nativa SPA' });
      const s = sheet({
        title: 'Coleção de destino',
        body: el('div',
          el('p.ed-hint', { style: { marginBottom: 'var(--s-4)' } },
            'É só digitar um nome. Se a coleção não existir, ela nasce no primeiro arquivo que você subir.'),
          el('.field', el('span.micro', 'Nome'), campo),
          colecoes.length
            ? el('div',
                el('.sec', el('span.micro', 'Já existem'), el('.line')),
                el('.chips', { style: { flexWrap: 'wrap' } },
                  colecoes.map((c) => el('button.chip', {
                    type: 'button', onClick: () => { campo.value = c.nome; },
                  }, `${c.nome} · ${c.itens}`)),
                ),
              )
            : null,
        ),
        actions: el('.row', { style: { gap: 'var(--s-2)' } },
          el('button.btn.grow', { type: 'button', onClick: () => { destino = ''; up.atualizarAlvo(); s.close(); } }, 'Sem coleção'),
          el('button.btn.btn--solid.grow', {
            type: 'button',
            onClick: () => { destino = campo.value.trim(); up.atualizarAlvo(); s.close(); },
          }, 'Usar'),
        ),
      });
    })();
  }

  container.appendChild(el('.page',
    el('.page-head',
      el('span.page-kicker.micro', 'Biblioteca'),
      el('.reveal', el('h1.h1.page-title', 'Mídia')),
      el('p.page-sub', 'Tudo que você sobe fica disponível pra equipe inteira, em qualquer post. Organize por cliente, projeto ou campanha.'),
    ),
    barra.node,
    el('.sec', el('span.micro', 'Subir'), el('.line')),
    btnDestino,
    up.node,
    el('.sec', el('span.micro', 'Arquivos'), el('.line')),
    grid.node,
  ));
}

/* ---------------------------------------------------------
   Detalhe
   --------------------------------------------------------- */
function abrirDetalhe(m, onChange) {
  const colecao = el('input.input', { value: m.colecao || '', placeholder: 'Sem coleção' });

  const s = sheet({
    title: m.nome || 'Arquivo',
    body: el('div',
      el('img', { src: m.url, alt: '', style: { width: '100%', border: '1px solid var(--line)', marginBottom: 'var(--s-5)' } }),
      el('.vid-meta', { style: { marginBottom: 'var(--s-5)' } },
        el('div', el('span.nano.k', 'Dimensões'), el('span.v', m.largura && m.altura ? `${m.largura}×${m.altura}` : '—')),
        el('div', el('span.nano.k', 'Tamanho'), el('span.v', fmtBytes(m.tamanho || 0))),
        el('div', el('span.nano.k', 'Enviado'), el('span.v', fmtDate(m.criado_em))),
      ),
      el('.field',
        el('span.micro', 'Coleção'),
        colecao,
        el('p.ed-hint', 'Mudar aqui move o arquivo. Deixar em branco tira ele de qualquer coleção.'),
      ),
      el('button.btn.btn--sm.btn--block', {
        type: 'button',
        onClick: async (e) => {
          e.currentTarget.disabled = true;
          try {
            await api.updateMedia(m.id, { colecao: colecao.value.trim() });
            toast('Movido.', 'gold');
            s.close();
            onChange && onChange();
          } catch (err) {
            e.currentTarget.disabled = false;
            toast(err.message, 'bad');
          }
        },
      }, 'Salvar coleção'),
    ),
    actions: el('.row', { style: { gap: 'var(--s-2)' } },
      el('button.btn.grow', { type: 'button', onClick: () => { window.open(m.url, '_blank'); } }, 'Abrir'),
      el('button.btn.btn--danger.grow', {
        type: 'button',
        onClick: async () => {
          if (await confirmSheet({ title: 'Apagar', message: 'O arquivo sai da biblioteca. Posts que já usam ele ficam sem a imagem.', confirmLabel: 'Apagar', danger: true })) {
            try {
              await api.deleteMedia(m.id);
              toast('Apagado.');
              s.close();
              onChange && onChange();
            } catch (e) { toast(e.message, 'bad'); }
          }
        },
      }, 'Apagar'),
    ),
  });
}

/* ---------------------------------------------------------
   Seletor usado pelo editor
   --------------------------------------------------------- */
export function openMediaPicker({ onPick } = {}) {
  let picked = null;
  let destino = '';

  const grid = mediaGrid({ onPick: (m) => { picked = m; confirmar.disabled = false; } });
  const barra = barraColecoes({
    atual: null,
    onPick: (c) => { grid.setColecao(c); if (c) { destino = c; up.atualizarAlvo(); } },
  });
  const up = uploadControl({
    getColecao: () => destino,
    onDone: (novos) => {
      grid.reload();
      barra.recarregar();
      if (novos[0]) { picked = novos[0]; confirmar.disabled = false; }
    },
  });

  const confirmar = el('button.btn.btn--solid.btn--block', {
    type: 'button', disabled: true,
    onClick: () => { onPick && onPick(picked); s.close(); },
  }, 'Usar esta imagem');

  const s = sheet({
    title: 'Escolher imagem',
    full: true,
    body: el('div',
      barra.node,
      up.node,
      el('.sec', el('span.micro', 'Biblioteca'), el('.line')),
      grid.node,
    ),
    actions: confirmar,
  });
  return s;
}
