let handler = async (m, { conn, usedPrefix, command }) => {
    // --- Verificaciones Iniciales ---
    if (!m.isGroup) {
        return conn.reply(m.chat, `🛡️ Este comando solo se puede usar en grupos.`, m);
    }
    if (!m.quoted) {
        return conn.reply(m.chat, `🛡️ Debes citar el mensaje del usuario.\n\n*Ejemplo:*\n${usedPrefix + command}`, m);
    }

    const isDebugMode = m.text.includes('-debug on');

    try {
        // --- Obtener Metadatos y Roles ---
        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupParticipants = groupMetadata.participants;
        const groupAdmins = groupParticipants.filter(p => p.admin).map(p => p.id);
        
        // --- LÓGICA DE DOBLE VERIFICACIÓN DE ID ---
        // 1. ID estándar del bot (ej: 52...@s.whatsapp.net)
        const standardBotId = conn.user.id || conn.user.jid;
        
        // 2. ID específico del grupo (puede ser @lid o el mismo estándar)
        const botParticipant = groupParticipants.find(p => p.id.startsWith(standardBotId.split(':')[0]));
        const groupSpecificBotId = botParticipant ? botParticipant.id : null;

        // 3. Comprobación final: ¿Alguno de los dos IDs es admin?
        const botIsAdmin = groupAdmins.includes(standardBotId) || (groupSpecificBotId && groupAdmins.includes(groupSpecificBotId));
        const userIsAdmin = groupAdmins.includes(m.sender);

        if (isDebugMode) {
            const debugMessage = `*--- 🐞 MODO DEBUG ACTIVADO 🐞 ---*

*🔍 Doble Verificación de ID del Bot:*
- *ID Estándar (@s.whatsapp.net):* \`${standardBotId}\`
- *ID del Grupo (@lid):* \`${groupSpecificBotId || 'No detectado'}\`

*🔑 Verificación de Permisos:*
- *¿ID Estándar es Admin?:* ${groupAdmins.includes(standardBotId) ? '✅' : '❌'}
- *¿ID del Grupo es Admin?:* ${groupSpecificBotId && groupAdmins.includes(groupSpecificBotId) ? '✅' : '❌'}
- *Resultado Final (Bot es Admin):* ${botIsAdmin ? '✅ Sí' : '❌ No'}

*📋 Admins Detectados:*
\`\`\`${JSON.stringify(groupAdmins, null, 2)}\`\`\`
----------------------------------`;
            await conn.reply(m.chat, debugMessage, m);
        }

        // --- Verificaciones de Permisos ---
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

        // Comprobamos contra ambos posibles IDs del bot para evitar auto-expulsión
        if (targetUser === standardBotId || (groupSpecificBotId && targetUser === groupSpecificBotId)) {
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

        // --- Ejecutar Acciones ---
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
