/* =========================================================
   Mestiza Lab — ajustes
   Conta, pessoas do estúdio e o token que liga o Claude
   nesta plataforma.
   ========================================================= */

import { el, clear, icon, toast, sheet, confirmSheet, copy, fmtDate } from '../ui.js';
import { api } from '../api.js';
import { session } from '../store.js';
import { APP, FEATURES, API_BASE } from '../config.js';

export async function renderAjustes(container, { go, setHeader }) {
  setHeader({ title: 'Ajustes' });

  const page = el('.page');
  const u = session.user || {};

  page.append(
    el('.page-head',
      el('span.page-kicker.micro', 'Conta'),
      el('.reveal', el('h1.h1.page-title', u.nome || 'Você')),
      el('p.page-sub', u.email),
    ),

    el('.sec', el('span.micro', 'Integração com o Claude'), el('.line')),
    el('div', { id: 'tokens' }),

    session.isAdmin ? el('.sec', el('span.micro', 'Pessoas'), el('.line')) : null,
    session.isAdmin ? el('div', { id: 'users' }) : null,

    el('.sec', el('span.micro', 'Sistema'), el('.line')),
    el('.opt-list',
      linha('Redator automático', FEATURES.redator ? 'Ligado' : 'Desligado — a copy vem do Claude na conversa'),
      linha('Export de vídeo', 'No aparelho, sem servidor'),
      linha('Versão', 'Lab 1.0'),
    ),

    el('button.btn.btn--block', {
      type: 'button', style: { marginTop: 'var(--s-8)' },
      onClick: async () => {
        if (await confirmSheet({ title: 'Sair', message: 'Você vai precisar entrar de novo.', confirmLabel: 'Sair' })) {
          await api.logout().catch(() => {});
          location.hash = '';
          location.reload();
        }
      },
    }, icon('sair', 16), 'Sair'),
  );
  container.appendChild(page);

  await drawTokens(page.querySelector('#tokens'));
  if (session.isAdmin) await drawUsers(page.querySelector('#users'));
}

function linha(t, d) {
  return el('.opt',
    el('span.idx', ''),
    el('div', el('.n', t), el('.h', d)),
    el('span'),
  );
}

/* ---------------------------------------------------------
   Tokens
   O token aparece UMA vez. Guardar o valor em claro no banco
   pra poder reexibir depois seria trocar segurança por
   conveniência — o servidor só guarda o hash.
   --------------------------------------------------------- */
async function drawTokens(root) {
  clear(root);
  root.appendChild(el('.cap-note',
    el('strong', 'Como conectar. '),
    'Crie um token, cole na conversa com o Claude junto com o endereço da API. A partir daí você pede o conteúdo por lá e ele monta o post direto na sua fila.',
  ));

  let tokens = [];
  try { tokens = (await api.listTokens()).tokens || []; }
  catch (e) { root.appendChild(el('p.micro', { style: { color: 'var(--danger)' } }, e.message)); return; }

  if (tokens.length) {
    root.appendChild(el('.opt-list',
      tokens.map((t) => el('.opt',
        el('span.idx', '·'),
        el('div',
          el('.n', t.nome),
          el('.h', `${t.prefixo}··· · criado ${fmtDate(t.criado_em)}${t.usado_em ? ' · último uso ' + fmtDate(t.usado_em) : ' · nunca usado'}`),
        ),
        el('button.iconbtn', {
          type: 'button', 'aria-label': 'Revogar',
          onClick: async () => {
            if (await confirmSheet({ title: 'Revogar token', message: `"${t.nome}" para de funcionar na hora.`, confirmLabel: 'Revogar', danger: true })) {
              await api.revokeToken(t.id);
              toast('Revogado.');
              drawTokens(root);
            }
          },
        }, icon('lixo', 16)),
      )),
    ));
  }

  root.appendChild(el('button.btn.btn--block', {
    type: 'button', style: { marginTop: 'var(--s-4)' },
    onClick: async () => {
      const nome = prompt('Nome do token (ex.: "Claude — Vilker")');
      if (!nome) return;
      try {
        const r = await api.createToken(nome);
        mostrarToken(r.token, r.base || location.origin + API_BASE);
        drawTokens(root);
      } catch (e) { toast(e.message, 'bad'); }
    },
  }, icon('mais', 16), 'Criar token'));
}

