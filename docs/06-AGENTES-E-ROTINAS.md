# Agentes e rotinas

Como fazer o projeto se manter sozinho: quem faz o quê, e o que roda sem
alguém pedir.

Os agentes estão criados em `.claude/agents/` — o Claude Code os carrega
automaticamente neste repositório. Use com `/` ou peça pelo nome.

---

## Os agentes

### 1. `diretor-de-arte` — o olho crítico

**Quando usar:** depois de qualquer mudança em template, formato ou renderer.

**O que faz:** renderiza as peças de verdade, **olha** e critica como diretor de
arte de campanha — composição, hierarquia, contraste, legibilidade, respiro,
craft. Aponta o que está fraco e propõe a correção específica.

**Por que existe:** os quatro bugs mais graves deste projeto — logo gigante
sangrando, vídeo preto, títulos invisíveis, texto cinza sobre cinza — passavam
em todo teste de sintaxe. Só apareceram na captura de tela. Verificação visual
não é opcional aqui, é o teste principal.

---

### 2. `qa-mestiza` — varredura de bugs e usabilidade

**Quando usar:** ao fim de toda entrega. Pedido explícito do Vilker:
*"depois de gerar deve vasculhar atrás de bugs e melhorias, tanto na estrutura,
bugs e usabilidade"*.

**O que faz, nesta ordem:**
1. Sintaxe de todos os módulos
2. Todos os templates × todos os formatos constroem
3. Sobe o app e percorre os fluxos num viewport de celular
4. Coleta erros de console e de página
5. Confere alvos de toque (mínimo 44px), contraste, e se algo nasce invisível
6. Testa offline, sessão expirada e falha de upload
7. Abre itens no backlog para o que achar

**Não conserta sozinho** o que for decisão de design — reporta.

---

### 3. `redator-mestiza` — a copy

**Quando usar:** para escrever legenda, título de peça ou carrossel.

**Só funciona depois** de [`05-VOZ-E-TOM.md`](05-VOZ-E-TOM.md) estar preenchido.
Antes disso ele produz o lugar-comum que o Vilker não quer.

**O que faz:** lê a voz, a lista de proibições e as regras de contagem de cada
template, e escreve dentro delas. Recusa-se a escrever quando o briefing não
tem o campo *"o que só a gente sabe sobre isso"* preenchido — porque sem isso
o texto vai ser genérico e é melhor pedir de novo do que entregar bonito e
vazio.

---

### 4. `template-smith` — novos layouts

**Quando usar:** quando chegarem as referências de diagramação do Vilker, ou
quando nascer uma editoria nova.

**O que faz:** converte referência visual em template — função que recebe
`(fmt, content)` e devolve layers a partir de `safeBox(fmt)`, testada em todos
os formatos que declara, renderizada e conferida a olho.

---

## As rotinas

### Rotina A — Varredura de qualidade *(a cada entrega)*

Não é agendada: é o último passo de todo trabalho. Roda o `qa-mestiza` e o
`diretor-de-arte`, e o que aparecer entra no backlog.

### Rotina B — Revisão do backlog *(início de toda sessão)*

Ler [`02-BACKLOG.md`](02-BACKLOG.md) e [`03-PENDENCIAS.md`](03-PENDENCIAS.md).
Confirmar que nada do que foi pedido saiu. Acrescentar o que apareceu na
conversa. **Isso é regra, não sugestão** — o Vilker pediu explicitamente:
*"sempre revisar se nada que falei nessa mensagem se perdeu"*.

### Rotina C — Pauta semanal *(quando a Fase 3 estiver de pé)*

Agendável com `/loop` ou com uma Routine. Uma vez por semana:
1. Olha o que o estúdio produziu (projetos, bastidores, entregas)
2. Propõe 3 a 5 pautas com ângulo específico — não tema genérico
3. Para as aprovadas, monta o post na fila via `POST /api/intake`

**Só vale ligar depois da base de conteúdo.** Pauta automática sem repertório
gera post de calendário comercial, que é o pior conteúdo que existe.

### Rotina D — Saúde da plataforma *(mensal)*

Uso do R2, tamanho do D1, mídia órfã (arquivo no bucket sem linha no banco),
sessões vencidas (já tem cron diário), e se o custo continua zero.

---

## Automação de conteúdo — como eu montaria

O que o Vilker descreveu: *"montar uma base pra criar meus conteúdos, se
precisar criar rotina pra automatizar isso, depois de construir um briefing de
texto foda"*.

A ordem importa, e é esta:

```
1. Base de conteúdo        ← o repertório. Sem isso nada funciona
        ↓
2. Briefing estruturado    ← o filtro de especificidade
        ↓
3. Redator com regras      ← escreve dentro das proibições
        ↓
4. Montagem automática     ← escolhe template e cria na fila
        ↓
5. Rotina semanal          ← só depois que 1–4 estiverem confiáveis
```

**A tentação é começar pelo 5.** É o passo mais visível e o único que não
funciona sozinho. Automatizar geração ruim só produz volume ruim.

### A base de conteúdo — o que ela é

Um arquivo (depois, uma tabela) com o que só a Mestiza tem:

| Categoria | Exemplos |
|---|---|
| **Casos** | Projeto, cliente, o problema real, a decisão que resolveu |
| **Números** | Dias de shooting, peças entregues, prazo, escala |
| **Opiniões** | O que vocês acham do mercado e quase ninguém diz em público |
| **Processo** | Como vocês decidem de verdade — não o fluxograma bonito |
| **Erros** | O que deu errado e o que aprenderam. É o conteúdo que mais engaja e o que quase ninguém publica |
| **Referências** | O que vocês olham e por quê |
| **Termos** | O vocabulário da casa |

Sem isso, qualquer redator — humano ou não — escreve sobre "a importância da
direção de arte". Com isso, escreve sobre uma decisão específica que vocês
tomaram numa terça-feira.
