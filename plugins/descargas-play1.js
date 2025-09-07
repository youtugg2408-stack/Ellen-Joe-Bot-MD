import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';
import path from 'path';
import fs from 'fs';

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
    forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
    externalAdReply: {
      title: '🖤 ⏤͟͟͞͞𝙀𝙇𝙇𝙀𝙉 - 𝘽𝙊𝙏 ᨶ႒ᩚ',
      body: `✦ Esperando tu solicitud, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
      thumbnail: icons,
      sourceUrl: redes,
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) return conn.reply(m.chat, `🦈 Usa:\n${usedPrefix}play <nombre o url>`, m, { contextInfo });

  const isMode = ["audio", "video"].includes(args[0].toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
  const isInputUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

  if (isMode && isInputUrl) {
    await m.react("📥");
    const modeArg = args[0].toLowerCase();
    const NEVI_API_URL = 'http://neviapi.ddns.net:5000';

    try {
      // 🔹 Llamada a la API
      const res = await fetch(`${NEVI_API_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': NEVI_API_KEY },
        body: JSON.stringify({ url: queryOrUrl, format: modeArg === "audio" ? "mp3" : "mp4" })
      });
      const json = await res.json();

      if (json.status !== "success") throw new Error(json.message || "Error al descargar");

      // 🔹 Descargar archivo desde download_link
      const response = await axios({ url: json.download_link, method: 'GET', responseType: 'arraybuffer', headers: { 'X-API-KEY': NEVI_API_KEY } });
      const fileBuffer = response.data;
      const fileSizeMb = fileBuffer.length / (1024 * 1024);
      const format = json.download_filename.endsWith(".mp3") ? "mp3" : "mp4";

      if (fileSizeMb > SIZE_LIMIT_MB) {
        await conn.sendMessage(m.chat, {
          document: fileBuffer,
          fileName: json.download_filename,
          mimetype: format === "mp3" ? "audio/mpeg" : "video/mp4",
          caption: `⚠️ *Archivo grande (${fileSizeMb.toFixed(2)} MB), se envía como documento.*`
        }, { quoted: m });
        await m.react("📄");
      } else {
        const mediaOptions = format === "mp3"
          ? { audio: fileBuffer, mimetype: "audio/mpeg", fileName: json.download_filename }
          : { video: fileBuffer, caption: `🎬 *Listo.*\n🖤 *Título:* ${json.title}`, fileName: json.download_filename, mimetype: "video/mp4" };

        await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
        await m.react(format === "mp3" ? "🎧" : "📽️");
      }

      return;

    } catch (e) {
      console.error("Error API:", e);
      await conn.reply(m.chat, `💔 Falló la descarga desde la API. Intentando con respaldo...`, m);

      // 🔹 Respaldo con ogmp3
      try {
        const tempFilePath = path.join(process.cwd(), './tmp', `${Date.now()}.${isMode === "audio" ? "mp3" : "mp4"}`);
        await m.react("🔃");
        const downloadResult = await ogmp3.download(queryOrUrl, tempFilePath, isMode);

        if (downloadResult.status && fs.existsSync(tempFilePath)) {
          const fileBuffer = fs.readFileSync(tempFilePath);
          const fileSizeMb = fileBuffer.length / (1024 * 1024);
          const format = isMode === "audio" ? "mp3" : "mp4";

          const mediaOptions = fileSizeMb > SIZE_LIMIT_MB
            ? { document: fileBuffer, fileName: downloadResult.result.title + `.${format}`, mimetype: format === "mp3" ? "audio/mpeg" : "video/mp4", caption: `⚠️ Archivo grande (${fileSizeMb.toFixed(2)} MB)` }
            : isMode === "audio"
              ? { audio: fileBuffer, mimetype: "audio/mpeg", fileName: downloadResult.result.title + ".mp3" }
              : { video: fileBuffer, caption: `🎬 *Listo.* 🖤 *Título:* ${downloadResult.result.title}`, fileName: downloadResult.result.title + ".mp4", mimetype: "video/mp4" };

          await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
          await m.react(format === "mp3" ? "🎧" : "📽️");
          fs.unlinkSync(tempFilePath);
        }
      } catch (e2) {
        console.error("Respaldo ogmp3 falló:", e2);
        await conn.reply(m.chat, `❌ No se pudo descargar nada.`, m);
        await m.react("❌");
      }

      return;
    }
  }

  // 🔍 Búsqueda si no se especifica modo o URL
  const searchResult = await yts(queryOrUrl);
  video = searchResult.videos?.[0];
  if (!video) return conn.reply(m.chat, `🦈 No encontré nada con: "${queryOrUrl}"`, m, { contextInfo });

  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 AUDIO' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 VIDEO' }, type: 1 }
  ];

  const caption = `
🎧 *Ellen BOT — PLAY*
> Título: ${video.title}
> Duración: ${video.timestamp}
> Vistas: ${video.views.toLocaleString()}
> Canal: ${video.author.name}
> Hace: ${video.ago}
> URL: ${video.url}
`.trim();

  await conn.sendMessage(m.chat, { image: { url: video.thumbnail }, caption, footer: 'Elige cómo lo quieres', buttons, headerType: 4, contextInfo }, { quoted: m });
};

handler.help = ['play <texto|url>'];
handler.tags = ['descargas'];
handler.command = ['play'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;