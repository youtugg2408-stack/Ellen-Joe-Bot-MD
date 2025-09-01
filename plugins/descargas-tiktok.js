// Importa las librerías necesarias
import fetch from "node-fetch";
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// Reemplaza 'TU_CLAVE_API' con tu clave real.
// Si no tienes una clave, no podrás usar esta API.
const NEVI_API_KEY = 'ellen';
const NEVI_API_KEY_SHA256 = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');

const SIZE_LIMIT_MB = 100;
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ 𖥔 Sᥱrvice';

// URL de imagen de respaldo si la API no proporciona una.
const FALLBACK_IMAGE_URL = 'https://i.imgur.com/KqW4LgM.jpeg';

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
      body: `✦ 𝙀𝙨𝙥𝙚𝙧𝙖𝙣𝙙𝙤 t𝙪 𝙨𝙤𝙡𝙞𝙘𝙞𝙩𝙪𝙙, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
      thumbnail: icons, // Asume que 'icons' está definido en otro lugar
      sourceUrl: redes, // Asume que 'redes' está definido en otro lugar
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  if (!args[0]) {
    return conn.reply(m.chat, `🦈 *¿᥎іᥒіs𝗍ᥱ ᥲ ⍴ᥱძіrmᥱ ᥲᥣg᥆ sіᥒ sᥲᑲᥱr 𝗊ᥙᥱ́?*
ძі ᥣ᥆ 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs... ᥆ ᥎ᥱ𝗍ᥱ.

