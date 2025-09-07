// Importa las librerías necesarias
import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Reemplaza 'TU_CLAVE_API' con tu clave real.
// Si no tienes una clave, no podrás usar esta API.
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

  // Si ya se especifica el modo y el enlace, va directo a la descarga
  if (isMode && isInputUrl) {
    await m.react("📥");
    const mode = args[0].toLowerCase();
    
    // --- Lógica de la API de Descarga ---
    const NEVI_API_URL = 'http://neviapi.ddns.net:5000'; // Host y puerto de la API

    // Función para notificar a la API que la descarga ha terminado.
    const notifyApiDone = async (downloadId, success) => {
      try {
        if (!downloadId) {
          console.warn("No se pudo notificar a la API, ID de descarga no disponible.");
          return;
        }
        const doneUrl = `${NEVI_API_URL}/done/${downloadId}`;
        await fetch(doneUrl, {
          method: 'POST',
          headers: {
            'X-Auth-Sha256': NEVI_API_KEY_SHA256,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ success })
        });
        console.log(`Notificación a NEVI API de descarga terminada: ${downloadId}, éxito: ${success}`);
      } catch (e) {
        console.error("Error al notificar a la API:", e);
      }
    };
    
    // CORRECCIÓN: Ahora se descarga el archivo con la clave y se envía localmente
    const sendMediaFile = async (downloadUrl, title, currentMode) => {
      try {
        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: { 'X-API-KEY': NEVI_API_KEY } // Incluye la clave en la solicitud de descarga
        });

        const fileBuffer = response.data;
        const fileSizeMb = fileBuffer.length / (1024 * 1024);

        if (fileSizeMb > SIZE_LIMIT_MB) {
          // El archivo es demasiado grande, enviarlo como documento
          await conn.sendMessage(m.chat, {
            document: fileBuffer,
            fileName: `${title}.${currentMode === 'audio' ? 'mp3' : 'mp4'}`,
            mimetype: currentMode === 'audio' ? 'audio/mpeg' : 'video/mp4',
            caption: `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), así que lo envío como documento. Puede tardar más en descargar.*
🖤 *Título:* ${title}`
          }, { quoted: m });
          await m.react("📄"); // React con un emoji de documento
        } else {
          // El archivo está dentro del límite, enviarlo como audio o video
          const mediaOptions = currentMode === 'audio'
              ? { audio: fileBuffer, mimetype: "audio/mpeg", fileName: `${title}.mp3` }
              : { video: fileBuffer, caption: `🎬 *Listo.*
🖤 *Título:* ${title}`, fileName: `${title}.mp4`, mimetype: "video/mp4" };

          await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
          await m.react(currentMode === 'audio' ? "🎧" : "📽️");
        }
      } catch (error) {
        console.error("Error al obtener el archivo o al enviarlo:", error.response?.status, error.response?.statusText);
        throw new Error("No se pudo obtener el archivo o falló el envío. Se intentará de nuevo.");
      }
    };

    let neviDownloadId = null;

    try {
      // Llamada al endpoint /download de la API
      const res = await fetch(`${NEVI_API_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': NEVI_API_KEY
        },
        body: JSON.stringify({
          url: queryOrUrl,
          type: mode
        }),
      });

      const json = await res.json();
      neviDownloadId = json.id; // Asignación segura del ID
      
      // Enviamos la respuesta JSON completa al chat para depuración
      await conn.reply(m.chat, `Respuesta de la API para depuración:\n\n` + JSON.stringify(json, null, 2), m);
      console.log("Respuesta de la API para depuración:", json);

      // CORRECCIÓN: Usar json.download_link para construir la URL completa
      if (json.ok && json.download_link) {
        const fileUrl = `${NEVI_API_URL}${json.download_link}`;
        await sendMediaFile(fileUrl, json.title || 'Título Desconocido', mode);
        return;
      }
      throw new Error("API falló o no devolvió un enlace de descarga válido.");

    } catch (e) {
      console.error("Error con la API:", e);
      // Notificar a la API que la descarga ha fallado.
      if (neviDownloadId) {
        await notifyApiDone(neviDownloadId, false);
      }

      await conn.reply(m.chat, `💔 *Fallé al procesar tu capricho.*
El servicio principal no está disponible, intentando con un servicio de respaldo...`, m);

      try {
        // --- Lógica de respaldo con ogmp3 ---
        const tempFilePath = path.join(process.cwd(), './tmp', `${Date.now()}_${mode === 'audio' ? 'audio' : 'video'}.tmp`);
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

        await conn.reply(m.chat, `💔 *fallé. pero tú más.*
no pude traerte nada.`, m);
        await m.react("❌");
      }
    }
    return;
  }

  // --- Lógica de búsqueda o metadatos (si no se especifica el modo) ---
  const searchResult = await yts(queryOrUrl);
  video = searchResult.videos?.[0];

  if (!video) {
    return conn.reply(m.chat, `🦈 *esta cosa murió antes de empezar.*
nada encontrado con "${queryOrUrl}"`, m, { contextInfo });
  }

  // Si no se especificó un modo, envía la interfaz de botones
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
⌣᮫ֶุ࣪ᷭ⌣〫᪲꒡᳝۪︶᮫໋࣭〭〫𝆬࣪࣪𝆬࣪꒡ֶ〪࣪ ׅ۫ெ᮫〪⃨〫〫᪲࣪˚̥ׅ੭ֶ֟ৎ᮫໋ׅ̣𝆬  ּ֢̊࣪⡠᮫ ໋🦈᮫ຸ〪〪〪〫ᷭ ݄࣪⢄ꠋּ֢ ࣪ ֶׅ੭ֶ̣֟ৎ᮫˚̥࣪ெ᮫〪〪⃨〫᪲ ࣪꒡᮫໋〭࣪𝆬࣪︶᳝۪〫ꠋּ꒡ׅ⌣᮫ֶ࣪᪲⌣᮫ຸ᳝〫֩ᷭ
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