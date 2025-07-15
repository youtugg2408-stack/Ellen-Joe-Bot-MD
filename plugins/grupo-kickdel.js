let handler = async (m, { conn, usedPrefix, command }) => {
    // --- Verificación Interna #1: Uso en Grupo y Mensaje Citado ---
    if (!m.isGroup) {
        return conn.reply(m.chat, `🛡️ Este comando solo se puede usar en grupos.`, m);
    }
    if (!m.quoted) {
        return conn.reply(m.chat, `🛡️ Debes citar el mensaje del usuario que deseas expulsar y eliminar.\n\n*Ejemplo:*\n${usedPrefix + command}`, m);
    }

    // --- Activación del Modo Debug ---
    // Comprueba si el texto del comando incluye el flag '-debug on'
    const isDebugMode = m.text.includes('-debug on');

    try {
        // --- Obtener Metadatos y Roles ---
        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        
        // Usamos conn.user.id que es más consistente.
        const botId = conn.user.id || conn.user.jid; 
        const botIsAdmin = groupAdmins.includes(botId);
        const userIsAdmin = groupAdmins.includes(m.sender);

        // --- Si el Modo Debug está activado, envía toda la información al chat ---
        if (isDebugMode) {
            const debugMessage = `*--- 🐞 MODO DEBUG ACTIVADO 🐞 ---*

*ℹ️ Información General:*
- *ID del Bot:* \`${botId}\`
- *ID del Usuario (Sender):* \`${m.sender}\`
- *ID del Grupo:* \`${m.chat}\`

*🔑 Verificación de Permisos:*
- *¿El Bot es Admin?:* ${botIsAdmin ? '✅ Sí' : '❌ No'}
- *¿El Usuario es Admin?:* ${userIsAdmin ? '✅ Sí' : '❌ No'}

*📋 Lista Completa de Admins Detectados:*
\`\`\`${JSON.stringify(groupAdmins, null, 2)}\`\`\`
----------------------------------`;
            await conn.reply(m.chat, debugMessage, m);
        }

        // --- Verificaciones de Permisos (se ejecutan siempre) ---
        if (!botIsAdmin) {
            return conn.reply(m.chat, `❌ El bot necesita ser administrador para usar este comando.`, m);
        }
        if (!userIsAdmin) {
            return conn.reply(m.chat, `❌ Solo los administradores pueden usar este comando.`, m);
        }

        // --- Identificar y verificar al Usuario Objetivo ---
        let targetUser = m.quoted.sender;
        const targetIsAdmin = groupAdmins.includes(targetUser);
        const ownerGroup = groupMetadata.owner || '';
        const ownerBot = global.owner[0][0] + '@s.whatsapp.net';

        if (targetUser === botId) {
            return conn.reply(m.chat, `😂 No me puedo auto-expulsar.`, m);
        }
        if (targetUser === ownerGroup) {
            return conn.reply(m.chat, `🛡️ No puedo eliminar al propietario del grupo.`, m);
        }
        if (targetUser === ownerBot) {
            return conn.reply(m.chat, `🛡️ No puedo eliminar a mi propietario.`, m);
        }
        if (targetIsAdmin) {
            return conn.reply(m.chat, `🛡️ No puedo eliminar a otro administrador.`, m);
        }

        // --- Ejecutar Acciones (Eliminar y Expulsar) ---
        const userMention = `@${targetUser.split('@')[0]}`;
        
        await conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
        await conn.groupParticipantsUpdate(m.chat, [targetUser], 'remove');
        await conn.reply(m.chat, `✅ ¡Hecho! El mensaje de ${userMention} fue eliminado y el usuario fue expulsado.`, m, { mentions: [targetUser] });

    } catch (e) {
        console.error(e);
        const errorDebug = `*Error Detallado (Debug):*\n\`\`\`${e}\`\`\``;
        await conn.reply(m.chat, `❌ Ocurrió un error al ejecutar la acción.\n\n${errorDebug}`, m);
    }
};

handler.help = ['kickdel'];
handler.tags = ['grupo'];
handler.command = ['kickdel'];

export default handler;
