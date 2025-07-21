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

    // Only process if it's a button message
    if (!btnMsg) return false

    // --- NEW: Check if it's a group message ---
    // If m.key.remoteJid ends with '@g.us', it's a group chat.
    // If it doesn't end with '@g.us', it's a private chat (or status, etc.).
    if (!m.key.remoteJid || !m.key.remoteJid.endsWith('@g.us')) {
      return false // Ignore if not a group
    }
    // --- END NEW CHECK ---

    const command = btnMsg.selectedButtonId
    if (!command) return false

    // Construct a fake message to simulate a text command
    const fakeMessage = {
      key: {
        remoteJid: m.key.remoteJid,
        fromMe: false, // Ensure it's treated as from another user
        id: m.key.id,
        participant: m.participant || m.key.participant || m.key.remoteJid // Original sender's JID
      },
      message: {
        conversation: command // The button's ID becomes the message text
      },
      pushName: m.pushName || '', // Preserve original sender's name
      sender: m.participant || m.key.participant || m.key.remoteJid // Ensure sender is correctly set
    }

    // If a global custom dispatch function exists, use it
    if (typeof global.dispatchCommandFromButton === 'function') {
      await global.dispatchCommandFromButton(fakeMessage)
    }

    // Call the main handler with the simulated message
    // Note: Assuming 'handler' is globally accessible here.
    // If 'handler' is imported or defined elsewhere, ensure its scope is correct.
    await handler.handler.call(conn, { messages: [fakeMessage] })

    return true
  } catch (err) {
    console.error('❌ Error en manejarRespuestasBotones:', err)
    return false
  }
}
