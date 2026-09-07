# Revisão de UX — Mestiza Lab

> **Data:** 2026-09-07 · **Agente:** `ux-mestiza`
> **Método:** o app rodado de verdade em Chromium, viewport 393×852, `isMobile`,
> `hasTouch`, DPR 2, a partir de `demo/mestiza-lab-demo.html`. Todos os números
> deste documento foram medidos percorrendo a interface, não estimados.

**O contexto que muda tudo.** O Vilker redefiniu o foco em 07/09:

> "Vamos focar apenas no design nesse app e melhorar a usabilidade e foco dele.
> Isso significa tirar só as funções de pré-texto, vai ser focado em layoutar
> nossos conteúdos."

O app deixa de ter ambição de **escrever** e passa a ser exclusivamente
ferramenta de **diagramar**. A pergunta desta revisão, repetida em toda tela:
*o que esta tela pede que a pessoa decida — e ela precisa decidir isso agora?*

---

## 1. Os caminhos, cronometrados

Toques contados clicando de verdade. "Sessão viva" é o caso de todo dia: o
cookie do Worker sobrevive e a tela de login não aparece.

| Caminho | Hoje (sessão viva) | Hoje (com login) | Sequência medida |
|---|---|---|---|
| **Peça existente → exportada** | **3** | 4 | linha da fila · Exportar · Salvar imagem |
| **Peça nova do zero → exportada**, aceitando todo padrão | **7** | 8 | Criar · Abrir no editor · Escolher imagem · miniatura · Usar esta imagem · Exportar · Salvar |
| **Peça nova do zero → exportada**, escolhendo editoria, formato e desenho | **10** | 11 | + 3 toques nos três passos |
| **Trocar a foto de uma peça existente** | **4** | 5 | linha da fila · Trocar imagem · miniatura · Usar esta imagem |
| **Carrossel de 3 slides → exportado** | **7** | 8 | Criar · Carrossel 4:5 · Abrir no editor · Escolher imagem · miniatura · Usar esta imagem · Exportar · Salvar todas |

Três coisas que os números escondem e precisam ser ditas:

**a) O share do iPhone cobra mais dois.** `shareOrDownload` chama
`navigator.share` com os arquivos. No aparelho isso abre a folha do sistema:
mais um toque em "Salvar em Fotos" e um em "Concluído". **Todo caminho acima
custa +2 na vida real.** Peça existente exportada = **5 toques de verdade.**

**b) No fallback, o carrossel cobra por slide.** Quando o download é bloqueado
(webview, link de demonstração), `salvar.js` mostra as peças para salvar
segurando. Um carrossel de 5 slides = **5 toques longos + 5 confirmações**.
Medido: o carrossel exportou 5 imagens (`01/05` a `05/05`). Isso não é bug —
é o único caminho possível ali — mas é o pico de custo do app e ninguém sabe
disso antes de chegar lá.

**c) O caminho do carrossel só é curto porque ninguém digitou nada.** O
template `inst-carrossel` já nasce com 3 blocos preenchidos e 5 slides. Montar
um carrossel de verdade é preencher **9 campos de texto** (chapéu, título de
capa, 3 títulos, 3 textos, fecho). O custo do carrossel não está nos toques:
está na digitação — e digitar é justamente o que o Vilker acabou de dizer que
não é o trabalho deste app.

**Veredito.** Nenhum caminho principal está acima de 6 toques na conta seca,
e isso é bom. O problema deste app **não é comprimento de caminho — é largura
de tela.** A pessoa chega rápido, mas atravessa telas onde 3 de cada 4 alvos
não têm nada a ver com o que ela veio fazer.

---

## 2. Carga por tela

Alvos interativos visíveis e quantos servem ao caminho principal (pôr conteúdo
no lugar e sair com o arquivo).

