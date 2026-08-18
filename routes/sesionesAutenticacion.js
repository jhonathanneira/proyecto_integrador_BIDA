const crypto = require('crypto');

const sesiones = new Map();
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

function crearSesion(idEmpleado) {
    const token = crypto.randomBytes(32).toString('hex');
    sesiones.set(token, { idEmpleado, expiraEn: Date.now() + DURACION_SESION_MS });
    return token;
}

function obtenerSesion(token) {
    const sesion = sesiones.get(token);
    if (!sesion || sesion.expiraEn < Date.now()) {
        sesiones.delete(token);
        return null;
    }
    return sesion;
}

function extraerToken(authorization = '') {
    const [tipo, token] = String(authorization).split(' ');
    return tipo === 'Bearer' && token ? token : null;
}

module.exports = { crearSesion, obtenerSesion, extraerToken };
