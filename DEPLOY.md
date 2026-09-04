# Publicar o Mestiza Lab

Dois caminhos. **O primeiro não precisa de computador** — dá para fazer tudo
pelo navegador do celular.

> **Por que não dá pra usar o GitHub Pages:** ele só serve arquivos parados. A
> plataforma precisa de senha de verdade, banco, upload de mídia e a rota que o
> Claude usa — isso exige um servidor. A Cloudflare roda isso de graça.

---

# Caminho A — pelo celular, sem terminal

Uns 15 minutos. Você só clica e copia/cola. **Não pede cartão em nenhum
momento** — Workers e D1 são gratuitos sem cadastro de pagamento.

Cinco passos: conta → banco → colar um código → publicar → criar seu login.

## 1. Criar a conta na Cloudflare

<https://dash.cloudflare.com/sign-up> — e-mail e senha, plano gratuito.

## 2. Criar o banco de dados

No menu, procure **Storage & Databases → D1** (em algumas contas aparece como
"D1 SQL Database").

- **Create database** → nome: `mestiza-lab` → criar
- Abra o banco criado e vá na aba **Console**
- Cole ali o conteúdo inteiro do arquivo `worker/schema.sql` deste repositório
  e execute
  *(no celular: abra o arquivo no GitHub, toque nos três pontinhos → "Copy raw
  file", e cole)*
- Ainda nessa tela, **copie o `Database ID`** — um código tipo
  `a1b2c3d4-5e6f-...`. Você vai precisar dele no passo 3.

## 3. Colar o Database ID no projeto

O arquivo `wrangler.toml`, na raiz do repositório, tem esta linha:

```toml
database_id = "SUBSTITUA_PELO_ID_DO_D1"
```

Troque pelo ID que você copiou no passo 2.

**Pelo celular:** abra o `wrangler.toml` no GitHub → ícone de lápis → edite →
**Commit changes**.

**Ou mais simples:** cole o ID na conversa comigo e eu edito e envio.

## 4. Publicar

No menu, **Compute (Workers)** → **Create** → aba **Import a repository**
(ou "Connect to Git").

- Autorize o GitHub e escolha o repositório `vilkers/mestizalab`
- Em **branch**, escolha a branch onde está o código
- Deixe as configurações de build como vieram — o `wrangler.toml` na raiz já
  diz tudo
- **Deploy**

Ao final ele mostra o endereço, algo como:

```
https://mestiza-lab.<sua-conta>.workers.dev
```

## 5. Criar o seu login

Abra esse endereço no celular. Vai aparecer a tela **Primeiro acesso** —
preencha nome, e-mail e senha, e você já entra.

> Faça isso **logo depois de publicar**. Essa tela existe enquanto não houver
> ninguém cadastrado; assim que você criar seu login, ela fecha para sempre.

Depois: **Compartilhar → Adicionar à Tela de Início**. Abre em tela cheia, com
cara de app.

---

# Caminho B — pelo terminal do Mac

Uns 15 minutos, se você já usa terminal.

```bash
git clone https://github.com/vilkers/mestizalab
cd mestizalab
npm install
npx wrangler login

npx wrangler d1 create mestiza-lab        # cole o database_id no wrangler.toml
npx wrangler d1 execute mestiza-lab --remote --file=worker/schema.sql
npx wrangler deploy
```

Abra o endereço que ele imprimir e crie seu login na tela de primeiro acesso.

*(Se preferir criar o usuário pelo terminal em vez da tela:
`node worker/seed-admin.mjs "seu@email.com" "Seu Nome"` gera o comando pronto.)*

---

## Onde as fotos ficam guardadas

**Por padrão, no próprio banco (D1).** Grátis, sem cartão, sem nada a
configurar. O app reduz cada foto antes de enviar — uma imagem de 3,7 MB e
4000px sai como 240 KB e 1800px, que é mais do que a peça de 1080px precisa.

Nesse modo:

| | |
|---|---|
| ✅ | Fotos, coleções, todos os templates, todos os formatos |
| ✅ | Export de PNG e de carrossel em `.zip` |
| ✅ | Máscara de Reels em PNG transparente 1080×1920 |
| ❌ | Upload de vídeo — o clipe não tem onde morar |
| ❌ | Arquivos acima de 800 KB |

### Ligar o R2 depois (opcional)

Se um dia quiser subir vídeo ou tirar o teto de tamanho:

1. No painel: **R2 Object Storage** → **Create bucket** → `mestiza-lab-media`
   *(a Cloudflare costuma pedir cartão para ativar o R2, mesmo no plano
   gratuito — nada é cobrado dentro dos 10 GB, mas o cadastro é exigido)*
2. No `wrangler.toml`, descomente as três linhas do bloco `[[r2_buckets]]`
3. Publique

As fotos que já estavam no banco continuam funcionando — não há migração a
fazer, o servidor procura nos dois lugares.

---

## Migrações do banco

Quando um deploy trouxer mudança de estrutura no banco, ela vem como arquivo em
`worker/migrations/`. Rode uma vez cada — pelo Console do D1 no painel, ou:

```bash
npx wrangler d1 execute mestiza-lab --remote --file=worker/migrations/001-colecoes.sql
```

Se você está criando o banco agora pelo `schema.sql`, **não precisa rodar
nenhuma migração** — o schema já vem completo.

---

## Publicar uma mudança depois

**Caminho A:** nada a fazer. Todo push na branch conectada publica sozinho.

**Caminho B:** `npx wrangler deploy` na raiz do projeto.

---

## Domínio próprio (opcional)

Para ficar em `lab.mestiza.work` em vez do `.workers.dev`:

1. O domínio `mestiza.work` precisa estar com o DNS na Cloudflare
2. No painel do Worker: **Settings → Domains & Routes → Add custom domain**
3. Ou descomente no `wrangler.toml`:

```toml
[[routes]]
pattern = "lab.mestiza.work/*"
zone_name = "mestiza.work"
```

O `mestiza.work` continua no GitHub Pages normalmente — só o subdomínio `lab`
aponta para cá.

---

## Adicionar as outras pessoas

Dentro do app: **Ajustes → Pessoas → Adicionar pessoa**. Ele sugere uma senha
provisória fácil de ditar (`estudio-craft-luz-42`). Mande por canal privado — a
pessoa troca depois. Marcando **Administrador**, ela também pode adicionar
gente.

---

## Ligar o Claude

**Ajustes → Integração com o Claude → Criar token.** Copie o bloco que aparece
(ele só aparece uma vez) e cole na conversa. O resto está em
[`docs/INTEGRACAO-CLAUDE.md`](docs/INTEGRACAO-CLAUDE.md).

---

## Ligar o redator automático (quando quiser)

Hoje está desligado para não gerar custo.

**No painel:** Worker → Settings → **Variables and Secrets** → adicione um
secret `ANTHROPIC_API_KEY` com a chave criada em console.anthropic.com.

Depois, em `app/js/config.js`, troque `redator: false` por `redator: true`.
Custo estimado: US$ 1–3/mês no seu volume. A chave fica como secret do Worker —
nunca no código, nunca no navegador.

---

## Quanto custa

| Recurso | Grátis até | Seu uso provável |
|---|---|---|
| Workers | 100.000 requisições/dia | uma fração disso |
| D1 (banco) | 5 GB | alguns MB |
| R2 (mídia) | 10 GB + saída ilimitada | anos de fotos |
| Deploy | ilimitado | — |

Se um dia estourar, o próximo degrau é US$ 5/mês. A conta gratuita **para de
servir** em vez de virar fatura, a menos que você habilite o plano pago.

---

## Se der problema

**A tela de primeiro acesso não aparece, aparece o login**
Já existe alguém cadastrado. Use o login, ou apague pelo Console do D1
(`DELETE FROM users;`) e recarregue.

**"Não autenticado" logo depois de entrar**
O app e a API precisam estar na mesma origem. Mantenha o bloco `[assets]` no
`wrangler.toml` — é o que garante isso.

**Imagem não aparece no post exportado**
O `Access-Control-Allow-Origin` em `/api/files/*` é o que impede o canvas de
ficar "tainted". Não remova essa linha do Worker.

**Vídeo não toca no iPhone**
O `Accept-Ranges` e a resposta `206` em `/api/files/*` são obrigatórios: sem
eles o Safari não consegue buscar dentro do arquivo.

**O deploy falhou no painel**
Veja o log do build. O erro mais comum é o `database_id` ainda estar como
`SUBSTITUA_PELO_ID_DO_D1` (passo 3).

**"Sem o R2 ativado, cada arquivo pode ter no máximo 800 KB"**
Uma imagem que o app não conseguiu reduzir o bastante — costuma ser PNG com
transparência muito grande. Salve como JPG e suba de novo, ou ative o R2.
