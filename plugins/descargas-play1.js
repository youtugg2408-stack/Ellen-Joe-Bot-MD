import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ 𖥔 Sᥱrvice';

// API de NeviAPI
const NEVI_API_URL = 'http://neviapi.ddns.net:8000';
// Clave SHA256
const NEVI_API_KEY = '7975b4132aaa77d75069a5d2ab3c501413eb91d11d046815158103d5628d7405';

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
      body: `✦ 𝙀sᴘᴇʀᴀɴᴅᴏ ᴛᴜ sᴏʟɪᴄɪᴛᴜᴅ, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
      thumbnail: icons, // definido globalmente
      sourceUrl: redes,  // definido globalmente
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

  // Si pide audio/video + URL → descarga directo
  if (isMode && isInputUrl) {
    await m.react("📥");
    const mode = args[0].toLowerCase();

    // --- DESCARGA CON NEVIAPI ---
    try {
      const apiFormat = mode === 'audio' ? 'mp3' : 'mp4';
      const downloadApiUrl = `${NEVI_API_URL}/download?url=${encodeURIComponent(queryOrUrl)}&format=${apiFormat}`;

      const response = await fetch(downloadApiUrl);
      const json = await response.json();

      if (response.status !== 200 || !json.download_url) {
        throw new Error(`Error en la API: ${json.detail || 'No se pudo obtener el enlace de descarga.'}`);
      }

      // API devuelve "...?pas=" → aquí le añadimos la clave SHA256
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
      await conn.reply(m.chat, `⚠️ *¡Error de conexión!*
No pude contactar a la API principal.
Razón: *${e.message}*
Intentaré con un método alternativo...`, m);

      // --- RESPALDO OGMP3 ---
      try {
        const audio = await ogmp3(queryOrUrl);
        const title = audio.title || 'Archivo de YouTube';

        if (mode === 'audio' && audio.buffer) {
          await conn.sendMessage(m.chat, { audio: audio.buffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: m });
          await m.react("🎧");
        } else if (mode === 'video' && audio.buffer) {
          await conn.sendMessage(m.chat, { video: audio.buffer, caption: `🎬 *Listo.*\n🖤 *Título:* ${title}`, fileName: `${title}.mp4`, mimetype: "video/mp4" }, { quoted: m });
          await m.react("📽️");
        } else {
          throw new Error('No se pudo obtener el archivo del video/audio.');
        }
        return;
      } catch (err) {
        console.error("Error con ogmp3:", err);
        await conn.reply(m.chat, `💔 *Fallé por completo.*\nAmbos métodos fallaron. Intenta más tarde.`, m);
        await m.react("❌");
      }
    }
    return;
  }

  // --- BÚSQUEDA YOUTUBE ---
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
    } catch (e) {
      console.error("Error al obtener info de la URL:", e);
      return conn.reply(m.chat, `💔 *Fallé al procesar la URL.*`, m, { contextInfo });
    }
  } else {
    try {
      const searchResult = await yts(queryOrUrl);
      video = searchResult.videos?.[0];
    } catch (e) {
      console.error("Error durante la búsqueda en Youtube:", e);
      return conn.reply(m.chat, `🖤 *qué patético...* no encontré nada`, m, { contextInfo });
    }
  }

  if (!video) {
    return conn.reply(m.chat, `🦈 *esta cosa murió antes de empezar.* nada encontrado con "${queryOrUrl}"`, m, { contextInfo });
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
> 👤 *Subido por:* ${video.author.name}
> 📅 *Hace:* ${video.ago}
> 🔗 *URL:* ${video.url}
`;

  await conn.sendMessage(m.chat, {
    image: { url: video.thumbnail },
    caption,
    footer: 'Dime cómo lo quieres... ┐(￣ー￣)┌.',
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