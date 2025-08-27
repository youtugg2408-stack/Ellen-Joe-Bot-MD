import fs from 'fs';
import path from 'path';
import translate from '@vitalets/google-translate-api';

const dbPath = path.resolve('./src/database/lengu-db.json');
let db = {};

// Carga la base de datos de idiomas al iniciar el bot
try {
    const data = fs.readFileSync(dbPath, 'utf8');
    db = JSON.parse(data);
} catch (error) {
    console.error('No se pudo cargar la base de datos de idiomas. Creando un nuevo archivo...');
    fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
}

// Guarda los cambios en el archivo JSON
function saveDb() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

/**
 * Establece el idioma de un usuario.
 * @param {string} userId El ID del usuario.
 * @param {string} langCode El código de idioma (ej. 'es', 'en').
 */
export function setLanguage(userId, langCode) {
    db[userId] = langCode;
    saveDb();
}

/**
 * Obtiene el idioma de un usuario desde la base de datos.
 * @param {string} userId El ID del usuario.
 * @returns {string} El código de idioma, por defecto 'es'.
 */
export function getLanguage(userId) {
    return db[userId] || 'es';
}

/**
 * Traduce un texto si el idioma de destino es diferente de 'es'.
 * @param {string} text El texto a traducir.
 * @param {string} targetLang El código del idioma de destino.
 * @returns {Promise<string>} El texto traducido o el original.
 */
export async function translateIfNeeded(text, targetLang) {
    if (targetLang === 'es') {
        return text;
    }
    try {
        const { text: translatedText } = await translate(text, { to: targetLang });
        return translatedText;
    } catch (error) {
        console.error('Error al traducir el texto:', error);
        return text; // Devuelve el texto original si hay un error
    }
}
