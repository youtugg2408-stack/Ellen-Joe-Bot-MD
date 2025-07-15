let handler = async (m, { conn, usedPrefix, command }) => {
    // --- Verificación Interna #1: Uso en Grupo ---
    // Esta comprobación reemplaza a `handler.group = true`
    if (!m.isGroup) {
        return conn.reply(m.chat, `🛡️ Este comando solo se puede usar en grupos.`, m);
    }
    
    // Verificación de objetivo (mensaje citado)
    if (!m.quoted) {
        return conn.reply(m.chat, `🛡️ Debes citar el mensaje del usuario que deseas expulsar y eliminar.\n\n*Ejemplo:*\n${usedPrefix + command}`, m);
    }

    try {
        // --- Obtener Metadatos y Roles ---
        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        
        // --- Verificación Interna #2: Permisos de Administrador ---
        // Estas comprobaciones reemplazan a `handler.botAdmin = true` y `handler.admin = true`
        const botIsAdmin = groupAdmins.includes(conn.user.jid);
        const userIsAdmin = groupAdmins.includes(m.sender);

        if (!botIsAdmin) {
            return conn.reply(m.chat, `❌ El bot necesita ser administrador para usar este comando.`, m);
        }
        if (!userIsAdmin) {
            return conn.reply(m.chat, `❌ Solo los administradores pueden usar este comando.`, m);
        }

        // --- Identificar al Usuario Objetivo ---
        let targetUser = m.quoted.sender;
        const targetIsAdmin = groupAdmins.includes(targetUser);

        // --- Comprobaciones de Seguridad ---
        const ownerGroup = groupMetadata.owner || '';
        const ownerBot = global.owner[0][0] + '@s.whatsapp.net';

        if (targetUser === conn.user.jid) {
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
        
        // 1. Eliminar el mensaje citado
        await conn.sendMessage(m.chat, { delete: m.quoted.vM.key });

        // 2. Expulsar al usuario
        await conn.groupParticipantsUpdate(m.chat, [targetUser], 'remove');

        // 3. Mensaje de confirmación
        await conn.reply(m.chat, `✅ El mensaje de ${userMention} fue eliminado y el usuario fue expulsado del grupo.`, m, { mentions: [targetUser] });

    } catch (e) {
        // --- Manejo de Errores con Debug ---
        // Se registra el error completo en la consola del servidor/PC
        console.error(e);
        
        // Se envía un mensaje de error detallado al chat para facilitar la depuración
        const errorDebug = `*Error Detallado (Debug):*\n\`\`\`${e}\`\`\``;
        await conn.reply(m.chat, `❌ Ocurrió un error al ejecutar la acción.\n\n${errorDebug}`, m);
    }
};

handler.help = ['kickdel'];
handler.tags = ['grupo'];
handler.command = ['kickdel'];

// Se han eliminado las siguientes propiedades para que el comando use su propio sistema de verificación:
// handler.group = true; 
// handler.admin = true;
// handler.botAdmin = true;

export default handler;
