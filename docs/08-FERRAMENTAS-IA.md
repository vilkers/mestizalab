# Ferramentas de design com IA — o que existe e o que usar

> Resposta à pergunta: *"tem alguma ferramenta de design mais arrojada ligada ao
> Claude pra que eu consiga fazer essas peças? De forma uniforme, design
> personalizado, gere as imagens a partir de referências."*

**Aviso de honestidade:** meu conhecimento tem corte em maio de 2026 e hoje é
setembro. O panorama de ferramentas generativas muda em semanas. O que está
abaixo em **arquitetura** continua valendo; os **nomes de produto** confira
antes de assinar.

---

## A resposta curta

Não existe uma ferramenta só que faça tudo. O que existe — e funciona muito
bem — é uma divisão de trabalho em três camadas:

| Camada | Quem faz | O quê |
|---|---|---|
| **Direção e consistência** | Claude | Escreve os prompts, mantém o sistema, critica o resultado, itera |
| **Pixel** | Nano Banana Pro / Freepik / Krea / Midjourney | Gera a imagem |
| **Layout e tipo** | Mestiza Lab (o que construímos) ou Claude Design | Compõe a peça final |

**A resposta específica à sua pergunta:** o Claude não gera imagem raster. O
valor dele aqui não é gerar — é ser o **diretor de arte que escreve o prompt e
segura a consistência**. Que é justamente onde a maioria falha: cada geração
sai com uma luz, uma lente e uma paleta diferentes, e o feed vira colcha de
retalho.

---

## 1. Claude Design — o que existe hoje ligado ao Claude

Nesta sessão do Claude Code existe a skill **`/design`**: um canvas de múltiplos
artboards publicado como Artifact, com editor visual — clicar para selecionar,
painel de propriedades, edição de texto no lugar, desfazer/refazer, export em
PNG e PDF.

**Para o que serve muito bem:**
- explorar diagramação rápido, com várias variações lado a lado
- mockups de tela, landing pages, pôsteres, one-pagers
- **montar o pitch da ferramenta** (item do backlog)
- prototipar o guide de marca antes de codar

**Para o que não serve:**
- não gera fotografia
- não é a ferramenta de produção diária da equipe — para isso é o Mestiza Lab,
  que tem os templates, a senha, a fila e o export no formato certo

**Sugestão prática:** use `/design` como prancheta de exploração e o Mestiza Lab
como linha de produção. Quando uma exploração virar padrão, eu converto em
template com o agente `template-smith`.

---

## 2. Geração de imagem — a arquitetura que resolve consistência

O problema real não é *"gerar uma imagem boa"*. É **gerar cinquenta imagens que
pareçam da mesma campanha.**

### O que causa a inconsistência

Cada geração isolada re-decide luz, lente, grade de cor, textura de pele e
profundidade de campo. O modelo não tem memória entre gerações. Se o prompt não
trava essas variáveis, elas variam.

### A solução: prompt-base + slot variável

Um bloco fixo que carrega a direção de fotografia do estúdio, e um slot que
muda. Estrutura:

```
[BLOCO FIXO — a direção de fotografia da Mestiza]
  câmera e lente     ex.: 50mm, f/2.0, altura do olho
  luz                ex.: janela lateral suave, key à esquerda, fill mínimo,
                          queda de 2 stops para a sombra
  grade de cor       ex.: sombras neutras frias, pele quente, sem verde no meio-tom
  textura            ex.: grão fino de filme, sem clareamento de pele, poro visível
  fundo              ex.: superfície sólida, sem cenário narrativo
  proibições         ex.: sem HDR, sem bokeh exagerado, sem flare, sem simetria total

[SLOT VARIÁVEL]
  o sujeito e a ação desta peça específica

[REFERÊNCIAS — com o papel de cada uma declarado]
  ref 1 = composição e enquadramento
  ref 2 = luz e grade de cor
  ref 3 = textura e acabamento
```

**Declarar o papel de cada referência é o passo que quase ninguém dá** — e é o
que separa "puxei umas refs" de direção de arte. Uma referência jogada sem
função faz o modelo misturar tudo.

### Sobre limitações reais das ferramentas

- **Freepik Spaces não tem peso de referência.** Você não controla quanto cada
  ref influencia. A saída: subir menos referências e mais explícitas, e
  descrever em texto o que cada uma deveria contribuir. Se subir três refs de
  luz diferente, ele faz média — e média é o inimigo.
- **Midjourney** tem `--sref` com peso, que resolve melhor a consistência de
  estilo entre peças de uma mesma campanha.
- **Nano Banana Pro** é forte em edição dirigida e em manter identidade entre
  gerações — bom para variação sobre uma peça aprovada.
- **Krea** é bom em tempo real e upscale.

**Regra de craft:** o resultado deve parecer fotografia ou peça real de
campanha. Se parecer "imagem de IA", quase sempre é excesso — de nitidez, de
simetria, de contraste, de bokeh. O ajuste é sempre para menos.

---

## 3. O que eu proponho construir *(entra na Fase 3)*

Um **kit de prompt do estúdio**, versionado no repo, em `docs/PROMPT-KIT.md`:

| Seção | Conteúdo |
|---|---|
| **Direção de fotografia** | O bloco fixo acima, preenchido com o padrão da Mestiza |
| **Variações por editoria** | Institucional pede uma luz; Livre pede outra |
| **Papéis de referência** | Que tipo de ref usar para composição, para luz, para textura |
| **Proibições** | O que nunca deve aparecer — a lista que mata a estética genérica |
| **Prompts prontos** | Blocos copiáveis por tipo de peça, sem exigir interpretação |
| **Fluxo de subida** | Como subir no Spaces, no Nano Banana, no Krea — passo a passo |

Aí o ciclo fica: você pede a peça aqui na conversa → eu monto o prompt a partir
do kit → você gera na ferramenta → sobe a imagem na biblioteca do Mestiza Lab →
o post se monta em cima dela.

**Para eu escrever esse kit, preciso de você:** 8 a 10 imagens que representam
o padrão fotográfico da Mestiza. Não precisa explicar — eu extraio a lente, a
luz, a grade e a textura e escrevo o bloco fixo. Você corrige.

---

## 4. O que eu não recomendo

- **Trocar o Mestiza Lab por um gerador de layout com IA.** Diagramação é
  decisão, não amostragem. Um modelo não sabe por que 4:5 pede outra escala de
  tipo que 9:16 — e a peça sai "quase certa", que é o pior lugar.
- **Gerar a peça inteira (com tipo) num modelo de imagem.** A tipografia sai
  deformada, a marca sai errada e não dá para editar. Imagem generativa entra
  como **matéria-prima**, e o tipo entra na plataforma.
- **Assinar quatro ferramentas antes de ter o kit de prompt.** Com o kit, uma
  só já resolve a maior parte. Sem ele, quatro só multiplicam a inconsistência.