| Tela | Alvos | Servem | Foco | Rolagem |
|---|---:|---:|---:|---|
| Login | 3 | 3 | 100% | 1 tela |
| **Fila** | 23 | 6 | **26%** | 2,1 telas |
| **Criar** | 22 | 7 | **32%** | 2,2 telas |
| Mídia | 18 | 7 | 39% | 1,8 telas |
| **Briefings** | 14 | **0** | **0%** | 1,7 telas |
| **Studio** | 8 | **0** | **0%** | 1,9 telas |
| Ajustes | 9 | 0 (manutenção) | — | 1,6 telas |
| Editor · Conteúdo (peça simples) | 18 | 15 | 83% | 1 tela |
| Editor · Conteúdo (carrossel) | 32 | 29 | 91% | 4,0 telas de painel |
| Editor · Estilo (nada selecionado) | 13 | 13 | 100% | 1 tela |
| **Editor · Estilo (camada de texto)** | **43** | ~30 | 70% | **2,9 telas de painel** |
| Editor · Camadas | 20 | 20 | 100% | 1 tela |
| **Editor · Legenda** | 16 | **3** | **19%** | 1 tela |
| Editor · Formato | 25 | 15 | 60% | 1 tela |
| Editor · Vídeo (sem R2) | 15 | 15 | 100% | 1 tela |

### Três medições que decidem a revisão

**A Fila não mostra nenhuma peça inteira antes de rolar.** Geometria medida:
manchete e lead ocupam até y=503; trilho de status em y=503; trilho de editoria
em y=550; barra Índice/Contato em y=613; cabeçalho de seção em y=665; **a
primeira linha da fila começa em y=723** — e a tabbar ocupa de 788 a 852. Sobram
65px da primeira peça, atrás da barra de navegação. **A tela cuja função é
"toque em qualquer peça" não oferece nenhuma peça tocável na primeira dobra.**
São 11 alvos de filtro (5 status + 4 editorias + 2 vistas) para uma fila de
5 itens — mais controles de filtro do que coisas a filtrar.

**A tira de abas do editor não cabe na tela.** Medido: 5 abas somam 453px de
largura contra 393px de viewport. "Formato" começa em x=362 e tem 91px — **60px
dela nascem fora da tela**. Com Reels são 6 abas, 528px, **135px fora**. Existe
uma aba do editor que a pessoa nunca vê inteira sem arrastar de lado.

**O painel Estilo é o lugar mais denso do app.** Com uma camada de texto
selecionada: 43 alvos na tela, 30 deles num painel de 393px de altura que
guarda 1125px de conteúdo — **2,9 telas de rolagem** para ajustar um título.
Dentro dele: 3 sliders, 4 grupos de segmentos, 1 chave, 6 amostras de cor e
**5 modos de mistura**, sendo que o `CLAUDE.md` deste projeto registra que
`difference` sobre dourado devolve azul-lavanda, que não existe na marca.

---

## 3. Tela por tela

