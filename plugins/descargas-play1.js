import fetch from "node-fetch";
import yts from "yt-search";
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { ogmp3 } from '../lib/youtubedl.js';

const NEVI_API_KEY = 'ellen';
const SIZE_LIMIT_MB = 100;

const handler = async (m, { conn, args, usedPrefix }) => {
    args = args.filter(v => v?.trim());
    if (!args[0]) return conn.reply(m.chat,
        `🦈 *¿Qué quieres reproducir?*\n🎧 Ejemplo:\n${usedPrefix}play moonlight - kali uchis`, m);

    const isMode = ["audio", "video"].includes(args[0].toLowerCase());
    const mode = isMode ? args[0].toLowerCase() : null;
    const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");

    // --- Buscar info con yt-search ---
    let video;
    try {
        let searchResult;
        if (/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl)) {
            const id = queryOrUrl.split('v=')[1] || queryOrUrl.split('/').pop();
            searchResult = await yts({ videoId: id });
        } else {
            const search = await yts(queryOrUrl);
            searchResult = search.videos?.[0];
        }
        if (!searchResult) throw new Error('No se encontró video');
        video = {
            title: searchResult.title,
            duration: searchResult.timestamp,
            views: searchResult.views,
            author: { name: searchResult.author.name },
            ago: searchResult.ago,
            url: searchResult.url,
            thumbnail: searchResult.thumbnail
        };
    } catch {
        return conn.reply(m.chat, `💔 *No se pudo obtener información del video*`, m);
    }

    // --- Mostrar botones si no se seleccionó modo ---
    if (!mode) {
        const buttons = [
            { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 AUDIO' }, type: 1 },
            { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 VIDEO' }, type: 1 }
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

        return await conn.sendMessage(m.chat, {
            image: { url: video.thumbnail },
            caption,
            footer: 'Elige una opción:',
            buttons,
            headerType: 4
        }, { quoted: m });
    }

    // --- Preparar tmp ---
    const tmpDir = path.join(process.cwd(), './tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const ext = mode === 'audio' ? 'mp3' : 'mp4';
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g,'_');
    const tempFilePath = path.join(tmpDir, `${Date.now()}_${safeTitle}.${ext}`);

    let fileId = null;

    try {
        // --- Intentar NEVI API ---
        const res = await fetch(`http://neviapi.ddns.net:8000/youtube`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: video.url, format: ext })
        });
        const json = await res.json();
        if (!json.ok || !json.download_url) throw new Error('No se obtuvo URL de descarga');
        fileId = json.id;

        const head = await axios.head(json.download_url);
        const fileSizeMb = head.headers['content-length'] / (1024*1024);

        if (fileSizeMb > SIZE_LIMIT_MB) {
            // Descargar a tmp y enviar como documento
            const writer = fs.createWriteStream(tempFilePath);
            const response = await axios.get(json.download_url, { responseType: 'stream' });
            response.data.pipe(writer);
            await new Promise((resolve, reject) => writer.on('finish', resolve).on('error', reject));
            const fileBuffer = fs.readFileSync(tempFilePath);

            await conn.sendMessage(m.chat, {
                document: fileBuffer,
                fileName: `${video.title}.${ext}`,
                mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                caption: `⚠️ Archivo grande (${fileSizeMb.toFixed(2)} MB), enviado como documento.\nTítulo: ${video.title}`
            }, { quoted: m });

            fs.unlinkSync(tempFilePath);
        } else {
            await conn.sendMessage(m.chat, {
                [mode]: { url: json.download_url },
                mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                fileName: `${video.title}.${ext}`,
                caption: `🎬 Listo. Título: ${video.title}`
            }, { quoted: m });
        }
    } catch {
        // Fallback con ogmp3
        try {
            await ogmp3.download(video.url, tempFilePath, mode);
            const stats = fs.statSync(tempFilePath);
            const fileSizeMb = stats.size / (1024*1024);
            const fileBuffer = fs.readFileSync(tempFilePath);

            const mediaOptions = fileSizeMb > SIZE_LIMIT_MB
                ? { document: fileBuffer, fileName: `${video.title}.${ext}`, mimetype: mode==='audio'?'audio/mpeg':'video/mp4', caption: `⚠️ Archivo grande (${fileSizeMb.toFixed(2)} MB), enviado como documento.\nTítulo: ${video.title}` }
                : mode==='audio'
                    ? { audio: fileBuffer, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` }
                    : { video: fileBuffer, mimetype: 'video/mp4', fileName: `${video.title}.mp4`, caption: `🎬 Listo. Título: ${video.title}` };

            await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
            fs.unlinkSync(tempFilePath);
        } catch {
            return conn.reply(m.chat, `⚠️ No se pudo descargar ni enviar el archivo`, m);
        }
    } finally {
        if (fileId) {
            try { await fetch(`http://neviapi.ddns.net:8000/done/${fileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${NEVI_API_KEY}` } }); } catch {}
        }
    }
};

handler.help = ['play'].map(v => v + ' <búsqueda o URL>');
handler.tags = ['descargas'];
handler.command = ['play'];
handler.register = true;
handler.prefix = /^[./#]/;

export default handler;