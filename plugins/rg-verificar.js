import { createHash } from 'crypto'

// Expresión regular para capturar el nombre y la edad del usuario en el formato "Nombre.edad"
let Reg = /\|?(.*)([.|] *?)([0-9]*)$/i

// Define la variable 'canales' con una URL relevante si es necesario, o déjala como está
const canales = 'https://whatsapp.com/channel/0029VbAuMiNCBtxOKcBfw71x'; // URL oficial de Zenless Zone Zero

// Se añade un objeto vacío como valor por defecto {} para evitar el TypeError
let handler = async function (m, { conn, text, usedPrefix, command } = {}) {
  // Verificación para asegurar que las dependencias existen antes de usarlas
  if (!conn || !text || !m) {
    // Si falta algo esencial, se detiene la ejecución para evitar más errores.
    // Puedes poner un console.log('Faltan objetos esenciales en el handler de registro.');
    return;
  }
  
  let user = global.db.data.users[m.sender]
  let name2 = conn.getName(m.sender)

  // Verifica si el usuario ya está registrado
  if (user.registered === true) throw `*『 ⚠️ 』Parece que ya estás en mis registros, conejito. Si quieres empezar de nuevo, usa #unreg.*`
  
  // Se verifica que 'text' exista y que el formato sea el correcto
  if (!text || !Reg.test(text)) throw `*『 ⚙️ 』Vaya, parece que te has liado un poco. El formato correcto es:*\n\n#reg *TuNombre.TuEdad*\n\n\`\`\`Ejemplo:\`\`\`\n#reg *${name2}.19*`

  let [_, name, splitter, age] = text.match(Reg)

  // Validaciones de los datos ingresados
  if (!name) throw '*『 ❌ 』Un nombre es esencial, ¿sabes? No puedo registrar a un fantasma. Inténtalo de nuevo.*'
  if (!age) throw '*『 ❌ 』Necesito tu edad. No te preocupes, no se lo diré a nadie... a menos que sea divertido.*'
  if (name.length >= 30) throw '*『 ✨ 』Hey, con calma. Un nombre más corto y directo, por favor. Que sea fácil de recordar.*' 

  age = parseInt(age)

  // Bromas y validaciones adicionales para la edad
  if (age > 100) throw '*『 😏 』¿En serio? Con esa edad, deberías estar contándome historias de la vieja Eridu, no jugando con esto.*'
  if (age < 16) throw '*『 🐰 』Un conejito... Asegúrate de que no te metas en líos que no puedas manejar.*'

  // Asignación de datos y recompensas al usuario
  user.name = name.trim()
  user.age = age
  user.regTime = + new Date
  user.registered = true
  global.db.data.users[m.sender].dennies += 10000 // Moneda del juego
  global.db.data.users[m.sender].w_engine_parts += 15 // Materiales de mejora
  global.db.data.users[m.sender].exp += 500
  global.db.data.users[m.sender].agent_level += 1

  // Creación de un identificador único para el usuario
  let sn = createHash('md5').update(m.sender).digest('hex').slice(0, 6)        
  m.react('🐰') // Reacción de conejo, un guiño a su apodo

  // Mensaje de bienvenida personalizado al estilo de Ellen Joe
  let regbot = `╭══• ೋ•✧๑🐰๑✧•ೋ •══╮
*¡BIENVENIDO(A) A LA FAMILIA, CONEJITO!*
╰══• ೋ•✧๑🐰๑✧•ೋ •══╯
║_-~-__-~-__-~-__-~-__-~-__-~-__-~-__-~-__-~-__-~-__
║
║ ֪ ׂ✨ ̶ ׁ ֪ 𝐍𝐨𝐦𝐛𝐫𝐞 𝐝𝐞 𝐀𝐠𝐞𝐧𝐭𝐞: ${name}
║ ֪ ׁ⚡  𝇌 𝐄𝐝𝐚𝐝: ${age} *Años*
║
║ *Es un placer tenerte a bordo. Espero que*
║ *estés listo para un poco de acción y diversión.*
║ *Usa* *.menu* *para ver qué podemos hacer.*
║
║
║ ✨ 𝐏𝐚𝐪𝐮𝐞𝐭𝐞 𝐝𝐞 𝐁𝐢𝐞𝐧𝐯𝐞𝐧𝐢𝐝𝐚:
║ • 10,000 Dennies 💵
║ • 15 W-Engine Parts ⚙️
║ • 500 de Experiencia 📈
║ • Nivel de Agente +1 🌟
╚══✦「 Victoria para los Conejos 」`

  // Envío del mensaje con una tarjeta personalizada
  conn.sendMessage(m.chat, {
    text: regbot,
    contextInfo: {
      externalAdReply: {
        title: '⊱『✅𝆺𝅥 REGISTRO COMPLETADO 𝆹𝅥✅』⊰',
        body: 'Victoria para los Conejos', // Lema de su facción
        thumbnailUrl: icons, // URL de una imagen de Ellen Joe
        sourceUrl: canales,
        mediaType: 1,
        showAdAttribution: true,
        renderLargerThumbnail: true,
      }
    }
  }, { quoted: m })
}

// Comandos para activar el handler
handler.help = ['reg']
handler.tags = ['rg']
handler.command = ['verify', 'verificar', 'reg', 'register', 'registrar'] 

export default handler
