# Ligar o Claude no Mestiza Lab

O objetivo: você pede o conteúdo aqui na conversa e ele **aparece pronto na
fila do app** — com o post montado, o template escolhido e a legenda escrita.
Você abre no celular, ajusta o que quiser e exporta.

---

## Configurar (uma vez)

1. No app: **Ajustes → Integração com o Claude → Criar token**
2. Copie o bloco que aparece — ele mostra a base da API e o token, e **só
   aparece uma vez** (o servidor guarda só o hash)
3. Cole na conversa com o Claude, uma vez. Algo assim:

```
Base da API: https://mestiza-lab.suaconta.workers.dev/api
Token: mzl_xxxxxxxxxxxxxxxxxxxxxxxx
```

Pronto. A partir daí é só pedir.

---

## Como pedir

Linguagem normal. Exemplos que funcionam:

> Monta um carrossel institucional sobre os três erros mais comuns em briefing
> de campanha. Três slides de conteúdo, com a legenda.

> Preciso de um post de feed 4:5 anunciando o shooting do Boticário. Usa o
> template de capa de projeto.

> Faz uma máscara de Reels com a manchete "o set às seis da manhã".

> Cria três variações da mesma frase em formatos diferentes: feed, stories e
> quadrado.

---

## O contrato da API

Para quem for integrar na mão, ou para o Claude conferir. O próprio endpoint
descreve o contrato: `GET /api/intake` com o token devolve este mesmo esquema.

### `POST /api/intake`

```
Authorization: Bearer mzl_...
Content-Type: application/json
```

```jsonc
{
  "titulo": "Carrossel sobre briefing",
  "briefing": "O texto do briefing, para ficar registrado na aba Briefings.",

  "post": {
    "titulo": "Três erros de briefing",
    "editoria": "institucional",          // institucional | livre | video
    "formato": "carrossel-45",
    "template": "inst-carrossel",
    "content": { /* os slots do template — ver tabela abaixo */ },
    "legenda": "A legenda que vai no Instagram.",
    "hashtags": "#mestiza #direcaodearte",
    "status": "revisao"                   // rascunho | revisao | aprovado | publicado
  }
}
```

Resposta:

```json
{ "ok": true, "briefing_id": "brf_...", "post_id": "pst_...", "post": { } }
```

O `post` é opcional. Sem ele, entra só o briefing na aba Briefings.

---

## Formatos

| id | proporção | px | uso |
|---|---|---|---|
| `feed-45` | 4:5 | 1080×1350 | feed, maior alcance |
| `feed-11` | 1:1 | 1080×1080 | LinkedIn, grid |
| `feed-916` | 9:16 | 1080×1920 | post vertical cheio |
| `story-916` | 9:16 | 1080×1920 | Stories (respeita a UI) |
| `reels-916` | 9:16 | 1080×1920 | máscara sobre vídeo |
| `carrossel-45` | 4:5 | 1080×1350 | carrossel |
| `carrossel-11` | 1:1 | 1080×1080 | carrossel quadrado |

---

## Templates e seus slots

### Institucional

| template | formatos | `content` |
|---|---|---|
| `inst-declaracao` | feed-45, feed-11, feed-916, story-916 | `imagem`, `chapeu`, `titulo` |
| `inst-capa-projeto` | idem | `imagem`, `cliente`, `projeto`, `ficha` |
| `inst-citacao` | idem | `texto`, `autor` |
| `inst-bastidores` | idem | `imagem`, `label`, `local`, `data` |
| `inst-lista` | idem | `chapeu`, `titulo`, `itens` (array) |
| `inst-anuncio` | idem | `imagem`, `titulo`, `data`, `cta` |
| `inst-carrossel` | carrossel-45, carrossel-11 | `imagem`, `chapeu`, `titulo`, `blocos` (array de `{titulo, texto}`), `fecho` |

### Vídeo (máscaras, formato `reels-916`)

| template | `content` |
|---|---|
| `video-moldura` | `handle` |
| `video-manchete` | `chapeu`, `titulo` |
| `video-legenda` | `texto` |

### Livre

| template | formatos | `content` |
|---|---|---|
| `livre-poster` | feed-45, feed-11, feed-916, story-916 | `imagem`, `palavra`, `nota` |
| `livre-split` | idem | `imagem`, `titulo`, `legenda` |
| `livre-duotone` | idem | `imagem`, `texto` |

---

## Exemplo completo

```bash
curl -X POST https://SEU-APP/api/intake \
  -H "Authorization: Bearer mzl_..." \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Carrossel — processo",
    "briefing": "Explicar as quatro etapas do processo do estúdio.",
    "post": {
      "titulo": "Como a gente trabalha",
      "editoria": "institucional",
      "formato": "carrossel-45",
      "template": "inst-carrossel",
      "content": {
        "chapeu": "Processo",
        "titulo": "Quatro etapas,\nnenhuma pulada.",
        "blocos": [
          { "titulo": "Briefing",  "texto": "Toda peça começa com uma pergunta difícil." },
          { "titulo": "Direção",   "texto": "Referência não é moodboard: é decisão." },
          { "titulo": "Entrega",   "texto": "O arquivo sai pronto, no formato certo." }
        ],
        "fecho": "Salva esse post."
      },
      "legenda": "O processo em quatro etapas.",
      "hashtags": "#mestiza #direcaodearte",
      "status": "revisao"
    }
  }'
```

---

## Sobre as imagens

`content.imagem` aceita a URL devolvida por `POST /api/media`.

Sem imagem, o post entra com o espaço reservado e quem abre escolhe da
biblioteca no editor — que costuma ser o certo, já que a escolha da foto é
decisão de direção de arte, não de texto.

Para subir uma imagem pela API:

```bash
curl -X POST https://SEU-APP/api/media \
  -H "Authorization: Bearer mzl_..." \
  -F "file=@foto.jpg"
```

---

## Escrevendo bem para estes templates

Regras que vêm do desenho, não de gosto:

- **`inst-declaracao`** — a frase é uma só, curta, de campanha. Três linhas no
  máximo. Se precisa de quatro, não é declaração: é legenda.
- **`inst-carrossel`** — um slide sustenta uma ideia. Se tem duas, são dois
  slides. O corpo de cada slide vive bem em 100–160 caracteres.
- **`inst-lista`** — os itens são substantivos ou verbos curtos, não frases.
  Quatro é o número que respira melhor; seis é o teto.
- **`inst-citacao`** — até 120 caracteres. Acima disso o corpo encolhe e a peça
  perde a presença.
- **`video-manchete`** — precisa ser lida com o som desligado, em dois segundos.
- **`livre-*`** — palavra, não frase. É pôster.
