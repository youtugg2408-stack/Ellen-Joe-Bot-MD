import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ 𖥔 Sᥱrvice';

// API de NeviAPI
const NEVI_API_URL = 'http://neviapi.ddns.net:8000';
// Clave SHA256 ya válida
const NEVI_API_KEY = '7975b4132aaa77d75069a5d2ab3c501413eb91d11d046815158103d5628d7405';

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
      body: `✦ 𝙀sᴘᴇʀᴀɴᴅᴏ ᴛᴜ sᴏʟɪᴄɪᴛᴜᴅ, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
      thumbnail: icons, // definido globalmente
      sourceUrl: redes,  // definido globalmente
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *¿Qué quieres buscar o descargar?*\nEjemplo:\n${usedPrefix}play moonlight - kali uchis`, m, { contextInfo });
  }

  const isMode = ["audio", "video"].includes(args[0].toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
  const isInputUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

  let video;

  // DESCARGA DIRECTA CON API
  if (isMode && isInputUrl) {
    await m.react("📥");
    const mode = args[0].toLowerCase();
    try {
      const apiFormat = mode === 'audio' ? 'mp3' : 'mp4';
      const downloadApiUrl = `${NEVI_API_URL}/download?url=${encodeURIComponent(queryOrUrl)}&format=${apiFormat}`;

      const response = await fetch(downloadApiUrl);
      const json = await response.json();

      if (!json.download_url) throw new Error('No se pudo obtener el enlace de descarga.');

      const finalDownloadUrl = `${json.download_url}${NEVI_API_KEY}`;
      const title = json.title || 'Archivo de YouTube';

      const mediaOptions = mode === 'audio'
        ? { audio: { url: finalDownloadUrl }, mimetype: "audio/mpeg", fileName: `${title}.mp3` }
        : { video: { url: finalDownloadUrl }, caption: `🎬 *Listo.*\n🖤 *Título:* ${title}`, fileName: `${title}.mp4`, mimetype: "video/mp4" };

      await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
      await m.react(mode === 'audio' ? "🎧" : "📽️");
      return;
    } catch (e) {
      console.error("Error con NeviAPI:", e);
      await conn.reply(m.chat, `⚠️ *¡Error con la API principal!*\nIntentaré con método alternativo...`, m);
    }
  }

  // BÚSQUEDA YTSEARCH
  try {
    if (isInputUrl) {
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
    } else {
      const searchResult = await yts(queryOrUrl);
      video = searchResult.videos?.[0];
    }
  } catch (e) {
    console.error("Error buscando en YouTube:", e);
    return conn.reply(m.chat, `💔 No encontré resultados para "${queryOrUrl}"`, m, { contextInfo });
  }

  if (!video) return conn.reply(m.chat, `🦈 No encontré nada para "${queryOrUrl}"`, m, { contextInfo });

  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 AUDIO' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 VIDEO' }, type: 1 }
  ];

  const caption = `
🎧 *${video.title}*

> ⏱️ Duración: ${video.timestamp}
> 👀 Vistas: ${video.views.toLocaleString()}
> 👤 Subido por: ${video.author.name}
> 📅 Hace: ${video.ago}
> 🔗 URL: ${video.url}
`;

  await conn.sendMessage(m.chat, {
    image: { url: video.thumbnail },
    caption,
    footer: 'Dime cómo lo quieres.',
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