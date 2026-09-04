# Backlog — tudo que foi pedido

> **Este é o arquivo mais importante do projeto.** Toda ideia, pedido ou
> decisão entra aqui na mesma sessão em que aparece. Se não está aqui, não
> existe. Nada se perde numa conversa.

Legenda: `✅ feito` · `🔵 em aberto` · `⏸ depende do Vilker` · `💭 ideia futura`

---

## Fase 1 — a plataforma existe

| | Item | Onde |
|---|---|---|
| ✅ | Login com senha, contas por pessoa, admin adiciona/suspende | `worker/src/auth.js` |
| ✅ | Fila de posts com filtro por status e editoria | `app/js/views/fila.js` |
| ✅ | 13 templates em 3 editorias | `app/js/templates.js` |
| ✅ | 7 formatos (feed 4:5, 1:1, 9:16, Stories, Reels, carrossel 4:5 e 1:1) | `app/js/formats.js` |
| ✅ | Editor visual mobile: toque, arraste, pinça, desfazer/refazer | `app/js/editor-stage.js` |
| ✅ | Export PNG 0,5× / 1× / 2×, ZIP de carrossel, compartilhamento nativo | `app/js/export.js` |
| ✅ | Export de vídeo com máscara queimada + áudio, no aparelho | `app/js/video.js` |
| ✅ | Fallback: PNG transparente da máscara em 1080×1920 | idem |
| ✅ | Biblioteca de mídia com upload do celular | `app/js/views/midia.js` |
| ✅ | Legenda + hashtags com contagem e copiar | `app/js/views/editor-view.js` |
| ✅ | Rota de ingestão do Claude (`POST /api/intake`) | `worker/src/index.js` |
| ✅ | Aba de briefings recebidos | `app/js/views/briefings.js` |
| ✅ | Tokens de integração (criar/revogar) | `app/js/views/ajustes.js` |
| ✅ | Marcação de zona segura, toggle no editor | `app/js/editor-stage.js` |
| ✅ | Marcação de terços, toggle | idem |
| ✅ | Miniaturas auto-curáveis na fila | `app/js/views/fila.js` |
| ✅ | Rascunho local (sobrevive a fechar a aba / perder rede) | `app/js/store.js` |
| ✅ | Studio (financeiro) como tela-prévia, não como alerta | `app/js/views/admin.js` |
| ✅ | Redator IA construído atrás de flag, desligado | `app/js/config.js` |
| ✅ | **Tela de primeiro acesso** | Cria o primeiro administrador pelo navegador, sem terminal. A rota fecha sozinha assim que existe um usuário. É o que permite publicar tudo pelo celular | `app/js/views/setup.js` |
| ✅ | `wrangler.toml` na raiz | Necessário para o deploy conectado ao GitHub funcionar sem configuração |
| ✅ | **Armazenamento sem R2** | O R2 exige cartão. Abstração em `worker/src/storage.js`: com o binding usa R2, sem ele guarda numa tabela `blobs` do D1. O app não sabe a diferença e não há migração ao trocar |
| ✅ | **Redução de imagem no cliente** | Foto de 3,7 MB / 4032px vira 240 KB / 1800px antes de subir. Trata orientação EXIF e preserva PNG com transparência. Vale com ou sem R2 — a peça tem 1080px, subir 4000px só gasta dados |
| ✅ | Capacidades vindas do servidor | `/me` devolve `recursos` (tem R2? aceita vídeo? qual o teto). O app nunca chuta limite |
| ✅ | **Terceiro degrau no export** | Web Share → download → mostrar a peça para salvar segurando. Em navegador embutido o download é bloqueado em silêncio e o botão parecia quebrado. `app/js/views/salvar.js` |
| ✅ | **Tratamento editorial — tela da Fila** | Escolha do Vilker: editorial impresso, uma tela primeiro. Manchete em display que DIZ o estado da fila, lista como página de índice numerada, trilho de filtros separado por régua, cabeçalho de seção com sticky stacking, esqueleto de carregamento em réguas, vazio com voz, alternador índice/folha de contato. `app/js/views/fila.js` |
| ✅ | **Sistema de motion** | Velocidade de rolagem como variável CSS (`js/scroll.js`), reveal por máscara linha a linha, parallax por velocidade nas chapas, contra-escala na revelação de imagem. Sem biblioteca. Ver `04-DESIGN-SYSTEM.md` §4 |
| ✅ | **Escala tipográfica corrigida** | O app rodava em metade da escala do site do estúdio. `--t-h1` foi de `clamp(2rem, 8.5vw, 3.5rem)` para `clamp(2.5rem, 11vw, 5rem)`, e entraram os tokens de ritmo `--rit-1..3` |
| 🔵 | **Propagar o tratamento editorial** | Mídia, Briefings, Criar, Studio e Ajustes receberam a escala nova mas ainda têm a estrutura antiga (cabeçalho + seções + cards). O editor é o próximo de maior impacto |
| ✅ | **Alvos de toque ≥ 42px** | Varredura achou 48 abaixo de 44px, incluindo o botão "Ajustes" com 10px de altura e o **Exportar** com 36px. Todos corrigidos, nova varredura em 0. Ver `10-PLANO-DE-EXECUCAO.md` |

