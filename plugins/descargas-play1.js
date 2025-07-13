import fetch from "node-fetch"; 
import { ogmp3 } from '../lib/youtubedl.js'; 
import yts from "yt-search";
import axios from 'axios'; 

// --- Constantes y Configuración ---
const SIZE_LIMIT_MB = 100;
const newsletterJid = '120363418071540900@newsletter';

const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏᴇ\'s 𝐒ervice';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = conn.getName(m.sender);

  const contextInfo = {
    mentionedJid: [m.sender],
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
      newsletterJid,
      newsletterName,
      serverMessageId: -1
    },
    externalAdReply: {
      // [CAMBIO + 🦈] Título con un toque de depredador.
      title: 'Ellen Joe: Pista localizada. 🦈', 
      body: `Procesando solicitud para el/la Proxy ${name}...`,
      thumbnail: icons, // Recuerda: la URL de la imagen de Ellen Joe va aquí
      sourceUrl: redes,
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  // [CAMBIO + 🦈] Mensaje de bienvenida con metáfora de caza.
  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *Hora de cazar, Proxy ${name}.* ¿Qué objetivo de audio o video rastreamos hoy?\n\nEjemplo:\n${usedPrefix}play Unusual Love - ZZZ`, m, { contextInfo });
  }

  const isMode = args[0].toLowerCase() === "audio" || args[0].toLowerCase() === "video";
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");

  const search = await yts(queryOrUrl);
  const video = search.videos?.[0];

  // [CAMBIO + 🦈] Mensaje de error temático.
  if (!video) {
    return conn.reply(m.chat, `🦈 *El objetivo se escabulló...* No pude localizar nada para: "${queryOrUrl}"`, m, { contextInfo });
  }

  if (isMode) {
    const mode = args[0].toLowerCase();
    await m.react("📥"); 

    const sendMediaFile = async (downloadUrl, title) => {
      if (mode === "audio") {
        await conn.sendMessage(m.chat, {
          audio: { url: downloadUrl },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
        }, { quoted: m });
        await m.react("🎧");
      } else {
        const headRes = await axios.head(downloadUrl);
        const fileSize = parseInt(headRes.headers['content-length'] || "0") / (1024 * 1024);
        const asDocument = fileSize > SIZE_LIMIT_MB;
        
        // [CAMBIO + 🦈] Mensaje de confirmación para el video.
        await conn.sendMessage(m.chat, {
          video: { url: downloadUrl },
          caption: `📹 *Presa capturada, ${name}.*\n⚙️ *Archivo:* ${title}`,
          fileName: `${title}.mp4`,
          mimetype: "video/mp4",
          ...(asDocument && { asDocument: true })
        }, { quoted: m });
        await m.react("📽️");
      }
    };

    // --- Lógica de descarga (sin cambios) ---
    try {
      const endpoint = mode === "audio" ? "ytmp3" : "ytmp4";
      const dlApi = `https://api.vreden.my.id/api/${endpoint}?url=${encodeURIComponent(video.url)}`;
      const res = await fetch(dlApi);
      const json = await res.json();
      if (json.status === 200 && json.result?.download?.url) {
        console.log("Extracción de datos exitosa con la API principal.");
        await sendMediaFile(json.result.download.url, json.result.metadata.title || video.title);
        return;
      }
      throw new Error("La API principal no devolvió una URL de datos válida.");
    } catch (e) {
      console.log(`Fallo de la API principal: ${e.message}. Iniciando protocolo de respaldo (ogmp3)...`);
    }

    try {
      const downloadResult = await ogmp3.download(video.url, null, mode);
      if (downloadResult.status && downloadResult.result?.download) {
        console.log("Extracción de datos exitosa con el protocolo de respaldo (ogmp3).");
        await sendMediaFile(downloadResult.result.download, downloadResult.result.title);
        return;
      }
      throw new Error("El protocolo de respaldo (ogmp3) también falló.");
    } catch (e) {
      console.error(`Ambos protocolos de extracción fallaron: ${e.message}`);
      return m.react("❌");
    }
  }

  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎵 Extraer Audio' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '📹 Extraer Video' }, type: 1 }
  ];

  // [CAMBIO + 🦈] Mensaje principal con la temática de tiburón.
  const caption = `
╭───🦈 *¡OBJETIVO ADQUIRIDO, ${name}!* 🦈───
│💿 *Archivo:* ${video.title}
│⏱️ *Duración:* ${video.timestamp}
│👁️ *Vistas:* ${video.views.toLocaleString()}
│👤 *Fuente:* ${video.author.name}
│🗓️ *Fecha de subida:* ${video.ago}
│🔗 *URL Original:* ${video.url}
╰───────────────────────────────`;

  await conn.sendMessage(m.chat, {
    image: { url: video.thumbnail },
    caption,
    // [CAMBIO + 🦈] Pie de página temático.
    footer: 'Elige cómo devorar los datos, Proxy.',
    buttons,
    headerType: 4
  }, { quoted: m });
};

handler.help = ['play'].map(v => v + ' <búsqueda o URL>');
handler.tags = ['descargas'];
handler.command = ['play'];
handler.register = true;

export default handler;
