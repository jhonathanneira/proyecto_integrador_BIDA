const express = require ('express');
const mysql = require ('mysql2');
const cors = require ('cors');
const productoRoutes = require('./routes/productoRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');


var app = express();

// Middleware para normalizar JSON que llega doble-encodado como string
// (p. ej. body: "{\"id\":1,...}") — intenta parsear hasta obtener un objeto.
app.use(express.text({ type: '*/*' }));
app.use((req, res, next) => {
    const raw = req.body;
    if (!raw || typeof raw !== 'string') {
        // Si no es texto, dejamos que otros middlewares lo manejen
        return next();
    }

    try {
        // Primer intento: parsear directamente
        const parsed = JSON.parse(raw);
        // Si el parse resultó en string (doble-encodado), intentamos otra vez
        if (typeof parsed === 'string') {
            try {
                req.body = JSON.parse(parsed);
            } catch (e) {
                // si falla, dejamos la versión string para que la validación de rutas la capture
                req.body = parsed;
            }
        } else {
            req.body = parsed;
        }
        return next();
    } catch (err) {
        // No es JSON válido -> dejamos el raw en req.rawBody y devolvemos error claro
        req.rawBody = raw;
        return res.status(400).send({ mensaje: 'JSON inválido en el body. Asegúrate de enviar application/json con un objeto JSON válido.', detalle: err.message });
    }
});

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
 app.use('/app', ventaRoutes(connection));
 