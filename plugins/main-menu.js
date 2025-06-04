const cooldowns = new Map();

let handler = async (m, { conn, usedPrefix }) => {
  const chatId = m.chat;
  const now = Date.now();
  const waitTime = 20 * 60 * 1000; // 20 minutos
  const lastUsed = cooldowns.get(chatId) || 0;

  if (now - lastUsed < waitTime) {
    const remaining = ((waitTime - (now - lastUsed)) / 60000).toFixed(1);
    return conn.reply(m.chat, `@${m.sender.split('@')[0]} ✋ El menú ya fue enviado recientemente.\n⏳ Espera *${remaining} minutos* para volver a usarlo.`, m, { mentions: [m.sender] });
  }

  cooldowns.set(chatId, now);

  const name = conn.getName(m.sender);
  const isMain = conn.user.jid === global.conn.user.jid;
  const botOwnerNumber = global.owner?.[0]?.[0] || "No definido";
  const totalCommands = Object.keys(global.plugins).length;
  const uptime = clockString(process.uptime() * 1000);
  const totalreg = Object.keys(global.db.data.users).length;

  // Videos cortos aleatorios para usar como GIF
  const videoLinks = [
"https://telegra.ph/file/44d01492911aea8ead955.mp4",
"https://telegra.ph/file/d2f145fbaa694c719815a.mp4",
"https://telegra.ph/file/6e354a46e722b6ac91e65.mp4"
  ];
  const gifVideo = videoLinks[Math.floor(Math.random() * videoLinks.length)];

  // Agrupar comandos por categoría
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

  let sections = Object.entries(groups).map(([tag, cmds]) => {
    return `╭⩽✦ ${tag.toUpperCase()} ✦⩾\n${cmds.map(cmd => `┃ ✦ ${cmd}`).join('\n')}\n╰═══════`;
  }).join('\n\n');

  const menuText = `
☆✼★━━━━━━━━━━━━━━━━━★✼☆｡
        ┎┈┈┈┈┈┈┈୨♡୧┈┈┈┈┈┈┈┒
     ꯭(𝐕).𝐄.𝐑.𝐌.𝐄.𝐈.𝐋
        ┖┈┈┈┈┈┈┈୨♡୧┈┈┈┈┈┈┈┚
｡☆✼★━━━━━━━━━━━━━━━━━★✼☆｡

¡Hola, ${name}! Soy *Vermeil* 💫

╔═══════⩽✦✰✦⩾═══════╗
       「 𝙄𝙉𝙁𝙊 𝘿𝙀 𝘽𝙊𝙏 」
╚═══════⩽✦✰✦⩾═══════╝
║ ☆ Tipo: *Waifu*
║ ☆ Modo: *Público*
║ ☆ Comandos: ${totalCommands}
║ ☆ Uptime: ${uptime}
║ ☆ Usuarios: ${totalreg}
║ ☆ Creador: [WhatsApp](https://wa.me/${botOwnerNumber})
${isMain ? '║ ☆ Rol: *Bot Principal*' : `║ ☆ Rol: *Sub-Bot*\n║ ☆ Bot Principal: wa.me/${botOwnerNumber}`}
╚════════════════════════╝

${sections}

> Este menú puede usarse cada 20 minutos por grupo.
`.trim();

  await conn.sendMessage(m.chat, {
    video: { url: gifVideo },
    gifPlayback: true,
    caption: menuText,
    mentions: [m.sender]
  }, { quoted: m });
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu'];
export default handler;

function clockString(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