---

## Fase 2 — usabilidade e layout (o próximo trabalho)

### Prioridade alta

| | Item | Nota |
|---|---|---|
| ⏸ | **Publicar de verdade na Cloudflare** | Adiado a pedido do Vilker em 04/09 — ele quis ver o app antes. Passo a passo pronto e simplificado em `DEPLOY.md` (5 passos, sem cartão, pelo celular). Retomar quando ele quiser: o próximo passo é criar o banco D1 e me mandar o Database ID |
| ✅ | **Demo navegável sem servidor** | Build de arquivo único com API simulada, para o Vilker usar o app antes de publicar. `tools/build-demo.mjs` |
| ✅ | **Grid de diagramação no editor** | 6 colunas + 8 linhas + baseline em 24 divisões, dentro da zona segura. Toggles em Formato → Guias. `app/js/editor-stage.js` → `gridSpec()` |
| ✅ | **Snap às guias** | Imanta borda inicial, centro e borda final na coluna, na linha, na margem e no centro do artboard. Guia dourada acende no eixo que pegou. Alt solta no desktop; toggle no painel para o celular |
| ✅ | **Preview de carrossel** | Faixa horizontal com scroll-snap, vizinhos espiando, pontos de posição e contador que segue o scroll. Mostra a legenda cortada em 125 caracteres, onde o feed corta. Abre pelo botão em Conteúdo ou tocando nos pontos do palco. `app/js/views/carrossel-preview.js` |
| ✅ | **Pastas / coleções na biblioteca de mídia** | Coleção é texto livre: criar é digitar o nome ao subir, sem passo de "criar pasta antes". Chips com contagem, filtro, e mover arquivo pelo detalhe. Vale também no seletor dentro do editor. `app/js/views/midia.js` |
| ✅ | **Upload em lote com coleção de destino** | Várias de uma vez, com barra de progresso por arquivo. Selecionar uma coleção já define o destino do próximo upload |
| 🔵 | **Varredura de bugs e usabilidade pós-entrega** | Rotina formal, ver `06-AGENTES-E-ROTINAS.md` |

### Prioridade média

| | Item | Nota |
|---|---|---|
| 🔵 | Réguas com medidas em px ao arrastar | Feedback numérico durante o gesto. A grade imanta mas não diz onde você está — prioridade alta depois da varredura |
| 🔵 | Duplicar post | "Fazer outro igual mudando a foto" é o caso mais comum |
| 🔵 | Duplicar slide dentro do carrossel | |
| 🔵 | Busca na fila e na biblioteca | |
| 🔵 | Reordenar slides do carrossel arrastando | Hoje só sobe um por vez |
| 🔵 | Histórico de versões do post | Voltar a um estado de ontem |
| 🔵 | Alinhar/distribuir elementos selecionados | |
| 🔵 | Bloquear camada (evitar mover sem querer) | O schema já prevê `locked` |

