/* =========================================================
   Mestiza Lab — leitura de rolagem

   Publica a VELOCIDADE do scroll como variável CSS, e deixa
   cada elemento decidir o que fazer com ela. É o mesmo
   princípio das colunas de fundo do site do estúdio, que
   aceleram quando você rola.

   Por que na mão e não com Lenis: a biblioteca reescreve a
   rolagem inteira para ganhar inércia. Num site de visita
   isso é ótimo. Numa ferramenta de toque, ela briga com o
   momentum nativo do iOS, com o `position: sticky` do
   cabeçalho e com o arraste do editor — três coisas que aqui
   valem mais que a inércia. O que a gente quer do Lenis é a
   leitura de velocidade, e essa custa vinte linhas.

   Publica em :root
     --scroll-v      -1..1   velocidade normalizada, com sinal
     --scroll-abs     0..1    módulo dela
     --scroll-skew   graus    inclinação já pronta para usar
   ========================================================= */

const TETO = 90;        // px por quadro que já conta como "rápido"
const SKEW_MAX = 1.4;   // graus. Acima disso vira efeito, não resposta
const ATRITO = 0.86;    // o quanto a velocidade cai por quadro parado

let ativo = false;
let ultimoY = 0;
let vel = 0;
let raf = 0;

function quadro() {
  const y = window.scrollY;
  const bruto = y - ultimoY;
  ultimoY = y;

  // Uma média que sobe rápido e desce devagar: a percepção de
  // velocidade não some no instante em que o dedo levanta.
  vel = vel * ATRITO + bruto * (1 - ATRITO);

  const n = Math.max(-1, Math.min(1, vel / TETO));
  const abs = Math.abs(n);
  const raiz = document.documentElement;
  raiz.style.setProperty('--scroll-v', n.toFixed(3));
  raiz.style.setProperty('--scroll-abs', abs.toFixed(3));
  raiz.style.setProperty('--scroll-skew', (n * SKEW_MAX).toFixed(2) + 'deg');

  if (abs < 0.002 && Math.abs(bruto) < 0.5) {
    // Parado: encerra o loop em vez de queimar bateria a 60fps.
    raiz.style.setProperty('--scroll-v', '0');
    raiz.style.setProperty('--scroll-abs', '0');
    raiz.style.setProperty('--scroll-skew', '0deg');
    raf = 0;
    return;
  }
  raf = requestAnimationFrame(quadro);
}

function acordar() {
  if (!raf) raf = requestAnimationFrame(quadro);
}

export function iniciarLeituraDeScroll() {
  if (ativo) return () => {};
  // Quem pediu menos movimento não recebe skew nenhum.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  ativo = true;
  ultimoY = window.scrollY;
  window.addEventListener('scroll', acordar, { passive: true });
  return () => {
    ativo = false;
    window.removeEventListener('scroll', acordar);
    cancelAnimationFrame(raf);
    raf = 0;
  };
}

/* =========================================================
   Entrada orquestrada

   Reveal por máscara, em sequência, uma vez só. O gesto vem
   da gramática de site premiado; o andamento não — lá são
   800ms a 1,2s, feitos para uma visita. Isto abre vinte vezes
   por dia, então o teto é 620ms e o stagger é curto.
   ========================================================= */
export function orquestrar(raiz, { passo = 55, inicio = 0 } = {}) {
  const alvos = [...raiz.querySelectorAll('[data-entra]')];
  if (!alvos.length) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    alvos.forEach((n) => n.classList.add('is-in'));
    return;
  }

  alvos.forEach((n, i) => {
    const proprio = parseInt(n.dataset.entra || '', 10);
    const atraso = Number.isFinite(proprio) ? proprio : inicio + i * passo;
    n.style.setProperty('--delay', atraso + 'ms');
  });

  // Dois quadros: o primeiro deixa o layout assentar, o
  // segundo dispara. Com um só, o Safari às vezes aplica o
  // estado final antes de pintar o inicial e não há transição.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    alvos.forEach((n) => n.classList.add('is-in'));
  }));
}

/**
 * Quebra um texto em linhas, cada uma dentro de sua própria
 * máscara. É o que permite a linha 2 subir depois da 1 em vez
 * de o bloco inteiro deslizar junto.
 *
 * Recebe as linhas já separadas — quebrar por medida no
 * cliente exigiria medir e remedir a cada rotação de tela, e
 * o texto aqui é curto e escrito à mão.
 */
export function linhasMascaradas(linhas, { classe = '', passo = 70 } = {}) {
  const frag = document.createDocumentFragment();
  linhas.forEach((texto, i) => {
    const masc = document.createElement('span');
    masc.className = 'linha' + (classe ? ' ' + classe : '');
    masc.dataset.entra = String(i * passo);
    const dentro = document.createElement('span');
    dentro.textContent = texto;
    masc.appendChild(dentro);
    frag.appendChild(masc);
  });
  return frag;
}
