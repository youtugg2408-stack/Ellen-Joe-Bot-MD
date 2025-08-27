// ... (Tus importaciones y variables)
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏᴇ\'s 𝐒ervice';
const packname = '˚🄴🄻🄻🄴🄽-🄹🄾🄴-🄱🄾🅃';

/**
 * Plugin centralizado para manejar todos los mensajes de error de permisos.
 * @param {string} type - El tipo de error (ej. 'admin', 'owner', 'unreg').
 * @param {object} conn - La conexión del bot.
 * @param {object} m - El objeto del mensaje.
 * @param {string} comando - El nombre del comando que se intentó usar.
 * @param {string} translatedMsg - El mensaje de error ya traducido. <-- AÑADE ESTE PARÁMETRO
 */
const handler = (type, conn, m, comando, translatedMsg) => {
    // Objeto con todos los posibles mensajes de error.
    // YA NO ES NECESARIO HACER ESTO, YA RECIBES EL MENSAJE TRADUCIDO
    /*
    const msg = {
        rowner: `...`,
        owner: `...`,
        // ... etc
    }[type];
    */

    // Usa directamente el mensaje traducido que recibes como argumento
    const msg = translatedMsg; 
    
    // Si se encontró un mensaje para el 'type' dado, se envía.
    if (msg) {
        // --- CONSTRUCCIÓN DEL CONTEXTINFO ---
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
                title: packname,
                body: '🦈 ¡Acceso Denegado! 🦈',
                thumbnailUrl: icons,
                sourceUrl: redes,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        };

        // Se envía el mensaje de error utilizando el contextInfo creado.
        return conn.reply(m.chat, msg, m, { contextInfo }).then(_ => m.react('✖️'));
    }
    return true; // Devuelve true si no hay mensaje, para seguir el flujo si es necesario.
};

// Exportamos la función para poder importarla desde handler.js
export default handler;
