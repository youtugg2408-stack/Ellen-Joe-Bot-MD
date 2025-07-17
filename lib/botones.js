import { handler as ejecutarHandler } from '../handler.js';

/**
 * Maneja los botones interactivos y simula un mensaje de comando.
 * @param {import('@whiskeysockets/baileys').WASocket} conn - Conexión activa.
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} m - Mensaje recibido.
 * @returns {boolean} true si el botón fue procesado, false si se ignora.
 */
export async function manejarRespuestasBotones(conn, m) {
  try {
    const selected = m?.message?.buttonsResponseMessage?.selectedButtonId;
    if (!selected || typeof selected !== 'string') return false;

    // 🔒 Prevenir loops infinitos
    if (m.isFakeButton) return false;

    const prefixes = ['.', '#', '/'];
    const prefix = prefixes.find(p => selected.startsWith(p));
    if (!prefix) return false;

    const comandoCompleto = selected.slice(prefix.length).trim();
    if (!comandoCompleto) return false;

    const partes = comandoCompleto.split(/\s+/);
    const comando = partes[0];
    const args = partes.slice(1);

    // 🧪 Validar
    if (!comando) return false;

    const fakeMessage = {
      ...m,
      text: selected,
      command,
      args,
      prefix,
      fromMe: false,
      isCommand: true,
      isFakeButton: true // <- evita bucles infinitos
    };

    await ejecutarHandler.call(conn, { messages: [fakeMessage] });
    return true;
  } catch (err) {
    console.error("❌ Error en manejarRespuestasBotones:", err);
    return false;
  }
}