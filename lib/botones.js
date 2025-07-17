// botones.js

/**
 * Detecta botones de WhatsApp y convierte el botón en un mensaje de comando.
 * @param {*} conn - conexión del bot
 * @param {*} m - mensaje original de tipo buttonsResponseMessage
 * @returns true si se procesó un botón válido, false si no lo era
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

  conn.emit('handler:command', fakeMessage);
  return true;
}