🎧 ᥱȷᥱm⍴ᥣ᥆s:
${usedPrefix}tiktok https://www.tiktok.com/@user/video/123456789
${usedPrefix}tiktok video https://www.tiktok.com/@user/video/123456789`, m, { contextInfo });
  }

  const isMode = ["audio", "video", "images"].includes(args[0].toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
  const isInputUrl = /^(https?:\/\/)?(www\.)?(vm\.)?tiktok\.com\/.+$/i.test(queryOrUrl);
  
  // No se permite búsqueda, solo URLs de TikTok
  if (!isInputUrl) {
    return conn.reply(m.chat, `💔 *Esa no es una URL de TikTok.*
Solo soporto URLs directas.`, m, { contextInfo });
  }

  // Función para notificar a la API que la descarga ha terminado.
  const notifyApiDone = async (downloadId, success) => {
    try {
      if (!downloadId) {
        console.warn("No se pudo notificar a la API, ID de descarga no disponible.");
        return;
      }
      const doneUrl = `http://neviapi.ddns.net:8000/done/${downloadId}`;
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

  // --- Lógica para enviar archivos de video/audio ---
  const sendMediaFile = async (downloadUrl, title, currentMode) => {
    try {
      const response = await axios.head(downloadUrl);
      const contentLength = response.headers['content-length'];
      const fileSizeMb = contentLength / (1024 * 1024);

      if (fileSizeMb > SIZE_LIMIT_MB) {
        await conn.sendMessage(m.chat, {
          document: { url: downloadUrl },
          fileName: `${title}.${currentMode === 'audio' ? 'mp3' : 'mp4'}`,
          mimetype: currentMode === 'audio' ? 'audio/mpeg' : 'video/mp4',
          caption: `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), así que lo envío como documento. Puede tardar más en descargar.*
🖤 *Título:* ${title}`
        }, { quoted: m });
        await m.react("📄");
      } else {
        const mediaOptions = currentMode === 'audio'
          ? { audio: { url: downloadUrl }, mimetype: "audio/mpeg", fileName: `${title}.mp3` }
          : { video: { url: downloadUrl }, caption: `🎬 *Listo.*
🖤 *Título:* ${title}`, fileName: `${title}.mp4`, mimetype: "video/mp4" };

        await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
        await m.react(currentMode === 'audio' ? "🎧" : "📽️");
      }
    } catch (error) {
      console.error("Error al obtener el tamaño del archivo o al enviarlo:", error);
      throw new Error("No se pudo obtener el tamaño del archivo o falló el envío.");
    }
  };

  // --- Lógica para descargar, descomprimir y enviar imágenes ---
  const sendImagesFromZip = async (downloadUrl, title) => {
    const tempDir = path.join(process.cwd(), 'temp', `tiktok_img_${Date.now()}`);
    const tempZipPath = `${tempDir}.zip`;

    if (!fs.existsSync(path.dirname(tempDir))) {
        fs.mkdirSync(path.dirname(tempDir));
    }

    try {
        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempZipPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        const zip = new AdmZip(tempZipPath);
        zip.extractAllTo(tempDir, true);

        const extractedFiles = fs.readdirSync(tempDir).filter(file => /\.(jpeg|jpg|png)$/i.test(file));
        if (extractedFiles.length === 0) {
            throw new Error('El archivo ZIP no contiene imágenes.');
        }

        await conn.reply(m.chat, `🖼️ *Enviando ${extractedFiles.length} imágenes...*`, m);
        for (const file of extractedFiles) {
            const imagePath = path.join(tempDir, file);
            await conn.sendMessage(m.chat, { image: fs.readFileSync(imagePath), caption: `_Imagen de la presentación de ${title}_` });
        }

    } catch (error) {
        console.error("Error al procesar imágenes:", error);
        throw new Error("No se pudieron procesar las imágenes del carrusel.");
    } finally {
        if (fs.existsSync(tempZipPath)) {
            fs.unlinkSync(tempZipPath);
        }
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
  };


  // Si ya se especifica el modo, va directo a la descarga
  if (isMode) {
    await m.react("📥");
    const mode = args[0].toLowerCase();
    let neviDownloadId = null;

    try {
      // --- Lógica para la NEVI API de TikTok ---
      const neviApiUrl = `http://neviapi.ddns.net:8000/tiktok`;
      let format = mode === "audio" ? "mp3" : "mp4";
      if (mode === "images") {
          format = "images";
      }

      const res = await fetch(neviApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Sha256': NEVI_API_KEY_SHA256,
        },
        body: JSON.stringify({
          url: queryOrUrl,
          format: format
        }),
      });

      const json = await res.json();
      await conn.reply(m.chat, `*Respuesta de la API de descarga:*
\`\`\`json
${JSON.stringify(json, null, 2)}
\`\`\``, m);
      
      neviDownloadId = json.id;

      if (json.ok && json.download_url) {
        const videoTitle = json.info?.title || 'Título Desconocido';
        if (mode === "images") {
            await sendImagesFromZip(json.download_url, videoTitle);
        } else {
            await sendMediaFile(json.download_url, videoTitle, mode);
        }
        await notifyApiDone(neviDownloadId, true);
        return;
      }
      throw new Error("NEVI API falló.");
    } catch (e) {
      console.error("Error con NEVI API:", e);
      if (neviDownloadId) {
        await notifyApiDone(neviDownloadId, false);
      }
      await conn.reply(m.chat, `*Respuesta de la API de descarga (Error):*
\`\`\`json
${JSON.stringify({ error: e.message, details: e.stack }, null, 2)}
\`\`\``, m);

      return conn.reply(m.chat, `💔 *Fallé al procesar tu capricho.*
No pude descargar el video de TikTok.`, m);
    }
    return;
  }
  
  // --- Lógica de metadatos (si no se especifica el modo) ---
  await m.react("🔎");
  try {
    const neviApiUrl = `http://neviapi.ddns.net:8000/tiktok-search`;
    const res = await fetch(neviApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Sha256': NEVI_API_KEY_SHA256,
      },
      body: JSON.stringify({
        url: queryOrUrl
      }),
    });
    
    const json = await res.json();
    await conn.reply(m.chat, `*Respuesta de la API de búsqueda:*
\`\`\`json
${JSON.stringify(json, null, 2)}
\`\`\``, m);

    if (!json.ok || !json.info) {
      throw new Error("No se encontraron metadatos.");
    }

    const { author, music_info, title, dynamic_cover, is_slideshow } = json.info;
    
    const buttons = [];
    if (is_slideshow) {
        buttons.push({ buttonId: `${usedPrefix}tiktok images ${queryOrUrl}`, buttonText: { displayText: '🖼️ 𝙄𝙈𝘼́𝙂𝙀𝙉𝙀𝙎' }, type: 1 });
    }
    buttons.push({ buttonId: `${usedPrefix}tiktok video ${queryOrUrl}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 });
    buttons.push({ buttonId: `${usedPrefix}tiktok audio ${queryOrUrl}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 });

    const caption = `
┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪۪۪۪۪ٜ݊᷼⁔᮫ּׅ̫ׄ࣪︵᮫ּ๋ׅׅ۪۪۪۪ׅ࣪࣪͡⌒🌀𔗨⃪̤̤̤ٜ۫۫۫҈҈҈҈҉҉᷒ᰰ꤬۫۫۫𔗨̤̤̤𐇽─۪۪۪۪ٜ᷼┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪݊᷼
₊‧꒰ 🎧꒱ 𝙀𝙇𝙇𝙀𝙉 𝙅𝙊𝙀 𝘽𝙊𝙏 — 𝙋𝙇𝘼𝙔 𝙈𝙊𝘿𝙀 ✧˖°
︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶

> ૢ⃘꒰👤⃝︩֟፝𐴲ⳋᩧ᪲ *Autor:* ${author?.nickname || 'Desconocido'} (@${author?.unique_id || 'N/A'})
> ૢ⃘꒰💬⃝︩֟፝𐴲ⳋᩧ᪲ *Descripción:* ${title || 'Sin descripción'}
> ૢ⃘꒰🎵⃝︩֟፝𐴲ⳋᩧ᪲ *Música:* ${music_info?.title || 'Desconocida'}
> ૢ⃘꒰🔗⃝︩֟፝𐴲ⳋᩧ᪲ *URL:* ${queryOrUrl}
⌣᮫ֶุ࣪ᷭ⌣〫᪲꒡᳝۪︶᮫໋࣭〭〫𝆬࣪࣪𝆬࣪꒡ֶ〪࣪ ׅ۫ெ᮫〪⃨〫〫᪲࣪˚̥ׅ੭ֶ֟ৎ᮫໋ׅ̣𝆬  ּ֢̊࣪⡠᮫ ໋🦈᮫ຸ〪〪〪〫ᷭ ݄࣪⢄ꠋּ֢ ࣪ ֶׅ੭ֶ̣֟ৎ᮫˚̥࣪ெ᮫〪〪⃨〫᪲ ࣪꒡᮫໋〭࣪𝆬࣪︶〪᳝۪ꠋּ꒡ׅ⌣᮫ֶ࣪᪲⌣᮫ຸ᳝〫֩ᷭ
     ᷼͝ ᮫໋⏝᮫໋〪ׅ〫𝆬⌣ׄ𝆬᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᷑︶᮫᷼͡︶ׅ ໋𝆬⋰᩠〫 ᮫ׄ ׅ𝆬 ⠸᮫ׄ ׅ ⋱〫 ۪۪ׄ᷑𝆬︶᮫໋᷼͡︶ׅ 𝆬⌣᮫〫ׄ᷑᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᜔᮫ׄ⏝᜔᮫๋໋〪ׅ〫 ᷼͝`;

    await conn.sendMessage(m.chat, {
      image: { url: dynamic_cover?.url || FALLBACK_IMAGE_URL },
      caption,
      footer: 'Dime cómo lo quieres... o no digas nada ┐(￣ー￣)┌.',
      buttons,
      headerType: 4,
      contextInfo
    }, { quoted: m });
  
  } catch (e) {
    console.error("Error al buscar metadatos de TikTok:", e);
    await conn.reply(m.chat, `*Respuesta de la API de búsqueda (Error):*
\`\`\`json
${JSON.stringify({ error: e.message, details: e.stack }, null, 2)}
\`\`\``, m);
    return conn.reply(m.chat, `💔 *Fallé al procesar tu capricho.*
Esa URL me da un dolor de cabeza, ¿estás seguro de que es una URL de TikTok válida?`, m, { contextInfo });
  }
};

handler.help = ['tiktok'].map(v => v + ' <URL>');
handler.tags = ['descargas'];
handler.command = ['tiktok'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;
