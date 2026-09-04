# Fases de execução

Cada fase entrega algo que funciona sozinho. Nenhuma depende de a próxima
existir para ter valor.

---

## ✅ Fase 1 — A plataforma existe *(concluída)*

**Objetivo:** montar e exportar um post pelo celular, com senha, sem depender
de ninguém.

Entregue: login, fila, 13 templates, 7 formatos, editor visual, export
PNG/ZIP, export de vídeo com máscara, biblioteca de mídia, legenda, ingestão do
Claude, briefings, tokens, tela-prévia do financeiro.

**Falta só uma coisa:** o Vilker rodar o [`DEPLOY.md`](../DEPLOY.md). ~15 min.

---

## 🔵 Fase 2 — Diagramar de verdade *(próxima)*

**Objetivo:** deixar de ser "preencher template" e passar a ser "diagramar com
sistema". É a fase que faz a plataforma parecer ferramenta profissional em vez
de gerador.

| Entrega | Por quê |
|---|---|
| **Grade de diagramação** com colunas, linhas e baseline, visível e alternável | Pedido explícito. Sem grade, mover na mão é chute |
| **Snap** às colunas, à baseline e à zona segura | É o que transforma arraste em alinhamento |
| **Feedback numérico** ao arrastar (px, % da coluna) | O DA quer saber onde está, não achar |
| **Preview de carrossel** em faixa deslizante | Ver o conjunto, não o slide isolado |
| **Coleções na biblioteca de mídia** (pastas por cliente/projeto/campanha) | Subir o acervo já produzido e achar depois |
| **Upload em lote** com destino | 40 fotos de uma campanha de uma vez |
| **Duplicar** post e slide | O caso mais comum: "outro igual, trocando a foto" |
| **Reordenar slides** arrastando | |
| **Varredura de bugs e usabilidade** formal | Rotina, não improviso |

**Depende de:** screenshots do `paulkalkbrenner.net` para calibrar espaçamento
e comportamento ([`03-PENDENCIAS.md`](03-PENDENCIAS.md)).

**Como saber que acabou:** o Vilker consegue diagramar uma peça fora do
template padrão sem que ela saia torta.

---

## 🔵 Fase 3 — Conteúdo que não é genérico

**Objetivo:** o texto parar de ser o elo fraco.

| Entrega | Por quê |
|---|---|
| **Voz, tom e termos** documentados | Sem isso, todo texto tende ao lugar-comum |
| **Lista do proibido** | Mais eficaz que a lista do permitido |
| **Base de conteúdo** — temas, ângulos, provas, casos, números do estúdio | O redator precisa ter de onde puxar. Sem repertório, ele inventa clichê |
| **Briefing estruturado** que força especificidade | O melhor filtro anti-obviedade é a pergunta, não o prompt |
| **Templates redesenhados** a partir das suas referências | |
| **Nova editoria** | |
| **Redator ligado** (secret + flag) | Só depois dos itens acima |
| **Rotina de geração** — pauta semanal, variações de formato | |

**Como saber que acabou:** você lê uma legenda gerada e não consegue dizer que
foi máquina que escreveu.

---

## 💭 Fase 4 — O produto

**Objetivo:** o que o estúdio vende. Ver [`07-GUIDE-DE-MARCA.md`](07-GUIDE-DE-MARCA.md).

| Entrega |
|---|
| Multi-marca: cada cliente com sua paleta, tipos, grade, templates e acervo |
| Guide de marca virtual: as regras vivas, navegáveis, ao lado da ferramenta |
| Papéis por marca (dono, editor, visualizador) |
| Onboarding de marca nova sem tocar em código |
| Domínio próprio por cliente |
| Cobrança |

**Pré-requisito real:** as Fases 2 e 3 rodando com a Mestiza por alguns meses.
Vender antes de a gente mesmo usar é o caminho mais curto para um produto que
não resolve nada.

---

## ⚙️ Satélite — módulo financeiro do estúdio

**Fora do produto, por decisão explícita.** Contas a pagar, recebimentos,
gastos, fechamento, orçamentos. Vive na mesma plataforma e na mesma senha por
conveniência, em módulo isolado, sem tocar na estrutura do resto e sem
aparecer para cliente nenhum.

Hoje: tela-prévia funcional que mostra o que vem. Entra quando o Vilker quiser
e definir os campos.

---

## Ordem sugerida das próximas sessões

1. Deploy da Fase 1 (Vilker, 15 min) + screenshots do site de referência
2. Grade + snap + feedback numérico
3. Preview de carrossel + coleções de mídia
4. Varredura de bugs e usabilidade
5. Manual e pitch
6. Voz e tom (com o Vilker) + base de conteúdo
7. Redesenho dos templates com as referências dele
8. Redator ligado
