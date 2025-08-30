import fetch from "node-fetch";
import yts from "yt-search";
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { ogmp3 } from '../lib/youtubedl.js';

const NEVI_API_KEY = 'ellen';
const NEVI_API_KEY_SHA256 = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');
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
        forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
    };

    if (!args[0]) return conn.reply(m.chat,
        `🦈 *¿Qué quieres reproducir?*\n🎧 Ejemplo:\n${usedPrefix}play moonlight - kali uchis`, m, { contextInfo });

    const isMode = ["audio", "video"].includes(args[0].toLowerCase());
    const queryOrUrl = isMode ? args.slice(1).join(" ") : args.join(" ");
    const mode = isMode ? args[0].toLowerCase() : null;
    const isInputUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(queryOrUrl);

    let video;
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
    } catch {
        return conn.reply(m.chat, `💔 *No se pudo obtener información del video*`, m, { contextInfo });
    }

    if (!video) return conn.reply(m.chat, `🦈 *No se encontró nada para:* ${queryOrUrl}`, m, { contextInfo });

    // --- Mensaje inicial con botones ---
    const buttons = [
        { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 AUDIO' }, type: 1 },
        { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 VIDEO' }, type: 1 }
    ];

    const caption = `
┈۪۪۪۪۪۪۪۪ٜ̈᷼─۪۪۪۪ٜ࣪᷼
₊‧꒰ 🎧꒱ 𝙀𝙇𝙇𝙀𝙉 𝙅𝙊𝙀 𝘽𝙊𝙏 — 𝙋𝙇𝘼𝙔 𝙈𝙊𝘿𝙀 ✧˖°

> 🎧 *Título:* ${video.title}
> ⏱️ *Duración:* ${video.timestamp}
> 👀 *Vistas:* ${video.views.toLocaleString()}
> 👤 *Subido por:* ${video.author.name}
> 📅 *Hace:* ${video.ago}
> 🔗 *URL:* ${video.url}

Dime cómo lo quieres... o no digas nada ┐(￣ー￣)┌.`;

    await conn.sendMessage(m.chat, {
        image: { url: video.thumbnail },
        caption,
        footer: 'Elige una opción:',
        buttons,
        headerType: 4,
        contextInfo
    }, { quoted: m });

    if (!mode) return;

    const tmpDir = path.join(process.cwd(), './tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const ext = mode === 'audio' ? 'mp3' : 'mp4';
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g,'_');
    const tempFilePath = path.join(tmpDir, `${Date.now()}_${safeTitle}.${ext}`);

    let fileId = null;

    // --- Intentar NEVI API ---
    try {
        const res = await fetch(`http://neviapi.ddns.net:8000/youtube`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Sha256': NEVI_API_KEY_SHA256 },
            body: JSON.stringify({ url: queryOrUrl, format: ext })
        });
        const json = await res.json();
        if (!json.ok || !json.download_url) throw new Error('No se obtuvo URL de descarga');
        fileId = json.id;

        const head = await axios.head(json.download_url);
        const fileSizeMb = head.headers['content-length'] / (1024 * 1024);

        if (fileSizeMb > SIZE_LIMIT_MB) {
            // Descargar primero a tmp
            const writer = fs.createWriteStream(tempFilePath);
            const response = await axios.get(json.download_url, { responseType: 'stream' });
            response.data.pipe(writer);
            await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
            const fileBuffer = fs.readFileSync(tempFilePath);

            await conn.sendMessage(m.chat, {
                document: fileBuffer,
                fileName: `${video.title}.${ext}`,
                mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                caption: `⚠️ Archivo grande (${fileSizeMb.toFixed(2)} MB), enviado como documento.\nTítulo: ${video.title}`
            }, { quoted: m });

            fs.unlinkSync(tempFilePath);
        } else {
            // Enviar directo
            await conn.sendMessage(m.chat, {
                [mode]: { url: json.download_url },
                mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                fileName: `${video.title}.${ext}`,
                caption: `🎬 Listo. Título: ${video.title}`
            }, { quoted: m });
        }
    } catch {
        // --- Fallback con ogmp3 ---
        try {
            await ogmp3.download(queryOrUrl, tempFilePath, mode);
            const stats = fs.statSync(tempFilePath);
            const fileSizeMb = stats.size / (1024 * 1024);
            const fileBuffer = fs.readFileSync(tempFilePath);

            const mediaOptions = fileSizeMb > SIZE_LIMIT_MB
                ? { document: fileBuffer, fileName: `${video.title}.${ext}`, mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4', caption: `⚠️ Archivo grande (${fileSizeMb.toFixed(2)} MB), enviado como documento.\nTítulo: ${video.title}` }
                : mode === 'audio'
                    ? { audio: fileBuffer, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` }
                    : { video: fileBuffer, mimetype: 'video/mp4', fileName: `${video.title}.mp4`, caption: `🎬 Listo. Título: ${video.title}` };

            await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
            fs.unlinkSync(tempFilePath);
        } catch {
            return conn.reply(m.chat, `⚠️ No se pudo descargar ni enviar el archivo`, m);
        }
    } finally {
        // Notificar a NEVI API si descargamos desde ahí
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