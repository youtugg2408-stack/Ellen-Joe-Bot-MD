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
      // console.log('⛔ No se detectó sticker válido o hash. Tipo:', Object.keys(msgContent)) // Keep for initial debugging if needed
      return false
    }

    const fileSha256Buffer = Buffer.from(stickerMsg.fileSha256);
    const hash = fileSha256Buffer.toString('base64');

    // console.log('✅ Hash detectado en grupo o priv:', hash) // Keep for debugging

    if (!global.db || !global.db.data || !global.db.data.sticker) {
      // console.log('❌ global.db.data.sticker no está inicializado o cargado.') // Keep for debugging
      return false
    }

    // console.log('📋 Contenido de global.db.data.sticker (primeras 5 entradas para no saturar):') // Keep for debugging
    // const stickerKeys = Object.keys(global.db.data.sticker); // Keep for debugging
    // stickerKeys.slice(0, 5).forEach(key => { // Keep for debugging
    //   console.log(`    - Hash: ${key}, Comando: ${global.db.data.sticker[key].text}`); // Keep for debugging
    // }); // Keep for debugging
    // if (stickerKeys.length > 5) { // Keep for debugging
    //   console.log(`    ... y ${stickerKeys.length - 5} entradas más.`); // Keep for debugging
    // } // Keep for debugging

    const sticker = global.db.data.sticker

    if (sticker[hash]) {
      const { text, mentionedJid } = sticker[hash]
      // console.log('✅ Comando encontrado para el hash:', text) // Keep for debugging

      // --- CRITICAL CORRECTION HERE ---
      // 1. Ensure mentionedJid is an array.
      // 2. Filter out any non-string or empty JIDs.
      // 3. Ensure m.chat is a valid string JID for the reply.
      const validMentions = Array.isArray(mentionedJid)
        ? mentionedJid.filter(jid => typeof jid === 'string' && jid.length > 0)
        : [];

      // Ensure m.chat is always a string and not empty
      const targetChat = typeof m.chat === 'string' && m.chat.length > 0 ? m.chat : null;

      if (!targetChat) {
        console.error('❌ Error: m.chat es inválido o no está definido. No se puede responder.');
        return false;
      }

      await conn.reply(targetChat, text, m, { mentions: validMentions });
      return true
    }

    // console.log('⚠️ El sticker no tiene comando registrado para el hash:', hash) // Keep for debugging
    return false
  } catch (err) {
    console.error('❌ Error en manejarRespuestasStickers:', err)
    return false
  }
}
