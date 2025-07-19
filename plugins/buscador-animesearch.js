/*
- Coded by I'm Fz
- https/Github.com/FzTeis
- Enhanced by Ellen Joe's Service
*/

import axios from 'axios';
import cheerio from 'cheerio';
import { proto } from '@whiskeysockets/baileys';

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
        return { error: 'No se pudo recuperar resultados. TioAnime podría estar caído o la búsqueda es inválida.' };
    }
};

let handler = async (m, { conn, command, args, text, usedPrefix }) => {
    const name = conn.getName(m.sender);

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
            body: `Procesando solicitud para Proxy ${name}...`,
            thumbnailUrl: 'https://i.imgur.com/Uw6IGg4.jpeg',
            sourceUrl: 'https://tioanime.com',
            mediaType: 1,
            renderLargerThumbnail: true
        }
    };

    if (!args[0]) {
        return conn.reply(m.chat, `🦈 *Rastro frío, Proxy ${name}.* Necesito la designación del anime para iniciar el barrido.`, m, { contextInfo, quoted: m });
    }

    m.react('🔄');
    conn.reply(m.chat, `🔄 *Iniciando protocolo de barrido de anime, Proxy ${name}.* Aguarda...`, m, { contextInfo, quoted: m });

    try {
        const results = await searchAnime(args[0]);

        if (results.error) {
            await m.react('❌');
            return conn.reply(m.chat, `❌ *Fallo en el barrido, Proxy ${name}.*\n${results.error}`, m, { contextInfo, quoted: m });
        }

        if (results.length === 0) {
            await m.react('❌');
            return conn.reply(m.chat, `❌ *Carga fallida, Proxy ${name}.*\nNo se encontraron resultados para "${args[0]}".`, m, { contextInfo, quoted: m });
        }

        const carouselMessages = [];

        for (const { name: animeName, id, url, image } of results) {
            carouselMessages.push({
                header: {
                    title: animeName,
                    hasMediaAttachment: true,
                    imageMessage: {
                        url: image,
                        mimetype: 'image/jpeg'
                    }
                },
                body: {
                    text: `╭━━━━[ 𝙰𝚗𝚒𝚖𝚎 𝙳𝚎𝚌𝚘𝚍𝚎𝚍 ]━━━━⬣\n\n📺 *Título:* ${animeName}\n🆔 *ID:* ${id}\n\n_Selecciona una opción para continuar._\n╰━━━━━━━━━━━━━━━━━━━━⬣`
                },
                footer: {
                    text: `📡 Ellen Joe's Service`
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "📘 Info Detallada",
                                id: `${usedPrefix}animeinfo ${url}`
                            })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🌐 Ver en TioAnime",
                                url: url,
                                merchant_url: url
                            })
                        }
                    ]
                }
            });
        }

        await conn.relayMessage(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `╭━━━━[ Anime Search 🧩 ]━━━━⬣\n\n🔎 *Término:* ${args[0]}\n\n_Desliza las tarjetas para ver resultados._\n╰━━━━━━━━━━━━━━━━━━━━⬣`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: `🦈 Resultados por Ellen Joe's Service`
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            hasMediaAttachment: false
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: carouselMessages
                        })
                    })
                }
            }
        }, { quoted: m });

        await m.react('✅');

    } catch (error) {
        console.error("Error en Anime Search:", error);
        await m.react('❌');
        conn.reply(m.chat, `⚠️ *Anomalía crítica, Proxy ${name}.*\nNo pude completar la búsqueda.\n*Detalles:* ${error.message}`, m, { contextInfo, quoted: m });
    }
};

handler.help = ['animes <nombre>'];
handler.command = ['animes', 'animesearch', 'animess'];
handler.tags = ['buscador'];
handler.premium = true;
handler.register = true;
handler.group = true;

export default handler;