| Tela | O que ela pede que a pessoa decida | Precisa ser agora? | Proposta |
|---|---|---|---|
| **Login** | E-mail e senha | Sim | Fica como está. Três alvos, 100% de foco. É a tela mais bem resolvida do app. |
| **Fila** | Status · editoria · vista · qual peça abrir | Só a última | Trilhos de filtro só aparecem acima de 12 peças. Vista Índice/Contato vira preferência guardada, não par de botões. Abertura encolhe para caber **duas linhas acima da dobra**. |
| **Criar** | Editoria · formato · desenho · confirmar | Só formato e desenho | Mata o passo "editoria" e o botão de confirmação. Chips de formato no topo, grade de 13 desenhos ao vivo embaixo. Tocar num desenho **abre o editor** — é a confirmação. |
| **Mídia** | Coleção do filtro · coleção de destino · qual arquivo · subir | Sim, mas duplicado | "Escolher coleção de destino" sai: tocar num chip de coleção já define o destino, e o texto de apoio já diz isso. Dois mecanismos para uma decisão. |
| **Briefings** | Ler · abrir post · copiar · arquivar | **Não** | **Sai.** Ver §4. |
| **Studio** | Nada. Dois botões: "Me avisa" e "Voltar pra fila" | **Não** | **Sai.** Uma tela com botão de "voltar" é uma tela que se sabe beco sem saída. |
| **Ajustes** | Token · pessoas · sair | Raramente | Fica onde está (link no cabeçalho e no rodapé). Herda as três linhas de "Sistema", que passam a ser duas. Trocar o `prompt()` nativo do "Criar token" por uma folha — é a única caixa de diálogo do sistema operacional no app inteiro. |
| **Editor · Conteúdo** | Preencher os slots do template | Sim | Núcleo do produto. "Restaurar layout do template" desce para Formato, junto das outras ações destrutivas. |
| **Editor · Estilo** | 30 propriedades da camada | Poucas | Corta Mistura para 3 modos (ou zero) e Peso para 3. Sobe Corpo, Alinhamento e Cor para o topo — é o que se mexe. |
| **Editor · Camadas** | Selecionar e esconder | Sim | Fica. Vale esconder do rol as camadas de estrutura (Scrim, Régua, Arrasta) atrás de "mostrar tudo" — hoje a primeira camada da lista é a micro-legenda "Arrasta". |
| **Editor · Legenda** | Escrever legenda e hashtags | **Não aqui** | Aba sai. Campo único vai para a folha de Exportar. Ver §4. |
| **Editor · Formato** | Formato · desenho · status · 5 guias · apagar | Sim, menos as guias | Guias viram um só botão no palco (liga/desliga o conjunto), não cinco chaves num painel. Status fica: é a única coisa de fluxo de trabalho que sobrou e custa um toque. |
| **Editor · Vídeo** | Subir clipe, ou baixar a máscara | Sim | Fica. Máscara sobre vídeo é diagramação, não texto. |

---

## 4. O julgamento sobre o pré-texto

### BRIEFINGS — **corta**

14 alvos, 1,7 tela de rolagem, **zero deles servem a diagramar**. É uma caixa de
entrada de texto escrito por outro sistema.

O que se perde, honestamente: **nada de estrutura.** A rota `POST /api/intake`
já cria o briefing *e monta a peça* quando o payload traz `post` — o post cai na
Fila com selo "IA" e `origem: claude`, e a Fila já o mostra assim (medido: a
primeira linha do índice traz "· Claude" e a chapa traz "IA"). Cortar a tela não
corta o caminho: corta a **sala de espera** do caminho.

O que se perde de verdade: a possibilidade de ler, dentro do app, o raciocínio
por trás de uma peça — e de arquivar um briefing que ainda não virou post. Isso
é real, e é aceitável: esse briefing nasceu numa conversa com o Claude e continua
lá, onde ele pode ser relido e revisado com muito mais proveito do que num cartão
de 1,7 tela dentro de um app de diagramação.

**A rota fica. A tela sai.** O intake continua escrevendo na fila.

### REDATOR IA — **corta o código, não só a chave**

Hoje `FEATURES.redator = false` e a interface existe atrás da flag em
`editor-view.js`. Enquanto desligado ele não custa toque nenhum — mas custa uma
**nota de rodapé permanente na aba Legenda** explicando que o redator está
desligado e como ligá-lo, mais uma linha em Ajustes dizendo a mesma coisa. São
duas explicações, em duas telas, de uma coisa que não existe.

Depois da decisão do Vilker, isso não é funcionalidade adormecida: é
funcionalidade **decidida contra**. Uma chave de funcionalidade é uma promessa
de que um dia se liga. Essa promessa foi retirada.

**Sai a flag, sai o botão "Gerar com o redator", saem as duas notas.** O que se
perde: um dia de trabalho se a decisão voltar atrás. Aceitável — o `git` guarda.

