#!/usr/bin/env node
/* =========================================================
   Mestiza Lab — cria o primeiro administrador.

   Gera o SQL com a senha já derivada em PBKDF2. A senha em
   claro nunca entra num arquivo nem fica no histórico do
   shell — ela é lida do stdin.

   Uso:
     node seed-admin.mjs "vilkervs@gmail.com" "Vilker Silva"

   Ele pede a senha, imprime o comando pronto do wrangler e
   você cola no terminal.
   ========================================================= */

import { webcrypto as crypto } from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin, stdout, argv, exit } from 'node:process';

const ITER = 210_000;
const enc = new TextEncoder();
const b64 = (b) => Buffer.from(b).toString('base64');

async function hashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER },
    key,
    256,
  );
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(bits)}`;
}

const email = (argv[2] || '').toLowerCase().trim();
const nome = argv[3] || '';

if (!email.includes('@')) {
  console.error('Uso: node seed-admin.mjs "email@dominio" "Nome Completo"');
  exit(1);
}

const rl = readline.createInterface({ input: stdin, output: stdout });
const senha = (await rl.question('Senha (mínimo 8 caracteres): ')).trim();
rl.close();

if (senha.length < 8) {
  console.error('Senha curta demais.');
  exit(1);
}

const hash = await hashSenha(senha);
const id = 'usr_' + [...crypto.getRandomValues(new Uint8Array(16))]
  .map((x) => x.toString(16).padStart(2, '0'))
  .join('');

const sql =
  `INSERT INTO users (id, email, nome, senha_hash, role) VALUES ` +
  `('${id}', '${email}', '${nome.replace(/'/g, "''")}', '${hash}', 'admin');`;

console.log('\n--- SQL gerado ---\n');
console.log(sql);
console.log('\n--- Rode isto (no diretório worker/) ---\n');
console.log(`npx wrangler d1 execute mestiza-lab --remote --command "${sql.replace(/"/g, '\\"')}"`);
console.log('');
console.log('Para o banco local de testes, troque --remote por --local.\n');
