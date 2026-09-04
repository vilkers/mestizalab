/* =========================================================
   Mestiza Lab — primeiro acesso

   Aparece uma única vez: quando a plataforma acabou de ser
   publicada e ainda não existe nenhuma pessoa cadastrada.
   Criado para que ninguém precise abrir um terminal para ter
   o primeiro login — dá para publicar e configurar tudo pelo
   celular.

   No instante em que este formulário é enviado, a rota que o
   alimenta fecha sozinha e não abre mais.
   ========================================================= */

import { el, toast, stagger } from '../ui.js';
import { api } from '../api.js';
import { APP } from '../config.js';

export function renderSetup(root, { onSuccess } = {}) {
  const nome = el('input.input', {
    type: 'text', autocomplete: 'name', placeholder: 'Vilker Silva',
  });
  const email = el('input.input', {
    type: 'email', autocomplete: 'username', inputmode: 'email',
    placeholder: 'voce@mestiza.work', spellcheck: 'false', autocapitalize: 'off',
  });
  const senha = el('input.input', {
    type: 'password', autocomplete: 'new-password', placeholder: 'mínimo 8 caracteres',
  });
  const forca = el('p.ed-hint');
  const err = el('.gate-err', { hidden: true });
  const btn = el('button.btn.btn--solid.btn--block', { type: 'submit' }, 'Criar meu acesso');

  senha.addEventListener('input', () => {
    const n = senha.value.length;
    if (!n) { forca.textContent = ''; return; }
    forca.textContent = n < 8
      ? `Faltam ${8 - n} caracteres.`
      : 'Boa. Anote em algum lugar seguro — não existe "esqueci a senha" ainda.';
    forca.style.color = n < 8 ? 'var(--danger)' : 'var(--dim)';
  });

  function falhar(msg) {
    err.textContent = msg;
    err.hidden = false;
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
      if (!mail.includes('@')) return falhar('Confira o e-mail.');
      if (senha.value.length < 8) return falhar('A senha precisa de pelo menos 8 caracteres.');

      btn.disabled = true;
      btn.textContent = '';
      btn.append(el('.spin'), el('span', 'Criando'));
      try {
        const r = await api.setup({ nome: nome.value.trim(), email: mail, senha: senha.value });
        toast('Pronto. Bem-vindo ao Lab.', 'gold');
        onSuccess && (await onSuccess(r.user));
      } catch (e2) {
        btn.disabled = false;
        btn.textContent = 'Criar meu acesso';
        falhar(
          e2.status === 409
            ? 'Alguém já configurou esta plataforma. Use a tela de login.'
            : e2.status === 0 ? 'Sem conexão com o servidor.' : e2.message,
        );
      }
    },
  },
    el('.field', el('span.micro', 'Seu nome'), nome),
    el('.field', el('span.micro', 'E-mail'), email),
    el('.field', el('span.micro', 'Senha'), senha, forca),
    err,
    btn,
  );

  const tela = el('.gate',
    el('.gate-bg', el('img', { src: 'assets/samples/02.jpg', alt: '', 'aria-hidden': 'true' })),
    el('.gate-scrim', { 'aria-hidden': 'true' }),
    el('.gate-main.is-in',
      el('.gate-logo.rise', el('img', { src: 'assets/logo/logo-site-flat-tight.png', alt: 'Mestiza' })),
      el('.reveal', { style: { marginBottom: 'var(--s-3)' } }, el('h1.h1', 'Primeiro acesso')),
      el('p.micro.dim.rise', { style: { marginBottom: 'var(--s-6)' } },
        'A plataforma está no ar e ainda não tem ninguém'),
      el('p.ed-hint.rise', { style: { marginBottom: 'var(--s-6)' } },
        'Você vai ser o administrador: cria posts, sobe mídia e adiciona o resto da equipe. Esta tela aparece uma vez só e depois some — a partir daqui o acesso é por login.'),
      el('.rise', form),
    ),
    el('.gate-foot',
      el('.row.row--between',
        el('span.nano', APP.tagline),
        el('span.nano', APP.site),
      ),
    ),
  );

  stagger(tela.querySelectorAll('.rise'), 90, 120);
  root.appendChild(tela);
  if (matchMedia('(hover: hover)').matches) setTimeout(() => nome.focus(), 500);
  return tela;
}
