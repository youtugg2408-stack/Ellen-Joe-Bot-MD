// Importa las librerías necesarias
import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// La clave se envía como un hash SHA256
const NEVI_API_KEY = 'ellen';
const NEVI_API_KEY_SHA256 = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');

const SIZE_LIMIT_MB = 100;
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ 𖥔 Sᥱrvice';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = conn.getName(m.sender);
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
      title: '🖤 ⏤͟͟͞͞𝙀𝙇𝙇𝙀𝙉 - 𝘽𝙊𝙏 ᨶ႒ᩚ',
      body: `✦ 𝙀𝙨𝙥𝙚𝙧𝙖𝙣𝙙𝙤 𝙩𝙪 𝙨𝙤𝙡𝙞𝙘𝙞𝙩𝙪𝙙, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
      thumbnail: icons, // Asume que 'icons' está definido en otro lugar
      sourceUrl: redes, // Asume que 'redes' está definido en otro lugar
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *¿᥎іᥒіs𝗍ᥱ ᥲ ⍴ᥱძіrmᥱ ᥲᥣg᥆ sіᥒ sᥲᑲᥱr 𝗊ᥙᥱ́?*
ძі ᥣ᥆ 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs... ᥆ ᥎ᥱ𝗍ᥱ.

🎧 ᥱȷᥱm⍴ᥣ᥆:
${usedPrefix}play moonlight - kali uchis`, m, { contextInfo });
  }

  const isMode = ["audio", "video"].includes(args[0].toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
  const isInputUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

  let video;

  if (isMode && isInputUrl) {
    video = { url: queryOrUrl };
    await m.react("📥");

    const mode = args[0].toLowerCase();

    // Función principal para manejar la descarga de la API de NEVI
    const handleNeviApiDownload = async () => {
      let videoInfo;
      try { videoInfo = await yts.getInfo(queryOrUrl); } 
      catch { videoInfo = { title: 'Archivo de YouTube' }; }

      const neviApiUrl = `http://neviapi.ddns.net:8000/youtube`;
      const format = mode === "audio" ? "mp3" : "mp4";
      const neviHeaders = { 'Content-Type': 'application/json', 'X-Auth-Sha256': NEVI_API_KEY_SHA256 };

      const res = await fetch(neviApiUrl, {
        method: 'POST',
        headers: neviHeaders,
        body: JSON.stringify({ url: queryOrUrl, format }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok || !json.download_url) {
        throw new Error(`NEVI API... derrumbada. Estado: ${json.ok ? 'OK, pero sin URL de descarga' : 'Fallido'}`);
      }

      const fileId = json.id;
      const downloadUrl = `http://neviapi.ddns.net:8000${json.download_url}`;
      const title = json.info.title || videoInfo.title;
      const safeTitle = title.replace(/[\/\\?%*:|"<>]/g, '-');
      const isAudio = mode === 'audio';
      const mediaMimetype = isAudio ? 'audio/mpeg' : 'video/mp4';
      const fileName = `${safeTitle}.${isAudio ? 'mp3' : 'mp4'}`;

      // HEAD para obtener tamaño
      let fileSizeMb;
      try {
        const headResponse = await fetch(downloadUrl, { method: "HEAD", headers: neviHeaders });
        if (!headResponse.ok) throw new Error(`HEAD error ${headResponse.status}`);
        const contentLength = headResponse.headers.get("content-length");
        fileSizeMb = contentLength / (1024 * 1024);
      } catch {
        fileSizeMb = 0;
      }

      const mediaOptions = { quoted: m, headers: neviHeaders };

      if (fileSizeMb > SIZE_LIMIT_MB) {
        mediaOptions.document = { url: downloadUrl };
        mediaOptions.fileName = fileName;
        mediaOptions.mimetype = mediaMimetype;
        mediaOptions.caption = `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), lo envío como documento. Puede tardar más en descargar.*
🖤 *Título:* ${title}`;
        await conn.sendMessage(m.chat, mediaOptions);
        await m.react("📄");
      } else {
        if (isAudio) {
          mediaOptions.audio = { url: downloadUrl };
          mediaOptions.mimetype = mediaMimetype;
          mediaOptions.fileName = fileName;
        } else {
          mediaOptions.video = { url: downloadUrl };
          mediaOptions.caption = `🎬 *Listo.* 🖤 *Título:* ${title}`;
          mediaOptions.fileName = fileName;
          mediaOptions.mimetype = mediaMimetype;
        }
        await conn.sendMessage(m.chat, mediaOptions);
        await m.react(isAudio ? "🎧" : "📽️");
      }

      // DONE
      try {
        await fetch(`http://neviapi.ddns.net:8000/done/${fileId}`, { method: "POST", headers: neviHeaders });
      } catch (doneError) { console.error("Error al notificar DONE:", doneError); }
    };

    try {
      await handleNeviApiDownload();
      return;
    } catch (apiError) {
      await conn.reply(m.chat, `⚠️ *¡Error de Debug!*\n*NEVI API falló.* Razón: ${apiError.message}`, m);

      // Fallback con ogmp3
      try {
        const tmpDir = path.join(process.cwd(), './tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tempFilePath = path.join(tmpDir, `${Date.now()}_${mode}.tmp`);

        await m.react("🔃"); 
        const downloadResult = await ogmp3.download(queryOrUrl, tempFilePath, mode);

        if (downloadResult.status && fs.existsSync(tempFilePath)) {
          const stats = fs.statSync(tempFilePath);
          const fileSizeMb = stats.size / (1024 * 1024);
          const fileBuffer = fs.readFileSync(tempFilePath);

          let mediaOptions;
          if (fileSizeMb > SIZE_LIMIT_MB) {
            mediaOptions = {
              document: fileBuffer,
              fileName: `${downloadResult.result.title}.${mode === 'audio' ? 'mp3' : 'mp4'}`,
              mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
              caption: `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), lo envío como documento.*`
            };
            await m.react("📄");
          } else {
            mediaOptions = mode === 'audio'
              ? { audio: fileBuffer, mimetype: 'audio/mpeg', fileName: `${downloadResult.result.title}.mp3` }
              : { video: fileBuffer, caption: `🎬 *Listo.*`, fileName: `${downloadResult.result.title}.mp4`, mimetype: 'video/mp4' };
            await m.react(mode === 'audio' ? "🎧" : "📽️");
          }

          await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
          fs.unlinkSync(tempFilePath);
          return;
        }
        throw new Error("ogmp3 no pudo descargar el archivo.");
      } catch (e2) {
        console.error("Error con ogmp3:", e2);
        await conn.reply(m.chat, `💔 *fallé. pero tú más.*\nno pude traerte nada.`, m);
        await m.react("❌");
      }
    }
    return;
  }

  // Lógica de búsqueda si no hay modo especificado
  if (isInputUrl) {
    try {
      const info = await yts.getInfo(queryOrUrl);
      video = {
        title: info.title,
        timestamp: info.timestamp,
        views: info.views,
        author: { name: info.author.name },
        ago: info.ago,
        url: info.url,
        thumbnail: info.thumbnail
      };
    } catch {
      return conn.reply(m.chat, `💔 *Fallé al procesar la URL.*`, m, { contextInfo });
    }
  } else {
    try {
      const searchResult = await yts(queryOrUrl);
      video = searchResult.videos?.[0];
    } catch {
      return conn.reply(m.chat, `🖤 *qué patético...* no logré encontrar nada con lo que pediste`, m, { contextInfo });
    }
  }

  if (!video) return conn.reply(m.chat, `🦈 *nada encontrado con "${queryOrUrl}"*`, m, { contextInfo });

  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 }
  ];

  const caption = `🎧 *Título:* ${video.title}\n⏱ *Duración:* ${video.timestamp}\n👀 *Vistas:* ${video.views.toLocaleString()}\n👤 *Subido por:* ${video.author.name}\n🔗 *URL:* ${video.url}`;

  await conn.sendMessage(m.chat, {
    image: { url: video.thumbnail },
    caption,
    footer: 'Dime cómo lo quieres...',
    buttons,
    headerType: 4,
    contextInfo
  }, { quoted: m });
};

handler.help = ['play'].map(v => v + ' <búsqueda o URL>');
handler.tags = ['descargas'];
handler.command = ['play'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;