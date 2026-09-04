# Sistema de design

## 1. Marca — herdada, não inventada

Tudo vem de `mestiza.work` (repo `vilkers/mestiza`, `css/style.css`).

```
--bg      #000000    --bg-1 #0b0b0b   --bg-2 #131313   --bg-3 #1c1c1c
--fg      #f4f1ea    off-white quente — nunca #fff puro em texto
--dim     #8a867d    texto secundário
--faint   #4a4843    placeholder, desativado
--line    #232323    hairline
--accent  #c9a86a    dourado metálico
```

**Regras de cor que não se negociam:**
- Texto principal é `--fg`, nunca branco puro. O branco puro sobre preto vibra e
  entrega "slide de PowerPoint".
- O dourado é **acento**, não cor de texto. Uma palavra em itálico por bloco,
  um micro-label, uma régua. Parágrafo inteiro em dourado mata a hierarquia.
- Preto é `#000` chapado. O grão de 3,2% (`.grain`) é o que tira o plástico.

**Tipografia:**

| Papel | Fonte | Especificação |
|---|---|---|
| Display | STIX Two Text | 600, tracking `-0.03em`, leading `0.94` |
| Acento | STIX Two Text | itálico 500, cor `--accent` — **uma palavra** |
| Corpo | STIX Two Text | 400, tracking `-0.008em`, leading `1.32` |
| Micro | Spline Sans Mono | 500, CAIXA ALTA, tracking `0.16em`, 0.6875rem |
| Nano | Spline Sans Mono | 400, CAIXA ALTA, tracking `0.22em`, 0.625rem |

O contraste entre serif enorme e mono minúsculo é o que faz o display parecer
maior do que é. Nunca usar mono para corpo de texto, nunca serif para label.

**Forma e movimento:**

```
border-radius   0        quina viva. Editorial, não app-store
hairline        1px      #232323 — é estrutura, não decoração
easing          cubic-bezier(0.16, 1, 0.3, 1)     expo-out, a curva da casa
durações        180 / 320 / 620 / 900ms
```

---

## 2. Grade de diagramação *(a implementar — Fase 2)*

Especificação pronta para virar código. A grade vive **dentro da zona segura**,
não do artboard inteiro — é o que faz a mesma grade servir 4:5 e Stories.

### Colunas

```
colunas   6        divide bem: 2, 3 e 6 partes
gutter    0.022    fração da largura do artboard (≈24px em 1080)
```

Largura de coluna (normalizada, dentro da safe box):

```
c = (safe.w - gutter * (colunas - 1)) / colunas
```

Em `feed-45` (1080×1350, safe.w = 0.876): coluna ≈ 138px, gutter 24px.

**Por que 6 e não 12:** peça de social não tem espaço para 12 colunas — a
coluna fica com 60px e ninguém alinha nada nela. Com 6, as divisões úteis
(metade, terço, dois terços) são todas exatas.

### Linhas

```
linhas    8        no formato vertical; 6 no quadrado
gutter    mesmo da coluna
```

Linhas servem para ancorar blocos horizontais (faixa, scrim, bloco de texto),
não cada elemento.

### Baseline

```
baseline  0.015    fração da largura (≈16px em 1080)
```

Subdivisão fina, só para o snap vertical de tipo. Não precisa ser desenhada por
padrão — vira ruído visual.

### Snap

```
tolerância   0.008   fração da largura (≈9px em 1080)
```

Imanta em, nesta ordem de prioridade:
1. borda da zona segura
2. borda de coluna (esquerda e direita)
3. centro do artboard
4. linha
5. baseline (só no eixo vertical, só para texto)

**Regra de usabilidade:** o snap tem que poder ser desligado durante o gesto.
No desktop, segurar `Alt`. No celular, um toggle no painel — porque não existe
modificador no dedo.

### Como desenhar

A grade é overlay SVG, junto com a zona segura e os terços em
`app/js/editor-stage.js` → `drawOverlay()`. Cores:

```
zona segura   rgba(201,168,106,0.22)   dourado, tracejado 3/5
colunas       rgba(244,241,234,0.07)   off-white, preenchimento sólido leve
linhas        rgba(244,241,234,0.05)
baseline      rgba(244,241,234,0.04)
guia de snap  rgba(201,168,106,0.9)    aparece só durante o arraste
```

A guia de snap ativa é a única que grita. As outras existem para serem
ignoradas até você precisar delas.

---

## 3. Zonas seguras por formato

Já implementado em `app/js/formats.js`. Não são regra de plataforma — são
disciplina de diagramação, com exceção das duas assimétricas:

| Formato | topo | dir | base | esq | nota |
|---|---|---|---|---|---|
| `feed-45` | 5,5% | 6,2% | 5,5% | 6,2% | composição |
| `feed-11` | 6,5% | 6,5% | 6,5% | 6,5% | composição |
| `story-916` | **13,5%** | 6% | **18,5%** | 6% | topo = avatar/barra; base = campo de resposta |
| `reels-916` | 9% | **15,5%** | **21%** | 6% | direita = coluna de ícones; base = legenda + áudio |

Reels come mais da direita e da base que Stories. Ignorar isso é ter o texto
tapado pelo botão de curtir.

---

## 4. Referência de comportamento — `paulkalkbrenner.net`

⚠️ **Não consegui abrir o site.** Bloqueado pelo proxy de rede desta sessão em
duas tentativas (`EGRESS_BLOCKED`). Não vou descrever o que não vi.

**Pendente:** screenshots ([`03-PENDENCIAS.md`](03-PENDENCIAS.md), item 1).

### O que foi aplicado até aqui, sem depender do site

Estes princípios vêm do sistema da própria Mestiza e de editorial impresso —
são seguros e provavelmente compatíveis com a referência:

| Princípio | Onde está |
|---|---|
| Contraste extremo entre display e micro | Toda a interface |
| Hairline de 1px como estrutura visível | `.sec`, `.opt-list`, `.layers` |
| Numeração de índice (`01`, `02`) expondo a estrutura | Lista de editorias, carrossel |
| Revelação por máscara (`clip-path`, `translateY(105%)`) em vez de fade | `motion.css` → `.reveal`, `.wipe` |
| Linha que inverte polaridade no toque | `.invert-row` |
| Marquee da assinatura no rodapé | `appFooter()` |
| Vazio como tensão entre extremos, não como sobra | Slides de carrossel |

### O que ainda quero calibrar com as imagens

- escala tipográfica real (a razão entre os degraus)
- escala de espaçamento (hoje uso base 4px — pode não bater com o ritmo de lá)
- comportamento do menu e da navegação
- tratamento de imagem (corte, proporção, grade de galeria)
- as transições: duração e se são por corte, máscara ou deslocamento

---

## 5. Escala de espaçamento

Base 4px, com clamps fluidos. Definida em `app/css/tokens.css`.

```
4  8  12  16  20  24  32  40  48  64  80  96
gutter da página: clamp(16px, 5vw, 40px)
```

**Sujeito a revisão** quando as referências chegarem.
