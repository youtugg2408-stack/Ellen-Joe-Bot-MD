import db from '../lib/database.js'

let handler = m => m

handler.before = async function (m, { conn, isAdmin, isBotAdmin }) {
  const botJid = conn.user.jid // este es el número del bot actual
  const sender = m.sender
  const chatId = m.chat
  const isPrivate = !m.isGroup
  const numero = sender.split('@')[0]
  const prefijosBloqueados = ['6', '90', '212', '92', '93', '94', '7', '49', '2', '91', '48']

  // Inicializa datos si no existen
  global.db.data.settings = global.db.data.settings || {}
  global.db.data.settings[botJid] = global.db.data.settings[botJid] || {}

  if (!isPrivate) {
    // ========== ANTIFAKE EN GRUPOS ==========
    let chat = global.db.data.chats[chatId]
    if (isBotAdmin && chat?.antifake) {
      for (let prefijo of prefijosBloqueados) {
        if (numero.startsWith(prefijo)) {
          global.db.data.users[sender].block = true
          await conn.groupParticipantsUpdate(chatId, [sender], 'remove')
          break
        }
      }
    }
  } else {
    // ========== ANTIFAKE EN PRIVADO ==========
    let antifakePriv = global.db.data.settings[botJid].antifakePriv
    if (antifakePriv) {
      for (let prefijo of prefijosBloqueados) {
        if (numero.startsWith(prefijo)) {
          global.db.data.users[sender].block = true
          try {
            await conn.sendMessage(sender, { text: '🚫 Usuario bloqueado por antifake.' })
          } catch {}
          await conn.chatModify({ clear: { messages: [{ id: m.key.id }] } }, sender)
          await conn.updateBlockStatus(sender, 'block')
          break
        }
      }
    }
  }
}

export default handler