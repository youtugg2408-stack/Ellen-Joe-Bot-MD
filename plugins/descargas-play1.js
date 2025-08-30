import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const NEVI_API_KEY = 'ellen';
const NEVI_API_KEY_SHA256 = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');

const SIZE_LIMIT_MB = 100;
const tmpFolder = path.join(process.cwd(), './tmp');
if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder);

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⸙ְ̻࠭ꪆ🦈 𝐄llen 𝐉ᴏᴇ 𖥔 Sᥱrvice';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = conn.getName(m.sender);
  args = args.filter(v => v?.trim());

  if (!args[0]) return conn.reply(m.chat, `🦈 *¿Qué quieres reproducir?*\nEjemplo:\n${usedPrefix}play moonlight - kali uchis`, m);

  const isMode = ["audio","video"].includes(args[0].toLowerCase());
  const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
  const mode = isMode ? args[0].toLowerCase() : 'audio';
  const isInputUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

  // --- Buscar info del video ---
  let video;
  try {
    if (isInputUrl) {
      const info = await yts.getInfo(queryOrUrl);
      video = {
        title: info.title,
        url: info.url,
        timestamp: info.timestamp,
        views: info.views,
        author: { name: info.author.name },
        ago: info.ago,
        thumbnail: info.thumbnail
      };
    } else {
      const search = await yts(queryOrUrl);
      if (!search.videos?.length) throw new Error();
      const info = search.videos[0];
      video = {
        title: info.title,
        url: info.url,
        timestamp: info.timestamp,
        views: info.views,
        author: { name: info.author.name },
        ago: info.ago,
        thumbnail: info.thumbnail
      };
    }
  } catch {
    return conn.reply(m.chat, `💔 *No se pudo obtener información del video*`, m);
  }

  // --- Preparar contexto de mensaje ---
  const contextInfo = {
    mentionedJid: [m.sender],
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 }
  };

  // --- Función de envío de archivo ---
  const sendMedia = async (downloadUrl, title, currentMode) => {
    try {
      const head = await axios.head(downloadUrl);
      const sizeMb = head.headers['content-length'] / (1024*1024);

      if (sizeMb > SIZE_LIMIT_MB) {
        // Descargar a tmp
        const tmpPath = path.join(tmpFolder, `${Date.now()}.${currentMode==='audio'?'mp3':'mp4'}`);
        const writer = fs.createWriteStream(tmpPath);
        const response = await axios({url: downloadUrl, method:'GET', responseType:'stream'});
        response.data.pipe(writer);
        await new Promise(res=>writer.on('finish',res));

        // Enviar archivo como documento
        await conn.sendMessage(m.chat,{
          document: fs.readFileSync(tmpPath),
          fileName: `${title}.${currentMode==='audio'?'mp3':'mp4'}`,
          mimetype: currentMode==='audio'?'audio/mpeg':'video/mp4',
          caption: `⚠️ *Archivo grande (${sizeMb.toFixed(2)} MB)*\n🖤 *Título:* ${title}`
        },{quoted:m});

        fs.unlinkSync(tmpPath);
      } else {
        // Enviar directamente
        await conn.sendMessage(m.chat,{
          [currentMode==='audio'?'audio':'video']:{url:downloadUrl},
          mimetype: currentMode==='audio'?'audio/mpeg':'video/mp4',
          fileName:`${title}.${currentMode==='audio'?'mp3':'mp4'}`,
          caption: currentMode==='video'?`🎬 *Listo.* 🖤 *Título:* ${title}`:''
        },{quoted:m});
      }

      // Notificar a NEVI API que descargó el archivo
      if (downloadUrl.includes('/download/')) {
        const id = downloadUrl.split('/').pop();
        await fetch(`http://neviapi.ddns.net:8000/done/${id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${NEVI_API_KEY}` }
        });
      }

    } catch (e) {
      // --- Respaldo con ogmp3 ---
      const tmpPath = path.join(tmpFolder, `${Date.now()}.${currentMode==='audio'?'mp3':'mp4'}`);
      await ogmp3.download(video.url, tmpPath, currentMode);
      const stats = fs.statSync(tmpPath);
      const fileSizeMb = stats.size/(1024*1024);

      await conn.sendMessage(m.chat,{
        [currentMode==='audio'?'audio':'video']:fs.readFileSync(tmpPath),
        fileName:`${title}.${currentMode==='audio'?'mp3':'mp4'}`,
        mimetype: currentMode==='audio'?'audio/mpeg':'video/mp4',
        caption:`🖤 *Título:* ${title}${fileSizeMb>SIZE_LIMIT_MB?`\n⚠️ Archivo grande (${fileSizeMb.toFixed(2)} MB)`:''}`
      },{quoted:m});
      fs.unlinkSync(tmpPath);
    }
  };

  // --- Intentar NEVI API ---
  try {
    const res = await fetch('http://neviapi.ddns.net:8000/youtube',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Auth-Sha256':NEVI_API_KEY_SHA256
      },
      body: JSON.stringify({url:video.url, format:mode})
    });
    const json = await res.json();
    if (json.ok && json.download_url) {
      await sendMedia(json.download_url, video.title, mode);
      return;
    }
  } catch{}

  // --- Si NEVI falla, usar ogmp3 ---
  await sendMedia(video.url, video.title, mode);

  // --- Mostrar info Play Mode ---
          const caption = `
┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪۪۪۪۪ٜ݊᷼⁔᮫ּׅ̫ׄ࣪︵᮫ּ๋ׅׅ۪۪۪۪ׅ࣪࣪͡⌒🌀𔗨⃪̤̤̤ٜ۫۫۫҈҈҈҈҉҉᷒ᰰ꤬۫۫۫𔗨̤̤̤𐇽─۪۪۪۪ٜ᷼┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼┈۪۪۪۪݊᷼
₊‧꒰ 🎧꒱ 𝙀𝙇𝙇𝙀𝙉 𝙅𝙊𝙀 𝘽𝙊𝙏 — 𝙋𝙇𝘼𝙔 𝙈𝙊𝘿𝙀 ✧˖°
︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶   ︶֟፝ᰳ࡛۪۪۪۪۪⏝̣ ͜͝ ۫۫۫۫۫۫︶

> ૢ⃘꒰🎧⃝︩֟፝𐴲ⳋᩧ᪲ *Título:* ${video.title}
> ૢ⃘꒰⏱️⃝︩֟፝𐴲ⳋᩧ᪲ *Duración:* ${video.duration}
> ૢ⃘꒰👀⃝︩֟፝𐴲ⳋᩧ᪲ *Vistas:* ${video.views.toLocaleString()}
> ૢ⃘꒰👤⃝︩֟፝𐴲ⳋᩧ᪲ *Subido por:* ${video.author.name}
> ૢ⃘꒰📅⃝︩֟፝𐴲ⳋᩧ᪲ *Hace:* ${video.ago}
> ૢ⃘꒰🔗⃝︩֟፝𐴲ⳋᩧ᪲ *URL:* ${video.url}
⌣᮫ֶุ࣪ᷭ⌣〫᪲꒡᳝۪︶᮫໋࣭〭〫𝆬࣪࣪𝆬࣪꒡ֶ〪࣪ ׅ۫ெ᮫〪⃨〫〫᪲࣪˚̥ׅ੭ֶ֟ৎ᮫໋ׅ̣𝆬  ּ֢̊࣪⡠᮫ ໋🦈᮫ຸ〪〪〪〫ᷭ ݄࣪⢄ꠋּ֢ ࣪ ֶׅ੭ֶ̣֟ৎ᮫˚̥࣪ெ᮫〪〪⃨〫᪲ ࣪꒡᮫໋〭࣪𝆬࣪︶〪᳝۪ꠋּ꒡ׅ⌣᮫ֶ࣪᪲⌣᮫ຸ᳝〫֩ᷭ
     ᷼͝ ᮫໋⏝᮫໋〪ׅ〫𝆬⌣ׄ𝆬᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᷑︶᮫᷼͡︶ׅ ໋𝆬⋰᩠〫 ᮫ׄ ׅ𝆬 ⠸᮫ׄ ׅ ⋱〫 ۪۪ׄ᷑𝆬︶᮫໋᷼͡︶ׅ 𝆬⌣᮫〫ׄ᷑᷼᷼᷼᷼᷼᷼᷼᷼᷼⌣᜔᮫ׄ⏝᜔᮫๋໋〪ׅ〫 ᷼͝
Dime cómo lo quieres... o no digas nada ┐(￣ー￣)┌.`;

  await conn.sendMessage(m.chat,{
    image:{url:video.thumbnail},
    caption,
    footer:' ',
    buttons:[
      {buttonId:`${usedPrefix}play audio ${video.url}`, buttonText:{displayText:'🎧 AUDIO'}, type:1},
      {buttonId:`${usedPrefix}play video ${video.url}`, buttonText:{displayText:'🎬 VIDEO'}, type:1}
    ],
    headerType:4,
    contextInfo
  },{quoted:m});
};

handler.help = ['play <búsqueda o URL>'];
handler.tags = ['descargas'];
handler.command = ['play'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;