/* =========================================================
   Mestiza Lab — preparo de imagem antes do upload

   Por que isto existe, mesmo com o R2 ligado: a foto que sai
   de um iPhone tem 4000px e 4 MB. A peça final tem 1080px de
   largura. Subir os 4 MB gasta o pacote de dados da pessoa,
   demora no 4G do set, e não melhora um pixel do resultado.

   Sem o R2, isto deixa de ser boa prática e vira requisito: o
   teto por arquivo no modo D1 é 800 KB.

   O que NÃO fazemos aqui: mexer em cor, nitidez ou contraste.
   Reduzir é operação de transporte, não de tratamento.
   ========================================================= */

/** Perfis. O modo sem R2 é mais apertado por necessidade. */
export const PERFIS = {
  r2: { maxEdge: 2600, qualidade: 0.88, alvoBytes: 3 * 1024 * 1024 },
  d1: { maxEdge: 1800, qualidade: 0.84, alvoBytes: 780 * 1024 },
};

/**
 * Carrega o arquivo já com a orientação do EXIF aplicada.
 * Foto de celular na horizontal vem com a rotação só no
 * metadado — quem desenha no canvas sem tratar isso publica a
 * imagem deitada.
 */
async function carregar(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Safari antigo não aceita a opção; cai no <img>, que
      // aplica a orientação por conta própria.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Não consegui ler essa imagem.'));
      i.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function dimensoes(src) {
  return {
    w: src.naturalWidth || src.width,
    h: src.naturalHeight || src.height,
  };
}

function paraBlob(canvas, tipo, q) {
  return new Promise((res) => canvas.toBlob(res, tipo, q));
}

/**
 * Reduz a imagem para caber no perfil.
 * @returns {Promise<{file: File, largura: number, altura: number, reduziu: boolean, de: number, para: number}>}
 */
export async function prepararImagem(file, perfil = PERFIS.r2) {
  const ehPNG = file.type === 'image/png';
  const src = await carregar(file);
  const { w, h } = dimensoes(src);
  const maior = Math.max(w, h);

  // Já está pequena e leve: não mexe. Reencodar uma imagem que
  // já cabe só destrói qualidade sem ganho nenhum.
  if (maior <= perfil.maxEdge && file.size <= perfil.alvoBytes) {
    src.close && src.close();
    return { file, largura: w, altura: h, reduziu: false, de: file.size, para: file.size };
  }

  const escala = Math.min(1, perfil.maxEdge / maior);
  const nw = Math.round(w * escala);
  const nh = Math.round(h * escala);

  const canvas = document.createElement('canvas');
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, nw, nh);
  src.close && src.close();

  // PNG com transparência (logo, elemento gráfico) continua
  // PNG — virar JPEG traria fundo preto.
  const temAlfa = ehPNG && (await pareceTerAlfa(ctx, nw, nh));
  const tipo = temAlfa ? 'image/png' : 'image/jpeg';

  let q = perfil.qualidade;
  let blob = await paraBlob(canvas, tipo, q);

  // Se ainda não coube, desce a qualidade em degraus. Abaixo
  // de 0.6 a compressão começa a aparecer em pele e gradiente,
  // então preferimos reduzir mais o tamanho a espremer mais.
  while (blob && blob.size > perfil.alvoBytes && !temAlfa && q > 0.6) {
    q -= 0.08;
    blob = await paraBlob(canvas, tipo, q);
  }
  if (blob && blob.size > perfil.alvoBytes) {
    const fator = Math.sqrt(perfil.alvoBytes / blob.size) * 0.95;
    canvas.width = Math.max(600, Math.round(nw * fator));
    canvas.height = Math.max(600, Math.round(nh * fator));
    const c2 = canvas.getContext('2d');
    c2.imageSmoothingQuality = 'high';
    const src2 = await carregar(file);
    c2.drawImage(src2, 0, 0, canvas.width, canvas.height);
    src2.close && src2.close();
    blob = await paraBlob(canvas, tipo, Math.max(q, 0.7));
  }

  if (!blob) throw new Error('Não consegui preparar essa imagem.');

  const nome = trocarExtensao(file.name || 'imagem', tipo === 'image/png' ? 'png' : 'jpg');
  return {
    file: new File([blob], nome, { type: tipo }),
    largura: canvas.width,
    altura: canvas.height,
    reduziu: true,
    de: file.size,
    para: blob.size,
  };
}

/** Amostra as bordas atrás de pixel transparente. Barato e
    suficiente: logo com alfa quase sempre tem canto vazado. */
async function pareceTerAlfa(ctx, w, h) {
  try {
    const pontos = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [(w / 2) | 0, 0], [0, (h / 2) | 0]];
    for (const [x, y] of pontos) {
      if (ctx.getImageData(x, y, 1, 1).data[3] < 250) return true;
    }
  } catch { /* canvas sujo — assume opaco */ }
  return false;
}

function trocarExtensao(nome, ext) {
  return nome.replace(/\.[^.]+$/, '') + '.' + ext;
}

export function fmtKB(n) {
  return n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;
}
