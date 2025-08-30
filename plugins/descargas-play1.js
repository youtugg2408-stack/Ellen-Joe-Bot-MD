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
        }
    };

    if (!args[0]) return conn.reply(m.chat, `🦈 *¿Qué quieres reproducir?*\nEjemplo:\n${usedPrefix}play moonlight - kali uchis`, m, { contextInfo });

    const isMode = ["audio", "video"].includes(args[0].toLowerCase());
    const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
    const mode = isMode ? args[0].toLowerCase() : null;

    let video;

    // Obtener info con yt-search
    try {
        if (/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl)) {
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
            const search = await yts(queryOrUrl);
            video = search.videos?.[0];
        }
    } catch {
        return conn.reply(m.chat, "💔 *No se pudo obtener información del video*", m);
    }

    if (!video) return conn.reply(m.chat, `💔 Nada encontrado con "${queryOrUrl}"`, m);

    // Enviar mensaje inicial con botones
    const buttons = [
        { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 },
        { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 }
    ];

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

    await conn.sendMessage(m.chat, {
        image: { url: video.thumbnail },
        caption,
        footer: '🎶 Elige audio o video',
        buttons,
        headerType: 4,
        contextInfo
    }, { quoted: m });

    // Si no se especifica modo aún, solo mostramos botones
    if (!mode) return;

    // Descargar desde NEVI API
    let fileId = null;
    try {
        const neviApiUrl = `http://neviapi.ddns.net:8000/youtube`;
        const res = await fetch(neviApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Sha256': NEVI_API_KEY_SHA256 },
            body: JSON.stringify({ url: video.url, format: mode === 'audio' ? 'mp3' : 'mp4' })
        });
        const json = await res.json();

        if (!json.ok || !json.download_url) throw new Error('NEVI API falló');
        fileId = json.id;

        // Obtener tamaño
        const head = await axios.head(json.download_url);
        const fileSizeMb = head.headers['content-length'] / (1024 * 1024);

        let tmpPath = null;
        let sendOptions = null;

        if (fileSizeMb > SIZE_LIMIT_MB) {
            tmpPath = path.join(process.cwd(), './tmp', `${Date.now()}_${mode}.${mode === 'audio' ? 'mp3' : 'mp4'}`);
            const writer = fs.createWriteStream(tmpPath);
            const response = await axios.get(json.download_url, { responseType: 'stream' });
            response.data.pipe(writer);
            await new Promise((resolve, reject) => writer.on('finish', resolve).on('error', reject));
            sendOptions = {
                [mode === 'audio' ? 'document' : 'document']: fs.readFileSync(tmpPath),
                fileName: `${video.title}.${mode === 'audio' ? 'mp3' : 'mp4'}`,
                mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                caption: `⚠️ El archivo es grande (${fileSizeMb.toFixed(2)} MB), enviado como documento.\n🎬 ${video.title}`
            };
        } else {
            sendOptions = {
                [mode === 'audio' ? 'audio' : 'video']: { url: json.download_url },
                fileName: `${video.title}.${mode === 'audio' ? 'mp3' : 'mp4'}`,
                mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                caption: `🎬 ${video.title}`
            };
        }

        await conn.sendMessage(m.chat, sendOptions, { quoted: m });

        if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    } catch {
        // Respaldo con ogmp3
        try {
            const tmpPath = path.join(process.cwd(), './tmp', `${Date.now()}_${mode}.${mode === 'audio' ? 'mp3' : 'mp4'}`);
            await ogmp3.download(video.url, tmpPath, mode);
            const sendOptions = {
                [mode === 'audio' ? 'audio' : 'video']: fs.readFileSync(tmpPath),
                fileName: `${video.title}.${mode === 'audio' ? 'mp3' : 'mp4'}`,
                mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                caption: `🎬 ${video.title}`
            };
            await conn.sendMessage(m.chat, sendOptions, { quoted: m });
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {
            return conn.reply(m.chat, '💔 No se pudo descargar el archivo.', m);
        }
    } finally {
        if (fileId) {
            try {
                const hashKey = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');
                await fetch(`http://neviapi.ddns.net:8000/done/${fileId}`, { 
                    method: 'POST', 
                    headers: { 'Authorization': `Bearer ${hashKey}` } 
                }); 
            } catch {}
        }
    }
};

handler.help = ['play'].map(v => v + ' <búsqueda o URL>');
handler.tags = ['descargas'];
handler.command = ['play'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;