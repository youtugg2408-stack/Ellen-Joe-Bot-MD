import { handler as ejecutarHandler } from '../handler.js'

/**
 * Maneja los botones y simula el envío de un comando al handler
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} m
 * @returns {Promise<boolean>}
 */
export async function manejarRespuestasBotones(conn, m) {
  try {
    const selected = m?.message?.buttonsResponseMessage?.selectedButtonId;
    if (!selected || typeof selected !== 'string') return false;

    // Evita recursividad infinita
    if (m.isFakeButton) return false;

    const prefixes = ['.', '#', '/'];
    const prefix = prefixes.find(p => selected.startsWith(p));
    if (!prefix) return false;

    const comandoCompleto = selected.slice(prefix.length).trim();
    if (!comandoCompleto) return false;

    const partes = comandoCompleto.split(/\s+/);
    if (partes.length === 0) return false;

    const cmd = partes[0];
    const args = partes.slice(1);

    const fakeMessage = {
      ...m,
      text: selected,
      command: cmd,
      args: args,
      prefix,
      isCommand: true,
      isFakeButton: true // ← evita loops infinitos
    };

    await ejecutarHandler.call(conn, { messages: [fakeMessage] });
    return true;
  } catch (err) {
    console.error("❌ Error en manejarRespuestasBotones:", err);
    return false;
  }
}