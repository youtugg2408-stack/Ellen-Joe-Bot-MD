import axios from 'axios';
import fetch from 'node-fetch';

// --- Constantes y Configuración de Transmisión (Estilo Ellen Joe) ---
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏ𝐄\'s 𝐒ervice';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const name = conn.getName(m.sender); // Identifying the Proxy

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
            title: 'Ellen Joe: Pista localizada. 🦈',
            body: `Procesando solicitud para el/la Proxy ${name}...`,
            thumbnail: icons, // Ensure 'icons' and 'redes' are globally defined
            sourceUrl: redes,
            mediaType: 1,
            renderLargerThumbnail: false
        }
    };

    if (!text) {
        return conn.reply(m.chat, `🦈 *Rastro frío, Proxy ${name}.* Necesito la designación de una pista o artista de Spotify.`, m, { contextInfo, quoted: m });
    }

    try {
        m.react('🔄'); // Processing reaction
        conn.reply(m.chat, `🔄 *Iniciando protocolo de extracción de Spotify, Proxy ${name}.* Aguarda, la decodificación de audio está en curso.`, m, { contextInfo, quoted: m });

        let songInfo = await spotifyxv(text);
        if (!songInfo.length) {
            await m.react('❌'); // Error reaction
            throw `❌ *Fallo en la extracción, Proxy ${name}.*\nNo se encontró ninguna pista que coincida con "${text}". Verifica la designación.`;
        }

        let song = songInfo[0];
        const res = await fetch(`https://archive-ui.tanakadomp.biz.id/download/spotify?url=${song.url}`);

        if (!res.ok) {
            await m.react('❌'); // Error reaction
            throw `❌ *Fallo en la transmisión de datos, Proxy ${name}.*\nCódigo de estado de la API: ${res.status}.`;
        }

        const data = await res.json().catch((e) => {
            console.error('Error parsing JSON:', e);
            throw `❌ *Anomalía de datos, Proxy ${name}.*\nError al analizar la respuesta del servidor.`;
        });

        if (!data || !data.result || !data.result.data || !data.result.data.download) {
            await m.react('❌'); // Error reaction
            throw `❌ *Carga de audio fallida, Proxy ${name}.*\nNo se pudo obtener el enlace de descarga de la pista.`;
        }

        const info = `
╭━━━━[ 𝚂𝚙𝚘𝚝𝚒𝚏𝚢 𝙳𝚎𝚌𝚘𝚍𝚎𝚍: 𝙿𝚒𝚜𝚝𝚊 𝙰𝚜𝚎𝚐𝚞𝚛𝚊𝚍𝚊 ]━━━━⬣
🎵 *Designación de Pista:* ${data.result.data.title}
👤 *Agente Creador:* ${data.result.data.artis}
💽 *Identificador de Álbum:* ${song.album}
⏱️ *Duración del Flujo:* ${timestamp(data.result.data.durasi)}
🔗 *Enlace de Origen:* ${song.url}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

        await conn.sendMessage(m.chat, {
            text: info,
            contextInfo: {
                forwardingScore: 9999999,
                isForwarded: false,
                externalAdReply: {
                    showAdAttribution: true,
                    containsAutoReply: true,
                    renderLargerThumbnail: true,
                    title: 'Ellen Joe: Pista asegurada. 🦈', // Consistent title
                    body: `Reproduciendo: ${data.result.data.title} - ${data.result.data.artis}`, // Dynamic body
                    mediaType: 1,
                    thumbnailUrl: data.result.data.image,
                    mediaUrl: data.result.data.download, // This URL is not for viewing, but for the actual audio
                    sourceUrl: data.result.data.download // Same as above, source of the audio
                }
            }
        }, { quoted: m });

        conn.sendMessage(m.chat, { audio: { url: data.result.data.download }, fileName: `${data.result.data.title}.mp3`, mimetype: 'audio/mp4', ptt: false }, { quoted: m });
        m.react('✅'); // Success reaction

    } catch (e1) {
        console.error("Error al procesar Spotify:", e1);
        conn.reply(m.chat, `⚠️ *Anomalía crítica en la operación Spotify, Proxy ${name}.*\nNo pude completar la extracción. Verifica los parámetros o informa del error.\nDetalles: ${e1.message || e1}`, m, { contextInfo, quoted: m });
    }
};

handler.help = ['spotify', 'music'].map(v => v + ' <song/artist name>');
handler.tags = ['downloader'];
handler.command = ['spotify', 'splay'];
handler.group = true;
handler.register = true;

export default handler;

// --- Funciones auxiliares (mantienen su lógica original) ---

async function spotifyxv(query) {
    let token = await tokens();
    let response = await axios({
        method: 'get',
        url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, // Correct Spotify API search endpoint
        headers: {
            Authorization: 'Bearer ' + token
        }
    });
    const tracks = response.data.tracks.items;
    const results = tracks.map((track) => ({
        name: track.name,
        artista: track.artists.map((artist) => artist.name).join(', '), // Join artists
        album: track.album.name,
        duracion: track.duration_ms, // Keep as milliseconds for timestamp conversion
        url: track.external_urls.spotify,
        imagen: track.album.images.length ? track.album.images[0].url : ''
    }));
    return results;
}

async function tokens() {
    // This client ID and secret are publicly known for Spotify API, but in a real scenario
    // consider using environment variables or a more secure method.
    const clientId = 'acc6302297e040aab6e4ac1fbdfd62c3';
    const clientSecret = '0e8439a1280a43aba9a5bc0a16f3f009';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token', // Correct Spotify API token endpoint
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + credentials
        },
        data: 'grant_type=client_credentials'
    });
    return response.data.access_token;
}

function timestamp(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

// These functions were in the original code but not used by the handler.
// Keeping them for completeness but they are not strictly necessary for this specific handler's logic.
/*
async function getBuffer(url, options) {
    try {
        options = options || {};
        const res = await axios({
            method: 'get',
            url,
            headers: {
                DNT: 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        return err;
    }
}

async function getTinyURL(text) {
    try {
        let response = await axios.get(`https://tinyurl.com/api-create.php?url=${text}`);
        return response.data;
    } catch (error) {
        return text;
    }
}
*/