function mostrarToken(token, base) {
  const bloco = [
    `Base da API: ${base}`,
    `Token: ${token}`,
  ].join('\n');
  sheet({
    title: 'Token criado',
    dismissable: true,
    body: el('div',
      el('p', { style: { marginBottom: 'var(--s-4)', lineHeight: 1.5 } },
        'Copie agora. Por segurança o servidor guarda só o hash — ',
        el('strong', 'este valor não aparece de novo'), '.'),
      el('pre', {
        style: {
          fontFamily: 'var(--mono)', fontSize: '0.78rem', lineHeight: 1.7,
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          padding: 'var(--s-4)', overflowX: 'auto', marginBottom: 'var(--s-4)',
          color: 'var(--accent)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        },
      }, bloco),
      el('p.nano', 'Cole isso na conversa com o Claude uma vez. Ele guarda o contexto e passa a escrever direto na sua fila.'),
    ),
    actions: el('button.btn.btn--solid.btn--block', {
      type: 'button',
      onClick: async () => { await copy(bloco); toast('Copiado.', 'gold'); },
    }, icon('copiar', 16), 'Copiar'),
  });
}

/* ---------------------------------------------------------
   Pessoas
   --------------------------------------------------------- */
async function drawUsers(root) {
  clear(root);
  let users = [];
  try { users = (await api.listUsers()).users || []; }
  catch (e) { root.appendChild(el('p.micro', { style: { color: 'var(--danger)' } }, e.message)); return; }

  root.appendChild(el('.opt-list',
    users.map((u, i) => el('.opt',
      el('span.idx', String(i + 1).padStart(2, '0')),
      el('div',
        el('.n', u.nome || u.email),
        el('.h', `${u.email} · ${u.role === 'admin' ? 'administrador' : 'editor'}${u.ativo ? '' : ' · desativado'}`),
      ),
      u.id === session.user.id
        ? el('span.nano', 'você')
        : el('button.iconbtn', {
            type: 'button', 'aria-label': u.ativo ? 'Desativar' : 'Reativar',
            onClick: async () => {
              await api.updateUser(u.id, { ativo: u.ativo ? 0 : 1 });
              toast(u.ativo ? 'Acesso suspenso.' : 'Acesso liberado.');
              drawUsers(root);
            },
          }, icon(u.ativo ? 'check' : 'menos', 16)),
    )),
  ));

  root.appendChild(el('button.btn.btn--block', {
    type: 'button', style: { marginTop: 'var(--s-4)' },
    onClick: () => novoUsuario(() => drawUsers(root)),
  }, icon('mais', 16), 'Adicionar pessoa'));
}

function novoUsuario(onDone) {
  const nome = el('input.input', { placeholder: 'Nome' });
  const email = el('input.input', { type: 'email', placeholder: 'email@mestiza.work', autocapitalize: 'off', spellcheck: 'false' });
  const senha = el('input.input', { type: 'text', placeholder: 'Senha provisória' });
  const admin = el('input', { type: 'checkbox' });
  const err = el('p.micro', { style: { color: 'var(--danger)' }, hidden: true });

  // Senha provisória sugerida: quatro palavras da casa. Mais
  // fácil de ditar no WhatsApp do que oito caracteres aleatórios,
  // e com entropia suficiente pra uma senha de primeiro acesso.
  senha.value = sugerirSenha();

  const s = sheet({
    title: 'Nova pessoa',
    body: el('div',
      el('.field', el('span.micro', 'Nome'), nome),
      el('.field', el('span.micro', 'E-mail'), email),
      el('.field', el('span.micro', 'Senha provisória'), senha,
        el('p.nano', { style: { marginTop: 'var(--s-2)' } }, 'Passe por um canal privado. A pessoa troca depois.')),
      el('.row.row--between', { style: { marginBottom: 'var(--s-5)' } },
        el('span.micro.dim', 'Administrador'),
        el('label.switch', admin, el('.track'), el('.knob')),
      ),
      err,
    ),
    actions: el('button.btn.btn--solid.btn--block', {
      type: 'button',
      onClick: async (e) => {
        err.hidden = true;
        if (!email.value.trim() || senha.value.length < 8) {
          err.textContent = 'E-mail obrigatório e senha com pelo menos 8 caracteres.';
          err.hidden = false;
          return;
        }
        e.currentTarget.disabled = true;
        try {
          await api.createUser({
            nome: nome.value.trim(), email: email.value.trim().toLowerCase(),
            senha: senha.value, role: admin.checked ? 'admin' : 'editor',
          });
          toast('Pessoa adicionada.', 'gold');
          s.close();
          onDone();
        } catch (e2) {
          e.currentTarget.disabled = false;
          err.textContent = e2.message;
          err.hidden = false;
        }
      },
    }, 'Adicionar'),
  });
}

const PALAVRAS = ['mestiza', 'estudio', 'quieras', 'hacer', 'campanha', 'briefing', 'still', 'grade', 'luz', 'foco', 'craft', 'serif'];
function sugerirSenha() {
  const r = new Uint32Array(3);
  crypto.getRandomValues(r);
  return [...r].map((n) => PALAVRAS[n % PALAVRAS.length]).join('-') + '-' + (r[0] % 90 + 10);
}
