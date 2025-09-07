import fetch from "node-fetch";
import yts from "yt-search";
import axios from "axios";
import path from "path";
import fs from "fs";

// 🔑 Clave API
const NEVI_API_KEY = 'ellen';
const SIZE_LIMIT_MB = 100;
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ 𖥔 Sᥱrvice';

const handler = async (m, { conn, args, usedPrefix }) => {
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
      body: `✦ Esperando tu solicitud, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
      thumbnail: icons, // definido fuera
      sourceUrl: redes, // definido fuera
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *Escribe lo que quieres buscar.*\nEjemplo:\n${usedPrefix}play moonlight - kali uchis`, m, { contextInfo });
  }

  const query = args.join(" ");
  const searchResult = await yts(query);
  const video = searchResult.videos?.[0];

  if (!video) {
    return conn.reply(m.chat, `🦈 *No encontré nada para:* "${query}"`, m, { contextInfo });
  }

  // Botones para elegir descargar Audio o Video
  const buttons = [
    { buttonId: `${usedPrefix}getaudio ${video.url}`, buttonText: { displayText: '🎧 Audio' }, type: 1 },
    { buttonId: `${usedPrefix}getvideo ${video.url}`, buttonText: { displayText: '🎬 Video' }, type: 1 }
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
    footer: 'Selecciona cómo quieres descargarlo ┐(￣ー￣)┌',
    buttons,
    headerType: 4,
    contextInfo
  }, { quoted: m });
};

// ================================
// Handler para descargar audio
// ================================
export const getaudioHandler = async (m, { conn, args }) => {
  if (!args[0]) return conn.reply(m.chat, '⚠️ Necesitas dar la URL del video.', m);

  const videoUrl = args[0];
  const format = 'mp3';
  const NEVI_API_URL = 'http://neviapi.ddns.net:5000';

  try {
    await m.react('📥');

    const res = await fetch(`${NEVI_API_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': NEVI_API_KEY },
      body: JSON.stringify({ url: videoUrl, format })
    });

    const json = await res.json();

    if (json.status !== "success") throw new Error(json.message || 'Fallo en la descarga');

    const fileRes = await axios.get(json.download_link, { responseType: 'arraybuffer', headers: { 'X-API-KEY': NEVI_API_KEY } });
    const fileBuffer = fileRes.data;
    const fileSizeMb = fileBuffer.length / (1024 * 1024);

    if (fileSizeMb > SIZE_LIMIT_MB) {
      await conn.sendMessage(m.chat, {
        document: fileBuffer,
        fileName: `${json.title}.${format}`,
        mimetype: 'audio/mpeg',
        caption: `⚠️ *Archivo grande (${fileSizeMb.toFixed(2)} MB), enviado como documento.*`
      }, { quoted: m });
      await m.react("📄");
    } else {
      await conn.sendMessage(m.chat, {
        audio: fileBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${json.title}.mp3`
      }, { quoted: m });
      await m.react("🎧");
    }

  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, `❌ Error al descargar audio: ${e.message}`, m);
    await m.react("❌");
  }
};

// ================================
// Handler para descargar video
// ================================
export const getvideoHandler = async (m, { conn, args }) => {
  if (!args[0]) return conn.reply(m.chat, '⚠️ Necesitas dar la URL del video.', m);

  const videoUrl = args[0];
  const format = 'mp4';
  const NEVI_API_URL = 'http://neviapi.ddns.net:5000';

  try {
    await m.react('📥');

    const res = await fetch(`${NEVI_API_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': NEVI_API_KEY },
      body: JSON.stringify({ url: videoUrl, format })
    });

    const json = await res.json();

    if (json.status !== "success") throw new Error(json.message || 'Fallo en la descarga');

    const fileRes = await axios.get(json.download_link, { responseType: 'arraybuffer', headers: { 'X-API-KEY': NEVI_API_KEY } });
    const fileBuffer = fileRes.data;
    const fileSizeMb = fileBuffer.length / (1024 * 1024);

    if (fileSizeMb > SIZE_LIMIT_MB) {
      await conn.sendMessage(m.chat, {
        document: fileBuffer,
        fileName: `${json.title}.${format}`,
        mimetype: 'video/mp4',
        caption: `⚠️ *Archivo grande (${fileSizeMb.toFixed(2)} MB), enviado como documento.*`
      }, { quoted: m });
      await m.react("📄");
    } else {
      await conn.sendMessage(m.chat, {
        video: fileBuffer,
        caption: `🎬 *Listo.* 🖤 *Título:* ${json.title}`,
        fileName: `${json.title}.mp4`,
        mimetype: 'video/mp4'
      }, { quoted: m });
      await m.react("📽️");
    }

  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, `❌ Error al descargar video: ${e.message}`, m);
    await m.react("❌");
  }
};

// Export principal (búsqueda)
handler.help = ['play'].map(v => v + ' <búsqueda>');
handler.tags = ['descargas'];
handler.command = ['play'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;