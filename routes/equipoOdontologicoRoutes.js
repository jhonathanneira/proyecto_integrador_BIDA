const express = require('express');
const { requiereAdministracion } = require('./autorizacion');

module.exports = (connection) => {
    const ruta = express.Router();
    const soloAdmin = requiereAdministracion(connection);
    const datosEquipo = (body) => ({
        nombre: body.nombre, tipo: body.tipo, marca: body.marca || null, modelo: body.modelo || null,
        serial: body.serial || null, fechaAdquisicion: body.fechaAdquisicion || null,
        estado: body.estado || 'Disponible', ubicacion: body.ubicacion || null,
        proximoMantenimiento: body.proximoMantenimiento || null, observaciones: body.observaciones || null
    });
    ruta.get('/equipo-odontologico', (req, res) => { connection.query('SELECT * FROM equipoOdontologico ORDER BY idEquipo DESC', (error, equipos) => {
        if (error) return res.status(500).json({ mensaje: 'Error al obtener equipos.', detalleError: error.code });
        return res.status(200).json({ total: equipos.length, equipos });
    }); });
    ruta.get('/equipo-odontologico/:id', (req, res) => { connection.query('SELECT * FROM equipoOdontologico WHERE idEquipo = ?', [req.params.id], (error, filas) => {
        if (error) return res.status(500).json({ mensaje: 'Error al consultar el equipo.', detalleError: error.code });
        if (!filas.length) return res.status(404).json({ mensaje: 'Equipo no encontrado.' });
        return res.status(200).json({ equipo: filas[0] });
    }); });
    ruta.post('/equipo-odontologico', soloAdmin, (req, res) => {
        const datos = datosEquipo(req.body);
        if (!datos.nombre || !datos.tipo) return res.status(400).json({ mensaje: 'Nombre y tipo son obligatorios.' });
        connection.query('INSERT INTO equipoOdontologico SET ?', datos, (error, resultado) => {
            if (error) return res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ mensaje: 'Error al crear el equipo.', detalleError: error.code });
            return res.status(201).json({ mensaje: 'Equipo odontológico creado exitosamente.', idEquipo: resultado.insertId });
        });
    });
    ruta.put('/equipo-odontologico/:id', soloAdmin, (req, res) => {
        const datos = datosEquipo(req.body);
        if (!datos.nombre || !datos.tipo) return res.status(400).json({ mensaje: 'Nombre y tipo son obligatorios.' });
        connection.query('UPDATE equipoOdontologico SET ? WHERE idEquipo = ?', [datos, req.params.id], (error, resultado) => {
            if (error) return res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ mensaje: 'Error al actualizar el equipo.', detalleError: error.code });
            if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Equipo no encontrado.' });
            return res.status(200).json({ mensaje: 'Equipo odontológico actualizado exitosamente.' });
        });
    });
    ruta.delete('/equipo-odontologico/:id', soloAdmin, (req, res) => { connection.query('DELETE FROM equipoOdontologico WHERE idEquipo = ?', [req.params.id], (error, resultado) => {
        if (error) return res.status(500).json({ mensaje: 'Error al eliminar el equipo.', detalleError: error.code });
        if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Equipo no encontrado.' });
        return res.status(200).json({ mensaje: 'Equipo odontológico eliminado exitosamente.' });
    }); });
    return ruta;
};
