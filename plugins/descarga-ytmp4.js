// Importa las librerías necesarias
import fetch from 'node-fetch';
import axios from 'axios';

// --- Constantes y Configuración de Transmisión ---
const NEVI_API_KEY = 'ellen';

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏᴇ\'s 𝐒ervice';

var handler = async (m, { conn, args, usedPrefix, command }) => {
    const name = conn.getName(m.sender);

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
            body: `✦ Esperando tu solicitud, ${name}.`,
            thumbnail: global.icons, // Asume que 'global.icons' está definido
            sourceUrl: global.redes, // Asume que 'global.redes' está definido
            mediaType: 1,
            renderLargerThumbnail: false
        }
    };

    if (!args[0]) {
        return conn.reply(
            m.chat,
            `Necesito el enlace de un video para continuar. Por favor, proporciona un enlace de YouTube.\n\n_Ejemplo: ${usedPrefix + command} https://youtube.com/watch?v=xxxxxxxxxxx_`,
            m,
            { contextInfo, quoted: m }
        );
    }

    await conn.reply(
        m.chat,
        `Procesando la solicitud. Esto puede tardar unos momentos.`,
        m,
        { contextInfo, quoted: m }
    );

    const url = args[0];

    try {
        // CAMBIO 1: Se usa el endpoint de la API en el puerto 5000
        const neviApiUrl = `http://neviapi.ddns.net:5000/download`;
        const res = await fetch(neviApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // CAMBIO 2: Se usa la clave de API simple sin SHA256
                'X-API-KEY': NEVI_API_KEY,
            },
            body: JSON.stringify({
                url: url,
                format: "mp4"
            }),
        });

        const json = await res.json();
        
        // CAMBIO 3: Se usa 'status' y 'download_link' que son los campos correctos de la API del puerto 5000
        if (json.status === "success" && json.download_link) {
            const titleFromApi = json.title || 'Título Desconocido';

            await conn.sendMessage(
                m.chat, {
                    video: { url: json.download_link },
                    caption: `*¡Video descargado con éxito!*
🎬 *Título:* ${titleFromApi}
`,
                    mimetype: 'video/mp4',
                    fileName: titleFromApi + '.mp4'
                }, { contextInfo, quoted: m }
            );

        } else {
            throw new Error(`No se pudo descargar el video. Razón: ${json.message || 'Respuesta inválida del servidor.'}`);
        }

    } catch (e) {
        console.error(e);

        await conn.reply(
            m.chat,
            `⚠️ Ha ocurrido un error al procesar la solicitud. Por favor, inténtalo de nuevo más tarde.\nDetalles: ${e.message}`,
            m,
            { contextInfo, quoted: m }
        );
    }
};

handler.help = ['ytmp4'].map(v => v + ' <enlace>');
handler.tags = ['descargas'];
handler.command = ['ytmp4', 'ytvideo', 'ytmp4dl'];
handler.register = true;
handler.limit = true;
handler.coin = 3;

export default handler;
