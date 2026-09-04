# Visão

## O que estamos construindo de verdade

Na superfície: uma ferramenta para o estúdio Mestiza montar seus posts pelo
celular sem abrir o Photoshop.

Uma camada abaixo — e é aqui que está o valor: **um sistema que transforma
identidade de marca em produção de conteúdo.** Você entrega a marca uma vez
(paleta, tipos, grade, templates, tom de voz) e a partir daí qualquer pessoa
produz peça correta, sem depender de quem desenhou.

Uma camada abaixo disso — e é o produto: **isso vendido para os clientes do
estúdio.** Um guide de marca que não é um PDF de 60 páginas que ninguém abre,
mas um lugar vivo onde o cliente **usa** a marca em vez de só consultar.

**A Mestiza é o piloto.** Tudo que a gente resolver aqui — multi-formato,
templates como dado, export sem servidor, integração com IA — é a fundação do
produto. Não é protótipo descartável: é a versão 1 do que vai ser vendido.

---

## O problema que isso resolve

Um estúdio de craft alto tem um gargalo estrutural: **toda peça precisa passar
por quem sabe diagramar.** O post de bastidores, o card de anúncio, a capa do
projeto — cada um consome tempo de direção de arte em trabalho que não é
direção de arte, é execução.

As saídas comuns são todas ruins:

| Saída | Por que não presta |
|---|---|
| Canva com templates da marca | Sai genérico. O sistema não é respeitado, é sugerido |
| Alguém do time no Photoshop | Depende de licença, de máquina, e de saber operar |
| Terceirizar o social | O craft cai, e o custo não |
| Fazer tudo o próprio DA | Não escala. É o gargalo |

O que falta é uma ferramenta onde **o sistema é obrigatório, não opcional.**
Onde a grade, a paleta e a escala tipográfica são a estrutura — e o que a
pessoa escolhe é o conteúdo, não o desenho.

É isso que o Mestiza Lab é.

---

## O princípio de design

> **O template não é um ponto de partida. É uma decisão já tomada.**

Um editor livre demais devolve o problema para o usuário: agora ele tem que
saber diagramar. Um editor engessado demais vira formulário e o resultado
parece formulário.

O equilíbrio que a gente escolheu:

- **Fechado:** paleta (6 amostras, não color picker), tipos (2 famílias),
  grade, zona segura, estrutura do template
- **Aberto:** o texto, a foto, o enquadramento da foto, o corpo do tipo dentro
  de uma faixa, a troca de template mantendo o conteúdo
- **Escondido, mas possível:** mover um elemento na mão, mudar cor de uma
  camada, mudar mistura — para quando o DA precisa quebrar a regra de
  propósito, com um toque duplo para voltar ao original

---

## As três invariantes técnicas

Estão no `CLAUDE.md` em detalhe. Em uma linha cada:

1. **Um renderer só** alimenta preview, PNG e vídeo — divergência é impossível
   por construção.
2. **Salva-se conteúdo, não camadas** — é o que deixa trocar de template sem
   perder o texto.
3. **Formato e template são dados** — marca nova, formato novo e editoria nova
   entram sem tocar no motor.

A invariante 3 é a que faz o produto existir. Sem ela, cada cliente novo seria
um fork.

---

## O que este produto não é

- **Não é um Canva.** Não vai ter milhão de template, banco de imagem genérico
  nem fonte fofa. O valor é o oposto: pouca escolha, escolha certa.
- **Não é um Figma.** Não é ferramenta de desenho. Ninguém cria layout aqui —
  as pessoas preenchem layouts que um DA criou.
- **Não é um agendador.** Publicar continua sendo no Instagram. Integrar com a
  API do Meta é possível depois, mas não é o problema que a gente resolve.
- **Não é ERP.** O módulo financeiro é satélite, para uso interno do estúdio, e
  não entra no que for vendido.

---

## Como a IA entra

Em dois lugares, e só neles:

**1. Do briefing à peça.** Você conversa com o Claude, ele monta o post na fila
— template escolhido, texto escrito, legenda pronta. Você abre e ajusta. Isso
já funciona (`POST /api/intake`).

**2. Do repertório ao texto.** O redator dentro do app, hoje desligado. Só vale
ligar depois que existir base de conteúdo e regras de voz — senão vira gerador
de lugar-comum, que é exatamente o que você não quer.

A IA **não** entra na diagramação. A grade é decisão humana. Modelo generativo
não sabe por que 4:5 pede outra escala de tipo que 9:16 — e nem deveria
adivinhar.
