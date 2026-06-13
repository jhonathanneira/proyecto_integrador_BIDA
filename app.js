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
// Permitir peticiones desde el front-end (dev). Ajustar origen según sea necesario.
app.use(cors());
// También aceptar JSON estándar
app.use(express.json());
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

// DEFINIMOS LOS PARÁMETROS DE CONEXIÓN A LA BASE DE DATOS 
var connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password: '',
    database: 'bida', 
    port: 3308
});

// EVITAR QUE LEVANTE EL PUERTO Y CONEXIÓN REAL SI ESTAMOS EN NUESTRAS PRUEBAS (JEST)
if (process.env.NODE_ENV !== 'test') {
    // Probamos la conexión con servidor local
    app.listen(puerto, function () {
        console.log('Conexión con servidor ok en el puerto ' + puerto);
    });

    // Probamos la conexión real a la base de datos
    connection.connect(function (error) {
        if (error) {
            throw error;
        } else {
            console.log('Conexión exitosa a la base de datos');
        }
    });
}

// CONEXIÓN DE RUTAS (Pasamos la conexión de mysql)
app.use('/app', productoRoutes(connection));
app.use('/app', empleadoRoutes(connection));
app.use('/app', ventaRoutes(connection));

// EXPORTAMOS LA APP
module.exports = app;