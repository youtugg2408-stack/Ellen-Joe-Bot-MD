// lib/stickers.js

/**
 * Maneja respuestas automáticas a stickers guardados por hash.
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} m
 * @returns {Promise<boolean>}
 */
export async function manejarRespuestasStickers(conn, m) {
  try {
    if (!m.msg || !m.msg.fileSha256) return false;

    const hash = m.msg.fileSha256.toString('base64');
    const sticker = global.db.data.sticker;

    if (sticker[hash]) {
      const { text, mentionedJid } = sticker[hash];
      await conn.reply(m.chat, text, m, { mentions: mentionedJid || [] });
      return true;
    }

    return false;
  } catch (err) {
    console.error('❌ Error en manejarRespuestasStickers:', err)
    return false;
  }
}