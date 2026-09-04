# Mestiza Lab

Ferramenta de criação de conteúdo do estúdio Mestiza. Mobile-first, com senha,
templates de marca, editor visual, export de PNG e de vídeo com máscara — e uma
porta de entrada para o Claude criar posts direto na fila a partir de um briefing.

**Custo de infraestrutura: R$ 0/mês.** Cloudflare Workers + D1 + R2, tudo dentro
do plano gratuito, com uso comercial liberado.

---

## O que ela faz

| | |
|---|---|
| **Senha por pessoa** | Contas individuais, sessão em cookie HttpOnly, admin adiciona e suspende gente |
| **13 templates** | Três editorias: institucional, livre e vídeo — todos derivados do sistema de mestiza.work |
| **7 formatos** | Feed 4:5, 1:1 e 9:16, Stories, Reels, carrossel 4:5 e 1:1 |
| **Editor visual** | Toque para selecionar, arraste para reenquadrar, pinça para zoom, desfazer/refazer, guias de zona segura e terços |
| **Export PNG** | 0,5× / 1× / 2× — 1× já é 1080px. Carrossel sai em `.zip` ou pelo compartilhamento do celular |
| **Vídeo** | Máscara queimada sobre o clipe, com áudio, gerada no próprio aparelho. Sem servidor de render |
| **Biblioteca de mídia** | Upload do celular, compartilhada entre a equipe |
| **Legenda** | Campo de legenda e hashtags com contagem, copiar com um toque |
| **Briefings** | O que o Claude manda cai aqui, já virado post |
| **Studio** | Módulo financeiro — ainda não existe, mas a tela já mostra o que vem |

---

## Como está montado

```
app/                    o aplicativo (HTML/CSS/JS puro, sem build)
  css/                  tokens, base, motion, chrome, editor
  js/
    renderer.js         ← o motor de desenho. Preview, PNG e vídeo saem daqui
    templates.js        ← os 13 templates, como dados
    formats.js          ← os formatos, como dados
    store.js            ← estado do documento, histórico, rascunho local
    editor-stage.js     ← canvas e gestos
    video.js            ← máscara sobre vídeo
    export.js           ← PNG, ZIP, compartilhamento
    views/              ← as telas
  assets/               logo, fontes self-hosted, amostras

worker/                 a API (Cloudflare Worker)
  src/index.js          rotas
  src/auth.js           senha, sessão, tokens
  schema.sql            banco D1
  migrations/           mudanças de estrutura, uma por arquivo

wrangler.toml           na RAIZ: é o que faz o deploy pelo painel da
                        Cloudflare funcionar sem configurar nada
```

### As três decisões que sustentam tudo

**1. Um renderer só.**
O mesmo código desenha o preview do editor, o PNG exportado e a máscara queimada
no vídeo. Não existe "ficou diferente no export" — é impossível por construção.

**2. O que se salva não são camadas, é conteúdo.**
O banco guarda `content` (o que você escreveu) e `overrides` (o que você mexeu na
mão). O documento é reconstruído com `template + formato + content + overrides`.
É isso que deixa trocar de template ou de formato **sem perder o texto**. Um
editor que salvasse camadas cruas não conseguiria fazer isso.

**3. Formato e template são dados, não código.**
Adicionar um formato novo é acrescentar um objeto em `formats.js`. Adicionar um
template é acrescentar uma função em `templates.js`. Nada mais no app muda.

---

## Sistema visual

Herdado 1:1 de `mestiza.work` — nada aqui é invenção nova.

```
--bg      #000000     --fg    #f4f1ea    (off-white quente, nunca #fff)
--dim     #8a867d     --faint #4a4843
--line    #232323     --accent #c9a86a   (dourado metálico)

Display   STIX Two Text, 600, tracking -0.03, leading 0.94
Micro     Spline Sans Mono, uppercase, tracking 0.16
Easing    cubic-bezier(0.16, 1, 0.3, 1)
```

Fontes servidas do próprio domínio (`app/assets/fonts/`, 240 KB) — o canvas
precisa delas carregadas para exportar, e FOUT em editor visual é inaceitável.

---

## Rodar localmente

```bash
npm install
npx wrangler d1 execute mestiza-lab --local --file=worker/schema.sql
npx wrangler dev
```

Abre em `http://127.0.0.1:8787` e cai na tela de primeiro acesso, onde você
cria o login. O Worker serve o app e a API na mesma origem — é por isso que o
cookie de sessão funciona sem CORS.

## Publicar

Passo a passo em [`DEPLOY.md`](DEPLOY.md).

## Ligar o Claude

Instruções e contrato da API em [`docs/INTEGRACAO-CLAUDE.md`](docs/INTEGRACAO-CLAUDE.md).
