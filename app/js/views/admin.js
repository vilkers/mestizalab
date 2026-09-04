/* =========================================================
   Mestiza Lab — Studio (administrativo)
   Ainda não existe. Mas um botão que abre um alerta dizendo
   "em breve" é a pior versão possível dessa conversa.
   Aqui a pessoa VÊ a forma da ferramenta — desfocada, como
   uma prova de gráfica antes do corte — e sabe o que vem.
   ========================================================= */

import { el, icon, toast, sheet } from '../ui.js';
import { FEATURES } from '../config.js';
import { session } from '../store.js';

const ROADMAP = [
  ['01', 'Contas a pagar', 'Lançamento, vencimento e aviso três dias antes. Recorrentes entram sozinhas.'],
  ['02', 'Recebimentos', 'Por cliente e por projeto, com status de nota emitida e pagamento caído.'],
  ['03', 'Gastos do estúdio', 'Equipamento, software, freela e produção — separados por projeto pra fechar custo real.'],
  ['04', 'Fechamento do mês', 'Entrou, saiu, sobrou. Uma tela só, sem planilha.'],
  ['05', 'Orçamentos', 'Do briefing ao PDF com a identidade do estúdio.'],
];

export async function renderAdmin(container, { setHeader, go }) {
  setHeader({ title: 'Studio' });

  if (FEATURES.admin) {
    container.appendChild(el('.page', el('.empty', el('h2.h2', 'Administrativo'), el('p', 'Módulo ativo.'))));
    return;
  }

  const bars = el('.bars', Array.from({ length: 11 }, (_, i) =>
    el('i', { style: { height: `${18 + ((i * 37) % 78)}%` } })));

  container.appendChild(el('.page',
    el('.page-head',
      el('span.page-kicker.micro', 'Módulo em construção'),
      el('.reveal', el('h1.h1.page-title', 'Studio')),
      el('p.page-sub', 'O financeiro do estúdio dentro da mesma plataforma. Está sendo desenhado agora.'),
    ),

    el('.teaser-art',
      el('.teaser-ghost',
        el('.g.w1'), el('.g.w2'), el('.g.w3'), el('.g.w4'), el('.g.w5'),
        bars,
      ),
      el('.teaser-badge.micro', 'Prévia · não funcional'),
    ),

    el('.sec', el('span.micro', 'O que vem'), el('.line'), el('span.nano', '05')),
    el('ul.flist',
      ROADMAP.map(([n, t, d]) => el('li',
        el('span.idx.n', n),
        el('div',
          el('div', { style: { fontSize: '1.05rem', fontWeight: 500, letterSpacing: '-0.015em' } }, t),
          el('.d', d),
        ),
      )),
    ),

    el('.cap-note', { style: { marginTop: 'var(--s-8)' } },
      el('strong', 'Por que ainda não está aqui. '),
      'Dinheiro do estúdio pede modelo de dados próprio, histórico e permissão por pessoa — coisa que não se improvisa em cima do editor. Entra como módulo separado, na mesma senha e no mesmo desenho.',
    ),

    el('button.btn.btn--gold.btn--block', {
      type: 'button', style: { marginTop: 'var(--s-6)' },
      onClick: avisar,
    }, 'Me avisa quando abrir'),

    el('button.btn.btn--ghost.btn--block', {
      type: 'button', style: { marginTop: 'var(--s-2)' },
      onClick: () => go('/fila'),
    }, 'Voltar pra fila'),
  ));
}

function avisar() {
  sheet({
    title: 'Studio',
    body: el('div',
      el('h2.h2', { style: { marginBottom: 'var(--s-3)' } },
        'Anotado', el('span.accent', '.')),
      el('p', { style: { color: 'var(--dim)', lineHeight: 1.5, marginBottom: 'var(--s-5)' } },
        'Quando o módulo financeiro entrar, ele aparece nessa mesma aba — sem app novo, sem senha nova, sem mudar nada do que você já usa aqui.'),
      el('p.nano', 'Enquanto isso, se você quiser adiantar: me diga na conversa quais campos uma conta a pagar precisa ter no seu fluxo. É a única coisa que trava o desenho.'),
    ),
    actions: null,
  });
  toast('Anotado.', 'gold');
}
