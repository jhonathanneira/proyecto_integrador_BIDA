require('dotenv').config();
const express = require ('express');
const path = require('path');
const mysql = require ('mysql2');
const cors = require ('cors');
const productoRoutes = require('./routes/productoRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const tratamientoRoutes = require('./routes/tratamientoRoutes');
const equipoOdontologicoRoutes = require('./routes/equipoOdontologicoRoutes');
const novedadRoutes = require('./routes/novedadRoutes');
const registroRoutes = require('./routes/registroRoutes');


var app = express();

// Middleware para normalizar JSON que llega doble-encodado como string
// (p. ej. body: "{\"id\":1,...}") — intenta parsear hasta obtener un objeto.
app.use(express.text({ type: '*/*' }));
// Permitir peticiones desde el front-end (dev). Ajustar origen según sea necesario.
app.use(cors());
// También aceptar JSON estándar
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/WEB%20Y%20APP/BIDA_Inicio%20de%20sesion_login.html'));
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

var puerto = process.env.PORT || 3000;

function asegurarColumnaRol(callback) {
    const sqlColumna = `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleado' AND COLUMN_NAME = 'rol'`;

    connection.query(sqlColumna, (error, columnas) => {
        if (error || !columnas.length) return callback(error);

        const columna = columnas[0];
        const requiereCambio = columna.DATA_TYPE.toLowerCase() !== 'varchar'
            || Number(columna.CHARACTER_MAXIMUM_LENGTH) < 50
            || columna.IS_NULLABLE !== 'NO';

        if (!requiereCambio) return callback();

        connection.query('ALTER TABLE empleado MODIFY COLUMN rol VARCHAR(50) NOT NULL', (errorAlteracion) => {
            if (!errorAlteracion) console.log('Columna rol actualizada para admitir nuevos roles.');
            callback(errorAlteracion);
        });
    });
}

// DEFINIMOS LOS PARÁMETROS DE CONEXIÓN A LA BASE DE DATOS 
var connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bida',
    port: Number(process.env.DB_PORT || 3308),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined


});


/*
 * INICIO DEL SERVIDOR BIDA
 * Conexión a TiDB Cloud
 * No modifica ni crea tablas automáticamente.
 */

if (process.env.NODE_ENV !== 'test') {

    connection.connect(function (error) {

        if (error) {
            console.error(
                'Error al conectar con TiDB:',
                error.message
            );
            process.exit(1);
        }

        console.log('Conexión exitosa con TiDB Cloud');

        app.listen(puerto, '0.0.0.0', function () {
            console.log(
                'Servidor BIDA funcionando en el puerto ' + puerto
            );

            console.log(
                'Abre: http://localhost:' + puerto
            );
        });

    });

}


// CONEXIÓN DE RUTAS (Pasamos la conexión de mysql)
app.use('/app', productoRoutes(connection));
app.use('/app', empleadoRoutes(connection));
app.use('/app', ventaRoutes(connection));
app.use('/app', agendaRoutes(connection));
app.use('/app', clienteRoutes(connection));
app.use('/app', tratamientoRoutes(connection));
app.use('/app', equipoOdontologicoRoutes(connection));
app.use('/app', novedadRoutes(connection));
app.use('/app', registroRoutes(connection));

// EXPORTAMOS LA APP
module.exports = app;
