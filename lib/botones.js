// lib/botones.js
import { proto } from '@whiskeysockets/baileys'

export async function manejarRespuestasBotones(conn, m) {
  try {
    const btnMsg = m?.message?.buttonsResponseMessage || m?.message?.templateButtonReplyMessage
    if (!btnMsg) return false

    const command = btnMsg.selectedButtonId
    if (!command) return false

    console.log('✅ Botón presionado:', command)

    // Crear un mensaje falso simulando texto enviado
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
      sender: m.participant || m.key.participant || m.key.remoteJid,
    }

    // Ejecutar directamente el handler
    const handler = (await import('../handler.js')).default
    await handler.handler.call(conn, { messages: [fakeMessage] })

    return true
  } catch (err) {
    console.error('❌ Error en manejarRespuestasBotones:', err)
    return false
  }
}