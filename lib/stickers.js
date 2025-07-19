// lib/stickers.js

/**
 * Maneja respuestas automáticas a stickers guardados por hash.
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} m
 * @returns {Promise<boolean>}
 */
export async function manejarRespuestasStickers(conn, m) {
  try {
    console.log('🔍 Buscando sticker en mensaje...')

    // Detectar hash desde donde sea
    const fileSha256 =
      m?.msg?.fileSha256 ||
      m?.message?.stickerMessage?.fileSha256 ||
      m?.message?.documentMessage?.fileSha256

    if (!fileSha256) {
      console.log('⛔ No se encontró fileSha256 en el mensaje.')
      return false
    }

    const hash = fileSha256.toString('base64')
    console.log('✅ Hash detectado:', hash)

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