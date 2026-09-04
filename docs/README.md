# Mestiza Lab — índice do projeto

> **Leia este arquivo primeiro.** Ele diz onde o projeto está, o que já existe,
> o que está pendente e onde continuar. Nenhuma decisão vive só numa conversa.

**Última atualização:** 2026-09-04
**Interlocutor:** Vilker Silva — diretor de arte publicitário sênior, estúdio Mestiza
**Repo:** `vilkers/mestizalab` · branch `claude/content-creation-tool-uhgqvm`

---

## Onde estamos

**Fase 1 completa. Fase 2 com os três itens de prioridade alta entregues.**
Nada foi deployado ainda — o código está pronto, falta o Vilker rodar o
[`DEPLOY.md`](../DEPLOY.md), ~15 minutos.

Funciona ponta a ponta: login com senha, fila de posts, 13 templates, 7
formatos, editor visual mobile, export PNG/ZIP, export de vídeo com máscara
queimada, biblioteca de mídia com coleções, e a rota que deixa o Claude criar
posts direto na fila a partir de um briefing.

Da Fase 2 já entraram: **grade de 6 colunas com imã**, **preview de carrossel
como o feed mostra**, e **coleções na biblioteca**.

**Próximo passo imediato:** o que sobrou da Fase 2 — varredura de bugs
(`qa-mestiza`), duplicar post/slide, reordenar slides arrastando, busca. Ver
[`02-BACKLOG.md`](02-BACKLOG.md).

**Trava tudo o que for calibragem visual:** os screenshots do
`paulkalkbrenner.net`, que o proxy desta sessão bloqueou. Ver
[`03-PENDENCIAS.md`](03-PENDENCIAS.md).

---

## Os documentos

| Arquivo | O que tem |
|---|---|
| [`00-VISAO.md`](00-VISAO.md) | A ambição real. Mestiza Lab é o piloto de um produto maior |
| [`01-FASES.md`](01-FASES.md) | Roadmap por fases, com o que entra em cada uma |
| [`02-BACKLOG.md`](02-BACKLOG.md) | **Tudo que foi pedido**, com status. Nada se perde aqui |
| [`03-PENDENCIAS.md`](03-PENDENCIAS.md) | O que depende do Vilker para destravar |
| [`04-DESIGN-SYSTEM.md`](04-DESIGN-SYSTEM.md) | Cor, tipo, grade, motion, referências |
| [`05-VOZ-E-TOM.md`](05-VOZ-E-TOM.md) | Como a Mestiza escreve. **A definir junto** |
| [`06-AGENTES-E-ROTINAS.md`](06-AGENTES-E-ROTINAS.md) | Agentes propostos e rotinas de manutenção |
| [`07-GUIDE-DE-MARCA.md`](07-GUIDE-DE-MARCA.md) | O produto vendável: guide de marca virtual para clientes |
| [`08-FERRAMENTAS-IA.md`](08-FERRAMENTAS-IA.md) | Ferramentas de design com IA — o que existe hoje e o que usar |
| [`09-MANUAL.md`](09-MANUAL.md) | Manual de uso da plataforma, para a equipe |
| [`INTEGRACAO-CLAUDE.md`](INTEGRACAO-CLAUDE.md) | Contrato da API e como pedir conteúdo pela conversa |
| [`../DEPLOY.md`](../DEPLOY.md) | Passo a passo para publicar |
| [`../CLAUDE.md`](../CLAUDE.md) | Contexto técnico e armadilhas conhecidas |

---

## Regras de trabalho neste projeto

1. **Nada vive só na conversa.** Toda decisão, pedido ou ideia entra no
   [`02-BACKLOG.md`](02-BACKLOG.md) na mesma sessão em que aparece.
2. **Verificação visual é obrigatória.** Os quatro bugs mais graves deste
   projeto passavam em todo teste de sintaxe e só apareceram na captura de
   tela. Renderize e olhe.
3. **Depois de gerar, procurar bug.** Toda entrega termina com uma varredura de
   estrutura, bugs e usabilidade — ver [`06-AGENTES-E-ROTINAS.md`](06-AGENTES-E-ROTINAS.md).
4. **Formato e template são dados, não código.**
5. **O financeiro é satélite.** Ele mora na plataforma por conveniência do
   Vilker, mas **não faz parte do produto**. Não pode complicar a estrutura,
   não entra no que for vendido a cliente.

---

## Onde continuar, se a sessão foi interrompida

```bash
cat docs/02-BACKLOG.md      # o que está aberto, por prioridade
cat docs/03-PENDENCIAS.md   # o que depende do Vilker
cat docs/01-FASES.md        # em que fase estamos
```

O primeiro item aberto de maior prioridade no backlog é o próximo trabalho.
