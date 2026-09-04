/* =========================================================
   Conteúdo inicial da demonstração.

   Escolhido para mostrar o app cheio já na primeira tela: um
   carrossel que "veio do Claude", uma peça de campanha, uma
   capa de projeto, um pôster da editoria livre e uma máscara
   de Reels. Cinco estados diferentes, cinco templates.

   Os caminhos de `assets/` viram data URI no build.
   ========================================================= */

const AGORA = new Date().toISOString().slice(0, 19).replace('T', ' ');
const ONTEM = new Date(Date.now() - 864e5).toISOString().slice(0, 19).replace('T', ' ');

export const DEMO_MEDIA = [
  { id: 'med_d1', chave: 'demo/01', nome: 'campanha-01.jpg', mime: 'image/jpeg', tipo: 'image',
    tamanho: 184320, largura: 900, altura: 502, colecao: 'Campanha — verão',
    criado_em: AGORA, url: 'assets/samples/01.jpg' },
  { id: 'med_d2', chave: 'demo/02', nome: 'retrato-vertical.jpg', mime: 'image/jpeg', tipo: 'image',
    tamanho: 172032, largura: 502, altura: 900, colecao: 'Campanha — verão',
    criado_em: AGORA, url: 'assets/samples/02.jpg' },
  { id: 'med_d3', chave: 'demo/03', nome: 'bastidor-set.jpg', mime: 'image/jpeg', tipo: 'image',
    tamanho: 165000, largura: 900, altura: 502, colecao: 'Bastidores',
    criado_em: ONTEM, url: 'assets/samples/03.jpg' },
  { id: 'med_d4', chave: 'demo/04', nome: 'grupo-externa.jpg', mime: 'image/jpeg', tipo: 'image',
    tamanho: 158000, largura: 900, altura: 502, colecao: 'Bastidores',
    criado_em: ONTEM, url: 'assets/samples/04.jpg' },
  { id: 'med_d5', chave: 'demo/05', nome: 'familia-contra-luz.jpg', mime: 'image/jpeg', tipo: 'image',
    tamanho: 161000, largura: 900, altura: 502, colecao: '',
    criado_em: ONTEM, url: 'assets/samples/05.jpg' },
  { id: 'med_d6', chave: 'demo/06', nome: 'atleta-vertical.jpg', mime: 'image/jpeg', tipo: 'image',
    tamanho: 170000, largura: 514, altura: 899, colecao: '',
    criado_em: ONTEM, url: 'assets/samples/06.jpg' },
];

export const DEMO_POSTS = [
  {
    id: 'pst_demo1', titulo: 'Como a gente trabalha',
    editoria: 'institucional', formato: 'carrossel-45', template: 'inst-carrossel',
    status: 'revisao', origem: 'claude',
    content: {
      imagem: 'assets/samples/02.jpg',
      chapeu: 'Processo',
      titulo: 'Quatro etapas,\nnenhuma pulada.',
      blocos: [
        { titulo: 'Briefing', texto: 'Toda peça começa com uma pergunta que ninguém quer responder.' },
        { titulo: 'Direção', texto: 'Referência não é moodboard: é decisão tomada antes do set.' },
        { titulo: 'Entrega', texto: 'O arquivo sai pronto, no formato certo, na hora combinada.' },
      ],
      fecho: 'Salva esse post.',
    },
    overrides: {},
    legenda: 'O processo em quatro etapas — e por que a gente não pula nenhuma, mesmo quando o prazo aperta.',
    hashtags: '#mestiza #direcaodearte #processo',
    video: null, thumb: null, criado_em: AGORA, atualizado_em: AGORA,
  },
  {
    id: 'pst_demo2', titulo: 'A ideia continua sendo a parte difícil',
    editoria: 'institucional', formato: 'feed-45', template: 'inst-declaracao',
    status: 'revisao', origem: 'app',
    content: {
      imagem: 'assets/samples/06.jpg',
      chapeu: 'Mestiza · ai estudio',
      titulo: 'A ideia continua\nsendo a parte\ndifícil.',
    },
    overrides: {},
    legenda: 'Ferramenta nova não substitui decisão. Só acelera quem já sabe o que quer.',
    hashtags: '#mestiza #ai',
    video: null, thumb: null, criado_em: AGORA, atualizado_em: AGORA,
  },
  {
    id: 'pst_demo3', titulo: 'Capa — Shooting Nativa SPA',
    editoria: 'institucional', formato: 'feed-45', template: 'inst-capa-projeto',
    status: 'aprovado', origem: 'app',
    content: {
      imagem: 'assets/samples/01.jpg',
      cliente: 'O Boticário',
      projeto: 'Shooting Nativa SPA',
      ficha: 'Direção de arte · Still · 2026',
    },
    overrides: {}, legenda: '', hashtags: '',
    video: null, thumb: null, criado_em: ONTEM, atualizado_em: ONTEM,
  },
  {
    id: 'pst_demo4', titulo: 'Pôster — haz lo que quieras',
    editoria: 'livre', formato: 'feed-45', template: 'livre-poster',
    status: 'rascunho', origem: 'app',
    content: {
      imagem: 'assets/samples/04.jpg',
      palavra: 'HAZ LO\nQUE\nQUIERAS',
      nota: 'mestiza · ai estudio',
    },
    overrides: {}, legenda: '', hashtags: '',
    video: null, thumb: null, criado_em: ONTEM, atualizado_em: ONTEM,
  },
  {
    id: 'pst_demo5', titulo: 'Reels — o set às seis',
    editoria: 'video', formato: 'reels-916', template: 'video-manchete',
    status: 'rascunho', origem: 'app',
    content: { chapeu: 'Bastidores', titulo: 'O set às\nseis da manhã.' },
    overrides: {}, legenda: '', hashtags: '',
    video: null, thumb: null, criado_em: ONTEM, atualizado_em: ONTEM,
  },
];

export const DEMO_BRIEFINGS = [
  {
    id: 'brf_demo1', titulo: 'Carrossel sobre o processo do estúdio',
    corpo: 'Precisamos de um carrossel institucional explicando as quatro etapas do nosso processo — briefing, direção, produção e entrega. Tom firme, sem didatismo. Uma ideia por slide, corpo curto. Fecho pedindo pra salvar.\n\nPúblico: cliente potencial que já viu o portfólio e está decidindo se chama.',
    editoria: 'institucional', status: 'novo', origem: 'claude',
    post_id: 'pst_demo1', criado_em: AGORA,
  },
  {
    id: 'brf_demo2', titulo: 'Peça de bastidores do shooting',
    corpo: 'Foto do set às seis da manhã, antes de todo mundo chegar. A ideia é mostrar o que ninguém vê: o silêncio antes. Sem legenda explicativa — a foto sustenta.\n\nFormato: Reels com máscara, ou feed 4:5 se a foto for melhor parada.',
    editoria: 'video', status: 'novo', origem: 'claude',
    post_id: null, criado_em: ONTEM,
  },
];
