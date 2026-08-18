const express = require ('express');
const { crearSesion } = require('./sesionesAutenticacion');
const { crearHash, verificarContrasena } = require('./contrasenas');
const { requiereAdministracion } = require('./autorizacion');
const ruta = express.Router();


module.exports = (connection) => { 


// ======
// método para mostrar todos los registros de la tabla empleados
// ======   

ruta.get('/empleado', (req, res)=>{
    const sql = 'SELECT idEmpleado, nombre, apellido, documento, rol, especialidad, telefono, email, usuario FROM empleado';
    
    connection.query(sql, (error, empleado)=> {



        if (error) {
            console.error('error al obtener empleado:', error)
            return res.status(500).json({  
                mensaje: 'Error interno del servidor al obtener empleados',
            });
        }
        
        res.status(200).json({
            mensaje: 'lista de empleados obtenidos exitosamente',
            total: empleado.length,
            empleados: empleado
        });
    });
    });


// ==========================================================
// MÉTODO PARA OBTENER UN EMPLEADO (GET /api/empleados/:id)
// ==========================================================



ruta.get('/empleado/:id', (req, res) => {
    const empleadoId = req.params.id;

    const sql = 'SELECT idEmpleado, nombre, apellido, documento, rol, especialidad, telefono, email, usuario FROM empleado WHERE idEmpleado = ?';

    connection.query(sql, [empleadoId], (error, resultado) => {
        if (error) {
            console.error('Error al buscar empleado:', error);
            return res.status(500).json({
                mensaje: 'Error interno del servidor al buscar el empleado'
            });
        }

        if (resultado.length === 0) {
            return res.status(404).json({
                mensaje: `Empleado con ID ${empleadoId} no encontrado.`
            });
        }

        res.status(200).json({
            mensaje: `Detalles del empleado ${empleadoId} obtenidos.`,
            empleado: resultado[0]
        });
    });
});

// ==========================================================
// METODO PARA CREAR UN EMPLEADO (POST /api/empleados)
// ==========================================================


ruta.post('/empleado', requiereAdministracion(connection), async (req, res) => {

    // obtenemos los datos del cuerpo de la peticion

    const { nombre, apellido, documento, rol, especialidad, telefono, email, usuario, PASSWORD } = req.body; 

    if (!nombre || !apellido || !documento || !rol || !especialidad || !telefono || !email || !usuario || !PASSWORD) {
        return res.status(400).json({
            mensaje: 'Faltan datos obligatorios para crear el empleado'
        });
    }

    const sql = 'INSERT INTO empleado (nombre, apellido, documento, rol, especialidad, telefono, email, usuario, PASSWORD) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [nombre, apellido, documento, rol, especialidad, telefono, email, usuario, await crearHash(PASSWORD)];

    connection.query(sql, params, (error, resultado) => {
// manejo de errores
        if (error) {
            console.error('Error al crear empleado:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    mensaje: 'El documento o el usuario ya existe. Por favor, elija otro.'
                });
            }
            return res.status(500).json({
                mensaje: 'Error interno del servidor al crear el empleado'
            });
        }
// respuesta exitosa
        res.status(201).json({
            mensaje: 'Empleado creado exitosamente',
            idEmpleado: resultado.insertId,
            empleado: { nombre, apellido, documento, rol, especialidad, telefono, email, usuario }
        });
    

    });
});



// ==========================================================
// METODO PARA ACTUALIZAR EMPLEADO (PUT /api/empleados/:id)
// ==========================================================


