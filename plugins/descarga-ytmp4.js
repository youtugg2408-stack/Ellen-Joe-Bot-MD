import fetch from 'node-fetch';
import crypto from 'crypto'; // Necesitas importar el módulo crypto para el hash SHA-256

// --- Constantes y Configuración de Transmisión ---
// Las variables de la API de NEVI se han movido aquí para el manejador
const NEVI_API_KEY = 'ellen'; 
const NEVI_API_KEY_SHA256 = crypto.createHash('sha256').update(NEVI_API_KEY).digest('hex');

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏᴇ\'s 𝐒ervice';

var handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = conn.getName(m.sender); // Identificando al Proxy

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

  try {
    await conn.reply(
      m.chat,
      `🔄 *Decodificando la señal, Proxy ${name}.* Aguarda. La presa está al alcance.`,
      m,
      { contextInfo, quoted: m }
    );

    const url = args[0];
    
    // --- Lógica para la NEVI API ---
    const neviApiUrl = `http://neviapi.ddns.net:8000/youtube`;
    const res = await fetch(neviApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Sha256': NEVI_API_KEY_SHA256,
      },
      body: JSON.stringify({
        url: url,
        format: "mp4" // La API de NEVI requiere el formato explícito
      }),
    });

    const json = await res.json();

    if (json.ok && json.download_url) {
        // Enviar video si la respuesta es exitosa
        await conn.sendMessage(
            m.chat,
            {
                video: { url: json.download_url },
                caption:
`╭━━━━[ 𝚈𝚃𝙼𝙿𝟺 𝙳𝚎𝚌𝚘𝚍𝚎𝚍: 𝙿𝚛𝚎𝚜𝚊 𝙲𝚊𝚙𝚝𝚞𝚛𝚊𝚍𝚊 ]━━━━⬣
📹 *Designación:* ${json.info.title}
🧑‍💻 *Fuente Operacional:* ${json.info.author}
🕒 *Duración del Flujo:* ${json.info.timestamp}
👁️ *Registros de Observación:* ${json.info.views.toLocaleString()}
📄 *Manifiesto de Carga:*
${json.info.description}
╰━━━━━━━━━━━━━━━━━━⬣`,
                mimetype: 'video/mp4',
                fileName: json.info.title + '.mp4'
            },
            { contextInfo, quoted: m }
        );
    } else {
        throw new Error(`Extracción de video fallida, Proxy ${name}. La señal es inestable. Razón: ${json.message || 'Respuesta inválida del servidor.'}`);
    }

  } catch (e) {
    console.error(e);
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
