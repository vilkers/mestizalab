# Todos os pedidos — o livro-razão

> Tudo que o Vilker pediu desde a primeira mensagem, na ordem em que pediu,
> com o estado de cada um e onde foi parar. Este arquivo existe para uma coisa:
> **nada se perde**. Se um pedido não está aqui, ele não foi registrado.
>
> Legenda: `✅ feito` · `🔵 aberto` · `⏸ trava em terceiro` · `✂️ cortado` ·
> `💭 futuro`

**Última revisão:** 07/09/2026 — após a decisão de foco em diagramação.

---

## 1 · Briefing original

| | Pedido (palavras dele) | Estado | Onde |
|---|---|---|---|
| 1.1 | "página mobile first, pra gente gerar o png com a postagem pronta" | ✅ | `app/js/export.js` — PNG 1080px, 0,5×/1×/2× |
| 1.2 | "um agente redator que vai ajudar a criar as legendas" | ✂️ | **Cortado em 07/09** — o app não escreve |
| 1.3 | "receber o briefing" | ✂️ | **Cortado em 07/09** — ver §7 |
| 1.4 | "que eu consiga montar os posts pelo navegador" | ✅ | Editor visual completo |
| 1.5 | "tenha templates prontos" | ✅ | 13 templates, 3 editorias |
| 1.6 | "como editar, meio que igual ao Canva" | ✅ | Toque, arraste, pinça, desfazer |
| 1.7 | "otimizado pra usar pelo celular" | ✅ | Mobile-first do primeiro pixel |
| 1.8 | "subir mídias por aqui" | ✅ | Biblioteca com coleções |
| 1.9 | "trabalhar em sincronia com o meu Claude… pedir um conteúdo a partir de um briefing e gerar usando essa ferramenta" | 🔵 | `POST /api/intake`. **Muda de natureza:** deixa de trazer texto, passa a montar a PEÇA |
| 1.10 | "vamos publicar vídeos, então um setor na ferramenta pra fazer isso? add alguma das máscaras que vão estar como template" | ✅ | 3 máscaras de Reels, export no aparelho |
| 1.11 | "quero que tenha senha pois mais pessoas vão usar" | ✅ | Contas individuais, sessão em cookie |
| 1.12 | "uma editoria que vai precisar de um campo específico… uma área no app com outros designs mais soltos" | ⏸ | Editoria **Livre** existe. A dele falta nome e tom |
| 1.13 | "vai pegar no site em construção o logo, fontes, e o que precisar" | ✅ | Paleta, STIX + Spline, logos, curva |
| 1.14 | "me faça perguntas" | ✅ | 4 rodadas de decisão |
| 1.15 | "área administrativa… contas a pagar, recebimentos, gastos. Por agora só crie um botão teaser" | ✅ | Tela-prévia. **Satélite, fora do produto** (§5.9) |
| 1.16 | "design arrojado, com motion e design foda" | 🔵 | **Fila feita.** Resto pendente |
| 1.17 | "se inspirar no design e comportamento do paulkalkbrenner.net… analise ele bem" | ⏸ | **Bloqueado.** 5 rotas tentadas. Ver §8 |

---

## 2 · "Antes que estoure meu limite"

| | Pedido | Estado | Onde |
|---|---|---|---|
| 2.1 | "guarde todas as ideias e tudo que pedi aqui" | ✅ | Este arquivo e todo o `docs/` |
| 2.2 | "tem que ter grid pra ajudar a layoutar, padronizados" | ✅ | 6 colunas + imã, `editor-stage.js` |
| 2.3 | "subir em pastas as imagens que já fizemos, pra já ter os assets" | ✅ | Coleções na biblioteca |
| 2.4 | "um preview de carrossel?" | ✅ | Faixa com scroll-snap e legenda cortada |
| 2.5 | "marcações opcionais pra ver safe area" | ✅ | Zona segura, terços, grade, baseline |
| 2.6 | "volte no site que mandei de ref" | ⏸ | Ver §8 |
| 2.7 | "depois de gerar deve vasculhar atrás de bugs e melhorias — estrutura, bugs e usabilidade" | ✅ | Varredura rodada, 48 defeitos corrigidos. `10-PLANO-DE-EXECUCAO.md` |
| 2.8 | "sobre os templates, vamos acertar o visual depois. Vou mandar referências de diagramação" | ⏸ | Esperando as referências |
| 2.9 | "definir o estilo de escrita, tom dos posts, termos" | ✂️ | **Cortado em 07/09** — não é do app |
| 2.10 | "sempre revisar se nada que falei se perdeu e ir aprendendo" | ✅ | Regra em `CLAUDE.md`, este arquivo |
| 2.11 | "vender uma espécie de guide de marca… virtual… Mestiza é o piloto" | 💭 | `07-GUIDE-DE-MARCA.md` |
| 2.12 | "tem alguma ferramenta de design mais arrojada ligada ao Claude?" | ✅ | Respondido em `08-FERRAMENTAS-IA.md` |
| 2.13 | "montar uma base pra criar meus conteúdos… briefing de texto foda" | ✂️ | **Cortado em 07/09** — pré-texto |
| 2.14 | "criar arquivos md e organizar isso tudo como projeto e definir as fases" | ✅ | `docs/` inteiro |
| 2.15 | "pode sugerir agentes" | ✅ | 5 agentes em `.claude/agents/` |
| 2.16 | "criando pitches refinados com prints, mostrando pq vale a pena" | 🔵 | Não começou |
| 2.17 | "uma outra página de manual de como usar" | 🔵 | Existe como `09-MANUAL.md`; falta virar página no app |
| 2.18 | "rotina pra revisar e resolver bugs" | ✅ | Agente `qa-mestiza` + rotina documentada |
| 2.19 | "gestão financeira… não entra pro produto que quero construir" | ✅ | Registrado como satélite |
| 2.20 | "tenho uma hospedagem que podemos usar pra migrar no futuro" | 💭 | Registrado. Falta saber o que ela oferece |