### LEGENDA — **a aba sai, o campo fica, e muda de lugar**

Esta é a decisão que exige defesa, então aqui está ela inteira.

A legenda **é texto, mas não é escrita.** A pessoa não abre este app para
redigir uma legenda; ela abre para diagramar. A legenda chega pronta — do
Claude, do WhatsApp, da cabeça dela — e o que o app precisa fazer é **carregá-la
até a área de transferência no momento em que o Instagram vai abrir.**

Três fatos medidos que sustentam isso:

1. **A aba Legenda é a de pior foco do editor:** 16 alvos, 3 úteis (dois campos
   e o botão de copiar). Os outros 13 são a moldura do editor e as abas irmãs.
2. **A legenda já tem função de diagramação** e ela não está na aba Legenda:
   está no preview de carrossel, que corta o texto em 125 caracteres para
   mostrar onde o feed corta (`CORTE_LEGENDA` em `carrossel-preview.js`). Isso
   é informação de layout — "a primeira linha sozinha tem que valer" —, não
   é redação.
3. **A necessidade dispara na hora de exportar,** não na hora de diagramar.
   Ninguém escreve a legenda e depois volta a mexer no kerning. Você fecha a
   peça, exporta, e vai colar.

**Proposta.** A aba some. Na folha de **Exportar** entra um bloco de legenda:
um campo só (legenda e hashtags juntas — separá-las é distinção de ferramenta de
escrita, e a área de transferência não conhece essa diferença), o contador de
2200 caracteres, e um botão **"Copiar legenda"** ao lado de "Salvar imagem". O
contador fica porque é restrição de plataforma, igual à zona segura — é
diagramação, não estilo.

O que se perde: escrever a legenda com calma olhando para a peça. Isso é real e
eu não vou fingir que não. Mas era exatamente esse gesto — o app como lugar de
escrever — que o Vilker acabou de tirar do escopo. O ganho é que a legenda passa
a aparecer no único momento em que serve.

### STUDIO — **corta**

8 alvos, 1,9 tela, **zero função**. Dois botões: "Me avisa quando abrir", que
abre uma folha e mostra um aviso mas não guarda nada em lugar nenhum, e "Voltar
pra fila". Uma tela que oferece um botão de voltar sabe que é beco sem saída.

O `docs/README.md` já registra a regra: *"O financeiro é satélite. Ele mora na
plataforma por conveniência do Vilker, mas não faz parte do produto. Não pode
complicar a estrutura."* **Uma aba na tabbar é a estrutura.** Uma das cinco
portas do app leva a uma prévia desfocada de um módulo que o próprio projeto
declarou fora do produto.

O que se perde: a lembrança visual de que o financeiro está no roteiro. Isso vive
melhor em `docs/01-FASES.md`, onde já vive.

**Sai da tabbar e sai da rota.** O `ROADMAP` de `admin.js` vira parágrafo no
documento de fases. Quando o módulo existir, ele volta — como aba, com função.

### Mais três coisas que só existem porque foram fáceis de construir

| Item | Onde | Por que sai |
|---|---|---|
| **Modos de mistura** (5 opções) | Estilo | O próprio `CLAUDE.md` avisa que `difference` sobre dourado devolve azul-lavanda, fora da marca. Cinco modos de blend num editor de marca fechada é a mesma contradição do color picker livre, que já foi corretamente recusado. Corta para Normal/Multiply/Screen — ou para nada. |
| **Peso 400/500/600/700** (4 opções) | Estilo | A marca roda em STIX 600 no display e mono no micro. Quatro pesos é um menu de fonte, não uma decisão de direção de arte. Três bastam. |
| **"Escolher coleção de destino"** | Mídia | Tocar num chip de coleção **já** define o destino do upload, e o texto da tela diz isso. Duas portas para a mesma decisão. |

---

## 5. Arquitetura de navegação depois do corte

