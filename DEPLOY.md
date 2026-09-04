# Publicar o Mestiza Lab

Leva uns 15 minutos na primeira vez. Depois, publicar uma mudança é **um comando**.

Você precisa de: uma conta na Cloudflare (grátis) e o terminal do Mac.

---

## 0. Conta na Cloudflare

Se ainda não tem: <https://dash.cloudflare.com/sign-up>. Plano gratuito.
Não precisa cadastrar cartão para nada do que está aqui.

---

## 1. Entrar pelo terminal

```bash
cd mestizalab/worker
npm install
npx wrangler login
```

Abre o navegador, você autoriza, volta pro terminal.

---

## 2. Criar o banco e o bucket

```bash
npx wrangler d1 create mestiza-lab
```

Ele responde com um bloco parecido com isto:

```
[[d1_databases]]
binding = "DB"
database_name = "mestiza-lab"
database_id = "a1b2c3d4-...."     ← este valor
```

**Copie o `database_id`** e cole no arquivo `worker/wrangler.toml`, na linha que
hoje diz `database_id = "local-dev-placeholder"`.

Depois o bucket de mídia:

```bash
npx wrangler r2 bucket create mestiza-lab-media
```

---

## 3. Criar as tabelas

```bash
npx wrangler d1 execute mestiza-lab --remote --file=schema.sql
```

---

## 4. Criar o seu usuário

```bash
node seed-admin.mjs "vilkervs@gmail.com" "Vilker Silva"
```

Ele pede a senha e imprime um comando pronto. **Copie e rode esse comando.**

A senha nunca é escrita em arquivo nenhum — o que vai pro banco é o hash
PBKDF2 dela.

---

## 5. Publicar

```bash
npx wrangler deploy
```

Pronto. Ele imprime o endereço, algo como:

```
https://mestiza-lab.<sua-conta>.workers.dev
```

Abre no celular, entra com o e-mail e a senha do passo 4.

**Adicione à tela de início** (Safari → Compartilhar → Adicionar à Tela de
Início). Ele abre em tela cheia, sem barra de navegador, com cara de app.

---

## 6. Domínio próprio (opcional)

Se quiser em `lab.mestiza.work` em vez do `.workers.dev`:

1. O domínio `mestiza.work` precisa estar com o DNS na Cloudflare
2. Descomente estas linhas no `worker/wrangler.toml`:

```toml
[[routes]]
pattern = "lab.mestiza.work/*"
zone_name = "mestiza.work"
```

3. `npx wrangler deploy`

O `mestiza.work` continua no GitHub Pages normalmente — só o subdomínio `lab`
aponta para cá.

---

## Publicar uma mudança depois

```bash
cd mestizalab/worker && npx wrangler deploy
```

Só isso. O app e a API vão juntos, no mesmo comando.

---

## Adicionar as outras pessoas

Depois de entrar, vá em **Ajustes → Pessoas → Adicionar pessoa**. O app sugere
uma senha provisória fácil de ditar (`estudio-craft-luz-42`). Mande por canal
privado — a pessoa troca depois.

Se marcar **Administrador**, ela também pode adicionar gente.

---

## Ligar o Claude

**Ajustes → Integração com o Claude → Criar token.** Copie o bloco que aparece
(ele só aparece uma vez) e cole na conversa. O resto está em
[`docs/INTEGRACAO-CLAUDE.md`](docs/INTEGRACAO-CLAUDE.md).

---

## Ligar o redator automático (quando quiser)

Hoje ele está desligado para não gerar custo. Para ligar:

```bash
cd worker
npx wrangler secret put ANTHROPIC_API_KEY
# cola a chave criada em console.anthropic.com
```

E em `app/js/config.js`, troque `redator: false` por `redator: true`.
`npx wrangler deploy` e pronto. Custo estimado: US$ 1–3/mês no seu volume.

A chave fica como secret do Worker — nunca no código, nunca no navegador.

---

## Quanto isso custa de verdade

| Recurso | Grátis até | Seu uso provável |
|---|---|---|
| Workers | 100.000 requisições/dia | uma fração disso |
| D1 (banco) | 5 GB | alguns MB |
| R2 (mídia) | 10 GB + saída ilimitada | anos de fotos |
| Deploy | ilimitado | — |

Se um dia estourar, o próximo degrau é US$ 5/mês. Não existe cobrança
surpresa: a conta gratuita **para de servir** em vez de virar fatura, a menos
que você mesmo habilite o plano pago.

---

## Se der problema

**"Não autenticado" logo depois de entrar**
O app e a API precisam estar na mesma origem. Se você separou os dois, o cookie
não viaja. Mantenha o `[assets]` no `wrangler.toml` — é o que garante isso.

**Imagem não aparece no post exportado**
O `Access-Control-Allow-Origin` no `/api/files/*` é o que impede o canvas de
ficar "tainted". Não remova essa linha do Worker.

**Vídeo não toca no iPhone**
O `Accept-Ranges` e a resposta `206` no `/api/files/*` são obrigatórios: sem
eles o Safari não consegue buscar dentro do arquivo e o clipe não roda.

**Erro de espaço no R2**
`npx wrangler r2 object list mestiza-lab-media` mostra o que está lá. Mídia
apagada pelo app sai do bucket junto.
