const express = require ('express');
const ruta = express.Router();

module.exports = function (connection) {


// ======
// método para mostrar todos los registros de la tabla productos
// ======


ruta.get('/producto', (req, res)=>{
    const sql = 'SELECT * FROM producto';

    connection.query(sql, (error, filas)=> {
        if (error) {
            console.error('error al obtener producto', error)
            res.status(500).send({ 
                message: 'Error al obtener productos',
                detalleError: error.code
            });
            return;
        }   

        if (filas.length === 0) {
            res.status(404).send({
                message: 'No se encontraron productos'
            });
            return;
        }
        else {
            res.status(200).send(filas);             
        }


        });
    
});


// ======
// método para mostrar un producto específico por su id
// ======



ruta.get('/producto/:idProducto', (req, res) => {

    const idProducto = req.params.idProducto;
    const sql = 'SELECT * FROM producto WHERE idProducto = ?';

    connection.query(sql, [idProducto], (error, fila) => {

        // 1. Manejo de Errores: Error de conexión o SQL (500 Internal Server Error)

        if (error) {
            console.error(`Error al consultar producto con ID ${idProducto}:`, error);
            res.status(500).send({
                message: `Error al consultar el producto con ID ${idProducto} en la base de datos.`,
                detalleError: error.code
            });
            return;
        }

        // 2. Manejo de Respuesta (Éxito en la Consulta)
        // La consulta devuelve un array 'fila'. Si está vacío, el producto no existe.

        if (fila.length === 0) {
            // Error 404: Recurso no encontrado
            res.status(404).send({
                message: `Producto con ID ${idProducto} no encontrado.`
            });
        } else {

            // Éxito 200: El producto fue encontrado. Como solo esperamos uno,
            // enviamos el primer elemento del array (fila[0]).

            res.status(200).send(fila[0]);
        }

    }); 
});


//===========================================
// Método para crear un producto
//===========================================

ruta.post('/producto', (req, res) => {
    let datos = {
        nombre: req.body.nombre,
        codigoBarra: req.body.codigoBarra,
        precioVenta: req.body.precioVenta,
        precioCompra: req.body.precioCompra,
        categoria: req.body.categoria,
        unidadMedida: req.body.unidadMedida,
        fechaVencimiento: req.body.fechaVencimiento
    };

    let sql = "INSERT INTO producto SET ?";

    connection.query(sql, datos, function (error, resultado) {
        if (error) {
            console.error("Error al insertar producto:", error);
            // Envía una respuesta de error al cliente en lugar de solo tirar el error
            res.status(500).send({
                message: "Error al crear el producto en la base de datos.",
                error: error.code
            });
        } else {
            // Envía la respuesta con el ID del nuevo producto
            res.status(201).send({
                message: "Producto creado con éxito",
                idProducto: resultado.insertId
            });
        }
    });
});


//===========================================
// Metodo para editar un producto
//===========================================


ruta.put('/producto/:idProducto', (req, res) => {
    
    const idProducto = req.params.idProducto;

    // Obtenemos los datos del cuerpo de la solicitud
    // Usamos la destructuración de req.body para mayor claridad
    const {
        nombre,
        codigoBarra,
        precioVenta,
        precioCompra,
        categoria,
        unidadMedida,
        fechaVencimiento
    } = req.body;

    // El orden de los placeholders en la SQL debe coincidir con el orden en el array de valores.
    const sql = "UPDATE producto SET nombre = ?, codigoBarra = ?, precioVenta = ?, precioCompra = ?, categoria = ?, unidadMedida = ?, fechaVencimiento = ? WHERE idProducto = ?";

    // Array de valores, asegurando el orden correcto de los datos
    const datos = [
        nombre,
        codigoBarra,
        precioVenta,
        precioCompra,
        categoria,
        unidadMedida,
        fechaVencimiento,
        idProducto // El ID es el último valor del WHERE
    ];

    connection.query(sql, datos, function(error, resultado){
        // 1. Manejo de Errores: Error de base de datos o conexión (500)
        if (error){
            console.error(`Error al actualizar producto con ID ${idProducto}:`, error);
            res.status(500).send({
                message: `Error al intentar actualizar el producto con ID ${idProducto}.`,
                detalleError: error.code
            });
            return;
        }

        // 2. Validación de Actualización
        if (resultado.affectedRows === 0) {
            // Error 404: Si la consulta no afectó ninguna fila, el ID no existe.
            res.status(404).send({
                message: `No se encontró el producto con ID ${idProducto} para actualizar.`
            });
        } else {
            // Éxito 200: El producto fue encontrado y actualizado.
            res.status(200).send({
                message: `Producto con ID ${idProducto} actualizado correctamente.`,
                affectedRows: resultado.affectedRows
            });
        }
    });
});


//===========================================
// Metodo para eliminar un producto
//===========================================


ruta.delete('/producto/:idProducto', (req, res) => {

    const idProducto = req.params.idProducto;

    const sql = 'DELETE FROM producto WHERE idProducto = ?';

    connection.query(sql, [idProducto], function(error, resultado){

        // 1. Manejo de Errores: Error de base de datos o conexión (500)
        if (error){
            console.error(`Error al eliminar producto con ID ${idProducto}:`, error);
            res.status(500).send({
                message: `Error al intentar eliminar el producto con ID ${idProducto}.`,
                detalleError: error.code
            });
            return;
        }

        // 2. Validación de Eliminación
        if (resultado.affectedRows === 0) {
            // Error 404: Si la consulta no afectó ninguna fila, el producto no existe.
            res.status(404).send({
                message: `No se encontró el producto con ID ${idProducto} para eliminar.`
            });
        } else {
            // Éxito 204: Eliminación exitosa. El código 204 (No Content)
            // es el estándar para operaciones DELETE exitosas que no devuelven cuerpo.
            res.status(204).send(); // No se envía contenido en el cuerpo
        }
    });
});


return ruta;
    
} 
