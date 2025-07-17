// lib/botones.js

export async function manejarRespuestasBotones(conn, m) {
  try {
    if (!m || !m.message) return false;

    // Detectar botón presionado
    const selected =
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.templateButtonReplyMessage?.selectedId;

    if (!selected) return false; // No es respuesta a botón

    console.log("📥 Botón presionado:", selected);

    // Crear mensaje falso para simular comando
    const fakeMessage = {
      ...m,
      key: {
        remoteJid: m.chat,
        fromMe: true,
        id: m.key.id,
      },
      message: {
        conversation: selected,
      },
    };

    // Ejecutar el handler principal manualmente
    const handler = (await import('../handler.js')).default;
    await handler.handler.call(conn, { messages: [fakeMessage] });

    return true;
  } catch (err) {
    console.error("❌ Error en manejarRespuestasBotones:", err);
    return false;
  }
}