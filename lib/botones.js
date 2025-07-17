// lib/botones.js
import { proto } from '@whiskeysockets/baileys'

/**
 * Maneja respuestas de botones y reenvía el comando simulado al handler.
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {proto.IWebMessageInfo} m
 * @returns {Promise<boolean>}
 */
export async function manejarRespuestasBotones(conn, m) {
  try {
    // Asegurarse que el mensaje viene de un botón
    const isButton = !!m.message?.buttonsResponseMessage
    if (!isButton) return false

    const buttonId = m.message.buttonsResponseMessage.selectedButtonId
    if (!buttonId) return false

    // Crear un mensaje simulado como si el usuario hubiera escrito el comando
    const fakeMessage = {
      key: {
        remoteJid: m.key.remoteJid,
        fromMe: false,
        id: m.key.id,
        participant: m.participant || m.key.participant || m.key.remoteJid
      },
      message: {
        conversation: buttonId
      },
      pushName: m.pushName,
      sender: m.sender
    }

    // Emitir el nuevo mensaje al handler principal
    conn.emit('handler:command', fakeMessage)
    return true
  } catch (e) {
    console.error("❌ Error en manejarRespuestasBotones:", e)
    return false
  }
}