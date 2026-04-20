const express = require ('express');
const mysql = require ('mysql2');
const cors = require ('cors');

var app = express();

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
             
        }



    
});
