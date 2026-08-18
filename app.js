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
    // Probamos la conexión real a la base de datos
    connection.connect(function (error) {
        if (error) {
            throw error;
        } else {
            console.log('Conexión exitosa a la base de datos');

            const sqlAgenda = `
                CREATE TABLE IF NOT EXISTS cita (
                    idCita INT AUTO_INCREMENT PRIMARY KEY,
                    fecha DATE NOT NULL,
                    hora TIME NOT NULL,
                    paciente VARCHAR(150) NOT NULL,
                    documento VARCHAR(30) DEFAULT NULL,
                    telefono VARCHAR(30) DEFAULT NULL,
                    idEmpleado INT DEFAULT NULL,
                    tratamiento VARCHAR(150) NOT NULL,
                    estado VARCHAR(30) NOT NULL DEFAULT 'Programada',
                    observacion TEXT DEFAULT NULL,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_cita_empleado
                        FOREIGN KEY (idEmpleado) REFERENCES empleado(idEmpleado)
                        ON UPDATE CASCADE
                        ON DELETE SET NULL
                )
            `;

            const sqlTratamiento = `CREATE TABLE IF NOT EXISTS tratamiento (idTratamiento INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(120) NOT NULL, descripcion TEXT DEFAULT NULL, categoria VARCHAR(100) DEFAULT NULL, costo DECIMAL(12,2) NOT NULL, duracionMinutos INT DEFAULT NULL, activo TINYINT(1) NOT NULL DEFAULT 1, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
            const sqlEquipo = `CREATE TABLE IF NOT EXISTS equipoOdontologico (idEquipo INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(120) NOT NULL, tipo VARCHAR(100) NOT NULL, marca VARCHAR(100) DEFAULT NULL, modelo VARCHAR(100) DEFAULT NULL, serial VARCHAR(100) DEFAULT NULL UNIQUE, fechaAdquisicion DATE DEFAULT NULL, estado VARCHAR(30) NOT NULL DEFAULT 'Disponible', ubicacion VARCHAR(120) DEFAULT NULL, proximoMantenimiento DATE DEFAULT NULL, observaciones TEXT DEFAULT NULL, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
            const sqlNovedad = `CREATE TABLE IF NOT EXISTS novedad (idNovedad INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(150) NOT NULL, descripcion TEXT NOT NULL, idEmpleado INT NOT NULL, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_novedad_empleado FOREIGN KEY (idEmpleado) REFERENCES empleado(idEmpleado) ON UPDATE CASCADE ON DELETE RESTRICT)`;

            [sqlTratamiento, sqlEquipo, sqlNovedad].forEach((sqlTabla) => {
                connection.query(sqlTabla, (errorTabla) => {
                    if (errorTabla) console.error('Error al crear tablas de BIDA:', errorTabla);
                });
            });

            connection.query(sqlAgenda, (agendaError) => {
                if (agendaError) {
                    throw agendaError;
                }

                // Probamos la conexión con servidor local
                app.listen(puerto, function () {
                    console.log('Conexión con servidor ok en el puerto ' + puerto);
                });
            });
        }
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

// EXPORTAMOS LA APP
module.exports = app;
