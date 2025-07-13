/*
- Coded by I'm Fz
- https/Github.com/FzTeis
- Enhanced by Ellen Joe's Service
*/

import axios from 'axios';
import cheerio from 'cheerio';

// --- Constantes y Configuración de Transmisión (Estilo Ellen Joe) ---
const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡ 𝐄llen 𝐉ᴏ𝐄\'s 𝐒ervice';

const searchAnime = async (query) => {
    const url = `https://tioanime.com/directorio?q=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const results = [];

        $('ul.animes li').each((_, element) => {
            const name = $(element).find('h3.title').text().trim();
            const id = $(element).find('a').attr('href').split('/').pop();
            const image = $(element).find('img').attr('src');
            const animeUrl = `https://tioanime.com${$(element).find('a').attr('href')}`; 

            results.push({
                name,
                id,
                image: `https://tioanime.com${image}`,
                url: animeUrl, 
            });
        });

        return results;
    } catch (error) {
        console.error('Error searching for anime:', error.message);
        return { error: 'Failed to retrieve results. The target might be offline or the query is invalid.' };
    }
};

let handler = async (m, { conn, command, args, text, usedPrefix }) => {
    const name = conn.getName(m.sender); // Identifying the Proxy

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
            title: 'Ellen Joe: Pista localizada. 🦈',
            body: `Processing request for Proxy ${name}...`,
            thumbnail: icons, // Ensure 'icons' and 'redes' are globally defined
            sourceUrl: redes,
            mediaType: 1,
            renderLargerThumbnail: false
        }
    };

    if (!args[0]) {
        return conn.reply(m.chat, `🦈 *Rastro frío, Proxy ${name}.* Necesito la designación del anime para iniciar el barrido.`, m, { contextInfo, quoted: m });
    }

    m.react('🔄'); // Reaction for processing
    conn.reply(m.chat, `🔄 *Iniciando protocolo de barrido de anime, Proxy ${name}.* Aguarda, la carga de datos está siendo procesada.`, m, { contextInfo, quoted: m });

    try {
        const results = await searchAnime(args[0]);

        if (results.error) {
            await m.react('❌'); // Error reaction
            return conn.reply(m.chat, `❌ *Fallo en el barrido, Proxy ${name}.*\n${results.error}. Verifica la designación o informa de la anomalía.`, m, { contextInfo, quoted: m });
        }
        if (results.length === 0) {
            await m.react('❌'); // Error reaction
            return conn.reply(m.chat, `❌ *Carga de datos fallida, Proxy ${name}.*\nNo se encontraron resultados para "${args[0]}". Verifica la designación.`, m, { contextInfo, quoted: m });
        }

        const carouselMessages = [];
        for (const { name: animeName, id, url, image } of results) {
            // Using a single button for simplicity and direct navigation to info.
            // The original carousel structure had empty arrays, which might not render correctly.
            // The 'buttonParamsJson' for 'url' type has 'display_text', 'url', 'merchant_url'.
            carouselMessages.push({
                'header': {
                    'title': '', // Left blank as per original, or could be animeName
                    'hasMediaAttachment': true,
                    'imageMessage': await conn.generateWAMessageContent({'image':{'url': image}},{'upload': conn.waUploadToServer}).then(msg => msg.imageMessage)
                },
                'body': {
                    'text': `╭━━━━[ 𝙰𝚗𝚒𝚖𝚎 𝙳𝚎𝚌𝚘𝚍𝚎𝚍: 𝙳𝚎𝚜𝚒𝚐𝚗𝚊𝚌𝚒𝚘́𝚗 𝙴𝚗𝚌𝚘𝚗𝚝𝚛𝚊𝚍𝚊 ]━━━━⬣\n\n📺 *Designación:* ${animeName}\n🔖 *Identificador:* ${id}\n\n*Selecciona la opción para obtener información detallada del anime.*\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`
                },
                'footer': {
                    'text': `Procesado por Ellen Joe's Service`
                },
                'nativeFlowMessage': {
                    'buttons': [
                        {
                            'name': "quick_reply", // Use quick_reply for bot command
                            'buttonParamsJson': JSON.stringify({
                                'display_text': "Obtener Info Detallada",
                                'id': `${usedPrefix}animeinfo ${url}`
                            })
                        },
                        {
                            'name': "cta_url", // Use cta_url for direct link
                            'buttonParamsJson': JSON.stringify({
                                'display_text': "Ver en TioAnime 🔗",
                                'url': url,
                                'merchant_url': url
                            })
                        }
                    ]
                }
            });
        }

        // Send carousel message
        await conn.relayMessage(m.chat, {
            'viewOnceMessage': {
                'message': {
                    'messageContextInfo': {
                        'deviceListMetadata': {},
                        'deviceListMetadataVersion': 2
                    },
                    'interactiveMessage': proto.Message.InteractiveMessage.fromObject({
                        'body': proto.Message.InteractiveMessage.Body.create({
                            'text': `╭━━━━[ 𝙰𝚗𝚒𝚖𝚎 𝚂𝚎𝚊𝚛𝚌𝚑: 𝚁𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜 𝙳𝚎𝚌𝚘𝚍𝚒𝚏𝚒𝚌𝚊𝚍𝚘𝚜 ]━━━━⬣\n\n*Término de Búsqueda:* ${args[0]}\n\n_Desliza para ver las designaciones encontradas._\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`
                        }),
                        'footer': proto.Message.InteractiveMessage.Footer.create({
                            'text': `⪛✰ Barrido de Anime - Ellen Joe's Service ✰⪜`
                        }),
                        'header': proto.Message.InteractiveMessage.Header.create({
                            'hasMediaAttachment': false
                        }),
                        'carouselMessage': proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            'cards': carouselMessages
                        })
                    })
                }
            }
        }, { 'quoted': m });
        
        await m.react('✅'); // Success reaction

    } catch (error) {
        console.error("Error processing Anime Search:", error);
        await m.react('❌'); // Error reaction
        conn.reply(m.chat, `⚠️ *Anomalía crítica en la operación de Anime Search, Proxy ${name}.*\nNo pude completar la búsqueda. Verifica el término o informa del error.\nDetalles: ${error.message}`, m, { contextInfo, quoted: m });
    }
}

handler.help = ['animes <nombre>'];
handler.command = ['animes', 'animesearch', 'animess'];
handler.tags = ['buscador'];
handler.premium = true; // Retained premium requirement
handler.register = true;
handler.group = true;

export default handler;