ruta.put('/empleado/:id', requiereAdministracion(connection), async (req, res) => {
    // 1_ Obtenemos el ID del empleado
    const empleadoId = req.params.id;

    // 2_ Se leen los datos enviados en el body
    const { nombre, rol, usuario, password } = req.body;

    // 3_ Creamos las variables para construir la actualizacion dinámicamente
    let updateCampos = [];
    let params = [];

    // 4_ Se agregaran solamente los campos que vienen en el body
    if (nombre) { updateCampos.push('nombre = ?'); params.push(nombre); }
    if (rol) { updateCampos.push('rol = ?'); params.push(rol); }
    if (usuario) { updateCampos.push('usuario = ?'); params.push(usuario); }
    if (password) { updateCampos.push('PASSWORD = ?'); params.push(await crearHash(password)); }

    // 5_ Validamos si se envió al menos un campo
    if (updateCampos.length === 0) {
        return res.status(400).json({ mensaje: 'No hay campos válidos para actualizar.' });
    }

    // 6_ Aqui añadimos el ID del empleado al final de los parámetros
    params.push(empleadoId);

    // 7_ Variable que contiene la sentencia de construcción del SQL dinámico
    const sql = `UPDATE empleado SET ${updateCampos.join(', ')} WHERE idEmpleado = ?`;

    // 8_ Ejecución de la consulta
    connection.query(sql, params, (error, result) => {
        // 9_ Manejo de errores
        if (error) {
            console.error('Error al actualizar empleado:', error);
            return res.status(500).json({
                mensaje: 'Error interno del servidor al actualizar el empleado.'
            });
        }

        // 10_ Comprobamos si el empleado existe
        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensaje: `Empleado con ID ${empleadoId} no encontrado para actualizar.`
            });
        }

        // 11_ Respuesta exitosa
        res.status(200).json({
            mensaje: `Empleado con ID ${empleadoId} actualizado exitosamente`,
            datosActualizados: req.body
        });
    });
});



// ==========================================================
// METODO PARA ELIMINAR UN EMPLEADO (DELETE /api/empleados/:id)
// ==========================================================


ruta.delete('/empleado/:id', requiereAdministracion(connection), (req, res) => {
    const empleadoId = req.params.id;

    const sql = 'DELETE FROM empleado WHERE idEmpleado = ?';

    connection.query(sql, [empleadoId], (error, result) => {
        if (error) {
            console.error('Error al eliminar empleado:', error);
            return res.status(500).json({
                mensaje: 'Error interno del servidor al eliminar el empleado.'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensaje: `Empleado con ID ${empleadoId} no encontrado para eliminar.`
            });
        }

        res.status(200).json({
            mensaje: `Empleado con ID ${empleadoId} eliminado exitosamente`
        });
    });
});

// ==========================================================
// METODO PARA EL INICIO DE SESION - LOGIN (POST /api/empleados/login)
// ==========================================================

ruta.post('/empleado/login', (req, res) => {
    const { usuario, password } = req.body;
    const credencial = (usuario || '').trim();

    if (!credencial || !password) {
        return res.status(400).json({
            mensaje: 'Usuario y contraseña son requeridos para iniciar sesión'
        });
    }   

    const sql = 'SELECT idEmpleado, nombre, usuario, email, rol, especialidad, PASSWORD FROM empleado WHERE usuario = ? OR email = ?';
    
    connection.query(sql, [credencial, credencial], async (error, resultado) => {
        if (error) {
            console.error('Error al iniciar sesión:', error);
            return res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor al iniciar sesión'
            });
        }

        if (resultado.length === 0) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        const empleado = resultado[0];
        if (!await verificarContrasena(password, empleado.PASSWORD || '')) {
            return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }
        if (process.env.NODE_ENV !== 'test' && !String(empleado.PASSWORD).startsWith('$2')) {
            connection.query('UPDATE empleado SET PASSWORD = ? WHERE idEmpleado = ?', [await crearHash(password), empleado.idEmpleado], () => {});
        }
        delete empleado.PASSWORD;
        const token = crearSesion(empleado.idEmpleado);

        res.status(200).json({
            success: true,
            mensaje: 'Inicio de sesión exitoso',
            user: empleado,
            token
        });
    });
});

    return ruta;
};

