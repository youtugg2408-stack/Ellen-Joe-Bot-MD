// lib/botones.js
import { handler as ejecutarHandler } from '../handler.js';

/**
 * Detecta botones de WhatsApp y convierte el botón en comando.
 * @param {*} conn - conexión del bot
 * @param {*} m - mensaje original
 * @returns true si fue manejado, false si no
 */
export async function manejarRespuestasBotones(conn, m) {
  const selected = m?.message?.buttonsResponseMessage?.selectedButtonId || null;
  if (!selected) return false;

  const prefixes = ['.', '#', '/'];
  const prefix = prefixes.find(p => selected.startsWith(p));
  if (!prefix) return false;

  const text = selected.trim();
  const commandText = text.slice(prefix.length);
  const [command, ...args] = commandText.trim().split(/\s+/);

  const fakeMessage = {
    ...m,
    isCommand: true,
    text,
    command: command.toLowerCase(),
    args,
    prefix,
    fromMe: false,
    isFakeButton: true,
  };

  // Llamamos directamente al handler con el mensaje fake
  await ejecutarHandler.call(conn, { messages: [fakeMessage] });

  return true;
}