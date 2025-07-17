// botones.js

export async function manejarRespuestasBotones(conn, m) { const selected = m?.message?.buttonsResponseMessage?.selectedButtonId || null;

if (!selected) return false; // No hay botón presionado

const prefixes = ['.', '#', '/']; const prefix = prefixes.find(p => selected.startsWith(p)); if (!prefix) return false; // No es comando válido

const text = selected.trim(); const commandText = text.slice(prefix.length); const [command, ...args] = commandText.trim().split(/\s+/);

const fakeMessage = { ...m, isCommand: true, text, command: command.toLowerCase(), args, prefix, fromMe: false, isFakeButton: true // para debug si quieres };

// reenviar el mensaje al sistema principal del bot conn.emit('handler:command', fakeMessage); return true; }

