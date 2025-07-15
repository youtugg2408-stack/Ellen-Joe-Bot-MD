import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';

// --- Constantes y Configuración ---
const SIZE_LIMIT_MB = 100;
const MIN_AUDIO_SIZE_BYTES = 50000; // Umbral para detectar audios corruptos/vacíos (50 KB)
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

    /**
     * Envía un archivo multimedia y verifica su integridad antes de enviarlo.
     * @param {string} downloadUrl - La URL del archivo a descargar.
     * @param {string} title - El título del archivo.
     * @param {'audio'|'video'} currentMode - El modo de descarga actual.
     */
    const sendMediaFile = async (downloadUrl, title, currentMode) => {
      // --- NUEVA VERIFICACIÓN PARA AUDIO ---
      if (currentMode === "audio") {
        try {
          const headRes = await axios.head(downloadUrl);
          const fileSize = parseInt(headRes.headers['content-length'] || "0");
          
          if (fileSize < MIN_AUDIO_SIZE_BYTES) {
            console.log(`Fallo detectado: El tamaño del audio (${fileSize} bytes) es menor al umbral de ${MIN_AUDIO_SIZE_BYTES} bytes.`);
            // Lanzar un error para ser capturado y activar el sistema de respaldo.
            throw new Error('Audio de 0 segundos o corrupto detectado.');
          }

          await conn.sendMessage(m.chat, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
          }, { quoted: m });
          await m.react("🎧");
        } catch (error) {
           // Si axios.head falla o el tamaño es muy pequeño, se propaga el error.
           throw error;
        }
      } else { // Lógica existente para video
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

    // --- LÓGICA DE DESCARGA MEJORADA ---

    // Nivel 1: Intento con la API Principal
    try {
      console.log("Protocolo 1: API Principal (vreden.my.id)");
      const endpoint = mode === "audio" ? "ytmp3" : "ytmp4";
      const dlApi = `https://api.vreden.my.id/api/${endpoint}?url=${encodeURIComponent(urlToDownload)}`;
      const res = await fetch(dlApi);
      const json = await res.json();
      if (json.status === 200 && json.result?.download?.url) {
        console.log("Éxito con API Principal. Verificando integridad del archivo...");
        await sendMediaFile(json.result.download.url, json.result.metadata.title || video.title, mode);
        return; // Termina si todo fue exitoso
      }
      throw new Error("API Principal no devolvió URL válida.");
    } catch (e) {
      console.log(`Fallo Protocolo 1: ${e.message}. Pasando al protocolo de respaldo.`);
      // Notificar al usuario que se intentará un respaldo.
      await conn.reply(m.chat, `🦈 El primer método de extracción falló. Intentando protocolo de respaldo...`, m);

      // Nivel 2: Intento con el Protocolo de Respaldo Final (ogmp3)
      try {
        console.log("Protocolo 2: Respaldo final (ogmp3)");
        const downloadResult = await ogmp3.download(urlToDownload, null, mode);
        if (downloadResult.status && downloadResult.result?.download) {
          console.log("Éxito con el respaldo (ogmp3). Verificando integridad del archivo...");
          await sendMediaFile(downloadResult.result.download, downloadResult.result.title, mode);
          return; // Termina si el respaldo fue exitoso
        }
        throw new Error("El respaldo (ogmp3) también falló.");
      } catch (e2) {
        console.error(`Error fatal: Todos los protocolos de descarga fallaron. Error final: ${e2.message}`);
        await conn.reply(m.chat, `🦈 *Misión Abortada, ${name}.* Todos los protocolos de extracción fallaron. El objetivo podría estar protegido o ser inaccesible.`, m);
        await m.react("❌");
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
