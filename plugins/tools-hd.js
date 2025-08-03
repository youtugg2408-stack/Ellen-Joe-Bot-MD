import FormData from "form-data";
import Jimp from "jimp";
import fetch from "node-fetch";

const handler = async (m, {conn, usedPrefix, command}) => {
 try {    
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || q.mediaType || "";
  if (!mime) return m.reply("Por favor, responda a una imagen para mejorar su calidad (HD).");
  if (!/image\/(jpe?g|png)/.test(mime)) return m.reply(`El formato del archivo (${mime}) no es compatible, envía o responda a una imagen.`);
  
  conn.reply(m.chat, "Mejorando la calidad de la imagen con IA...", m);
  let img = await q.download?.();
  let pr;

  try {
    // Intenta usar la API de DeepAI como alternativa
    pr = await upscaleImageWithDeepAI(img);
  } catch (apiError) {
    console.error("La API de mejora de imagen falló, usando Jimp como alternativa:", apiError);
    // Si la API falla, usa Jimp como plan B
    conn.reply(m.chat, "La API falló. Usando un método de escalado básico...", m);
    pr = await resizeImageWithJimp(img);
  }

  conn.sendMessage(m.chat, {image: pr}, {quoted: m});

 } catch (generalError) {
  console.error("Ocurrió un error general:", generalError);
  return m.reply("Ocurrió un error inesperado.");
 }
};

handler.help = ["remini", "hd", "enhance"];
handler.tags = ["ai", "tools"];
handler.command = ["remini", "hd", "enhance"];
handler.group = true;
handler.register = true

export default handler;

// Función para usar la API de DeepAI (alternativa)
async function upscaleImageWithDeepAI(imageData) {
  const url = 'https://api.deepai.org/api/waifu2x';
  const formData = new FormData();
  formData.append('image', imageData, {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': 'tu_api_key_de_deepai', // **IMPORTANTE: Debes obtener tu propia clave API de DeepAI y ponerla aquí**
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`DeepAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const imageUrl = result.output_url;

  if (!imageUrl) {
    throw new Error('No se encontró URL de salida en la respuesta de la API.');
  }

  const enhancedImageResponse = await fetch(imageUrl);
  if (!enhancedImageResponse.ok) {
    throw new Error(`Error al descargar la imagen mejorada: ${enhancedImageResponse.statusText}`);
  }

  return enhancedImageResponse.buffer();
}

// Función de respaldo con Jimp
async function resizeImageWithJimp(imageData) {
  const image = await Jimp.read(imageData);
  // Redimensiona la imagen a 2048px de ancho, manteniendo la relación de aspecto
  const resizedImage = await image.resize(2048, Jimp.AUTO);
  const buffer = await resizedImage.getBufferAsync(Jimp.AUTO);
  return buffer;
}
