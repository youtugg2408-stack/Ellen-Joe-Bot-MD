const handler = async (m, { conn, isAdmin, isOwner, groupMetadata }) => {
    const from = m.chat;

    if (!isOwner) return m.reply("⚠ Solo el owner puede usar este comando.");
    if (!isAdmin) return m.reply("⚠ El bot debe ser admin para ejecutar esto.");

    const miembros = groupMetadata.participants.map(u => '@' + u.id.split('@')[0]);
    await conn.sendMessage(from, {
        text: ✅ Comando de prueba avanzado ejecutado!\nMencionando a todos los miembros:\n${miembros.join(', ')},
        mentions: groupMetadata.participants.map(u => u.id)
    });
};

handler.help = ['pruebaavanzada'];
handler.tags = ['tools'];
handler.command = ['pruebaavanzada'];
handler.rowner = true; // Solo el owner puede usarlo
handler.group = true;  // Solo en grupos
handler.botAdmin = true; // El bot debe ser admin

export default handler;
