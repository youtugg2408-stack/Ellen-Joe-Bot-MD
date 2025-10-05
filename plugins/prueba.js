let handler = async (m, { conn }) => {
    await conn.reply(m.chat, '✅ ¡Funciona!', m);
};

handler.help = ['prueba'];
handler.tags = ['tools'];
handler.command = ['prueba'];

export default handler;
