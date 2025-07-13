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
      title: 'Ellen Joe: Pista localizada. 🦈', 
      body: `Procesando solicitud para el/la Proxy ${name}...`,
      thumbnail: icons, // Recuerda: la URL de la imagen de Ellen Joe va aquí
      sourceUrl: redes,
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *Hora de cazar, Proxy ${name}.* ¿Qué objetivo de audio o video rastreamos hoy?\n\nEjemplo:\n${usedPrefix}play Unusual Love - ZZZ`, m, { contextInfo });
  }

  const isMode = args[0].toLowerCase() === "audio" || args[0].toLowerCase() === "video";
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");

  const isInputUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

  const search = await yts(queryOrUrl);
  const video = search.videos?.[0];

  if (!video) {
    return conn.reply(m.chat, `🦈 *El objetivo se escabulló...* No pude localizar nada para: "${queryOrUrl}"`, m, { contextInfo });
  }

  // --- Lógica de descarga directa ---
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
    
    const urlToDownload = isInputUrl ? queryOrUrl : video.url;

    // --- NUEVA LÓGICA DE DESCARGA CON 3 NIVELES ---

    // Nivel 1: Intento con la API Principal
    try {
      console.log("Protocolo 1: API Principal (vreden.my.id)");
      const endpoint = mode === "audio" ? "ytmp3" : "ytmp4";
      const dlApi = `https://api.vreden.my.id/api/${endpoint}?url=${encodeURIComponent(urlToDownload)}`;
      const res = await fetch(dlApi);
      const json = await res.json();
      if (json.status === 200 && json.result?.download?.url) {
        console.log("Éxito con API Principal.");
        await sendMediaFile(json.result.download.url, json.result.metadata.title || video.title);
        return;
      }
      throw new Error("API Principal no devolvió URL válida.");
    } catch (e) {
      console.log(`Fallo API Principal: ${e.message}. Pasando al protocolo 2.`);

      // Nivel 2: Intento con la API Secundaria
      try {
        console.log("Protocolo 2: API Secundaria (stellarwa.xyz)");
        const apiBase = "https://api.stellarwa.xyz/dow";
        const endpoint = mode === "audio" ? "ytmp3" : "ytmp4";
        const resSecondary = await fetch(`${apiBase}/${endpoint}?url=${encodeURIComponent(urlToDownload)}&apikey=Stellar`);
        const jsonSecondary = await resSecondary.json();
        
        // Asumiendo que la URL de descarga está en 'result' y el estado es 'ok'
        if (jsonSecondary.status === 'ok' && jsonSecondary.result) {
          console.log("Éxito con API Secundaria.");
          await sendMediaFile(jsonSecondary.result, video.title);
          return;
        }
        throw new Error("API Secundaria no devolvió URL válida.");
      } catch (e2) {
        console.log(`Fallo API Secundaria: ${e2.message}. Pasando al protocolo 3.`);

        // Nivel 3: Intento con el Protocolo de Respaldo Final (ogmp3)
        try {
          console.log("Protocolo 3: Respaldo final (ogmp3)");
          const downloadResult = await ogmp3.download(urlToDownload, null, mode);
          if (downloadResult.status && downloadResult.result?.download) {
            console.log("Éxito con el respaldo (ogmp3).");
            await sendMediaFile(downloadResult.result.download, downloadResult.result.title);
            return;
          }
          throw new Error("El respaldo (ogmp3) también falló.");
        } catch (e3) {
          console.error(`Todos los protocolos fallaron: ${e3.message}`);
          await m.react("❌");
        }
      }
    }
    return;
  }

  // --- Lógica para mostrar botones (sin cambios) ---
  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎵 Extraer Audio' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '📹 Extraer Video' }, type: 1 }
  ];

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
