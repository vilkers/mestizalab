/* =========================================================
   Mestiza Lab — biblioteca de mídia
   Serve como tela própria e como seletor dentro do editor.
   O upload vem do celular: câmera, rolo ou arquivos.
   ========================================================= */

import { el, clear, icon, iconBtn, toast, sheet, confirmSheet, fmtBytes, fmtDate } from '../ui.js';
import { api } from '../api.js';
import { LIMITS } from '../config.js';

/* ---------------------------------------------------------
   Grade compartilhada
   --------------------------------------------------------- */
function mediaGrid({ onPick, selected } = {}) {
  const grid = el('.media-grid');
  const state = { itens: [], sel: selected || null };

  async function load() {
    clear(grid);
    grid.appendChild(el('.row', { style: { padding: 'var(--s-8) 0', gridColumn: '1/-1', color: 'var(--dim)' } },
      el('.spin'), el('span.micro', 'Carregando')));
    try {
      const r = await api.listMedia({ tipo: 'image' });
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
        'Nada aqui ainda. Sobe as primeiras fotos.'));
      return;
    }
    for (const m of state.itens) {
      grid.appendChild(el(`button.mcell${state.sel === m.id ? '.is-on' : ''}`, {
        type: 'button',
        onClick: () => {
          state.sel = m.id;
          draw();
          onPick && onPick(m);
        },
      },
        el('img', { src: m.url, alt: m.nome || '', loading: 'lazy', decoding: 'async' }),
        el('.pick', icon('check', 12)),
      ));
    }
  }

  load();
  return { node: grid, reload: load, state };
}

/* ---------------------------------------------------------
   Upload
   --------------------------------------------------------- */
export function uploadControl({ onDone, accept = 'image/*', tipo = 'image' } = {}) {
  const input = el('input', {
    type: 'file', accept, multiple: tipo === 'image', hidden: true,
    // capture ausente de propósito: no iOS isso abre a câmera
    // direto e tira do usuário a escolha de pegar do rolo.
  });
  const status = el('div');
  const drop = el('.drop',
    el('div', { style: { color: 'var(--fg)', marginBottom: 'var(--s-2)' } }, icon('baixar', 24)),
    el('p.micro', { style: { marginBottom: 'var(--s-1)' } }, tipo === 'image' ? 'Fotos' : 'Vídeo'),
    el('p.nano', tipo === 'image'
      ? `JPG, PNG ou WebP · até ${LIMITS.imageMB} MB`
      : `MP4, MOV ou WebM · até ${LIMITS.videoMB} MB`),
  );

  async function send(files) {
    const list = [...files];
    if (!list.length) return;
    clear(status);
    const bar = el('i');
    const label = el('p.nano', { style: { marginTop: 'var(--s-2)' } });
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
          onProgress: (p) => { bar.style.width = `${Math.round(((i + p) / list.length) * 100)}%`; },
        });
        enviados.push(r.media);
      } catch (e) {
        toast(`${f.name}: ${e.message}`, 'bad');
      }
    }
    clear(status);
    if (enviados.length) {
      toast(`${enviados.length} ${enviados.length > 1 ? 'arquivos enviados' : 'arquivo enviado'}.`, 'gold');
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

  return { node: el('div', input, drop, status), open: () => input.click() };
}

/* ---------------------------------------------------------
   Tela
   --------------------------------------------------------- */
export async function renderMidia(container, { setHeader }) {
  setHeader({ title: 'Mídia' });

  const grid = mediaGrid({
    onPick: (m) => openDetail(m, () => grid.reload()),
  });
  const up = uploadControl({ onDone: () => grid.reload() });

  container.appendChild(el('.page',
    el('.page-head',
      el('span.page-kicker.micro', 'Biblioteca'),
      el('.reveal', el('h1.h1.page-title', 'Mídia')),
      el('p.page-sub', 'Tudo que você sobe fica disponível pra equipe inteira, em qualquer post.'),
    ),
    up.node,
    el('.sec', el('span.micro', 'Imagens'), el('.line')),
    grid.node,
  ));
}

function openDetail(m, onChange) {
  const s = sheet({
    title: m.nome || 'Arquivo',
    body: el('div',
      el('img', { src: m.url, alt: '', style: { width: '100%', border: '1px solid var(--line)', marginBottom: 'var(--s-5)' } }),
      el('.vid-meta', { style: { marginBottom: 'var(--s-5)' } },
        el('div', el('span.nano.k', 'Dimensões'), el('span.v', m.largura && m.altura ? `${m.largura}×${m.altura}` : '—')),
        el('div', el('span.nano.k', 'Tamanho'), el('span.v', fmtBytes(m.tamanho || 0))),
        el('div', el('span.nano.k', 'Enviado'), el('span.v', fmtDate(m.criado_em))),
      ),
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
  const grid = mediaGrid({ onPick: (m) => { picked = m; confirmar.disabled = false; } });
  const up = uploadControl({
    onDone: (novos) => {
      grid.reload();
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
      up.node,
      el('.sec', el('span.micro', 'Biblioteca'), el('.line')),
      grid.node,
    ),
    actions: confirmar,
  });
  return s;
}
