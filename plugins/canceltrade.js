const MIDDLE_GROUP = '120363404169868595@g.us'; // Asegúrate que coincide

let handler = async (m, { conn }) => {
    const from = m.chat;

        if (!global.currentTrades) global.currentTrades = {};

            if (!global.currentTrades[from]) {
                    return conn.reply(from, '⚠️ No hay ningún trade activo en este grupo.', m);
                        }

                            // Limpiar timeout si existe
                                if (global.currentTrades[from].timeout) {
                                        clearTimeout(global.currentTrades[from].timeout);
                                            }

                                                // Eliminar trade activo
                                                    delete global.currentTrades[from];

                                                        await conn.reply(from, '❌ Trade cancelado correctamente.', m);
                                                            await conn.sendMessage(MIDDLE_GROUP, { text: `⚠️ Trade en el grupo ${from} fue cancelado.` });
                                                            };

                                                            handler.help = ['canceltrade'];
                                                            handler.tags = ['tools'];
                                                            handler.command = ['canceltrade'];

                                                            export default handler;