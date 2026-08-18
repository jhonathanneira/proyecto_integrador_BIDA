const express = require('express');
const { requiereAdministracion } = require('./autorizacion');

module.exports = (connection) => {
    const ruta = express.Router();
    const soloAdmin = requiereAdministracion(connection);
    const campos = ['nombre', 'descripcion', 'categoria', 'costo', 'duracionMinutos', 'activo'];
    const obtenerDatos = (body) => ({
        nombre: body.nombre,
        descripcion: body.descripcion || null,
        categoria: body.categoria || null,
        costo: body.costo,
        duracionMinutos: body.duracionMinutos || null,
        activo: body.activo === undefined ? 1 : !['0', 0, false, 'false'].includes(body.activo)
    });

    ruta.get('/tratamiento', (req, res) => { connection.query('SELECT * FROM tratamiento ORDER BY nombre', (error, tratamientos) => {
        if (error) return res.status(500).json({ mensaje: 'Error al obtener tratamientos.', detalleError: error.code });
        return res.status(200).json({ total: tratamientos.length, tratamientos });
    }); });
    ruta.get('/tratamiento/:id', (req, res) => { connection.query('SELECT * FROM tratamiento WHERE idTratamiento = ?', [req.params.id], (error, filas) => {
        if (error) return res.status(500).json({ mensaje: 'Error al consultar el tratamiento.', detalleError: error.code });
        if (!filas.length) return res.status(404).json({ mensaje: 'Tratamiento no encontrado.' });
        return res.status(200).json({ tratamiento: filas[0] });
    }); });
    ruta.post('/tratamiento', soloAdmin, (req, res) => {
        const datos = obtenerDatos(req.body);
        if (!datos.nombre || datos.costo === undefined || Number(datos.costo) < 0) return res.status(400).json({ mensaje: 'Nombre y costo válido son obligatorios.' });
        connection.query('INSERT INTO tratamiento SET ?', datos, (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al crear el tratamiento.', detalleError: error.code });
            return res.status(201).json({ mensaje: 'Tratamiento creado exitosamente.', idTratamiento: resultado.insertId });
        });
    });
    ruta.put('/tratamiento/:id', soloAdmin, (req, res) => {
        const datos = obtenerDatos(req.body);
        if (!datos.nombre || datos.costo === undefined || Number(datos.costo) < 0) return res.status(400).json({ mensaje: 'Nombre y costo válido son obligatorios.' });
        connection.query('UPDATE tratamiento SET ? WHERE idTratamiento = ?', [datos, req.params.id], (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al actualizar el tratamiento.', detalleError: error.code });
            if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Tratamiento no encontrado.' });
            return res.status(200).json({ mensaje: 'Tratamiento actualizado exitosamente.' });
        });
    });
    ruta.delete('/tratamiento/:id', soloAdmin, (req, res) => { connection.query('DELETE FROM tratamiento WHERE idTratamiento = ?', [req.params.id], (error, resultado) => {
        if (error) return res.status(500).json({ mensaje: 'Error al eliminar el tratamiento.', detalleError: error.code });
        if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Tratamiento no encontrado.' });
        return res.status(200).json({ mensaje: 'Tratamiento eliminado exitosamente.' });
    }); });
    return ruta;
};
