// lib/stickers.js

/**
 * Maneja respuestas automáticas a stickers guardados por hash.
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} m
 * @returns {Promise<boolean>}
 */
export async function manejarRespuestasStickers(conn, m) {
  try {
    console.log('🔍 Verificando si el mensaje tiene sticker...')

    if (!m.msg) {
      console.log('⛔ No hay mensaje (`m.msg`)')
      return false
    }

    if (!m.msg.fileSha256) {
      console.log('⛔ No es un sticker válido (no tiene `fileSha256`)')
      return false
    }

    const hash = m.msg.fileSha256.toString('base64')
    console.log('✅ Hash del sticker:', hash)

    const sticker = global.db.data.sticker

    if (sticker[hash]) {
      const { text, mentionedJid } = sticker[hash]
      console.log('✅ Comando encontrado para este sticker:', text)

      await conn.reply(m.chat, text, m, {
        mentions: mentionedJid || [],
      })

      return true
    } else {
      console.log('⚠️ Sticker no registrado en la base de datos.')
    }

    return false
  } catch (err) {
    console.error('❌ Error en manejarRespuestasStickers:', err)
    return false
  }
}