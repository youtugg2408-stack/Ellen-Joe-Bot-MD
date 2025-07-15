// Versión Final de kickdel.js (la más robusta)
let handler = async (m, { conn, usedPrefix, command }) => {
    if (!m.isGroup) {
        return conn.reply(m.chat, `🛡️ Este comando solo funciona en grupos.`, m);
    }
    if (!m.quoted) {
        return conn.reply(m.chat, `🛡️ Debes citar el mensaje de un usuario.\n\n*Ejemplo:*\n${usedPrefix + command}`, m);
    }

    const isDebugMode = m.text.includes('-debug on');

    try {
        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        
        // Esta es la línea clave. Obtiene el ID del bot que la sesión actual está usando.
        // En un grupo con LIDs, esta variable debería contener el @lid de tu bot.
        const botId = conn.authState.creds.me.id;
        
        const botIsAdmin = groupAdmins.includes(botId);
        const userIsAdmin = groupAdmins.includes(m.sender);

        if (isDebugMode) {
            const debugMessage = `*--- 🐞 MODO DEBUG FINAL 🐞 ---*
*ID del Bot (Desde AuthState):* \`${botId}\`
*¿Este ID está en la lista de Admins?:* ${botIsAdmin ? '✅ Sí' : '❌ No'}
*Admins Detectados:*
\`\`\`${JSON.stringify(groupAdmins, null, 2)}\`\`\``;
            await conn.reply(m.chat, debugMessage, m);
        }

        if (!botIsAdmin) {
            return conn.reply(m.chat, `❌ El bot necesita ser administrador para usar este comando.`, m);
        }
        if (!userIsAdmin) {
            return conn.reply(m.chat, `❌ Solo los administradores pueden usar este comando.`, m);
        }

        let targetUser = m.quoted.sender;
        if (targetUser === botId) {
            return conn.reply(m.chat, `😂 No me puedo auto-expulsar.`, m);
        }
        
        // Resto de las verificaciones de seguridad...
        const targetIsAdmin = groupAdmins.includes(targetUser);
        if (targetIsAdmin) {
             return conn.reply(m.chat, `🛡️ No puedo eliminar a otro administrador.`, m);
        }

        // Ejecutar acción
        await conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
        await conn.groupParticipantsUpdate(m.chat, [targetUser], 'remove');
        await conn.reply(m.chat, `✅ ¡Hecho! Se eliminó el mensaje y se expulsó al usuario.`, m);

    } catch (e) {
        console.error(e);
        await conn.reply(m.chat, `❌ Ocurrió un error: ${e.message}`, m);
    }
};

handler.help = ['kickdel'];
handler.tags = ['grupo'];
handler.command = ['kickdel'];

export default handler;
