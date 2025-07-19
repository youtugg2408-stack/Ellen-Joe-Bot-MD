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
      console.log('⛔ No se detectó sticker válido. Tipo:', Object.keys(msgContent))
      return false
    }

    const hash = stickerMsg.fileSha256.toString('base64')
    console.log('✅ Hash detectado en grupo o priv:', hash)

    const sticker = global.db.data.sticker

    if (sticker[hash]) {
      const { text, mentionedJid } = sticker[hash]
      console.log('✅ Comando encontrado:', text)

      await conn.reply(m.chat, text, m, { mentions: mentionedJid || [] })
      return true
    }

    console.log('⚠️ El sticker no tiene comando registrado.')
    return false
  } catch (err) {
    console.error('❌ Error en manejarRespuestasStickers:', err)
    return false
  }
}