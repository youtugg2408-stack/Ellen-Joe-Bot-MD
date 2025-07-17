import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';

// --- Constantes y Configuración ---
const SIZE_LIMIT_MB = 100;
const MIN_AUDIO_SIZE_BYTES = 50000; // Umbral para audios corruptos
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏᴇ\'s 𝐒ervice';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = conn.getName(m.sender);

  // Limpiar argumentos
  args = args.filter(v => v?.trim());

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
      thumbnail: icons,
      sourceUrl: redes,
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *Hora de cazar, Proxy ${name}.* ¿Qué objetivo de audio o video rastreamos hoy?\n\nEjemplo:\n${usedPrefix}play Unusual Love - ZZZ`, m, { contextInfo });
  }

  const isMode = ["audio", "video"].includes(args[0].toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
  const isInputUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

  let search, video;
  try {
    search = await yts(queryOrUrl);
    video = search.videos?.[0];
  } catch (e) {
    return conn.reply(m.chat, `❌ Error buscando el objetivo. Intenta de nuevo.`, m, { contextInfo });
  }

  if (!video) {
    return conn.reply(m.chat, `🦈 *El objetivo se escabulló...* No pude localizar nada para: "${queryOrUrl}"`, m, { contextInfo });
  }

  if (isMode) {
    const mode = args[0].toLowerCase();
    await m.react("📥");

    const sendMediaFile = async (downloadUrl, title, currentMode, protocolo) => {
      try {
        if (currentMode === "audio" && protocolo === "API_PRINCIPAL") {
          const headRes = await axios.head(downloadUrl);
          const fileSize = parseInt(headRes.headers['content-length'] || "0");

          if (fileSize < MIN_AUDIO_SIZE_BYTES) {
            throw new Error('Audio de 0 segundos o corrupto detectado.');
          }

          await conn.sendMessage(m.chat, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
          }, { quoted: m });
          await m.react("🎧");
        } else {
          const mediaOptions = currentMode === 'audio'
            ? { audio: { url: downloadUrl }, mimetype: "audio/mpeg", fileName: `${title}.mp3` }
            : { video: { url: downloadUrl }, caption: `📹 *Presa capturada, ${name}.*\n⚙️ *Archivo:* ${title}`, fileName: `${title}.mp4`, mimetype: "video/mp4" };

          await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
          await m.react(currentMode === 'audio' ? "🎧" : "📽️");
        }
      } catch (error) {
        throw error;
      }
    };

    const urlToDownload = isInputUrl ? queryOrUrl : video.url;

    try {
      console.log("Protocolo 1: API Principal (vreden.my.id)");
      const endpoint = mode === "audio" ? "ytmp3" : "ytmp4";
      const dlApi = `https://api.vreden.my.id/api/${endpoint}?url=${encodeURIComponent(urlToDownload)}`;
      const res = await fetch(dlApi);
      const json = await res.json();

      if (json.status === 200 && json.result?.download?.url) {
        await sendMediaFile(json.result.download.url, json.result.metadata.title || video.title, mode, "API_PRINCIPAL");
        return;
      }
      throw new Error("API Principal falló.");
    } catch (e) {
      console.warn("Fallo protocolo API_PRINCIPAL:", e.message);

      try {
        console.log("Protocolo 2: ogmp3");
        const downloadResult = await ogmp3.download(urlToDownload, null, mode);

        if (downloadResult.status && downloadResult.result?.download) {
          await sendMediaFile(downloadResult.result.download, downloadResult.result.title, mode, "OGMP3");
          return;
        }
        throw new Error("ogmp3 falló.");
      } catch (e2) {
        console.error("Todos los protocolos fallaron:", e2.message);
        await conn.reply(m.chat, `🦈 *Misión Abortada, ${name}.* Todos los protocolos de extracción fallaron.`, m);
        await m.react("❌");
      }
    }
    return;
  }

  // --- Botones si aún no se seleccionó modo ---
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
handler.prefix = /^[./#]/; // Soporte para múltiples prefijos

export default handler;