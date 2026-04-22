const express = require ('express');
const mysql = require ('mysql2');
const cors = require ('cors');
const productoRoutes = require('./routes/productoRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');


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





// conexión de rutas


 app.use('/app', productoRoutes(connection));
 app.use('/app', empleadoRoutes(connection));