const express = require ('express');
const ruta = express.Router();


module.exports = (connection) => { 


// ======
// método para mostrar todos los registros de la tabla empleados
// ======   

ruta.get('/empleado', (req, res)=>{
    const sql = 'SELECT * FROM empleado';
    
    connection.query(sql, (error, empleados)=> {



        if (error) {
            console.error('error al obtener empleado:', error)
            return res.status(500).json({  
                mensaje: 'Error interno del servidor al obtener empleados',
            });
        }
        
        res.status(200).json({
            mensaje: 'lista de empleados obtenidos exitosamente',
            total: empleados.length,
            empleados
        });
    });
    });


// ==========================================================
// METODO PARA OBTENER UN EMPLEADO (GET /api/empleados/:id)
// ==========================================================



ruta.get('/empleado/:id', (req, res) => {
    const empleadoId = req.params.id;

    const sql = 'SELECT * FROM empleado WHERE idEmpleado = ?';

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


ruta.post('/empleado', (req, res) => {

    // obtenemos los datos del cuerpo de la peticion

    const { nombre, apellido, documento, rol, especialidad, telefono, email, usuario, PASSWORD } = req.body; 

    if (!nombre || !apellido || !documento || !rol || !especialidad || !telefono || !email || !usuario || !PASSWORD) {
        return res.status(400).json({
            mensaje: 'Faltan datos obligatorios para crear el empleado'
        });
    }

    const sql = 'INSERT INTO empleado (nombre, apellido, documento, rol, especialidad, telefono, email, usuario, PASSWORD) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [nombre, apellido, documento, rol, especialidad, telefono, email, usuario, PASSWORD];

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


ruta.put('/empleados/:id', (req, res) => {
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
    if (password) { updateCampos.push('PASSWORD = ?'); params.push(password); }

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


ruta.delete('/empleados/:id', (req, res) => {
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








return ruta;

}




