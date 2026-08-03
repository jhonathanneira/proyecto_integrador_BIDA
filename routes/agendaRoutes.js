const express = require('express');
const ruta = express.Router();

module.exports = (connection) => {
    ruta.get('/cita', (req, res) => {
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
            ORDER BY C.fecha ASC, C.hora ASC, C.idCita DESC
        `;

        connection.query(sql, (error, citas) => {
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

    ruta.get('/cita/:id', (req, res) => {
        const idCita = req.params.id;
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
            WHERE C.idCita = ?
        `;

        connection.query(sql, [idCita], (error, filas) => {
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

    ruta.post('/cita', (req, res) => {
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

    ruta.put('/cita/:id', (req, res) => {
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

    ruta.delete('/cita/:id', (req, res) => {
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