### Prioridade baixa / conforto

| | Item |
|---|---|
| 🔵 | Modo claro no editor (só o chrome, a peça continua sobre preto) |
| 🔵 | Atalhos de teclado documentados na interface |
| 🔵 | Exportar a legenda junto do ZIP, como `.txt` |
| 🔵 | Marcar post como publicado com data, virar histórico |

---

## Fase 3 — conteúdo e inteligência

| | Item | Nota |
|---|---|---|
| ⏸ | **Acertar o visual dos templates** | O Vilker vai mandar referências de diagramação. Os 13 atuais são minha leitura do sistema do site — servem de esqueleto, o desenho final vem das referências dele |
| ⏸ | **Definir voz, tom e termos** | A definir junto. Esqueleto em `05-VOZ-E-TOM.md` |
| 🔵 | **Briefing estruturado de verdade** | Um formulário/roteiro de briefing que force especificidade, para o texto não sair óbvio e manjado. Pedido explícito |
| 🔵 | **Base de conteúdo** | Repositório de temas, ângulos, frases e provas do estúdio, para o redator ter de onde puxar em vez de inventar genérico |
| 🔵 | Ligar o redator IA | Um secret + uma flag. Custo ~US$ 1–3/mês |
| 🔵 | Rotina de geração de conteúdo automatizada | Ver `06-AGENTES-E-ROTINAS.md` |
| ⏸ | **Nova editoria** | O Vilker terá uma editoria com templates próprios. Já é dado: `EDITORIAS` em `templates.js` + tabela `editorias` no D1 |

---

## Fase 4 — o produto

| | Item | Nota |
|---|---|---|
| 💭 | **Guide de marca virtual vendável** | O produto de verdade. Cliente recebe um guide interativo e monta conteúdo dentro dele. Mestiza é o piloto. Ver `07-GUIDE-DE-MARCA.md` |
| 💭 | Multi-marca na mesma plataforma | Cada cliente com sua paleta, tipos, templates e assets |
| 💭 | Papéis por marca (dono, editor, visualizador) | |
| 💭 | Domínio próprio por cliente | |
| 💭 | Cobrança / assinatura | |
| 💭 | Migrar para hospedagem própria | O Vilker tem uma hospedagem. Ver nota abaixo |

---

## Satélite — não faz parte do produto

| | Item | Nota |
|---|---|---|
| 💭 | **Módulo financeiro do estúdio** | Contas a pagar, recebimentos, gastos, fechamento, orçamentos. **Explicitamente fora do produto** — vive na plataforma só por conveniência do Vilker, em módulo isolado que não pode complicar a estrutura nem aparecer para cliente. Hoje existe como tela-prévia |

---

## Comunicação e material

| | Item | Nota |
|---|---|---|
| 🔵 | **Manual de uso** | Página dentro da plataforma, não só arquivo. Esqueleto em `09-MANUAL.md` |
| 🔵 | **Pitch da ferramenta** | Peça refinada com prints, mostrando por que vale a pena. Serve para a equipe, para clientes e para o produto futuro |

---

## Notas soltas registradas

- **Hospedagem própria:** o Vilker tem uma hospedagem que pode receber isso no
  futuro. A arquitetura atual (Worker + D1 + R2) é Cloudflare-específica.
  Migrar exige trocar D1 por Postgres/MySQL e R2 por S3 ou disco — o app em si
  (HTML/CSS/JS puro, sem build) roda em qualquer lugar. **Antes de migrar,
  levantar o que a hospedagem oferece:** Node? PHP? banco? object storage?
- **Referência de comportamento:** `paulkalkbrenner.net` — bloqueado pelo proxy
  desta sessão em duas tentativas. Ver `03-PENDENCIAS.md`.
- **Evolução contínua:** revisar este arquivo a cada sessão, confirmar que nada
  do que foi pedido saiu, e acrescentar o que apareceu.
- **Migração de banco:** bancos já criados precisam de
  `worker/migrations/001-colecoes.sql`. Bancos novos já nascem com a coluna.
