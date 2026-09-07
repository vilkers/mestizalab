# Plano de execução

**Revisado em 07/09/2026**, depois da decisão de foco. O inventário completo de
tudo que foi pedido está em [`00-PEDIDOS.md`](00-PEDIDOS.md); a revisão de UX
que sustenta os cortes está em [`11-REVISAO-UX.md`](11-REVISAO-UX.md).

---

## A decisão que reorganiza tudo

> "Vamos focar apenas no design nesse app e melhorar a usabilidade e foco dele.
> Isso significa tirar só as funções de pré-texto, vai ser focado em layoutar
> nossos conteúdos." — Vilker, 07/09

**O Mestiza Lab é uma ferramenta de diagramação.** Quem abre já sabe o que vai
publicar. O app existe para tirar a peça da cabeça e pôr no formato certo,
rápido, dentro do sistema da marca.

Consequência, e é o critério de tudo abaixo:
**toda decisão que o app pede e que não é sobre diagramar é atrito.**

---

## O que a medição mostrou

Números medidos no app, num viewport de iPhone. Não são estimativas.

| | |
|---|---|
| **A Fila não mostra nenhuma peça inteira antes de rolar** | A primeira linha começa em y=723 e a tabbar cobre a partir de 788. Sobram 65px de uma linha de 119px. São 11 alvos de filtro acima de 5 peças |
| **O Reels não existe até você adivinhar** | Com a editoria padrão "Institucional", os formatos oferecidos são feed 4:5, 1:1, 9:16, Stories e os dois carrosséis. Reels só aparece depois de trocar a editoria para "Vídeo" |
| **O painel do editor vazava 60px para fora da tela** | Painel de 453px numa tela de 393. A aba "Formato" era **inalcançável pelo dedo**. ✅ Corrigido em 07/09 |
| **A aba Estilo pede demais** | Com uma camada de texto selecionada: 30 alvos e 2,9 telas de rolagem num painel de 393px |
| **Briefings e Studio servem zero** | 14 e 8 alvos, nenhum no caminho de diagramar |

**O comprimento dos caminhos não é o problema.** Nenhum passa de 6 toques na
conta seca: peça existente → exportada custa **3**; peça nova aceitando os
padrões, **7**; carrossel de 3 slides, **7**. O problema é **largura de tela** —
a pessoa atravessa telas onde 3 de cada 4 alvos não servem ao que ela veio
fazer.

---

# Fase A — O corte *(próxima)*

Objetivo: o app fazer uma coisa só, e fazer visivelmente.

### Cortar

| O quê | Por quê | O que se perde |
|---|---|---|
| **Aba Briefings** | A rota `/api/intake` já cria o briefing **e monta a peça** — o post cai na Fila com selo "IA". Cortar a tela não corta o caminho, corta a sala de espera | Ler o raciocínio do briefing dentro do app. Ele continua na conversa com o Claude, onde nasceu |
| **Redator IA — o código, não só a flag** | Desligado ele não custa toque, mas custa **duas explicações, em duas telas, de algo que não existe**. Uma flag é promessa de que um dia se liga; a promessa foi retirada | Nada hoje. Se um dia voltar, volta como decisão nova |
| **Aba Studio** | Zero função. Dois botões, um deles "Voltar pra fila" — uma tela que oferece botão de voltar sabe que é beco sem saída. O `docs/README.md` já dizia que o financeiro "não pode complicar a estrutura", e **uma aba na tabbar é a estrutura** | A vitrine do módulo futuro. Ela volta quando o módulo existir |
| **Modos de mistura: 5 → 2** | O próprio `CLAUDE.md` registra que `difference` sobre dourado devolve azul-lavanda, fora da marca. Multiply, screen e overlay nunca foram usados em template nenhum | Nada em uso |
| **Pesos 400/500/600/700 → 3** | A marca roda em 600. Quatro opções onde há uma decisão | Quase nada |
| **"Escolher coleção de destino" na Mídia** | O chip de coleção já define o destino ao ser selecionado. O botão é a mesma decisão, duas vezes | Nada |

### Mover