**Sobram três abas.** O teto do método é cinco; o app precisa de três.

```
  ┌─────────────┬─────────────┬─────────────┐
  │    FILA     │  ⊕ CRIAR    │    MÍDIA    │
  │  as peças   │  a peça     │  as fotos   │
  │             │  nova       │             │
  └─────────────┴─────────────┴─────────────┘
        Ajustes: link no cabeçalho e no rodapé, como já é
```

**Por que essas três.** Uma ferramenta de diagramar tem três substantivos: o que
já existe, o que vai existir, e a matéria-prima. Fila, Criar, Mídia. Não há
quarto.

**Por que Criar no meio, e por que continua sendo o botão de destaque.** É a
zona do polegar e é a ação de intenção — a única das três em que a pessoa está
começando algo em vez de procurar. Já está assim (`tab--new`) e está certo.

**Por que Ajustes não é aba.** A regra do método: *se alguma aba não é usada toda
semana, ela não é aba — é item de Ajustes.* Ajustes em si não é usado toda
semana; por isso ele já mora corretamente em dois links discretos, e continua.

**O que muda no chrome.** Com 3 abas em vez de 5, cada alvo da tabbar passa de
79px para ~131px de largura. O rótulo cabe, o ícone respira, e o erro de toque
cai. Não é enfeite: é a barra que fica sempre na tela.

**Editor: de 5-6 abas para 4.**

```
  CONTEÚDO · [VÍDEO] · ESTILO · CAMADAS · FORMATO
```

Legenda sai (vai para Exportar). Sem ela, as 4 abas somam 363px contra 393px de
viewport: **a tira para de vazar pela direita.** Com Reels são 5 abas / 437px,
que ainda transborda 44px — mas transbordar uma aba condicional é aceitável;
transbordar a aba permanente "Formato" não era.

---

## 6. As três listas

### CORTAR

| O que sai | O que se perde, honestamente |
|---|---|
| **Aba Briefings** (`views/briefings.js`, rota `/briefings`) | Ler o briefing dentro do app e arquivar briefing que não virou post. A rota `/api/intake` fica e continua criando a peça direto na Fila. |
| **Aba Studio** (`views/admin.js`, rota `/admin`, `FEATURES.admin`) | A lembrança visual do roteiro financeiro. Ela já está em `01-FASES.md`. |
| **Redator IA** (`FEATURES.redator`, botão e as duas notas explicativas) | Um dia de trabalho se a decisão voltar. O `git` guarda. |
| **Aba Legenda do editor** | Escrever a legenda com calma olhando para a peça. O campo não morre — muda de lugar (ver MOVER). |
| **Modos de mistura** exceto Normal, Multiply e Screen | Efeitos que o guia de marca já proíbe na prática. |
| **Pesos 400 e 700** em Estilo | Dois pesos que a marca não usa. |
| **"Escolher coleção de destino"** em Mídia | Nada: o chip de coleção já faz isso. |
| **Botão "Me avisa quando abrir"** | Um botão que não guardava nada em lugar nenhum. |

### MOVER

| O que | De onde | Para onde | Por quê |
|---|---|---|---|
| **Campo de legenda** (unificado com hashtags) + contador de 2200 + "Copiar legenda" | Aba Legenda | **Folha de Exportar** | A necessidade dispara na hora de exportar, não na hora de diagramar. |
| **"Restaurar layout do template"** | Fim da aba Conteúdo | Aba Formato, junto de "Apagar post" | Ação destrutiva mora com as ações destrutivas. Hoje ela fecha a tela que a pessoa mais usa. |
| **Toggles de guia** (5 chaves) | Painel Formato | Um botão único no palco | Guia é ferramenta de olho: se liga olhando para a peça, não descendo dois níveis de painel. |
| **Linhas "Redator automático" e "Export de vídeo"** | Ajustes → Sistema | Saem | Uma descreve algo que deixou de existir; a outra descreve o funcionamento normal do app. |
| **`ROADMAP` do financeiro** | `views/admin.js` | `docs/01-FASES.md` | Ele já está lá. Vira a única cópia. |

