import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import moment from 'moment-timezone';
import PhoneNumber from 'awesome-phonenumber';

const cooldowns = new Map();
const ultimoMenuEnviado = new Map();

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '*Ellen-Joe-Bot-OFICIAL*';
const packname = '˚🄴🄻🄻🄴🄽-🄹🄾🄴-🄱🄾🅃';

let handler = async (m, { conn, usedPrefix }) => {
  // ... (el resto del código inicial hasta la detección de la hora se mantiene igual)
  // ... (Manejo de DB, Cooldown, etc.)

  // --- CÓDIGO CORREGIDO Y CON DEPURACIÓN PARA LA HORA DEL USUARIO ---
  let horaUsuario = 'No disponible';
  try {
    // Se pasa el JID completo (ej: '18291234567@s.whatsapp.net') para un mejor análisis
    const numeroParseado = new PhoneNumber(m.sender);

    // --- Registros de depuración ---
    console.log(`[DEBUG] Analizando JID: ${m.sender}`);
    const esValido = numeroParseado.isValid();
    console.log(`[DEBUG] ¿Número válido?: ${esValido}`);
    // --- Fin de registros ---

    if (esValido) {
      const zonasHorarias = numeroParseado.getTimezones();
      console.log(`[DEBUG] Zonas horarias encontradas: ${JSON.stringify(zonasHorarias)}`);

      if (zonasHorarias && zonasHorarias.length > 0) {
        const zonaHorariaUsuario = zonasHorarias[0];
        console.log(`[DEBUG] Usando zona horaria: ${zonaHorariaUsuario}`);
        horaUsuario = moment().tz(zonaHorariaUsuario).format('h:mm A');
      } else {
        console.log('[DEBUG] El número es válido pero no se encontraron zonas horarias.');
      }
    }
  } catch (e) {
    console.error("Error al procesar el número con awesome-phonenumber:", e.message);
  }
  // --- FIN DE LA SECCIÓN CORREGIDA ---


  // --- El resto del código continúa desde aquí ---
  let nombre;
  try {
    nombre = await conn.getName(m.sender);
  } catch {
    nombre = 'Usuario';
  }

  const esPrincipal = conn.user.jid === global.conn.user.jid;
  const numeroBot = conn.user.jid.split('@')[0];
  const numeroPrincipal = global.conn?.user?.jid?.split('@')[0] || "Desconocido";
  const totalComandos = Object.keys(global.plugins || {}).length;
  const tiempoActividad = clockString(process.uptime() * 1000);
  const totalRegistros = Object.keys(global.db?.data?.users || {}).length;
  
  const horaSantoDomingo = moment().tz("America/Santo_Domingo").format('h:mm A');

  // ... (El resto del código para construir el menú es idéntico al anterior)
  // ... (Definición de emojis, grupos, secciones, encabezado, textoFinal, contextInfo, etc.)
  
  const enlacesMultimedia = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'database', 'db.json'))).links;
  const videoGif = enlacesMultimedia.video[Math.floor(Math.random() * enlacesMultimedia.video.length)];
  const miniaturaRandom = enlacesMultimedia.imagen[Math.floor(Math.random() * enlacesMultimedia.imagen.length)];

  const emojis = {
    'main': '🦈', 'tools': '🛠️', 'audio': '🎧', 'group': '👥',
    'owner': '👑', 'fun': '🎮', 'info': 'ℹ️', 'internet': '🌐',
    'downloads': '⬇️', 'admin': '🧰', 'anime': '✨', 'nsfw': '🔞',
    'search': '🔍', 'sticker': '🖼️', 'game': '🕹️', 'premium': '💎', 'bot': '🤖'
  };

  let grupos = {};
  for (let plugin of Object.values(global.plugins || {})) {
    if (!plugin.help || !plugin.tags) continue;
    for (let tag of plugin.tags) {
      if (!grupos[tag]) grupos[tag] = [];
      for (let help of plugin.help) {
        if (/^\$|^=>|^>/.test(help)) continue;
        grupos[tag].push(`${usedPrefix}${help}`);
      }
    }
  }

  for (let tag in grupos) {
    grupos[tag].sort((a, b) => a.localeCompare(b));
  }

  const secciones = Object.entries(grupos).map(([tag, cmds]) => {
    const emoji = emojis[tag] || '📁';
    return `[${emoji} ${tag.toUpperCase()}]\n` + cmds.map(cmd => `> ${cmd}`).join('\n');
  }).join('\n\n');

  const encabezado = `
🦈 |--- *Ellen-Joe-Bot | MODO TIBURÓN* ---| 🦈
| 👤 *Usuario:* ${nombre}
| 🌎 *Hora Santo Domingo:* ${horaSantoDomingo}
| 🕒 *Tu Hora (Estimada):* ${horaUsuario}
| 🤖 *Bot:* ${esPrincipal ? 'Principal' : `Sub-Bot | Principal: ${numeroPrincipal}`}
| 📦 *Comandos:* ${totalComandos}
| ⏱️ *Tiempo Activo:* ${tiempoActividad}
| 👥 *Usuarios Reg:* ${totalRegistros}
| 👑 *Dueño:* wa.me/${global.owner?.[0]?.[0] || "No definido"}
|-------------------------------------------|`.trim();

  const textoFinal = `${encabezado}\n\n${secciones}\n\n*${packname}*`;

  const contextInfo = {
    mentionedJid: [m.sender],
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
      newsletterJid,
      newsletterName,
      serverMessageId: -1
    },
    externalAdReply: {
      title: packname,
      body: '🦈 Menú de Comandos | Ellen-Joe-Bot 🦈',
      thumbnailUrl: miniaturaRandom,
      sourceUrl: 'https://github.com/nevi-dev/Vermeil-bot',
      mediaType: 1,
      renderLargerThumbnail: false
    }
  };

  let msgEnviado;
  try {
    msgEnviado = await conn.sendMessage(idChat, {
      video: { url: videoGif },
      gifPlayback: true,
      caption: textoFinal,
      contextInfo
    }, { quoted: m });
  } catch (e) {
    console.error("Error al enviar el menú con video:", e);
    msgEnviado = await conn.reply(idChat, textoFinal, m, { contextInfo });
  }
  
  cooldowns.set(idChat, ahora);
  ultimoMenuEnviado.set(idChat, {
    timestamp: ahora,
    message: msgEnviado
  });
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', '
