const express = require ('express');
const mysql = require ('mysql2');
const cors = require ('cors');

var app = express();
app.use(express.json());

//asignamos el puerto 3000 a una variable

var puerto = 3000;

//probamos la conexión con servidor local

app.listen('3000', function () {
    console.log('conexión con servidor ok')
});

//crear la primera ruta de acceso con método get

app.get('/', function (req, res) {
    res.send('primera ruta de inicio');
});
 
//definimos los parámetros de conexión a la base de datos 

var connection = mysql.createConnection({
    host:'localhost', 
    user: 'root',
    password: '',
    database: 'bida', 
    port: 3308
})  

//probamos la conexión a la base de datos

connection.connect(function (error) {
    if (error) {
        throw error;
    } else {
    console.log('Conexión exitosa a la base de datos')
    }
})

// ======
// método para mostrar todos los registros de la tabla productos
// ======


app.get('/app/productos', (req, res)=>{
    const sql = 'SELECT * FROM productos';

    connection.query(sql, (error, filas)=> {
        if (error) {
            console.error('error al obtener productos', error)
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



app.get('/app/productos/:idProducto', (req, res) => {

    const idProducto = req.params.idProducto;
    const sql = 'SELECT * FROM productos WHERE idProducto = ?';

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

app.post('/app/productos', (req, res) => {
    let datos = {
        nombre: req.body.nombre,
        codigoBarra: req.body.codigoBarra,
        precioVenta: req.body.precioVenta,
        precioCompra: req.body.precioCompra,
        categoria: req.body.categoria,
        unidadMedida: req.body.unidadMedida,
        fechaVencimiento: req.body.fechaVencimiento
    };

    let sql = "INSERT INTO productos SET ?";

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


app.put('/app/productos/:idProducto', (req, res) => {
    
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
    const sql = "UPDATE productos SET nombre = ?, codigoBarra = ?, precioVenta = ?, precioCompra = ?, categoria = ?, unidadMedida = ?, fechaVencimiento = ? WHERE idProducto = ?";

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


app.delete('/app/productos/:idProducto', (req, res) => {

    const idProducto = req.params.idProducto;

    const sql = 'DELETE FROM productos WHERE idProducto = ?';

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