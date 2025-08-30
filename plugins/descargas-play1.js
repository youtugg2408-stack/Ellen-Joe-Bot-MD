// Importa las librerías necesarias
import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';

// La clave se envía como un hash SHA256
const NEVI_API_KEY = 'ellen';
const NEVI_API_KEY_SHA256 = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');

const SIZE_LIMIT_MB = 100;
const MIN_AUDIO_SIZE_BYTES = 50000;
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
      // 1. Obtener los metadatos de YouTube para el título y otros datos
      let videoInfo;
      try {
        videoInfo = await yts.getInfo(queryOrUrl);
      } catch (e) {
        console.error("Error al obtener info de la URL:", e);
        videoInfo = { title: 'Archivo de YouTube' };
      }
      
      // 2. Hacer la petición a la API de NEVI para generar el archivo
      const neviApiUrl = `http://neviapi.ddns.net:8000/youtube`;
      const format = mode === "audio" ? "mp3" : "mp4";
      const neviHeaders = { 'Content-Type': 'application/json', 'X-Auth-Sha256': NEVI_API_KEY_SHA256 };

      const res = await fetch(neviApiUrl, {
        method: 'POST',
        headers: neviHeaders,
        body: JSON.stringify({ url: queryOrUrl, format: format }),
      });

      // --- Sección de depuración de la respuesta de la API ---
      console.log('--- Respuesta de la API de NEVI ---');
      console.log('Status:', res.status);
      console.log('Status Text:', res.statusText);
      const json = await res.json();
      console.log('Body:', json);
      console.log('------------------------------------');
      // --- Fin de la sección de depuración ---

      if (!res.ok || !json.ok || !json.download_url) {
        throw new Error(`NEVI API... derrumbada. Estado: ${json.ok ? 'OK, pero sin URL de descarga' : 'Fallido'}`);
      }
      
      const fileId = json.id;
      const downloadUrl = `http://neviapi.ddns.net:8000${json.download_url}`;
      const title = json.info.title || videoInfo.title;

      // 3. Petición HEAD para obtener el tamaño del archivo
      let fileSizeMb;
      try {
        const headResponse = await axios.head(downloadUrl, { headers: neviHeaders });
        const contentLength = headResponse.headers['content-length'];
        fileSizeMb = contentLength / (1024 * 1024);
      } catch (headError) {
        console.error("Error en la petición HEAD:", headError);
        throw new Error("No se pudo obtener el tamaño del archivo. Intentando con la lógica de respaldo.");
      }

      const isAudio = mode === 'audio';
      const mediaMimetype = isAudio ? 'audio/mpeg' : 'video/mp4';
      const fileName = `${title}.${isAudio ? 'mp3' : 'mp4'}`;
      
      // 4. Petición GET para descargar el archivo
      const mediaOptions = {
        quoted: m,
        headers: neviHeaders
      };

      if (fileSizeMb > SIZE_LIMIT_MB) {
        // Enviar como documento si es demasiado grande
        mediaOptions.document = { url: downloadUrl };
        mediaOptions.fileName = fileName;
        mediaOptions.mimetype = mediaMimetype;
        mediaOptions.caption = `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), lo envío como documento. Puede tardar más en descargar.*
🖤 *Título:* ${title}`;
        await conn.sendMessage(m.chat, mediaOptions);
        await m.react("📄");
      } else {
        // Enviar como audio o video
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
      
      // 5. Notificar al servidor que la descarga ha terminado
      try {
        await axios.post(`http://neviapi.ddns.net:8000/done/${fileId}`, {}, { headers: neviHeaders });
      } catch (doneError) {
        console.error("Error al notificar la descarga al servidor:", doneError);
      }
    };
    
    // Ejecutar la lógica de la API de NEVI con un fallback
    try {
      await handleNeviApiDownload();
      return;
    } catch (apiError) {
      console.error("Fallo con la API de NEVI, recurriendo a la lógica de respaldo:", apiError);
      await conn.reply(m.chat, `⚠️ *¡Error de Debug!*
*NEVI API falló.* Razón: ${apiError.message}`, m);

      // --- Lógica de respaldo con ogmp3 ---
      try {
        const tmpDir = path.join(process.cwd(), './tmp');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        const tempFilePath = path.join(tmpDir, `${Date.now()}_${mode === 'audio' ? 'audio' : 'video'}.tmp`);
        
        await m.react("🔃"); 
        const downloadResult = await ogmp3.download(queryOrUrl, tempFilePath, mode);
        
        if (downloadResult.status && fs.existsSync(tempFilePath)) {
          const stats = fs.statSync(tempFilePath);
          const fileSizeMb = stats.size / (1024 * 1024);
          
          let mediaOptions;
          const fileBuffer = fs.readFileSync(tempFilePath);

          if (fileSizeMb > SIZE_LIMIT_MB) {
              mediaOptions = {
                  document: fileBuffer,
                  fileName: `${downloadResult.result.title}.${mode === 'audio' ? 'mp3' : 'mp4'}`,
                  mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                  caption: `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), lo envío como documento. Puede tardar más en descargar.*
🖤 *Título:* ${downloadResult.result.title}`
              };
              await m.react("📄");
          } else {
              mediaOptions = mode === 'audio'
                  ? { audio: fileBuffer, mimetype: 'audio/mpeg', fileName: `${downloadResult.result.title}.mp3` }
                  : { video: fileBuffer, caption: `🎬 *Listo.* 🖤 *Título:* ${downloadResult.result.title}`, fileName: `${downloadResult.result.title}.mp4`, mimetype: 'video/mp4' };
              await m.react(mode === 'audio' ? "🎧" : "📽️");
          }

          await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
          fs.unlinkSync(tempFilePath);
          return;
        }
        throw new Error("ogmp3 no pudo descargar el archivo.");

      } catch (e2) {
        console.error("Error con ogmp3:", e2);
        
        const tempFilePath = path.join(process.cwd(), './tmp', `${Date.now()}_${mode === 'audio' ? 'audio' : 'video'}.tmp`);
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        
        await conn.reply(m.chat, `⚠️ *¡Error de Debug!*
*ogmp3 falló.* Razón: ${e2.message}`, m);

        await conn.reply(m.chat, `💔 *fallé. pero tú más.*
no pude traerte nada.`, m);
        await m.react("❌");
      }
    }
    return;
  }

  // --- Lógica para la búsqueda de video (si no hay modo especificado) ---
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
      return conn.reply(m.chat, `💔 *Fallé al procesar la URL.*
Asegúrate de que sea una URL de YouTube válida.`, m, { contextInfo });
    }
  } else {
    try {
      const searchResult = await yts(queryOrUrl);
      video = searchResult.videos?.[0];
    } catch (e) {
      console.error("Error durante la búsqueda en Youtube:", e);
      return conn.reply(m.chat, `🖤 *qué patético...*
no logré encontrar nada con lo que pediste`, m, { contextInfo });
    }
  }

  if (!video) {
    return conn.reply(m.chat, `🦈 *esta cosa murió antes de empezar.*
nada encontrado con "${queryOrUrl}"`, m, { contextInfo });
  }

  const buttons = [
    { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 },
    { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 }
  ];

  const caption = `
┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪۪۪۪۪ٜ݊᷼⁔᮫ּׅ̫ׄ࣪︵᮫ּ๋ׅׅ۪۪۪۪ׅ࣪࣪͡⌒🌀𔗨⃪̤̤̤ٜ۫۫۫҈҈҈҈҉҉᷒ᰰ꤬۫۫۫𔗨̤̤̤𐇽─۪۪۪۪ٜ᷼┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪݊᷼
₊‧꒰ 🎧꒱ 𝙀𝙇𝙇𝙀𝙉 𝙅𝙊𝙀 𝘽𝙊𝙏 — 𝙋𝙇𝘼𝙔 𝙈𝙊𝘿𝙀 ✧˖°
︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶

> ૢ⃘꒰🎧⃝︩֟፝𐴲ⳋᩧ᪲ *Título:* ${video.title}
> ૢ⃘꒰⏱️⃝︩֟፝𐴲ⳋᩧ᪲ *Duración:* ${video.timestamp}
> ૢ⃘꒰👀⃝︩֟፝𐴲ⳋᩧ᪲ *Vistas:* ${video.views.toLocaleString()}
> ૢ⃘꒰👤⃝︩֟፝𐴲ⳋᩧ᪲ *Subido por:* ${video.author.name}
> ૢ⃘꒰📅⃝︩֟፝𐴲ⳋᩧ᪲ *Hace:* ${video.ago}
> ૢ⃘꒰🔗⃝︩֟፝𐴲ⳋᩧ᪲ *URL:* ${video.url}
⌣᮫ֶุ࣪ᷭ⌣〫᪲꒡᳝۪︶᮫໋࣭〭〫𝆬࣪࣪𝆬࣪꒡ֶ〪࣪ ׅ۫ெ᮫〪⃨〫〫᪲࣪˚̥ׅ੭ֶ֟ৎ᮫໋ׅ̣𝆬  ּ֢̊࣪⡠᮫ ໋🦈᮫ຸ〪〪〫〫ᷭ ݄࣪⢄ꠋּ֢ ࣪ ֶׅ੭ֶ̣֟ৎ᮫˚̥࣪ெ᮫〪〪⃨〫᪲ ࣪꒡᮫໋〭࣪𝆬࣪︶〪᳝۪ꠋּ꒡ׅ⌣᮫ֶ࣪᪲⌣᮫ຸ᳝〫֩ᷭ
     ᷼͝ ᮫໋⏝᮫໋〪ׅ〫𝆬⌣ׄ𝆬᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᷑︶᮫᷼͡︶ׅ ໋𝆬⋰᩠〫 ᮫ׄ ׅ𝆬 ⠸᮫ׄ ׅ ⋱〫 ۪۪ׄ᷑𝆬︶᮫໋᷼͡︶ׅ 𝆬⌣᮫〫ׄ᷑᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᜔᮫ׄ⏝᜔᮫๋໋〪ׅ〫 ᷼͝`;

  await conn.sendMessage(m.chat, {
    image: { url: video.thumbnail },
    caption,
    footer: 'Dime cómo lo quieres... o no digas nada ┐(￣ー￣)┌.',
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