### SIMPLIFICAR

| O que fica | Com menos decisões |
|---|---|
| **Criar** | De **4 decisões** (editoria · formato · desenho · confirmar) para **2** (formato · desenho). O passo "editoria" some — ele é a decisão mais abstrata das três e é **a que esconde o Reels**: medido, com a editoria padrão "Institucional" o formato Reels não aparece na lista, e só surge depois de escolher a editoria "Vídeo". Escolher um formato de vídeo não devia exigir saber que existe uma editoria de vídeo. Chips de formato no topo, grade dos 13 desenhos com preview ao vivo embaixo, **tocar num desenho abre o editor**. A editoria continua existindo como dado (a Fila agrupa por ela) — só deixa de ser pergunta. |
| **Fila** | De **11 alvos de filtro** para **0 até 12 peças**. Abaixo disso, filtrar 5 itens custa mais do que ler os 5. Acima disso, um só trilho de status aparece. Vista Índice/Contato vira preferência guardada em `sessionStorage` — já é —, alternada por um ícone no cabeçalho, não por dois botões ocupando uma faixa. A abertura encolhe o suficiente para **duas linhas da fila caberem acima da dobra**: hoje não cabe nenhuma. |
| **Estilo** | De **30 controles** para ~22, com Corpo, Alinhamento e Cor no topo do painel. Hoje "Corpo" aparece depois de 900px de rolagem quando a camada tem texto. |
| **Camadas** | Camadas de estrutura (Scrim, Régua, Arrasta) recolhidas atrás de "mostrar tudo". Hoje o primeiro item da lista de um carrossel é a micro-legenda "Arrasta" — a camada menos provável de alguém querer mexer. |
| **Export** | A folha ganha a legenda e ganha uma linha de aviso quando o ambiente não permite download: no fallback, um carrossel de 5 slides custa 5 toques longos, e isso precisa ser dito **antes** de a pessoa tocar em "Salvar todas", não depois. |

---

## 7. Os caminhos, antes e depois

| Caminho | Hoje | Depois | Diferença |
|---|---:|---:|---|
| Peça existente → exportada | 3 | **3** | igual — já estava certo |
| Peça existente → exportada **com a legenda na mão** | 3 + 3 (aba Legenda · Copiar tudo · voltar) = **6** | **4** | −2 |
| Peça nova do zero → exportada, com escolhas de verdade | 10 | **8** | −2 (sai "editoria", sai o CTA de confirmação) |
| Peça nova → exportada, aceitando padrões | 7 | **6** | −1 |
| Trocar a foto de uma peça existente | 4 | **4** | igual |
| Carrossel de 3 slides → exportado | 7 | **6** | −1 |
| **Reels do zero → máscara exportada** | **6** (Criar · editoria Vídeo · desenho · Abrir no editor · aba Vídeo · Baixar máscara) | **5** | −1, e o formato deixa de estar escondido atrás de uma decisão de editoria |

Somando: **−9 telas de rolagem** fora do editor (Briefings 1,7 + Studio 1,9 e o
que encolhe em Fila e Criar), **−22 alvos interativos** na navegação principal,
**duas abas a menos** na tabbar e **uma aba a menos** no editor — que é o que
faz a tira de abas caber na tela pela primeira vez.

---

## 8. A recomendação, em uma frase

O Mestiza Lab já é rápido; ele só não é **estreito**. Cortar Briefings, Studio,
o redator e a aba Legenda não torna o app mais pobre — torna-o **uma coisa só**:
o lugar onde uma peça entra bruta e sai diagramada, em três toques. Tudo que
sobra na tela depois desse corte é sobre onde o texto fica, não sobre o que ele
diz.
