import { handler as ejecutarHandler } from '../handler.js';

export async function manejarRespuestasBotones(conn, m) {
  const selected = m?.message?.buttonsResponseMessage?.selectedButtonId;
  if (!selected) return false;

  // 🔒 NO volver a procesar si el mensaje ya viene de un botón
  if (m.isFakeButton) return false;

  const prefixes = ['.', '#', '/'];
  const prefix = prefixes.find(p => selected.startsWith(p));
  if (!prefix) return false;

  const fakeMessage = {
    ...m,
    text: selected,
    command: selected.slice(prefix.length).split(/\s+/)[0],
    args: selected.slice(prefix.length).split(/\s+/).slice(1),
    prefix,
    fromMe: false,
    isCommand: true,
    isFakeButton: true // 🔒 Etiqueta para evitar loops
  };

  await ejecutarHandler.call(conn, { messages: [fakeMessage] });
  return true;
}