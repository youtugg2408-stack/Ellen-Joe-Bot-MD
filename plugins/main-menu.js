import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import moment from 'moment-timezone';

const cooldowns = new Map();
const lastMenuSent = new Map();

let handler = async (m, { conn, usedPrefix }) => {
  if (m.quoted?.id && m.quoted?.fromMe) return;

  const chatId = m.chat;
  const now = Date.now();
  const waitTime = 20 * 60 * 1000;

  const lastUsed = cooldowns.get(chatId) || 0;

  if (now - lastUsed < waitTime) {
    const remainingMs = waitTime - (now - lastUsed);
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    const last = lastMenuSent.get(chatId);
    return await conn.reply(
      chatId,
      `@${m.sender.split('@')[0]} no se puede enviar el menú antes de tiempo.\nTiempo restante: *${minutes}m ${seconds}s*`,
      last?.message || m,
      {
        mentions: [m.sender]
      }
    );
  }

  cooldowns.set(chatId, now);

  let name;
  try {
    name = await conn.getName(m.sender);
  } catch {
    name = 'Usuario';
  }

  const isMain = conn.user.jid === global.conn.user.jid;
  const botNumber = conn.user.jid.split('@')[0];
  const principalNumber = global.conn?.user?.jid?.split('@')[0] || "Desconocido";
  const totalCommands = Object.keys(global.plugins || {}).length;
  const uptime = clockString(process.uptime() * 1000);
  const totalreg = Object.keys(global.db?.data?.users || {}).length;
  const utcTime = moment().utc().format('HH:mm');

  const videoLinks = [
    "https://telegra.ph/file/44d01492911aea8ead955.mp4",
    "https://telegra.ph/file/d2f145fbaa694c719815a.mp4",
    "https://telegra.ph/file/6e354a46e722b6ac91e65.mp4"
  ];
  const gifVideo = videoLinks[Math.floor(Math.random() * videoLinks.length)];

  const emojis = {
    'main': '📋', 'tools': '🛠️', 'audio': '🎧', 'group': '👥',
    'owner': '👑', 'fun': '🎮', 'info': 'ℹ️', 'internet': '🌐',
    'downloads': '⬇️', 'admin': '🧰', 'anime': '✨', 'nsfw': '🔞',
    'search': '🔍', 'sticker': '🖼️', 'game': '🕹️', 'premium': '💎', 'bot': '🤖'
  };

  let groups = {};
  for (let plugin of Object.values(global.plugins || {})) {
    if (!plugin.help || !plugin.tags) continue;
    for (let tag of plugin.tags) {
      if (!groups[tag]) groups[tag] = [];
      for (let help of plugin.help) {
        if (/^\$|^=>|^>/.test(help)) continue; // Excluir comandos especiales
        groups[tag].push(`${usedPrefix}${help}`);
      }
    }
  }

  for (let tag in groups) {
    groups[tag].sort((a, b) => a.localeCompare(b));
  }

  const sections = Object.entries(groups).map(([tag, cmds]) => {
    const emoji = emojis[tag] || '📁';
    return `[${emoji} ${tag.toUpperCase()}]\n` + cmds.map(cmd => `> ${cmd}`).join('\n');
  }).join('\n\n');

  const header = `
Hola ${name} este es el menú:
|----[𝙑𝙀𝙍𝙈𝙀𝙄𝙇 𝘽𝙊𝙏]----•
| 👤 Usuario: ${name}
| 🤖 Bot: ${isMain ? 'Principal' : `Sub-Bot | Principal: ${principalNumber}`}
| 📦 Comandos: ${totalCommands}
| ⏱️ Uptime: ${uptime}
| 🌍 Hora UTC: ${utcTime}
| 👥 Usuarios: ${totalreg}
| 👑 Dueño: wa.me/${global.owner?.[0]?.[0] || "No definido"}
|---------------------•`.trim();

  const finalText = `${header}\n\n${sections}\n\n[⏳] Este menú puede enviarse 1 vez cada 20 minutos por grupo.`;

  let sentMsg;
  try {
    sentMsg = await conn.sendMessage(chatId, {
      video: { url: gifVideo },
      gifPlayback: true,
      caption: finalText,
      mentions: [m.sender]
    }, { quoted: m });
  } catch (e) {
    sentMsg = await conn.reply(chatId, finalText, m);
  }

  cooldowns.set(chatId, now);
  lastMenuSent.set(chatId, {
    timestamp: now,
    message: sentMsg
  });
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'menú', 'help'];

export default handler;

function clockString(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
