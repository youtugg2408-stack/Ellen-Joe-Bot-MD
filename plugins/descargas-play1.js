// Importa las librerías necesarias
import fetch from "node-fetch";
import { ogmp3 } from '../lib/youtubedl.js';
import yts from "yt-search";
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// --- Configuración ---
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
            thumbnail: icons,
            sourceUrl: redes,
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

    // Función para enviar archivo según tamaño
    const sendMediaFile = async (downloadUrl, title, currentMode) => {
        try {
            const headRes = await axios.head(downloadUrl);
            const contentLength = headRes.headers['content-length'];
            const fileSizeMb = contentLength / (1024 * 1024);

            if (fileSizeMb > SIZE_LIMIT_MB) {
                await conn.sendMessage(m.chat, {
                    document: { url: downloadUrl },
                    fileName: `${title}.${currentMode === 'audio' ? 'mp3' : 'mp4'}`,
                    mimetype: currentMode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                    caption: `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), lo envío como documento.*
🖤 *Título:* ${title}`
                }, { quoted: m });
                await m.react("📄");
            } else {
                const mediaOptions = currentMode === 'audio'
                    ? { audio: { url: downloadUrl }, mimetype: "audio/mpeg", fileName: `${title}.mp3` }
                    : { video: { url: downloadUrl }, caption: `🎬 *Listo.* 🖤 *Título:* ${title}`, fileName: `${title}.mp4`, mimetype: "video/mp4" };

                await conn.sendMessage(m.chat, mediaOptions, { quoted: m });
                await m.react(currentMode === 'audio' ? "🎧" : "📽️");
            }
        } catch (error) {
            console.error("Error al enviar archivo:", error);
            throw new Error("No se pudo enviar el archivo.");
        }
    };

    // Si el primer argumento es modo y el input es URL
    if (isMode && isInputUrl) {
        video = { url: queryOrUrl };
        await m.react("📥");
        const mode = args[0].toLowerCase();

        try {
            // --- NEVI API ---
            const neviApiUrl = `http://neviapi.ddns.net:8000/youtube`;
            const format = mode === "audio" ? "mp3" : "mp4";
            const res = await fetch(neviApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Sha256': NEVI_API_KEY_SHA256,
                },
                body: JSON.stringify({ url: queryOrUrl, format })
            });
            const json = await res.json();

            if (json.ok && json.download_url) {
                await sendMediaFile(json.download_url, json.info.title, mode);
                return;
            } else {
                throw new Error("NEVI API falló o no retornó download_url.");
            }
        } catch (e) {
            console.error("Error NEVI API:", e);
            await conn.reply(m.chat, `⚠️ *NEVI API falló.* Razón: ${e.message}`, m);

            // --- Fallback con ogmp3 ---
            try {
                const tmpDir = path.join(process.cwd(), './tmp');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

                const tempFilePath = path.join(tmpDir, `${Date.now()}_${mode === 'audio' ? 'audio' : 'video'}.tmp`);
                await m.react("🔃");

                const downloadResult = await ogmp3.download(queryOrUrl, tempFilePath, mode);

                if (downloadResult.status && fs.existsSync(tempFilePath)) {
                    const stats = fs.statSync(tempFilePath);
                    const fileSizeMb = stats.size / (1024 * 1024);
                    const fileBuffer = fs.readFileSync(tempFilePath);

                    let mediaOptions;
                    if (fileSizeMb > SIZE_LIMIT_MB) {
                        mediaOptions = {
                            document: fileBuffer,
                            fileName: `${downloadResult.result.title}.${mode === 'audio' ? 'mp3' : 'mp4'}`,
                            mimetype: mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
                            caption: `⚠️ *El archivo es muy grande (${fileSizeMb.toFixed(2)} MB), lo envío como documento.* 🖤 *Título:* ${downloadResult.result.title}`
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
                console.error("Error ogmp3:", e2);
                await conn.reply(m.chat, `💔 *Fallé.* No pude traerte nada. Razón: ${e2.message}`, m);
                await m.react("❌");
            }
        }
        return;
    }

    // --- Lógica de búsqueda ---
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
            console.error("Error info URL:", e);
            return conn.reply(m.chat, `💔 Fallé al procesar la URL.`, m, { contextInfo });
        }
    } else {
        try {
            const searchResult = await yts(queryOrUrl);
            video = searchResult.videos?.[0];
        } catch (e) {
            console.error("Error búsqueda YT:", e);
            return conn.reply(m.chat, `🖤 No logré encontrar nada con lo que pediste.`, m, { contextInfo });
        }
    }

    if (!video) {
        return conn.reply(m.chat, `🦈 Nada encontrado con "${queryOrUrl}"`, m, { contextInfo });
    }

    const buttons = [
        { buttonId: `${usedPrefix}play audio ${video.url}`, buttonText: { displayText: '🎧 𝘼𝙐𝘿𝙄𝙊' }, type: 1 },
        { buttonId: `${usedPrefix}play video ${video.url}`, buttonText: { displayText: '🎬 𝙑𝙄𝘿𝙀𝙊' }, type: 1 }
    ];

    const caption = `
> 🎧 *Título:* ${video.title}
> ⏱️ *Duración:* ${video.timestamp}
> 👀 *Vistas:* ${video.views.toLocaleString()}
> 👤 *Subido por:* ${video.author.name}
> 🔗 *URL:* ${video.url}
`;

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