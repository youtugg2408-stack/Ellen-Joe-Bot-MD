import fs from 'fs';
import path from 'path';
import translate from '@vitalets/google-translate-api';

const dbPath = path.resolve('./src/database/lengu-db.json');
let db = {};

// Cargar DB al iniciar
try {
    const data = fs.readFileSync(dbPath, 'utf8');
    db = JSON.parse(data);
} catch (error) {
    console.error('No se pudo cargar la base de datos de idiomas. Creando un nuevo archivo...');
    fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
}

// Guardar cambios
function saveDb() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

/**
 * Establece el idioma de un usuario.
 * @param {string} userId 
 * @param {string} langCode 
 */
export function setLanguage(userId, langCode) {
    db[userId] = langCode;
    saveDb();
}

/**
 * Obtiene el idioma de un usuario desde la base de datos.
 * @param {string} userId 
 * @returns {string} idioma (default: 'es')
 */
export function getLanguage(userId) {
    return db[userId] || 'es';
}

/**
 * Traduce un texto si el idioma de destino es diferente de 'es'.
 * Respeta comandos (#, ., !, /) y URLs sin traducirlos.
 * 
 * @param {string} text Texto en español
 * @param {string} targetLang Idioma de destino
 * @returns {Promise<string>} Texto final traducido
 */
export async function translateIfNeeded(text, targetLang) {
    if (targetLang === 'es') {
        return text;
    }

    try {
        // Expresiones regulares
        const commandRegex = /^[#./!]\w+/; 
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

        // Extraer comandos (si hay al inicio)
        const commandMatch = text.match(commandRegex);
        const commandPart = commandMatch ? commandMatch[0] : null;

        // Extraer URLs
        let urls = [];
        let placeholderIndex = 0;
        const textWithPlaceholders = text.replace(urlRegex, match => {
            urls.push(match);
            return `__URL${placeholderIndex++}__`;
        });

        // Quitar el comando temporalmente para no traducirlo
        let textToTranslate = commandPart
            ? textWithPlaceholders.replace(commandRegex, "").trim()
            : textWithPlaceholders;

        // Traducir solo la parte sin comandos/urls
        let translatedPart = textToTranslate
            ? (await translate(textToTranslate, { to: targetLang })).text
            : "";

        // Restaurar comando + urls
        let finalText = "";
        if (commandPart) finalText += commandPart + " ";
        finalText += translatedPart;

        urls.forEach((url, i) => {
            finalText = finalText.replace(`__URL${i}__`, url);
        });

        return finalText.trim();

    } catch (error) {
        console.error('Error al traducir el texto:', error);
        return text; // Devuelve original si falla
    }
}