# Guide de marca virtual — o produto

> Ideia do Vilker: *"vender uma espécie de guide de marca que eu vou
> disponibilizar pra clientes, onde ele é virtual e dentro dele consiga montar
> conteúdos também. Mestiza é o projeto piloto pra gente estruturar isso."*

**Status:** Fase 4. Registrado agora para que a arquitetura das Fases 2 e 3 já
seja compatível — e ela já é.

---

## A tese

Um manual de marca em PDF tem um problema estrutural: **ele é consultado, não
usado.** O cliente abre uma vez, elogia, salva numa pasta e depois pede a peça
para o estúdio de qualquer jeito — ou faz no Canva, errado.

O guide virtual inverte isso: **as regras não estão descritas, estão
embutidas.** O cliente não lê que a fonte é X e a margem é Y. Ele abre, monta o
post e o post sai certo porque é impossível sair errado.

O manual vira consequência da ferramenta, não um documento ao lado dela.

---

## Por que a Mestiza é o piloto certo

Não é ensaio: é a versão 1 do produto. O que a gente resolver aqui já é a
fundação.

| O que já existe | Por que serve ao produto |
|---|---|
| Template como função de dados | Marca nova = conjunto novo de templates, sem tocar no motor |
| Coordenadas normalizadas | A mesma composição serve todo formato |
| Salvar conteúdo em vez de camadas | Trocar de template sem perder texto — essencial quando o cliente muda de ideia |
| Editorias como tabela no banco | Cada marca tem as suas |
| Paleta fechada | É a garantia de que o cliente não sai da marca |
| Zona segura por formato | Disciplina embutida |
| Export no aparelho | Sem custo por cliente. Escala sem servidor |
| Auth com papéis | Base de multi-usuário por marca |

**O que falta para virar produto** está listado como Fase 4 no
[`01-FASES.md`](01-FASES.md). O maior item é **multi-marca** — hoje a paleta e
os tipos são constantes; precisam virar registro no banco.

---

## O que o produto entrega ao cliente

### 1. O guide vivo
As regras da marca navegáveis — cor, tipo, grade, uso do logo, tom de voz,
direção de fotografia, o que pode e o que não pode. Com exemplos reais, não
lorem ipsum.

### 2. A linha de produção
Os templates da marca dele. Ele monta feed, stories, reels e carrossel pelo
celular e exporta pronto.

### 3. O acervo
Logo em todas as versões, fotos aprovadas, elementos gráficos, ícones. No lugar
certo, sempre a versão atual. Acaba o "manda o logo em PNG" no WhatsApp.

### 4. O controle do estúdio
Vocês publicam template novo para uma campanha e ele aparece na conta do
cliente. Vocês veem o que ele produziu. A marca não deriva sozinha.

---

## O modelo de negócio — o que faz sentido

| Modelo | Como funciona | Observação |
|---|---|---|
| **Setup + assinatura** | Vocês cobram a construção do guide (projeto de identidade + templates) e uma mensalidade de acesso | O mais natural. O setup é o trabalho de vocês; a mensalidade paga a plataforma e a manutenção |
| **Incluído no projeto** | Todo projeto de identidade sai com o guide virtual por N meses | Vira diferencial na proposta, não linha de custo |
| **Só assinatura** | Sem setup, templates padrão | Concorre com Canva. Não recomendo — o valor de vocês está no setup |

**Recomendação:** setup + assinatura. É onde o craft do estúdio é o produto e a
plataforma é a entrega dele. A mensalidade também resolve o problema clássico
do manual de marca: ele morre no dia da entrega. Aqui ele é mantido.

---

## O que decidir antes de construir

1. **Uma instância por cliente, ou uma plataforma multi-marca?**
   Uma por cliente é mais simples e mais lento de escalar. Multi-marca é o
   caminho certo, mas exige repensar autenticação e isolamento de dados.
   *Recomendação:* multi-marca desde o início da Fase 4 — retrofitar isolamento
   depois é caro.

2. **O cliente pode criar template, ou só usar?**
   *Recomendação:* só usar. O momento em que o cliente cria template é o
   momento em que a marca começa a derivar — e é exatamente o problema que o
   produto existe para resolver.

3. **Marca branca ou assinada pela Mestiza?**
   Assinada discretamente (rodapé, tela de login) é mais valiosa: cada cliente
   vira vitrine.

4. **Quantos formatos por marca?**
   Menos é mais. Feed, stories e carrossel resolvem 90%.

---

## Riscos honestos

- **O cliente pode não usar.** O mesmo risco do PDF. Mitigação: o guide precisa
  ser o caminho mais curto para a peça, não um caminho a mais.
- **Suporte vira trabalho.** Cada cliente com dúvida é hora do estúdio. Mitigação:
  o manual dentro da plataforma, e a interface ser óbvia o bastante para não
  gerar pergunta.
- **Alguém vai pedir uma exceção.** Sempre. Mitigação: a camada de override
  manual já existe no editor — o DA do estúdio pode quebrar a regra quando fizer
  sentido, o cliente não.
- **Escopo:** é fácil isso virar "um Canva". Não é. A restrição é a
  funcionalidade.

---

## Próximo passo concreto

Nada disso se constrói agora. O próximo passo é **usar a Mestiza Lab de verdade
por alguns meses**, com o estúdio produzindo nela. O que incomodar no uso real
é a especificação do produto — e é uma especificação que nenhuma reunião
produziria.
