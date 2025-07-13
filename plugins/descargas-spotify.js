import axios from 'axios';
import fetch from 'node-fetch';

// --- Constantes y Configuración de Transmisión (Estilo Ellen Joe) ---
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏ𝐄\'s 𝐒ervice';

// --- Handler Principal (Lógica del Comando) ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
    const name = conn.getName(m.sender); // Identificando al Proxy

    // --- Contexto para las respuestas ---
    // Asegúrate de que las variables 'icons' y 'redes' estén definidas globalmente
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
            thumbnail: icons, // ✅ Usando la variable global 'icons'
            sourceUrl: redes, // ✅ Usando la variable global 'redes'
            mediaType: 1,
            renderLargerThumbnail: false
        }
    };

    if (!text) {
        return conn.reply(m.chat, `🦈 *Rastro frío, Proxy ${name}.* Necesito la designación de una pista o artista.`, m, { contextInfo, quoted: m });
    }

    try {
        m.react('🔄'); // Reacción de procesamiento
        conn.reply(m.chat, `🔄 *Iniciando protocolo de extracción, Proxy ${name}.* Aguarda, la decodificación de audio está en curso.`, m, { contextInfo, quoted: m });

        // --- Búsqueda y obtención de la canción usando la nueva API ---
        const songData = await searchAndDownloadSong(text);

        if (!songData) {
            await m.react('❌'); // Reacción de error
            throw `❌ *Fallo en la extracción, Proxy ${name}.*\nNo se encontró ninguna pista que coincida con "${text}". Verifica la designación.`;
        }

        // --- Mensaje con la información de la pista ---
        const info = `
╭━━━━[ 𝚂𝚙𝚘𝚝𝚒𝚏𝚢 𝙳𝚎𝚌𝚘𝚍𝚎𝚍: 𝙿𝚒𝚜𝚝𝚊 𝙰𝚜𝚎𝚐𝚞𝚛𝚊𝚍𝚊 ]━━━━⬣
🎵 *Designación de Pista:* ${songData.title}
👤 *Agente Creador:* ${songData.artists}
💽 *Identificador de Álbum:* ${songData.album}
🔗 *Enlace de Origen:* ${songData.url}
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
                    title: 'Ellen Joe: Pista asegurada. 🦈',
                    body: `Reproduciendo: ${songData.title} - ${songData.artists}`,
                    mediaType: 1,
                    thumbnailUrl: songData.thumbnail, // El thumbnail de la canción se mantiene dinámico
                    sourceUrl: redes // ✅ Usando la variable global 'redes'
                }
            }
        }, { quoted: m });

        // --- Envío del archivo de audio ---
        conn.sendMessage(m.chat, {
            audio: { url: songData.downloadUrl },
            fileName: `${songData.title}.mp3`,
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: m });

        m.react('✅'); // Reacción de éxito

    } catch (e) {
        console.error("Error en la operación Spotify:", e);
        m.react('❌');
        conn.reply(m.chat, `⚠️ *Anomalía crítica en la operación, Proxy ${name}.*\nNo pude completar la extracción. Verifica los parámetros o informa del error.\nDetalles: ${e.message || e}`, m, { contextInfo, quoted: m });
    }
};

handler.help = ['spotify', 'music'].map(v => v + ' <nombre de la canción/artista>');
handler.tags = ['downloader'];
handler.command = ['spotify', 'splay'];
handler.group = true;
handler.register = true;

export default handler;

// --- Nueva Función Auxiliar para buscar y descargar música ---
async function searchAndDownloadSong(query) {
    try {
        const response = await axios.get(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(query)}`);
        const track = response.data.result;

        if (!track || !track.download) {
            throw new Error('No se encontró la pista o el enlace de descarga en la respuesta de la API.');
        }

        return {
            title: track.name,
            artists: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            url: track.url,
            thumbnail: track.cover,
            downloadUrl: track.download
        };
    } catch (error) {
        console.error('Error en la búsqueda de Spotify, intentando con YouTube:', error.message);
        try {
            const ytResponse = await axios.get(`https://api.fabdl.com/youtube/get?url=${encodeURIComponent(query)}`);
            const ytTrack = ytResponse.data.result;

            if (!ytTrack || !ytTrack.download || ytTrack.download.length === 0) {
                 return null;
            }
            
            const audioDownload = ytTrack.download.find(f => f.format === 'mp3-128') || ytTrack.download.find(f => f.format.includes('mp3'));

            if (!audioDownload) {
                return null;
            }

            return {
                title: ytTrack.title,
                artists: ytTrack.channel,
                album: 'YouTube',
                url: query,
                thumbnail: ytTrack.thumbnail,
                downloadUrl: audioDownload.url
            }
        } catch (ytError) {
            console.error('Error en la búsqueda de respaldo en YouTube:', ytError);
            return null;
        }
    }
}
