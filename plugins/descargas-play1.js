// Importa las librerías necesarias
import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';
import path from 'path';
import fs from 'fs';

// 🔑 Clave API (no en SHA256, se manda directo)
const NEVI_API_KEY = 'ellen';

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
      thumbnail: icons, // definido fuera
      sourceUrl: redes, // definido fuera
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

  // ================================
  // 📥 Descarga directa (si hay url y modo)
  // ================================
  if (isMode && isInputUrl) {
    await m.react("📥");
    const modeArg = args[0].toLowerCase();
    const format = modeArg === "audio" ? "mp3" : "mp4";

    const NEVI_API_URL = 'http://neviapi.ddns.net:5000';
    let neviDownloadId = null;

    try {
      // 📡 Petición a la API
      const res = await fetch(`${NEVI_API_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': NEVI_API_KEY
        },
        body: JSON.stringify({
          url: queryOrUrl,
          format
        }),
      });

      const json = await res.json();
      await conn.reply(m.chat, `📡 *Respuesta API:*\n\n${JSON.stringify(json, null, 2)}`, m);

      if (json.status === "success" && json.filename && json.title) {
        const fileUrl = `${NEVI_API_URL}${json.filename}`;

        // Descargar el archivo
        const response = await axios({
          url: fileUrl,
          method: 'GET',
          responseType: 'arraybuffer',
          headers: { 'X-API-KEY': NEVI_API_KEY }
        });

        const fileBuffer = response.data;
        const fileSizeMb = fileBuffer.length / (1024 * 1024);

        if (fileSizeMb > SIZE_LIMIT_MB) {
          await conn.sendMessage(m.chat, {
            document: fileBuffer,
            fileName: `${json.title}.${format}`,
            mimetype: format === "mp3" ? "audio/mpeg" : "video/mp4",
            caption: `⚠️ *El archivo pesa ${fileSizeMb.toFixed(2)} MB, lo envío como documento.*`
          }, { quoted: m });
          await m.react("📄");
        } else {
          const mediaOptions = format === "mp3"
            ? { audio: fileBuffer, mimetype: "audio/mpeg", fileName: `${json.title}.mp3` }
            : { video: fileBuffer, caption: `🎬 *Listo.*\n🖤 *Título:* ${json.title}`, fileName: `${json.title}.mp4`, mimetype: "video/mp4" };

          await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
          await m.react(format === "mp3" ? "🎧" : "📽️");
        }
        return;
      }

      throw new Error(`API falló: ${json.message || "No se devolvió un archivo válido"}`);

    } catch (e) {
      console.error("Error con la API:", e);

      await conn.reply(m.chat, `💔 *Fallé al usar la API.*
Intentando con servicio de respaldo...`, m);

      try {
        // Respaldo con ogmp3
        const tempFilePath = path.join(process.cwd(), './tmp', `${Date.now()}.${format}`);
        await m.react("🔃");
        const downloadResult = await ogmp3.download(queryOrUrl, tempFilePath, modeArg);

        if (downloadResult.status && fs.existsSync(tempFilePath)) {
          const stats = fs.statSync(tempFilePath);
          const fileSizeMb = stats.size / (1024 * 1024);
          const fileBuffer = fs.readFileSync(tempFilePath);

          if (fileSizeMb > SIZE_LIMIT_MB) {
            await conn.sendMessage(m.chat, {
              document: fileBuffer,
              fileName: `${downloadResult.result.title}.${format}`,
              mimetype: format === "mp3" ? "audio/mpeg" : "video/mp4",
              caption: `⚠️ *El archivo pesa ${fileSizeMb.toFixed(2)} MB, lo envío como documento.*`
            }, { quoted: m });
            await m.react("📄");
          } else {
            const mediaOptions = format === "mp3"
              ? { audio: fileBuffer, mimetype: "audio/mpeg", fileName: `${downloadResult.result.title}.mp3` }
              : { video: fileBuffer, caption: `🎬 *Listo.* 🖤 *Título:* ${downloadResult.result.title}`, fileName: `${downloadResult.result.title}.mp4`, mimetype: "video/mp4" };

            await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
            await m.react(format === "mp3" ? "🎧" : "📽️");
          }

          fs.unlinkSync(tempFilePath);
          return;
        }
        throw new Error("ogmp3 no pudo descargar el archivo.");

      } catch (e2) {
        console.error("Error con ogmp3:", e2);
        await conn.reply(m.chat, `❌ *No pude traerte nada.*`, m);
        await m.react("❌");
      }
    }
    return;
  }

  // ================================
  // 🔍 Búsqueda si no se especifica url
  // ================================
  const searchResult = await yts(queryOrUrl);
  video = searchResult.videos?.[0];

  if (!video) {
    return conn.reply(m.chat, `🦈 *nada encontrado con:* "${queryOrUrl}"`, m, { contextInfo });
  }

  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 }
  ];

  const caption = `
₊‧꒰ 🎧꒱ 𝙀𝙇𝙇𝙀𝙉 𝙅𝙊𝙀 𝘽𝙊𝙏 — 𝙋𝙇𝘼𝙔 ✧˖°
> 🎶 *Título:* ${video.title}
> ⏱️ *Duración:* ${video.timestamp}
> 👀 *Vistas:* ${video.views.toLocaleString()}
> 👤 *Canal:* ${video.author.name}
> 📅 *Hace:* ${video.ago}
> 🔗 *URL:* ${video.url}
`;

  await conn.sendMessage(m.chat, {
    image: { url: video.thumbnail },
    caption,
    footer: 'Dime cómo lo quieres... ┐(￣ー￣)┌',
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