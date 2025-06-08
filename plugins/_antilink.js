let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
let linkRegex1 = /whatsapp\.com\/channel\/([0-9A-Za-z]{20,24})/i;

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
  if (!m.isGroup) return;

  // Si es admin, owner o mensaje propio, no aplicar antilink
  if (isAdmin || isOwner || m.fromMe || isROwner) return;

  let chat = global.db.data.chats[m.chat];
  if (!chat.antiLink) return;

  const user = `@${m.sender.split('@')[0]}`;
  const groupAdmins = participants.filter(p => p.admin);
  const isSenderAdmin = groupAdmins.some(p => p.id === m.sender);
  const currentGroupLink = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`;
  const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text);

  // Si contiene un link de grupo
  if (isGroupLink) {
    // Si es el mismo link del grupo, ignorar
    if (m.text.includes(currentGroupLink)) return;

    // Reforzamos verificación: si es admin, no hacer nada
    if (isSenderAdmin) {
      return m.reply(`✦ El antilink está activo pero te salvaste por ser admin.`);
    }

    // Aviso de que será eliminado
    await conn.sendMessage(m.chat, {
      text: `*「 ENLACE DETECTADO 」*\n\n《✧》${user} rompiste las reglas del grupo y serás eliminado...`,
      mentions: [m.sender]
    }, { quoted: m });

    // Si bot no es admin, no puede eliminar
    if (!isBotAdmin) {
      return conn.sendMessage(m.chat, {
        text: `✦ El antilink está activo pero no puedo eliminar a ${user} porque no soy admin.`,
        mentions: [...groupAdmins.map(v => v.id)]
      }, { quoted: m });
    }

    // Eliminar mensaje y expulsar usuario
    await conn.sendMessage(m.chat, {
      delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant }
    });

    const res = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
    if (res[0]?.status === "404") return; // Usuario ya no está
  }

  return true;
}
