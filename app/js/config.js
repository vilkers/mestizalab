/* =========================================================
   Mestiza Lab — configuração
   ========================================================= */

/**
 * Base da API.
 * Em produção o Pages e o Worker ficam no mesmo domínio via
 * rota (/api/*), então caminho relativo resolve. Em dev,
 * aponte para o `wrangler dev` colocando ?api= na URL uma
 * vez — fica guardado no aparelho.
 */
const override = new URLSearchParams(location.search).get('api');
if (override !== null) localStorage.setItem('mz.api', override);
export const API_BASE = localStorage.getItem('mz.api') || '/api';

export const APP = {
  name: 'Mestiza Lab',
  tagline: 'haz lo que quieras hacer',
  site: 'mestiza.work',
};

/**
 * Chaves de funcionalidade.
 *
 * `redator` está DESLIGADO por decisão de custo: ligar exige
 * uma ANTHROPIC_API_KEY como secret do Worker. A interface do
 * redator já está construída atrás dessa chave — o dia que
 * quiser ligar é trocar isto para true e pôr o secret. Nenhum
 * refactor.
 */
export const FEATURES = {
  redator: false,     // agente redator dentro do app
  admin: false,       // área administrativa (contas a pagar etc.)
  video: true,        // editor de vídeo com máscara
};

/**
 * Tipos aceitos. Os LIMITES de tamanho não moram aqui: eles
 * dependem do servidor (com R2 ou sem) e chegam pelo /me, em
 * `session.recursos`. Duplicar número de limite no cliente é
 * receita para mensagem de erro mentindo.
 */
export const TIPOS = {
  imagem: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
};

export const STATUS = {
  rascunho:  { label: 'Rascunho',  color: 'var(--faint)' },
  revisao:   { label: 'Em revisão', color: 'var(--accent)' },
  aprovado:  { label: 'Aprovado',  color: 'var(--ok)' },
  publicado: { label: 'Publicado', color: 'var(--dim)' },
};
