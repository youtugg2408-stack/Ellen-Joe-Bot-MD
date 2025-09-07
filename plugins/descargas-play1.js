// ================================
// ⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ — Service
// Handler con API Nevi + respaldo ogmp3
// ================================

import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// ================================
// 🔑 Configuración de API
// ================================
const NEVI_API_KEY = 'ellen';
const NEVI_API_URL = 'http://neviapi.ddns.net:5000';
const SIZE_LIMIT_MB = 100;

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ 𖥔 Sᥱrvice';

// 📂 Carpeta temporal
const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// ================================
// ⚙️ Handler principal
// ================================
let handler = async (m, { conn, text, args, usedPrefix, command }) => {
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
      thumbnail: icons, // <- define esto en tu settings.js
      sourceUrl: redes, // <- define esto en tu settings.js
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!text) {
    return conn.reply(m.chat, `🦈 *¿᥎іᥒіs𝗍ᥱ ᥲ ⍴ᥱძіrmᥱ ᥲᥣg᥆ sіᥒ sᥲᑲᥱr 𝗊ᥙᥱ́?*
ძі ᥣ᥆ 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs... ᥆ ᥎ᥱ𝗍ᥱ.

🎧 ᥱȷᥱm⍴ᥣ᥆:
${usedPrefix}play moonlight - kali uchis`, m, { contextInfo });
  }

  // Si es link directo
  const isMode = ["audio", "video"].includes(args[0]?.toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
  const isInputUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

  let video;

  if (isMode && isInputUrl) {
    await m.react("📥");
    const mode = args[0].toLowerCase();

    try {
      // ================================
      // 📡 Petición a la API Nevi
      // ================================
      const res = await fetch(`${NEVI_API_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': NEVI_API_KEY
        },
        body: JSON.stringify({ url: queryOrUrl, type: mode })
      });

      const json = await res.json();
      await conn.reply(m.chat, `📡 *Respuesta API:*\n\n${JSON.stringify(json, null, 2)}`, m);

      if (!json.ok || !json.filename) throw new Error("La API no devolvió archivo válido");

      // 📥 Descarga temporal
      const fileUrl = json.filename.startsWith('http')
        ? json.filename
        : `${NEVI_API_URL}${json.filename}`;

      const tmpFilePath = path.join(TMP_DIR, `${Date.now()}_${mode}.tmp`);
      const fileRes = await fetch(fileUrl, { headers: { 'X-API-KEY': NEVI_API_KEY_SHA256 } });

      if (!fileRes.ok) throw new Error(`Error al descargar archivo: ${fileRes.status}`);
      const destStream = fs.createWriteStream(tmpFilePath);
      await new Promise((resolve, reject) => {
        fileRes.body.pipe(destStream);
        fileRes.body.on("error", reject);
        destStream.on("finish", resolve);
      });

      // 📤 Envío
      const stats = fs.statSync(tmpFilePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (mode === "audio") {
        await conn.sendMessage(m.chat, {
          audio: fs.createReadStream(tmpFilePath),
          mimetype: "audio/mpeg",
          fileName: `${Date.now()}.mp3`,
          caption: `🎧 *Listo.*\n🖤 *Tamaño:* ${fileSizeMB.toFixed(2)} MB`
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          video: fs.createReadStream(tmpFilePath),
          mimetype: "video/mp4",
          fileName: `${Date.now()}.mp4`,
          caption: `🎬 *Listo.*\n🖤 *Tamaño:* ${fileSizeMB.toFixed(2)} MB`
        }, { quoted: m });
      }

      fs.unlinkSync(tmpFilePath);
      await m.react("✅");

    } catch (err) {
      console.error("❌ Error:", err);
      await conn.reply(m.chat, `💔 *Fallé al complacerte.*\nIntentando con respaldo...`, m);

      // ================================
      // 🔄 Respaldo con ogmp3
      // ================================
      try {
        const result = await ogmp3(queryOrUrl);
        if (!result?.audio) throw new Error("ogmp3 no devolvió audio.");

        const tmpFilePath = path.join(TMP_DIR, `${Date.now()}_backup.mp3`);
        const res = await fetch(result.audio);
        const dest = fs.createWriteStream(tmpFilePath);
        await new Promise((resolve, reject) => {
          res.body.pipe(dest);
          res.body.on("error", reject);
          dest.on("finish", resolve);
        });

        await conn.sendMessage(m.chat, {
          audio: fs.createReadStream(tmpFilePath),
          mimetype: "audio/mpeg",
          fileName: `${Date.now()}_backup.mp3`,
          caption: `🎵 *Respaldo (ogmp3)*`
        }, { quoted: m });

        fs.unlinkSync(tmpFilePath);
        await m.react("🔄");
      } catch (backupErr) {
        console.error("Error en ogmp3:", backupErr);
        await conn.reply(m.chat, `💔 *fallé. pero tú más.*\nno pude traerte nada.`, m);
        await m.react("❌");
      }
    }
    return;
  }

  // ================================
  // 🔍 Búsqueda cuando no hay modo
  // ================================
  const searchResult = await yts(queryOrUrl);
  video = searchResult.videos?.[0];
  if (!video) {
    return conn.reply(m.chat, `🦈 *esta cosa murió antes de empezar.*\nNada encontrado con "${queryOrUrl}"`, m, { contextInfo });
  }

  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 }
  ];

  const caption = `
₊‧꒰ 🎧꒱ 𝙀𝙇𝙇𝙀𝙉 𝙅𝙊𝙀 𝘽𝙊𝙏 — 𝙋𝙇𝘼𝙔 ✧˖°
> 🎧 *Título:* ${video.title}
> ⏱️ *Duración:* ${video.timestamp}
> 👀 *Vistas:* ${video.views.toLocaleString()}
> 👤 *Canal:* ${video.author.name}
> 📅 *Hace:* ${video.ago}
> 🔗 *URL:* ${video.url}`;

  await conn.sendMessage(m.chat, {
    image: { url: video.thumbnail },
    caption,
    footer: 'Dime cómo lo quieres... o no digas nada ┐(￣ー￣)┌.',
    buttons,
    headerType: 4,
    contextInfo
  }, { quoted: m });
};

// ================================
// 📌 Configuración del comando
// ================================
handler.help = ['play <texto|url>'];
handler.tags = ['downloader'];
handler.command = ['play', 'ytplay', 'ytmp3', 'ytmp4'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;