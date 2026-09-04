# Plano de execução, bugs e craft

> Pedido do Vilker: *"um plano de execução e review de bugs e implementação de
> melhorias e craft na plataforma"*.
>
> Não é um plano teórico. A varredura abaixo foi **rodada de verdade** contra o
> app, num viewport de iPhone, e os números são medidos.

**Rodada em:** 04/09/2026, contra o build de demonstração
**Método:** Chromium headless, 393×852, `isMobile`, `hasTouch`, DPR 2

---

## 1. A varredura — o que foi medido

Cinco classes de defeito, checadas em todas as telas e nas cinco abas do editor:

| O que | Como |
|---|---|
| Erros de JavaScript | `console[error]` e `pageerror` em cada tela |
| Conteúdo invisível | `opacity` computada dos elementos `.reveal` / `.rise` |
| Texto estourando | `scrollWidth > clientWidth` com `overflow-x: visible` |
| Scroll lateral do corpo | `documentElement.scrollWidth > innerWidth` |
| Alvos de toque | `getBoundingClientRect` de todo botão, chip, célula e linha |

Mais três cenários de borda: texto de 600 caracteres num campo de 3 linhas,
remover slides de um carrossel até sobrar poucos, e o `.zip` num ambiente que
bloqueia download.

---

## 2. Resultado

### Estrutura: limpa

**Zero erros de console. Zero conteúdo invisível. Zero texto estourando. Zero
scroll lateral.** Os cenários de borda passaram: texto absurdo renderiza sem
travar (o `fitMode: 'shrink'` segura), remover slides recompõe a numeração
sozinho, e o `.zip` avisa em vez de falhar mudo.

Isso não é sorte — é consequência de duas decisões: um renderer só, e a rede de
segurança de 1,4s no `observe()` que impede animação de virar condição para o
conteúdo existir.

### Craft: 48 defeitos, todos do mesmo tipo

**Alvos de toque abaixo de 44px.** A diretriz da Apple é 44pt, e esta ferramenta
é usada com uma mão, em pé, às vezes no set.

| Onde | Antes | Depois |
|---|---|---|
| Botão "Ajustes" no rodapé | **57 × 10 px** | 44px |
| `.btn--sm` — inclui **Exportar**, "Trocar imagem", "Copiar tudo", os toggles de guia | 36px | 42px |
| `.chip` — filtros da fila, formatos, coleções, status | 37px | 42px |
| `.seg button` — alinhamento, peso, tratamento | 40px | 44px |

O de 10px era o pior: menos que a espessura de um dedo. Um chip de 37px numa
fileira que rola na horizontal é pior do que parece — o toque vira arrasto e a
pessoa conclui que o filtro não funciona.

**Todos corrigidos. Nova varredura: 0 achados.** Layout conferido depois, sem
regressão.

---

## 3. O que fica em aberto

Nada disso é bug — é o que a ferramenta ainda não faz.

### Craft e usabilidade

| Prioridade | Item | Por quê |
|---|---|---|
| Alta | **Réguas com medida em px ao arrastar** | Hoje a grade imanta, mas não diz onde você está. Um DA quer o número |
| Alta | **Duplicar post** | "Outro igual, trocando a foto" é o caso mais comum e hoje não existe |
| Alta | **Reordenar slides arrastando** | Hoje só sobe um por vez, com botão |
| Média | Duplicar slide | |
| Média | Busca na fila e na biblioteca | Passa a doer com 40+ posts |
| Média | Alinhar e distribuir a seleção | |
| Média | Bloquear camada | O schema já prevê `locked`, falta a interface |
| Baixa | Histórico de versões | Voltar a um estado de ontem |
| Baixa | Legenda em `.txt` dentro do `.zip` | |

### Estrutura

| Item | Nota |
|---|---|
| **Sem teste automatizado** | Existem os roteiros de verificação, rodados à mão. Um `npm test` que rode a varredura acima e falhe o build evitaria regressão silenciosa |
| **Nenhuma medida de performance** | O app parece rápido, mas ninguém mediu. Vale cronometrar o primeiro desenho e o redesenho durante o arraste num aparelho antigo |
| **Acessibilidade só no básico** | Foco visível e `aria-label` existem; navegação por teclado no editor e leitor de tela nunca foram testados |
| **Sem telemetria de erro** | Se quebrar no celular de alguém da equipe, ninguém fica sabendo. O Worker já tem `observability` ligado — falta o app reportar |

---

## 4. A ordem que eu proponho

Cada bloco é uma sessão de trabalho e entrega algo utilizável sozinho.

**Bloco 1 — publicar** *(depende do Vilker)*
Os 5 passos do `DEPLOY.md`. Sem isso, tudo o resto é teórico. A varredura de
verdade precisa rodar contra o app publicado, num iPhone real, com rede real.

**Bloco 2 — os três atritos do dia a dia**
Duplicar post, reordenar slides arrastando, medida em px ao arrastar. São os
três que aparecem no primeiro dia de uso de verdade.

**Bloco 3 — calibrar o desenho** *(depende do Vilker)*
Os screenshots do `paulkalkbrenner.net` e as referências de diagramação. Aqui
o `template-smith` e o `diretor-de-arte` fazem o trabalho.

**Bloco 4 — travar contra regressão**
Transformar a varredura em `npm test`. Medir performance num aparelho antigo.
Passar o leitor de tela no editor.

**Bloco 5 — conteúdo** *(depende do Vilker)*
Voz e tom, base de conteúdo, briefing estruturado. Só então ligar o redator.

---

## 5. A rotina, daqui pra frente

**Toda entrega termina com a varredura.** Não é opcional e não é improviso:
o agente `qa-mestiza` (em `.claude/agents/`) roda os cinco checks acima, os
cenários de borda e as regressões conhecidas. O que ele achar entra no
[`02-BACKLOG.md`](02-BACKLOG.md).

**Toda mudança visual passa pelo olho.** O agente `diretor-de-arte` renderiza
as peças de verdade e critica composição, contraste e craft.

A razão é factual: **os quatro piores defeitos deste projeto passaram em todo
teste de sintaxe.** Logo gigante sangrando pela peça, vídeo exportando preto,
títulos nascendo invisíveis, texto cinza sobre cinza. Nenhum deles gerou erro.
Todos apareceram na captura de tela.

Neste projeto, olhar é o teste principal. O resto é apoio.