| O quê | Para onde | Por quê |
|---|---|---|
| **Legenda** | Aba sai; o campo vai para a **folha de Exportar** — campo único (legenda + hashtags), contador de 2200, botão *Copiar legenda* ao lado de *Salvar imagem* | É texto, mas **não é escrita**: chega pronta, e o app só precisa carregá-la até a área de transferência **quando o Instagram vai abrir**. A necessidade dispara na hora de exportar, não na de diagramar. A aba tinha o pior foco do editor: 3 alvos úteis em 16. Economiza 2 toques no caminho "exportar com a legenda na mão" (6 → 4) |
| **Editoria** | Deixa de ser pergunta em **Criar**. Continua existindo como dado — é ela que agrupa a Fila e filtra a biblioteca | É a mais abstrata das três perguntas **e é o que esconde o Reels** |

### Simplificar

| O quê | De | Para |
|---|---|---|
| **Tabbar** | 5 abas, alvo de 79px | **3 abas** — `FILA · ⊕ CRIAR · MÍDIA` — alvo de ~131px. Ajustes fica onde já está: link no cabeçalho e no rodapé. Não é usado toda semana, logo não é aba |
| **Abas do editor** | 5–6, tira de 453px numa tela de 393 | **4** — `CONTEÚDO · [VÍDEO] · ESTILO · CAMADAS · FORMATO` sem Legenda: 363px. **A tira para de vazar pela primeira vez** |
| **Criar** | 3 perguntas antes de ver qualquer coisa | **2** — formato e desenho. E o Reels passa a existir |

**Como saber que a Fase A acabou:** a tabbar tem três alvos, a tira de abas do
editor cabe sem arrastar, e não existe nenhuma tela no app que não sirva a
diagramar.

---

# Fase B — A Fila respirar

Objetivo: a primeira coisa que você vê ao abrir é **uma peça**, não um painel
de filtros.

- A primeira peça aparece **inteira**, sem rolar
- Os filtros recuam: hoje são 11 alvos acima de 5 peças
- A folha de contato vira o padrão? *(a decidir olhando)*
- Duplicar peça — "outra igual, trocando a foto" é o caso mais comum e não existe

---

# Fase C — O editor

Objetivo: onde a equipe passa 90% do tempo, e onde eu fui mais conservador.

- **Tratamento editorial**, como foi feito na Fila
- **Aba Estilo**: 30 alvos e 2,9 telas viram um painel que cabe
- **Medida em px ao arrastar** — a grade imanta mas não diz onde você está
- **Reordenar slides arrastando**
- Duplicar slide · alinhar e distribuir · bloquear camada

---

# Fase D — Publicar

Cinco passos, sem cartão, pelo celular ([`../DEPLOY.md`](../DEPLOY.md)).
**Parado no passo 2** — criar o banco D1 e mandar o Database ID.

Sem isso, tudo acima roda só na demonstração.

---

# Fase E — O que depende do Vilker

| O quê | O que eu preciso |
|---|---|
| **Redesenhar os templates** | 5–10 referências de diagramação |
| **Calibrar contra o site de referência** | 5–6 screenshots. `paulkalkbrenner.net` está bloqueado por rede aqui — 5 rotas tentadas |
| **A editoria nova** | Nome e tom. Tecnicamente já é só dado |

---

# Depois

| | |
|---|---|
| **Manual como página** dentro do app | Existe como `09-MANUAL.md` |
| **Pitch com prints** | Serve à equipe, a clientes e ao produto futuro |
| **Travar contra regressão** | A varredura vira `npm test`. Medir performance em aparelho antigo |
| **Guide de marca vendável** | O produto. `07-GUIDE-DE-MARCA.md`. Pré-requisito real: usar o Lab por alguns meses |
| **Migrar para hospedagem própria** | Só com motivo. A stack atual custa R$ 0 e não tem servidor para cair |

---

# Satélite — fora do produto

**Módulo financeiro do estúdio.** Contas a pagar, recebimentos, gastos,
fechamento, orçamentos. Decisão do Vilker: não faz parte do que vai ser
vendido, e a partir de 07/09 **também não ocupa aba**. Volta como módulo
separado, na mesma senha, quando ele quiser e definir os campos.

---

## A ordem, em uma linha

```
A. cortar  →  B. a Fila respirar  →  D. publicar  →  C. o editor  →  E. o desenho
```

**D vem antes de C de propósito.** Depois do corte e da Fila, o que mais ensina
é o app na mão da equipe, num aparelho de verdade, com rede de verdade. O
editor é a maior obra do projeto e não vale fazê-la sem esse retorno.
