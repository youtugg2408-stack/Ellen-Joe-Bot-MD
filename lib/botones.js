// lib/botones.js
import { proto } from '@whiskeysockets/baileys'

/**
 * Maneja respuestas de botones (privado y grupos) y reenvía como comando textual.
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {proto.IWebMessageInfo} m
 * @returns {Promise<boolean>}
 */
export async function manejarRespuestasBotones(conn, m) {
  try {
    const btnMsg =
      m?.message?.buttonsResponseMessage ||
      m?.message?.templateButtonReplyMessage
    if (!btnMsg) return false

    const command = btnMsg.selectedButtonId
    if (!command) return false

    console.log('✅ Botón presionado:', command)

    const fakeMessage = {
      key: {
        remoteJid: m.key.remoteJid,
        fromMe: false,
        id: m.key.id,
        participant: m.participant || m.key.participant || m.key.remoteJid
      },
      message: {
        conversation: command
      },
      pushName: m.pushName || '',
      sender: m.participant || m.key.participant || m.key.remoteJid
    }

    // Importa handler.js correctamente (asegúrate de export default { handler } en handler.js)
    if (typeof global.dispatchCommandFromButton === 'function') {
  await global.dispatchCommandFromButton(fakeMessage)
}

    // Llama directamente el handler con el mensaje simulado
    await handler.handler.call(conn, { messages: [fakeMessage] })

    return true
  } catch (err) {
    console.error('❌ Error en manejarRespuestasBotones:', err)
    return false
  }
}