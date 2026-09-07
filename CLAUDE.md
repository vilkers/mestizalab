# Mestiza Lab — contexto do projeto

> **Antes de qualquer trabalho, leia [`docs/README.md`](docs/README.md)** — ele
> diz onde o projeto está, o que está aberto e o que depende do Vilker.
> Todo pedido novo entra em [`docs/02-BACKLOG.md`](docs/02-BACKLOG.md) na mesma
> sessão em que aparece. Nada vive só na conversa.
>
> Agentes deste projeto (em `.claude/agents/`): `diretor-de-arte`,
> `qa-mestiza`, `redator-mestiza`, `template-smith`.

Ferramenta de **diagramação** do estúdio **Mestiza** (`mestiza.work`).
Interlocutor: **Vilker Silva**, diretor de arte publicitário sênior.

**O foco, decidido em 07/09/2026:** o app NÃO escreve. Quem abre já sabe o que
vai publicar; a ferramenta existe para pôr a peça no formato certo, dentro do
sistema da marca. Toda decisão que o app pede e que não é sobre diagramar é
atrito. Redator, briefings, voz e tom e base de conteúdo estão **cortados** —
não são funcionalidade adormecida, são decididos contra.

O tom de tudo aqui — código, texto de interface, documentação — é o de estúdio
de criação, não o de produto SaaS. Nada de "Oops!", nada de emoji na interface,
nada de ilustração genérica.

---

## Decisões já tomadas (não re-perguntar)

| Tópico | Decisão |
|---|---|
| Infra | Cloudflare Workers + D1 + R2. R$ 0/mês, uso comercial liberado |
| Por que não Supabase/Vercel | Supabase Free pausa o projeto sem uso; Vercel Hobby é licenciado para uso não-comercial. US$ 45/mês a mais pela mesma entrega |
| Um Worker só | O mesmo Worker serve os arquivos (`[assets]`) e a API. Mesma origem = cookie de sessão sem CORS e sem `SameSite=None` |
| Stack do app | HTML/CSS/JS puro, ES modules, **sem build step** — mesma cultura do site do estúdio |
| Redator com IA | **Desligado** por `FEATURES.redator` em `app/js/config.js`. A interface já existe atrás da flag. Ligar = pôr `ANTHROPIC_API_KEY` como secret e virar a flag |
| Vídeo | Queimado no aparelho via MediaRecorder + `canvas.captureStream()`. Sem servidor de render |
| Por que não ffmpeg.wasm | Minutos por clipe no celular. Aqui é tempo real, no encoder de hardware |
| Por que não WebCodecs puro | Mais rápido, mas levar o áudio junto exigiria demuxar o MP4 de entrada na mão. Reels sem áudio não serve |
| Módulo financeiro (Studio) | Só a tela-prévia. Modelo de dados próprio, entra depois |

---

## Marca (herdada de `mestiza.work`, não inventar)

```
--bg #000000  --bg-1 #0b0b0b  --bg-2 #131313
--fg #f4f1ea  (off-white quente — nunca #fff puro em texto)
--dim #8a867d  --faint #4a4843  --line #232323
--accent #c9a86a  (dourado metálico)

Display: STIX Two Text 600, tracking -0.03, leading 0.94
         itálico dourado como acento — UMA palavra por bloco, nunca uma frase
Micro:   Spline Sans Mono, uppercase, 0.6875rem, tracking 0.16
Easing:  cubic-bezier(0.16, 1, 0.3, 1)   ← a curva da casa, é lei
Forma:   quina viva (border-radius 0). Hairline de 1px como estrutura.
Tagline: "haz lo que quieras hacer"
Logo:    app/assets/logo/ — arte BRANCA sobre transparente, recolorida por
         source-in no canvas e por filter no CSS
```

O logo tem duas versões: `logo-horizontal-tight` (~4.06:1, para cabeçalhos) e
`logo-site-flat-tight` (~1:1, lockup empilhado com "ai · estudio" e a tagline).
As versões `-tight` são recortadas no bounding box da tinta — use sempre elas.

---

## Arquitetura — as invariantes

**1. Um renderer só.** `app/js/renderer.js` alimenta o preview do editor, o
export PNG e a máscara sobre vídeo. Se algo divergir entre preview e arquivo, o
bug está no renderer, não em três lugares.

