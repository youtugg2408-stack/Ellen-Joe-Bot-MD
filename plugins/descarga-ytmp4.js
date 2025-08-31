import fetch from 'node-fetch';
import crypto from 'crypto';

// --- Constantes y Configuración de Transmisión ---
const NEVI_API_KEY = 'ellen';
const NEVI_API_KEY_SHA256 = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏᴇ\'s 𝐒ervice';

// --- Función para notificar a la API de NEVI ---
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
            body: `✦ 𝙀𝙨𝙥𝙚𝙧𝙖𝙣𝙙𝙤 𝙩𝙪 𝙨𝙤𝙡𝙞𝙘𝙞𝙩𝙪𝙙, ${name}. ♡~٩( ˃▽˂ )۶~♡`,
            thumbnail: global.icons,
            sourceUrl: global.redes,
            mediaType: 1,
            renderLargerThumbnail: false
        }
    };

    if (!args[0]) {
        return conn.reply(
            m.chat,
            `🦈 *Rastro frío, Proxy ${name}.* Necesito un identificador de video para proceder. Dame el enlace.\n\n_Ejemplo: ${usedPrefix + command} https://youtube.com/watch?v=xxxxxxxxxxx_`,
            m,
            { contextInfo, quoted: m }
        );
    }

    await conn.reply(
        m.chat,
        `🔄 *Decodificando la señal, Proxy ${name}.* Aguarda. La presa está al alcance.`,
        m,
        { contextInfo, quoted: m }
    );

    const url = args[0];
    let neviDownloadId = null;

    try {
        const neviApiUrl = `http://neviapi.ddns.net:8000/youtube`;
        const res = await fetch(neviApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Sha256': NEVI_API_KEY_SHA256,
            },
            body: JSON.stringify({
                url: url,
                format: "mp4"
            }),
        });

        const json = await res.json();
        neviDownloadId = json.id;

        if (json.ok && json.download_url) {
            await conn.sendMessage(
                m.chat, {
                    video: { url: json.download_url },
                    caption:
`╭━━━━[ 𝚈𝚃𝙼𝙿𝟺 𝙳𝚎𝚌𝚘𝚍𝚎𝚍: 𝙿𝚛𝚎𝚜𝚊 𝙲𝚊𝚙𝚝𝚞𝚛𝚊𝚍𝚊 ]━━━━⬣
📹 *Designación:* ${json.info.title}
🧑‍💻 *Fuente Operacional:* ${json.info.uploader}
🕒 *Duración del Flujo:* ${json.info.duration}
👁️ *Registros de Observación:* ${json.info.view_count.toLocaleString()}
📄 *Manifiesto de Carga:*
${json.info.description || 'Descripción no disponible.'}
╰━━━━━━━━━━━━━━━━━━⬣`,
                    mimetype: 'video/mp4',
                    fileName: json.info.title + '.mp4'
                }, { contextInfo, quoted: m }
            );

            await notifyApiDone(neviDownloadId, true);

        } else {
            throw new Error(`Extracción de video fallida, Proxy ${name}. La señal es inestable. Razón: ${json.message || 'Respuesta inválida del servidor.'}`);
        }

    } catch (e) {
        console.error(e);

        if (neviDownloadId) {
            await notifyApiDone(neviDownloadId, false);
        }

        await conn.reply(
            m.chat,
            `⚠️ *Anomalía detectada, Proxy ${name}.*\nNo pude asegurar la carga de video. Repórtalo si persiste.\nDetalles: ${e.message}`,
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