---

## 3 · "Não sei o que fazer agora"

| | Pedido | Estado |
|---|---|---|
| 3.1 | "já posso acessar o site?" | ✅ Respondido: precisa publicar |
| 3.2 | "vamos decidindo uma coisa por vez, pode ir me perguntando" | ✅ Passou a ser o modo de trabalho |
| 3.3 | "estou no celular, isso não roda no GitHub?" | ✅ Explicado + tela de primeiro acesso construída para dispensar o terminal |

---

## 4 · "Vamos pular essa parte, quero ver o app"

| | Pedido | Estado |
|---|---|---|
| 4.1 | "vamos pular [o deploy] por enquanto" | ✅ Adiado e registrado |
| 4.2 | "registre pra gente add esse step no plano depois" | ✅ Item ⏸ no backlog |
| 4.3 | "quero ver o app" | ✅ Demonstração navegável publicada |
| 4.4 | "me mostre um plano de execução e review de bugs e implementação de melhorias e craft" | ✅ `10-PLANO-DE-EXECUCAO.md` |

---

## 5 · "Sem cobranças"

| | Pedido | Estado |
|---|---|---|
| 5.1 | "só não quero cobranças" | ✅ R2 desligado; fotos no D1; zero cartão |
| 5.2 | "eu crio a conta, vamos seguir como tinha sugerido" | ⏸ Parado no passo 2 (criar o banco) |

---

## 6 · "Falta um trabalho de design e UX grande"

| | Pedido | Estado |
|---|---|---|
| 6.1 | Tratamento **editorial impresso** | ✅ Aplicado na Fila |
| 6.2 | Uma tela por vez | ✅ Fila primeiro |
| 6.3 | "sites premiados em CSS… fontes, comportamentos, rolagem, motion" | ✅ Linguagem aplicada em andamento de ferramenta. `04-DESIGN-SYSTEM.md` §4 |

---

## 7 · A decisão de foco — 07/09/2026

> "Vamos focar apenas no design nesse app e melhorar a usabilidade e foco dele.
> Isso significa tirar só as funções de pré-texto, vai ser focado em layoutar
> nossos conteúdos."

**O que isso decide, e é a decisão mais importante do projeto até aqui:**

O Mestiza Lab não é uma ferramenta de conteúdo. É uma ferramenta de
**diagramação**. Quem abre já sabe o que vai publicar; o app existe para tirar
a peça da cabeça e pôr no formato certo, rápido, dentro do sistema da marca.

Consequência: **toda decisão que o app pede e que não é sobre diagramar é
atrito.**

O que sai, o que fica e o que muda de natureza está em
[`01-FASES.md`](01-FASES.md), com a revisão de UX que sustenta cada corte em
[`11-REVISAO-UX.md`](11-REVISAO-UX.md).

---

## 8 · O que está travado em terceiros

| | O quê | Quem destrava |
|---|---|---|
| 8.1 | **Screenshots do `paulkalkbrenner.net`** — 5 rotas tentadas (direta, WebFetch, Wayback, Awwwards, extrator). O proxy desta sessão só libera registros de pacote e as APIs da Anthropic. Não é falta de tentativa | Vilker: 5–6 prints |
| 8.2 | **Referências de diagramação dos templates** | Vilker: 5–10 peças |
| 8.3 | **Nome e tom da editoria nova** | Vilker: uma frase |
| 8.4 | **Publicar na Cloudflare** — parado no passo 2 | Vilker: criar o banco e mandar o Database ID |
| 8.5 | **O que a hospedagem própria oferece** | Vilker: tipo, Node, banco, storage |
| 8.6 | Campos de contas a pagar *(satélite)* | Vilker, quando quiser |