**2. Coordenadas normalizadas 0..1.** Toda `layer.box` é fração do artboard;
`size` de tipo é fração da LARGURA. É isso que deixa a mesma composição servir
4:5, 1:1 e 9:16 e exportar em qualquer escala.

**3. Salva-se conteúdo, não camadas.** O banco guarda `content` (os slots
preenchidos) e `overrides` (o que foi mexido na mão, chaveado por
`slideIndex:layerId`). O documento é reconstruído com
`buildDoc(template, formato, content)` + overrides. É o que permite trocar de
template sem perder o texto.

**4. Formato e template são dados.** Formato novo = objeto em `formats.js`.
Template novo = função em `templates.js` que recebe `(fmt, content)` e devolve
layers, partindo de `safeBox(fmt)`. Nada mais muda.

---

## Armadilhas que já custaram caro (não reintroduzir)

- **`renderSlide` só limpa o canvas quando `transparent` é falso.** Em modo
  transparente o quadro do vídeo já está pintado; um `clearRect` ali apaga o
  clipe e deixa a máscara perfeita sobre preto.
- **`loadedmetadata` NÃO significa quadro pintável** (`readyState 1`). O
  `drawImage` desenha nada, em silêncio. Use `ensureFrame()`.
- **`currentTime = 0` quando já se está em 0 não dispara seek.** Por isso
  `ensureFrame` força `0.001`.
- **`Stage.draw` precisa devolver o contexto neutro** (`setTransform` no fim).
  O preview de vídeo usa o mesmo canvas e a escala se aplicaria duas vezes.
- **Camadas decorativas em `position: fixed` precisam de `pointer-events: none`.**
  O `.gate-scrim` chegou a comer todos os toques da tela de login.
- **Animação nunca pode ser condição para o conteúdo existir.** Todo estado
  inicial de `.reveal`/`.rise` é invisível; `observe()` tem rede de segurança de
  1,4s e `autoObserve` cobre conteúdo assíncrono.
- **`difference` sobre dourado devolve azul-lavanda**, que não existe na marca.
  Só use difference sobre base preto-e-branco contrastada.
- **`Access-Control-Allow-Origin` em `/api/files/*` é o que impede o canvas de
  ficar "tainted"** — sem isso o export de PNG quebra.
- **`Accept-Ranges` + `206` em `/api/files/*`** — sem isso o `<video>` no iOS
  não toca.

---

## Direção de arte dos templates

- Zona segura é disciplina de diagramação, não regra de plataforma. Texto de
  campanha não encosta na borda.
- `story-916` e `reels-916` têm safe area **assimétrica** — Reels come a direita
  (coluna de ícones) e a base (legenda).
- Scrim sobre foto clara: a rampa começa cedo e fecha alto, senão o micro-label
  em `--dim` some.
- Slide de carrossel: título no topo, corpo ancorado na BASE. Texto no topo de
  caixa alta deixa um buraco morto no meio.
- Paleta do editor é fechada (6 amostras). Color picker livre em editor de marca
  é convite para peça fora do sistema.

---

## Testes

Não há suíte automatizada. O que existe e vale repetir a cada mudança grande:

```bash
# 1. sintaxe de todos os módulos
for f in app/js/**/*.js worker/src/*.js; do node --check "$f"; done

# 2. todos os templates constroem em todos os formatos
node --input-type=module -e "
import { buildDoc, TEMPLATES } from './app/js/templates.js';
for (const t of TEMPLATES) for (const f of t.formats) buildDoc(t.id, f, {});
console.log('ok');"

# 3. renderizar as peças e OLHAR. Nunca confie em 'não deu erro'.
#    Chromium: /opt/pw-browsers/chromium-1194/chrome-linux/chrome
#    Playwright global: /opt/node22/lib/node_modules/playwright
```

Verificação visual é obrigatória neste projeto. Os bugs que mais custaram
(logo gigante sangrando, vídeo preto, títulos invisíveis) **passavam em todo
teste de sintaxe** e só apareceram na captura de tela.

---

## Repositórios relacionados

- `vilkers/mestiza` — site em `mestiza.work` (GitHub Pages, HTML puro).
  Origem da marca: `css/style.css`, `assets/logo/`, `CLAUDE.md`.
- `vilkers/mestizalab` — este.
