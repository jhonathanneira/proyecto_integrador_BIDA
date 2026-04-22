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

        
return ruta;
}

   