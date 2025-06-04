import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import moment from 'moment-timezone';

const cooldowns = new Map();

let handler = async (m, { conn, usedPrefix }) => {
  const chatId = m.chat;
  const now = Date.now();
  const waitTime = 20 * 60 * 1000;
  const lastUsed = cooldowns.get(chatId) || 0;

  if (now - lastUsed < waitTime) {
    const remaining = ((waitTime - (now - lastUsed)) / 60000).toFixed(1);
    return m.reply(`@${m.sender.split('@')[0]} no se puede enviar el menú antes de tiempo.\nTiempo restante: *${remaining} minutos*`, null, {
      mentions: [m.sender],
    });
  }

  cooldowns.set(chatId, now);

  const name = conn.getName(m.sender);
  const isMain = conn.user.jid === global.conn.user.jid;
  const botNumber = conn.user.jid.split('@')[0];
  const principalNumber = global.conn?.user?.jid?.split('@')[0] || "Desconocido";

  const totalCommands = Object.keys(global.plugins).length;
  const uptime = clockString(process.uptime() * 1000);
  const totalreg = Object.keys(global.db.data.users).length;

  const videoLinks = [
"https://telegra.ph/file/44d01492911aea8ead955.mp4",
"https://telegra.ph/file/d2f145fbaa694c719815a.mp4",
"https://telegra.ph/file/6e354a46e722b6ac91e65.mp4"
  ];
  const gifVideo = videoLinks[Math.floor(Math.random() * videoLinks.length)];

  // === Buscar comandos por categoría ===
  let groups = {};
  for (let plugin of Object.values(global.plugins)) {
    if (!plugin.help || !plugin.tags) continue;
    for (let tag of plugin.tags) {
      if (!groups[tag]) groups[tag] = [];
      for (let help of plugin.help) {
        groups[tag].push(`${usedPrefix}${help}`);
      }
    }
  }

  // === Construir el texto del menú ===
  let sections = Object.entries(groups).map(([tag, cmds]) => {
    return `[${tag.toUpperCase()}]\n` + cmds.map(cmd => `> ${cmd}`).join('\n');
  }).join('\n\n');

  const header = `
[==============================]
          ( VERMEIL BOT )
[==============================]

Usuario: ${name}
Bot: ${isMain ? 'Principal' : `Sub-Bot | Principal: ${principalNumber}`}
Comandos: ${totalCommands}
Uptime: ${uptime}
Usuarios: ${totalreg}
Dueño: wa.me/${global.owner?.[0]?.[0] || "No definido"}

`.trim();

  const finalText = `${header}\n\n${sections}\n\n[==============================]\n> Este menú puede enviarse 1 vez cada 20 minutos por grupo.`;

  // === Enviar el video como GIF con caption ===
  await conn.sendMessage(m.chat, {
    video: { url: gifVideo },
    gifPlayback: true,
    caption: finalText,
    mentions: [m.sender]
  }, { quoted: m });
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu'];
export default handler;

// === Función para mostrar uptime en formato HH:MM:SS ===
function clockString(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
