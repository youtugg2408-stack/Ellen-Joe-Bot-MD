import { smsg } from './lib/simple.js'
import { format } from 'util'
import * as ws from 'ws';
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import failureHandler from './lib/respuesta.js';
import { manejarRespuestasBotones } from './lib/botones.js';
import { manejarRespuestasStickers } from './lib/stickers.js';
import { sendTranslated } from './lib/traducir.js'; // ✅ traductor

const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

const normalizeJid = jid => jid?.replace(/[^0-9]/g, '')
const cleanJid = jid => jid?.split(':')[0] || ''

// Definición global y centralizada de la función de error.
global.dfail = (type, m, conn) => {
    failureHandler(type, conn, m, global.comando);
};

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate) return

    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return

    // Manejo de botones y stickers
    if (await manejarRespuestasBotones(this, m)) return;
    if (await manejarRespuestasStickers(this, m)) return;

    if (m.isGroup && global.conns && global.conns.length > 1) {
        let botsEnGrupo = global.conns.filter(c => c.user && c.user.jid && c.ws && c.ws.socket && c.ws.socket.readyState !== 3)
        let elegido = botsEnGrupo[Math.floor(Math.random() * botsEnGrupo.length)]
        if (this.user.jid !== elegido.user.jid) return
    }

    if (global.db.data == null)
        await global.loadDatabase()       

    try {
        m = smsg(this, m) || m
        if (!m) return
        m.exp = 0
        m.coin = false

        // ⚡ Definir sistema de traducción para replies
        const replyTranslated = async (text, chatId = m.chat) => {
            return sendTranslated(this, chatId, text, m.sender);
        };

        // ✅ m._reply = nuestra función traducida
        m._reply = replyTranslated;

        // ✅ Redefinimos m.reply para que apunte a _reply
        Object.defineProperty(m, "reply", {
            value: replyTranslated,
            writable: true,
            configurable: true,
            enumerable: false
        });

        // ✅ conn._reply
        this._reply = async (jid, text, quoted, options = {}) => {
            return sendTranslated(this, jid, text, quoted?.sender || m.sender);
        };

        Object.defineProperty(this, "reply", {
            value: this._reply,
            writable: true,
            configurable: true,
            enumerable: false
        });

        // -------------------------
        // Aquí sigue tu lógica normal
        // -------------------------

        let user = global.db.data.users[m.sender]
        if (typeof user !== 'object')
            global.db.data.users[m.sender] = {}
        if (user) {
            if (!isNumber(user.exp)) user.exp = 0
            if (!isNumber(user.coin)) user.coin = 10
            if (!isNumber(user.joincount)) user.joincount = 1
            if (!isNumber(user.diamond)) user.diamond = 3
            if (!isNumber(user.lastadventure)) user.lastadventure = 0
            if (!isNumber(user.lastclaim)) user.lastclaim = 0
            if (!isNumber(user.health)) user.health = 100
            if (!isNumber(user.crime)) user.crime = 0
            if (!isNumber(user.lastcofre)) user.lastcofre = 0
            if (!isNumber(user.lastdiamantes)) user.lastdiamantes = 0
            if (!isNumber(user.lastpago)) user.lastpago = 0
            if (!isNumber(user.lastcode)) user.lastcode = 0
            if (!isNumber(user.lastcodereg)) user.lastcodereg = 0
            if (!isNumber(user.lastduel)) user.lastduel = 0
            if (!isNumber(user.lastmining)) user.lastmining = 0
            if (!('muto' in user)) user.muto = false
            if (!('premium' in user)) user.premium = false
            if (!user.premium) user.premiumTime = 0
            if (!('registered' in user)) user.registered = false
            if (!('genre' in user)) user.genre = ''
            if (!('birth' in user)) user.birth = ''
            if (!('marry' in user)) user.marry = ''
            if (!('description' in user)) user.description = ''
            if (!('packstickers' in user)) user.packstickers = null
            if (!user.registered) {
                if (!('name' in user)) user.name = m.name
                if (!isNumber(user.age)) user.age = -1
                if (!isNumber(user.regTime)) user.regTime = -1
            }
            if (!isNumber(user.afk)) user.afk = -1
            if (!('afkReason' in user)) user.afkReason = ''
            if (!('role' in user)) user.role = 'Nuv'
            if (!('banned' in user)) user.banned = false
            if (!('useDocument' in user)) user.useDocument = false
            if (!isNumber(user.level)) user.level = 0
            if (!isNumber(user.bank)) user.bank = 0
            if (!isNumber(user.warn)) user.warn = 0
        } else {
            global.db.data.users[m.sender] = {
                exp: 0, coin: 10, joincount: 1, diamond: 3, lastadventure: 0, health: 100, lastclaim: 0, lastcofre: 0, lastdiamantes: 0, lastcode: 0, lastduel: 0, lastpago: 0, lastmining: 0, lastcodereg: 0, muto: false, registered: false, genre: '', birth: '', marry: '', description: '', packstickers: null, name: m.name, age: -1, regTime: -1, afk: -1, afkReason: '', banned: false, useDocument: false, bank: 0, level: 0, role: 'Nuv', premium: false, premiumTime: 0                 
            }
        }

        // ⚡ Aquí seguiría TODO el resto de tu handler normal
        // (plugins, comandos, validaciones, etc.)
        // Lo único que cambió es que ahora m.reply y conn.reply pasan por traducción

    } catch (e) {
        console.error(e)
    } finally {
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        let user, stats = global.db.data.stats
        if (m) { 
            let utente = global.db.data.users[m.sender]
            if (utente.muto == true) {
                let bang = m.key.id
                let cancellazzione = m.key.participant
                await this.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: cancellazzione }})
            }
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp
                user.coin -= m.coin * 1
            }
        }

        try {
            if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
        } catch (e) { 
            console.log(m, m.quoted, e)
        }
        let settingsREAD = global.db.data.settings[this.user.jid] || {}  
        if (opts['autoread']) await this.readMessages([m.key])
    }
}

const file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.green('Actualizando "handler.js"'));
    if (global.conns && global.conns.length > 0 ) {
        const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];
        for (const userr of users) {
            userr.subreloadHandler(false)
        }
    }
});

export default { handler }