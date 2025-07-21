// lib/stickers.js

/**
 * Maneja respuestas automáticas a stickers guardados por hash.
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} m
 * @returns {Promise<boolean>}
 */
export async function manejarRespuestasStickers(conn, m) {
  try {
    const msgContent = m.message || {}
    const stickerMsg = msgContent.stickerMessage || msgContent?.ephemeralMessage?.message?.stickerMessage

    if (!stickerMsg || !stickerMsg.fileSha256) {
      console.log('⛔ No se detectó sticker válido o hash. Tipo:', Object.keys(msgContent))
      return false
    }

    const fileSha256Buffer = Buffer.from(stickerMsg.fileSha256);
    const hash = fileSha256Buffer.toString('base64');

    console.log('✅ Hash detectado en grupo o priv:', hash)

    if (!global.db || !global.db.data || !global.db.data.sticker) {
      console.log('❌ global.db.data.sticker no está inicializado o cargado.')
      return false
    }
    console.log('📋 Contenido de global.db.data.sticker (primeras 5 entradas para no saturar):')
    const stickerKeys = Object.keys(global.db.data.sticker);
    stickerKeys.slice(0, 5).forEach(key => {
      console.log(`    - Hash: ${key}, Comando: ${global.db.data.sticker[key].text}`);
    });
    if (stickerKeys.length > 5) {
      console.log(`    ... y ${stickerKeys.length - 5} entradas más.`);
    }

    const sticker = global.db.data.sticker

    if (sticker[hash]) {
      const { text, mentionedJid } = sticker[hash]
      console.log('✅ Comando encontrado para el hash:', text)

      // --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
      // Aseguramos que mentionedJid es un array válido.
      // Si no existe, es null, o no es un array, se usará un array vacío.
      const validMentions = Array.isArray(mentionedJid) ? mentionedJid : [];

      await conn.reply(m.chat, text, m, { mentions: validMentions })
      // ---------------------------------
      return true
    }

    console.log('⚠️ El sticker no tiene comando registrado para el hash:', hash)
    return false
  } catch (err) {
    console.error('❌ Error en manejarRespuestasStickers:', err)
    return false
  }
}
