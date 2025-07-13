import axios from 'axios';
import fetch from 'node-fetch';

// --- Constantes y Configuración de Transmisión (Estilo Ellen Joe) ---
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏ𝐄\'s 𝐒ervice';

// --- Handler Principal (Lógica del Comando) ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
    const name = conn.getName(m.sender); // Identificando al Proxy

    // --- Contexto para las respuestas ---
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
            thumbnail: icons,
            sourceUrl: redes,
            mediaType: 1,
            renderLargerThumbnail: false
        }
    };

    if (!text) {
        return conn.reply(m.chat, `🦈 *Rastro frío, Proxy ${name}.* Necesito la designación de una pista o artista de Spotify.`, m, { contextInfo, quoted: m });
    }

    try {
        m.react('🔄'); // Reacción de procesamiento
        conn.reply(m.chat, `🔄 *Iniciando protocolo de extracción de Spotify, Proxy ${name}.* Aguarda, la decodificación de audio está en curso.`, m, { contextInfo, quoted: m });

        const songData = await searchAndDownloadSong(text);

        if (!songData) {
            await m.react('❌'); // Reacción de error
            throw `❌ *Fallo en la extracción, Proxy ${name}.*\nNo se encontró ninguna pista que coincida con "${text}" en Spotify. Verifica la designación.`;
        }

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
                    thumbnailUrl: songData.thumbnail,
                    sourceUrl: redes
                }
            }
        }, { quoted: m });

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
        conn.reply(m.chat, `⚠️ *Anomalía crítica en la operación Spotify, Proxy ${name}.*\nNo pude completar la extracción. Verifica los parámetros o informa del error.\nDetalles: ${e.message || e}`, m, { contextInfo, quoted: m });
    }
};

handler.help = ['spotify', 'splay'].map(v => v + ' <canción o artista>');
handler.tags = ['downloader'];
handler.command = ['spotify', 'splay'];
handler.group = true;
handler.register = true;

export default handler;

// --- Función Auxiliar Híbrida (Spotify + YouTube) ---
async function searchAndDownloadSong(query) {
    try {
        // --- PASO 1: Buscar la canción en Spotify para obtener los metadatos correctos ---
        console.log(`Buscando metadatos en Spotify para: "${query}"`);
        const spotifyApiUrl = `https://spotify-info.onrender.com/search?q=${encodeURIComponent(query)}`;
        const spotifyResponse = await axios.get(spotifyApiUrl);

        if (!spotifyResponse.data || spotifyResponse.data.length === 0) {
            console.error('La búsqueda en Spotify no arrojó resultados.');
            return null;
        }

        const spotifyTrack = spotifyResponse.data[0];
        const spotifyTitle = spotifyTrack.title;
        const spotifyArtist = spotifyTrack.artist;
        const preciseYoutubeQuery = `${spotifyTitle} - ${spotifyArtist}`;
        
        console.log(`Búsqueda precisa para YouTube: "${preciseYoutubeQuery}"`);

        // --- PASO 2: Usar los datos de Spotify para encontrar el audio en YouTube ---
        const youtubeApiUrl = `https://yt-downloader.onrender.com/search?q=${encodeURIComponent(preciseYoutubeQuery)}`;
        const youtubeResponse = await axios.get(youtubeApiUrl);
        
        if (!youtubeResponse.data || youtubeResponse.data.length === 0) {
            console.error('La búsqueda en YouTube no arrojó resultados para la consulta precisa.');
            return null;
        }

        const videoId = youtubeResponse.data[0].id;
        if (!videoId) {
            console.error('No se pudo obtener el ID del video de la búsqueda en YouTube.');
            return null;
        }

        const downloadInfoUrl = `https://yt-downloader.onrender.com/download?id=${videoId}`;
        const downloadInfoResponse = await axios.get(downloadInfoUrl);
        const downloadTrack = downloadInfoResponse.data;

        if (!downloadTrack || !downloadTrack.mp3 || !downloadTrack.mp3.url) {
             console.error('La API de descarga no proporcionó un enlace de audio (mp3).');
             return null;
        }

        // --- PASO 3: Devolver los datos de SPOTIFY con el enlace de descarga de YOUTUBE ---
        return {
            title: spotifyTrack.title,
            artists: spotifyTrack.artist,
            album: spotifyTrack.album,
            url: spotifyTrack.url,
            thumbnail: spotifyTrack.cover,
            downloadUrl: downloadTrack.mp3.url
        };

    } catch (error) {
        console.error('Error crítico en el proceso de búsqueda y descarga:', error.message);
        return null;
    }
}
