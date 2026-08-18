const express = require('express');
const { obtenerSesion, extraerToken } = require('./sesionesAutenticacion');

module.exports = (connection) => {
    const ruta = express.Router();

    ruta.get('/novedad', (req, res) => {
        const sql = `SELECT n.idNovedad, n.titulo, n.descripcion, n.createdAt,
                            e.nombre AS autor
                     FROM novedad n
                     INNER JOIN empleado e ON e.idEmpleado = n.idEmpleado
                     ORDER BY n.createdAt DESC, n.idNovedad DESC`;
        connection.query(sql, (error, novedades) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener las novedades.' });
            return res.status(200).json({ total: novedades.length, novedades });
        });
    });

    ruta.post('/novedad', (req, res) => {
        const { titulo, descripcion } = req.body || {};
        const token = extraerToken(req.headers.authorization);
        const sesion = token && obtenerSesion(token);
        if (!sesion) {
            return res.status(401).json({ mensaje: 'Debes iniciar sesión para publicar novedades.' });
        }
        const idEmpleado = sesion.idEmpleado;
        if (!titulo || !descripcion || !idEmpleado) {
            return res.status(400).json({ mensaje: 'El título, la descripción y el empleado son obligatorios.' });
        }

        connection.query('SELECT especialidad FROM empleado WHERE idEmpleado = ?', [idEmpleado], (error, empleados) => {
            if (error) return res.status(500).json({ mensaje: 'No fue posible validar la especialidad del empleado.' });
            if (!empleados.length) return res.status(404).json({ mensaje: 'Empleado no encontrado.' });

            const especialidad = String(empleados[0].especialidad || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            if (especialidad !== 'administracion') {
                return res.status(403).json({ mensaje: 'Solo los empleados con rol Administración pueden agregar novedades.' });
            }

            connection.query(
                'INSERT INTO novedad (titulo, descripcion, idEmpleado) VALUES (?, ?, ?)',
                [String(titulo).trim(), String(descripcion).trim(), idEmpleado],
                (insertError, resultado) => {
                    if (insertError) return res.status(500).json({ mensaje: 'Error al guardar la novedad.' });
                    return res.status(201).json({ mensaje: 'Novedad publicada exitosamente.', idNovedad: resultado.insertId });
                }
            );
        });
    });

    return ruta;
};
