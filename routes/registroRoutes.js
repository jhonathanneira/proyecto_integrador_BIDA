const express = require('express');
const { crearHash } = require('./contrasenas');

const texto = (valor) => String(valor || '').trim();
const esAdministracion = (valor) => texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase() === 'administracion';

module.exports = (connection) => {
    const ruta = express.Router();

    ruta.post('/registro', async (req, res) => {
        const tipo = texto(req.body?.tipo).toLowerCase();

        if (tipo === 'cliente') {
            const cliente = {
                nombre: texto(req.body.nombre), apellido: texto(req.body.apellido),
                documentoIdentidad: texto(req.body.documentoIdentidad), fechaNacimiento: texto(req.body.fechaNacimiento),
                genero: texto(req.body.genero), direccion: texto(req.body.direccion),
                telefono: texto(req.body.telefono), correo: texto(req.body.correo).toLowerCase()
            };
            if (Object.values(cliente).some(valor => !valor)) return res.status(400).json({ mensaje: 'Completa todos los datos requeridos del paciente.' });
            return connection.query('INSERT INTO cliente SET ?', cliente, (error, resultado) => {
                if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Ya existe un paciente con ese documento o correo.' });
                if (error) return res.status(500).json({ mensaje: 'No fue posible registrar el paciente.' });
                return res.status(201).json({ mensaje: 'Paciente registrado exitosamente.', idCliente: resultado.insertId });
            });
        }

        if (tipo === 'empleado') {
            const empleado = {
                nombre: texto(req.body.nombre), apellido: texto(req.body.apellido), documento: texto(req.body.documento),
                especialidad: texto(req.body.especialidad), telefono: texto(req.body.telefono), email: texto(req.body.email).toLowerCase(),
                usuario: texto(req.body.usuario), password: String(req.body.password || '')
            };
            if (Object.values(empleado).some(valor => !valor)) return res.status(400).json({ mensaje: 'Completa todos los datos requeridos del empleado.' });
            if (esAdministracion(empleado.especialidad)) return res.status(403).json({ mensaje: 'Las cuentas de Administración se crean desde el módulo de Administración.' });

            const passwordHash = await crearHash(empleado.password);
            const parametros = [empleado.nombre, empleado.apellido, empleado.documento, 'Empleado', empleado.especialidad, empleado.telefono, empleado.email, empleado.usuario, passwordHash];
            return connection.query('INSERT INTO empleado (nombre, apellido, documento, rol, especialidad, telefono, email, usuario, PASSWORD) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', parametros, (error, resultado) => {
                if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'El documento, correo o usuario ya se encuentra registrado.' });
                if (error) return res.status(500).json({ mensaje: 'No fue posible registrar el empleado.' });
                return res.status(201).json({ mensaje: 'Empleado registrado exitosamente.', idEmpleado: resultado.insertId });
            });
        }

        return res.status(400).json({ mensaje: 'Selecciona el tipo de registro.' });
    });

    return ruta;
};
