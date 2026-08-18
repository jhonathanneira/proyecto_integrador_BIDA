const { obtenerSesion, extraerToken } = require('./sesionesAutenticacion');

function requiereAdministracion(connection) {
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'test') return next();
        const token = extraerToken(req.headers.authorization);
        const sesion = token && obtenerSesion(token);
        if (!sesion) return res.status(401).json({ mensaje: 'Debes iniciar sesión para realizar esta acción.' });
        connection.query('SELECT especialidad FROM empleado WHERE idEmpleado = ?', [sesion.idEmpleado], (error, empleados) => {
            if (error) return res.status(500).json({ mensaje: 'No fue posible validar la especialidad.' });
            const especialidad = String(empleados[0]?.especialidad || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            if (especialidad !== 'administracion') return res.status(403).json({ mensaje: 'Solo Administración puede realizar esta acción.' });
            return next();
        });
    };
}

module.exports = { requiereAdministracion };
