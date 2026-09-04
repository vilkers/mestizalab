/* =========================================================
   Mestiza Lab — porta de entrada
   Login com senha. A sessão é um cookie HttpOnly emitido
   pelo Worker; nada de token no JavaScript.
   ========================================================= */

import { el, toast, stagger } from '../ui.js';
import { api } from '../api.js';
import { APP } from '../config.js';

const BGS = ['assets/samples/02.jpg', 'assets/samples/06.jpg', 'assets/samples/04.jpg'];

export function renderGate(root, { onSuccess, message } = {}) {
  const bg = BGS[Math.floor(Math.random() * BGS.length)];

  const email = el('input.input', {
    type: 'email', name: 'email', autocomplete: 'username',
    inputmode: 'email', placeholder: 'voce@mestiza.work', required: true,
    spellcheck: 'false', autocapitalize: 'off',
  });
  const senha = el('input.input', {
    type: 'password', name: 'senha', autocomplete: 'current-password',
    placeholder: '••••••••', required: true,
  });
  const err = el('.gate-err', { hidden: true });
  const btn = el('button.btn.btn--solid.btn--block', { type: 'submit' }, 'Entrar');

  function fail(msg) {
    err.textContent = msg;
    err.hidden = false;
    // Sacode uma vez. Feedback físico vale mais que texto.
    err.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
       { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
      { duration: 260, easing: 'cubic-bezier(0.16,1,0.3,1)' },
    );
  }

  const form = el('form', {
    onSubmit: async (e) => {
      e.preventDefault();
      err.hidden = true;
      const mail = email.value.trim().toLowerCase();
      if (!mail || !senha.value) return fail('Preenche os dois campos.');

      btn.disabled = true;
      btn.textContent = '';
      btn.append(el('.spin'), el('span', 'Entrando'));
      try {
        const r = await api.login(mail, senha.value);
        onSuccess && (await onSuccess(r.user));
      } catch (e2) {
        btn.disabled = false;
        btn.textContent = 'Entrar';
        fail(
          e2.status === 401 ? 'E-mail ou senha não conferem.'
          : e2.status === 429 ? 'Muitas tentativas. Espera um minuto.'
          : e2.status === 0 ? 'Sem conexão com o servidor.'
          : e2.message,
        );
      }
    },
  },
    el('.field', el('span.micro', 'E-mail'), email),
    el('.field', el('span.micro', 'Senha'), senha),
    err,
    btn,
  );

  const gate = el('.gate',
    el('.gate-bg', el('img', { src: bg, alt: '', 'aria-hidden': 'true' })),
    el('.gate-scrim', { 'aria-hidden': 'true' }),
    el('.gate-main.is-in',
      el('.gate-logo.rise', el('img', { src: 'assets/logo/logo-site-flat-tight.png', alt: 'Mestiza' })),
      el('.reveal', { style: { marginBottom: 'var(--s-3)' } },
        el('h1.h1', 'Lab'),
      ),
      el('p.micro.dim.rise', { style: { marginBottom: 'var(--s-8)' } }, 'Criação de conteúdo · acesso restrito'),
      message ? el('.gate-err', message) : null,
      el('.rise', form),
    ),
    el('.gate-foot',
      el('.row.row--between',
        el('span.nano', APP.tagline),
        el('span.nano', APP.site),
      ),
    ),
  );

  stagger(gate.querySelectorAll('.rise'), 90, 120);
  root.appendChild(gate);
  requestAnimationFrame(() => gate.querySelector('.gate-main').classList.add('is-in'));

  // No desktop, o cursor já entra no campo. No celular, não:
  // abrir o teclado sozinho tampa metade da tela.
  if (matchMedia('(hover: hover)').matches) setTimeout(() => email.focus(), 500);

  return gate;
}
