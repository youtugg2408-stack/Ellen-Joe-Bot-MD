// lib/botones.js
import { proto } from '@whiskeysockets/baileys'

/**
 * Maneja respuestas de botones (solo en grupos) y reenvía como comando textual.
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

    // Ensure it's a group message. If not, stop here.
    if (!m.key.remoteJid || !m.key.remoteJid.endsWith('@g.us')) {
      return false
    }

    const command = btnMsg.selectedButtonId
    if (!command) return false

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

    // If a global custom dispatch function exists, use it.
    if (typeof global.dispatchCommandFromButton === 'function') {
      await global.dispatchCommandFromButton(fakeMessage)
    }

    // Call the main handler with the simulated message.
    // Ensure 'handler' is globally accessible in your bot's scope.
    await handler.handler.call(conn, { messages: [fakeMessage] })

    return true
  } catch (err) {
    // Keep the error log for unexpected issues.
    console.error('❌ Error en manejarRespuestasBotones:', err)
    return false
  }
}
