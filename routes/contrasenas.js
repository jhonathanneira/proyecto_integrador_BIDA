const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function crearHash(contrasena) {
    return bcrypt.hash(String(contrasena), 12);
}

async function verificarContrasena(contrasena, almacenada) {
    if (!String(almacenada).startsWith('$2')) {
        const entrada = Buffer.from(String(contrasena));
        const guardada = Buffer.from(String(almacenada));
        return entrada.length === guardada.length && crypto.timingSafeEqual(entrada, guardada);
    }
    return bcrypt.compare(String(contrasena), String(almacenada));
}

module.exports = { crearHash, verificarContrasena };
