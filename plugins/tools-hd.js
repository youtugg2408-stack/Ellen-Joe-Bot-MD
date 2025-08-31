import fetch from "node-fetch";
import crypto from "crypto";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

// Emojis y texto de Ellen
const rwait = "⏳";
const done = "✅";
const error = "❌";
const emoji = "❕";
const ellen = "🦈 Ellen Joe aquí... *ugh* que flojera~";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

// Función para generar la API Key en SHA256
function generateSha256(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

const API_URL = "http://neviapi.ddns.net:8000";
const API_KEY = "ellen";
const HASHED_KEY = generateSha256(API_KEY);

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : null;
  if (!q)
    return conn.reply(
      m.chat,
      `${ellen}\n${emoji} ¿Me haces trabajar sin darme una imagen? No, gracias… responde a una imagen primero.`,
      m
    );
  let mime = (q.msg || q).mimetype || "";
  if (!mime || !mime.startsWith("image/"))
    return conn.reply(
      m.chat,
      `${ellen}\n${emoji} Eso no es una imagen… ¿acaso me quieres ver bostezar?`,
      m
    );

  await m.react(rwait);

  let upscaleData;
  try {
    let media = await q.download();
    if (!media || media.length === 0)
      throw new Error("Ni siquiera puedo descargar eso…");

    const { ext, mime: fileMime } = (await fileTypeFromBuffer(media)) || {};
    const blob = new Blob([media.toArrayBuffer()], { type: fileMime });
    const formData = new FormData();
    formData.append("file", blob, `image.${ext}`);

    const upscaleResponse = await fetch(`${API_URL}/image/hd`, {
      method: "POST",
      body: formData,
      headers: {
        "X-Auth-Sha256": HASHED_KEY,
      },
    });

    upscaleData = await upscaleResponse.json();

    if (!upscaleResponse.ok || !upscaleData.ok) {
      const errorMsg = `La API de HD se rindió, igual que yo después de 5 minutos de esfuerzo.
Error: ${upscaleData.error || "Desconocido"}`;
      const jsonString = JSON.stringify(upscaleData, null, 2);
      throw new Error(`${errorMsg}\n\n\`\`\`json\n${jsonString}\n\`\`\``);
    }
    
    if (!upscaleData.download_url) {
        const jsonString = JSON.stringify(upscaleData, null, 2);
        throw new Error(`La API no devolvió una URL de descarga válida.
\`\`\`json
${jsonString}
\`\`\``);
    }

    const downloadUrl = `${API_URL}${upscaleData.download_url}`;

    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        "X-Auth-Sha256": HASHED_KEY,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error("No pude descargar la imagen mejorada.");
    }

    const bufferHD = Buffer.from(await downloadResponse.arrayBuffer());

    let textoEllen = `
🦈 *Listo… aquí tienes tu imagen en HD...*
> Aunque sinceramente, no sé por qué me haces gastar energía en esto…
> Supongo que ahora puedes ver cada pixel, feliz, ¿no?

*Respuesta JSON de la API:*
\`\`\`json
${JSON.stringify(upscaleData, null, 2)}
\`\`\`

💤 *Ahora… ¿puedo volver a mi siesta?*
`;

    await conn.sendMessage(
      m.chat,
      {
        image: bufferHD,
        caption: textoEllen.trim(),
      },
      { quoted: m }
    );

    await m.react(done);

    const fileId = upscaleData.download_url.split("/").pop();
    await fetch(`${API_URL}/done/${fileId}`, {
      method: "POST",
      headers: {
        "X-Auth-Sha256": HASHED_KEY,
      },
    });

  } catch (e) {
    console.error(e);
    await m.react(error);
    return conn.reply(
      m.chat,
      `${ellen}\n⚠️ Algo salió mal… y no, no fue mi culpa… probablemente.\n\n*Error:* ${e.message}`,
      m
    );
  }
};

handler.help = ["hd"];
handler.tags = ["ai"];
handler.command = ["hd"];
export default handler;
