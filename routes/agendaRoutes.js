const express = require('express');
const { obtenerSesion, extraerToken } = require('./sesionesAutenticacion');
const ruta = express.Router();

module.exports = (connection) => {
    const requiereSesion = (req, res, next) => {
        const token = extraerToken(req.headers.authorization);
        const sesion = token && obtenerSesion(token);
        if (!sesion) return res.status(401).json({ mensaje: 'Debes iniciar sesión para consultar la agenda.' });

        connection.query('SELECT idEmpleado, especialidad FROM empleado WHERE idEmpleado = ?', [sesion.idEmpleado], (error, empleados) => {
            if (error) return res.status(500).json({ mensaje: 'No fue posible validar el empleado.' });
            if (!empleados.length) return res.status(404).json({ mensaje: 'Empleado no encontrado.' });
            const especialidad = String(empleados[0].especialidad || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            req.empleadoAgenda = { idEmpleado: sesion.idEmpleado, esAdministracion: especialidad === 'administracion' };
            return next();
        });
    };

    const requiereAdministracion = (req, res, next) => {
        const token = extraerToken(req.headers.authorization);
        const sesion = token && obtenerSesion(token);
        if (!sesion) return res.status(401).json({ mensaje: 'Debes iniciar sesión para crear citas.' });

        connection.query('SELECT especialidad FROM empleado WHERE idEmpleado = ?', [sesion.idEmpleado], (error, empleados) => {
            if (error) return res.status(500).json({ mensaje: 'No fue posible validar la especialidad del empleado.' });
            if (!empleados.length) return res.status(404).json({ mensaje: 'Empleado no encontrado.' });
            const especialidad = String(empleados[0].especialidad || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            if (especialidad !== 'administracion') {
                return res.status(403).json({ mensaje: 'Solo los empleados con especialidad Administración pueden crear citas.' });
            }
            return next();
        });
    };

    ruta.get('/cita', requiereSesion, (req, res) => {
        const filtro = req.empleadoAgenda.esAdministracion ? '' : 'WHERE C.idEmpleado = ?';
        const parametros = req.empleadoAgenda.esAdministracion ? [] : [req.empleadoAgenda.idEmpleado];
        const sql = `
            SELECT
                C.idCita,
                C.fecha,
                C.hora,
                C.paciente,
                C.documento,
                C.telefono,
                C.idEmpleado,
                E.nombre AS nombreEmpleado,
                C.tratamiento,
                C.estado,
                C.observacion,
                C.createdAt
            FROM cita C
            LEFT JOIN empleado E ON C.idEmpleado = E.idEmpleado
            ${filtro}
            ORDER BY C.fecha ASC, C.hora ASC, C.idCita DESC
        `;

        connection.query(sql, parametros, (error, citas) => {
            if (error) {
                console.error('Error al obtener citas:', error);
                return res.status(500).json({
                    mensaje: 'Error interno del servidor al obtener la agenda.'
                });
            }

            return res.status(200).json({
                mensaje: 'lista de citas obtenidas exitosamente',
                total: citas.length,
                citas
            });
        });
    });

    ruta.get('/cita/:id', requiereSesion, (req, res) => {
        const idCita = req.params.id;
        const filtro = req.empleadoAgenda.esAdministracion ? 'WHERE C.idCita = ?' : 'WHERE C.idCita = ? AND C.idEmpleado = ?';
        const parametros = req.empleadoAgenda.esAdministracion ? [idCita] : [idCita, req.empleadoAgenda.idEmpleado];
        const sql = `
            SELECT
                C.idCita,
                C.fecha,
                C.hora,
                C.paciente,
                C.documento,
                C.telefono,
                C.idEmpleado,
                E.nombre AS nombreEmpleado,
                C.tratamiento,
                C.estado,
                C.observacion,
                C.createdAt
            FROM cita C
            LEFT JOIN empleado E ON C.idEmpleado = E.idEmpleado
            ${filtro}
        `;

        connection.query(sql, parametros, (error, filas) => {
            if (error) {
                console.error('Error al consultar cita:', error);
                return res.status(500).json({
                    mensaje: 'Error interno del servidor al consultar la cita.'
                });
            }

            if (filas.length === 0) {
                return res.status(404).json({
                    mensaje: `Cita con ID ${idCita} no encontrada.`
                });
            }

            return res.status(200).json({
                mensaje: `Detalles de la cita ${idCita} obtenidos.`,
                cita: filas[0]
            });
        });
    });

    ruta.post('/cita', requiereAdministracion, (req, res) => {
        const {
            fecha,
            hora,
            paciente,
            documento,
            telefono,
            idEmpleado,
            tratamiento,
            estado,
            observacion
        } = req.body;

        if (!fecha || !hora || !paciente || !tratamiento) {
            return res.status(400).json({
                mensaje: 'Fecha, hora, paciente y tratamiento son obligatorios para crear la cita.'
            });
        }

        const sql = `
            INSERT INTO cita
                (fecha, hora, paciente, documento, telefono, idEmpleado, tratamiento, estado, observacion)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            fecha,
            hora,
            paciente,
            documento || null,
            telefono || null,
            idEmpleado || null,
            tratamiento,
            estado || 'Programada',
            observacion || null
        ];

        connection.query(sql, params, (error, resultado) => {
            if (error) {
                console.error('Error al crear cita:', error);
                return res.status(500).json({
                    mensaje: 'Error interno del servidor al crear la cita.'
                });
            }

            return res.status(201).json({
                mensaje: 'Cita creada exitosamente',
                idCita: resultado.insertId
            });
        });
    });

    ruta.put('/cita/:id', requiereAdministracion, (req, res) => {
        const idCita = req.params.id;
        const {
            fecha,
            hora,
            paciente,
            documento,
            telefono,
            idEmpleado,
            tratamiento,
            estado,
            observacion
        } = req.body;

        if (!fecha || !hora || !paciente || !tratamiento) {
            return res.status(400).json({
                mensaje: 'Fecha, hora, paciente y tratamiento son obligatorios para actualizar la cita.'
            });
        }

        const sql = `
            UPDATE cita
            SET fecha = ?, hora = ?, paciente = ?, documento = ?, telefono = ?, idEmpleado = ?, tratamiento = ?, estado = ?, observacion = ?
            WHERE idCita = ?
        `;

        const params = [
            fecha,
            hora,
            paciente,
            documento || null,
            telefono || null,
            idEmpleado || null,
            tratamiento,
            estado || 'Programada',
            observacion || null,
            idCita
        ];

        connection.query(sql, params, (error, resultado) => {
            if (error) {
                console.error('Error al actualizar cita:', error);
                return res.status(500).json({
                    mensaje: 'Error interno del servidor al actualizar la cita.'
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: `Cita con ID ${idCita} no encontrada para actualizar.`
                });
            }

            return res.status(200).json({
                mensaje: `Cita con ID ${idCita} actualizada exitosamente`
            });
        });
    });

    ruta.delete('/cita/:id', requiereAdministracion, (req, res) => {
        const idCita = req.params.id;

        connection.query('DELETE FROM cita WHERE idCita = ?', [idCita], (error, resultado) => {
            if (error) {
                console.error('Error al eliminar cita:', error);
                return res.status(500).json({
                    mensaje: 'Error interno del servidor al eliminar la cita.'
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: `Cita con ID ${idCita} no encontrada para eliminar.`
                });
            }

            return res.status(200).json({
                mensaje: `Cita con ID ${idCita} eliminada exitosamente`
            });
        });
    });

    return ruta;
};
