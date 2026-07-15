// Compressão/redimensionamento client-side de imagens antes do upload —
// evita enviar fotos de celular em resolução/peso muito acima do necessário
// (causa do efeito de "carregamento em blocos" em conexões mais lentas).
// Compartilhado entre o recorte de foto de perfil (EditProfile.jsx) e o
// upload de foto de sessão (useAddSession.js): ambos precisam do mesmo passo
// de "desenhar num canvas do tamanho certo e exportar como Blob", só mudam
// os parâmetros (recorte ou não, dimensão máxima, qualidade).

// Carrega uma imagem a partir de uma URL (blob: ou remota) como HTMLImageElement.
export const loadImageFromSrc = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });

// Desenha um recorte de `image` (por padrão, a imagem inteira) num canvas,
// reduzindo proporcionalmente se a maior dimensão do recorte passar de
// `maxDimension` — nunca aumenta imagens já menores que o limite. Exporta
// como Blob no formato/qualidade pedidos.
export const drawToResizedBlob = ({
  image,
  sx = 0,
  sy = 0,
  sWidth = image.naturalWidth || image.width,
  sHeight = image.naturalHeight || image.height,
  maxDimension,
  quality,
  mimeType = "image/jpeg",
}) => {
  const largestSide = Math.max(sWidth, sHeight);
  const scale =
    maxDimension && largestSide > maxDimension ? maxDimension / largestSide : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sWidth * scale);
  canvas.height = Math.round(sHeight * scale);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
};

// Comprime um File de imagem inteiro (sem recorte) — usado no upload de
// fotos de sessão, onde, diferente do avatar, não há etapa de crop.
export const compressImageFile = async (
  file,
  { maxDimension, quality, mimeType = "image/jpeg" },
) => {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromSrc(objectUrl);
    return await drawToResizedBlob({ image, maxDimension, quality, mimeType });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
