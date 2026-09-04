# Pendências — o que depende do Vilker

> Coisas que eu não consigo resolver sozinho. Cada uma trava um pedaço
> específico do trabalho. Estão em ordem de quanto destravam.

---

## 1. Screenshots do `paulkalkbrenner.net` 🔴 trava a Fase 2

**Por quê:** o domínio está bloqueado pelo proxy de rede desta sessão. Tentei
duas vezes, nas duas deu `EGRESS_BLOCKED`. Não abri o site e não vou inventar
o que vi.

**O que mandar** — 5 ou 6 prints, de preferência do desktop:
- a home no topo
- a home depois de rolar um pouco (para eu ver o ritmo do scroll)
- o menu aberto
- uma página de lista (datas de turnê, discografia — o que houver)
- uma página interna com texto corrido
- se houver algum momento de transição bonito, um print no meio dele

**O que eu extraio disso:** escala tipográfica real, relação entre display e
micro, escala de espaçamento, comportamento de hover/estado ativo, tratamento
de imagem, e o ritmo das transições. Hoje trabalhei só com o que é seguro — a
marca de vocês, contraste duro, revelação por máscara em vez de fade.

**Enquanto não vier:** a plataforma está coerente com o sistema de
`mestiza.work`. Não está errada — está incompleta em relação ao que você pediu
de inspiração.

---

## 2. Referências de diagramação dos templates 🔴 trava a Fase 3

**Você disse que vai mandar.** Os 13 templates atuais são a minha leitura do
sistema visual do site. Servem de esqueleto funcional — a diagramação final vem
das suas referências.

**O que ajuda mais:**
- 5 a 10 peças que você considera o padrão (de vocês ou de terceiros)
- se possível, dizendo **o que** em cada uma você quer: a grade? a escala de
  tipo? o tratamento de imagem? a relação texto/foto?

**Também útil:** prints dos posts que vocês já publicam hoje. Se já existe um
layout rodando, eu replico o de vocês em vez de propor o meu.

---

## 3. Voz, tom e termos 🟡 trava o redator

A definir junto — o esqueleto das perguntas está em [`05-VOZ-E-TOM.md`](05-VOZ-E-TOM.md).

O ponto que você levantou: **"pra não sair escrevendo coisa muito óbvia e
manjada"**. Isso não se resolve com prompt melhor. Resolve-se com:
1. um repertório de termos, ângulos e provas que só a Mestiza tem
2. uma lista explícita do que é proibido escrever
3. um briefing que force especificidade antes de qualquer texto

Os três dependem de você. As perguntas estão no arquivo.

---

## 4. Nome e tom da nova editoria 🟡

Você mencionou uma editoria futura com templates próprios, "mais soltos, para
além dos layouts institucionais".

Já existe a editoria **Livre** (pôster, split, duotone) que talvez seja isso —
ou talvez você queira outra coisa. Me diga o nome, o assunto e a temperatura, e
eu desenho os templates.

Tecnicamente já está pronto para receber: editoria é dado (`EDITORIAS` em
`templates.js` + tabela `editorias` no D1), não código.

---

## 5. Sua hospedagem 🟢 sem pressa

Você mencionou ter uma hospedagem para migrar no futuro. Para eu avaliar se
vale e o que dá trabalho, preciso saber:
- que tipo é (compartilhada? VPS? qual painel?)
- roda Node.js? Qual versão?
- tem banco? Qual (MySQL, Postgres)?
- tem object storage ou é disco?

**Recomendação honesta:** a stack atual custa R$ 0/mês, escala sozinha e não
tem servidor para cair. Migrar para hospedagem própria costuma ser um passo
para trás, a menos que haja um motivo (exigência de cliente, dado que não pode
sair do país, custo de algo que hoje é grátis). Se o motivo existir, a migração
é factível: o app é HTML/CSS/JS puro e roda em qualquer lugar; o que muda é o
Worker (D1 → Postgres, R2 → S3/disco).

---

## 6. Campos de "contas a pagar" 🟢 satélite

Só para quando você quiser o módulo financeiro. Uma frase basta: quais campos
um lançamento precisa ter no seu fluxo real (fornecedor? projeto? centro de
custo? recorrência? anexo da nota?).

---

## Decisões já tomadas — não precisa reconfirmar

| | |
|---|---|
| Infra | Cloudflare Workers + D1 + R2, R$ 0/mês |
| Redator IA | Desligado por flag até você quiser ligar |
| Vídeo | Queimado no aparelho, sem servidor de render |
| Formatos | Todos — feed, stories, reels, carrossel, quadrado |
| Financeiro | Satélite, fora do produto |
| Senha | Sim, contas individuais |
