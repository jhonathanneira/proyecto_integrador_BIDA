const express = require('express');
const { requiereAdministracion } = require('./autorizacion');

module.exports = (connection) => {
    const ruta = express.Router();
    const soloAdmin = requiereAdministracion(connection);
    const datosCliente = (body) => ({
        nombre: body.nombre,
        apellido: body.apellido,
        documentoIdentidad: body.documentoIdentidad,
        fechaNacimiento: body.fechaNacimiento,
        genero: body.genero,
        direccion: body.direccion,
        telefono: body.telefono,
        correo: body.correo
    });
    const validar = (datos) => Object.values(datos).every(valor => valor !== undefined && valor !== null && String(valor).trim() !== '');

    ruta.get('/cliente', (req, res) => {
        connection.query('SELECT * FROM cliente ORDER BY idCliente DESC', (error, clientes) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener los clientes.', detalleError: error.code });
            return res.status(200).json({ total: clientes.length, clientes });
        });
    });

    ruta.get('/cliente/:id', (req, res) => {
        connection.query('SELECT * FROM cliente WHERE idCliente = ?', [req.params.id], (error, filas) => {
            if (error) return res.status(500).json({ mensaje: 'Error al consultar el cliente.', detalleError: error.code });
            if (!filas.length) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
            return res.status(200).json({ cliente: filas[0] });
        });
    });

    ruta.post('/cliente', soloAdmin, (req, res) => {
        const datos = datosCliente(req.body);
        if (!validar(datos)) return res.status(400).json({ mensaje: 'Todos los datos del cliente son obligatorios.' });
        connection.query('INSERT INTO cliente SET ?', datos, (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al crear el cliente.', detalleError: error.code });
            return res.status(201).json({ mensaje: 'Cliente creado exitosamente.', idCliente: resultado.insertId });
        });
    });

    ruta.put('/cliente/:id', soloAdmin, (req, res) => {
        const datos = datosCliente(req.body);
        if (!validar(datos)) return res.status(400).json({ mensaje: 'Todos los datos del cliente son obligatorios.' });
        connection.query('UPDATE cliente SET ? WHERE idCliente = ?', [datos, req.params.id], (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al actualizar el cliente.', detalleError: error.code });
            if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
            return res.status(200).json({ mensaje: 'Cliente actualizado exitosamente.' });
        });
    });

    ruta.delete('/cliente/:id', soloAdmin, (req, res) => {
        connection.query('DELETE FROM cliente WHERE idCliente = ?', [req.params.id], (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al eliminar el cliente.', detalleError: error.code });
            if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
            return res.status(200).json({ mensaje: 'Cliente eliminado exitosamente.' });
        });
    });

    return ruta;
};
