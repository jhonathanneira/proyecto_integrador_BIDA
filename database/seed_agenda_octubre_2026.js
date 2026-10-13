require('dotenv').config();

const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
};

const pacientesNuevos = [
  ['Valentina', 'Morales', '1045678901', '1997-01-12', 'Femenino', 'Calle 72 #14-18', '3004567891', 'valentina.morales@bida.demo'],
  ['Samuel', 'Ortiz', '1045678902', '1989-06-23', 'Masculino', 'Carrera 36 #8-42', '3004567892', 'samuel.ortiz@bida.demo'],
  ['Camila', 'Vargas', '1045678903', '1999-09-08', 'Femenino', 'Calle 19 #31-09', '3004567893', 'camila.vargas@bida.demo'],
  ['Andrés', 'Pineda', '1045678904', '1985-04-17', 'Masculino', 'Carrera 11 #64-25', '3004567894', 'andres.pineda@bida.demo'],
  ['Natalia', 'Herrera', '1045678905', '1993-12-01', 'Femenino', 'Avenida 6 #28-16', '3004567895', 'natalia.herrera@bida.demo'],
  ['Mateo', 'Salazar', '1045678906', '2000-02-14', 'Masculino', 'Calle 45 #19-60', '3004567896', 'mateo.salazar@bida.demo']
];

const productosNuevos = [
  ['Kit de profilaxis desechable', '7700000001010', 18500, 11000, 'Bioseguridad', 'Kit', '2028-08-31'],
  ['Pasta profiláctica menta', '7700000001011', 22000, 13500, 'Higiene oral', 'Tubo', '2028-11-30'],
  ['Rollos de algodón dental', '7700000001012', 15000, 8500, 'Insumos odontológicos', 'Paquete x 100', '2029-03-31']
];

const tratamientosNuevos = [
  ['Valoración odontológica integral', 'Consulta inicial con diagnóstico y plan de tratamiento.', 'Diagnóstico', 65000, 30, 1],
  ['Aplicación de sellantes', 'Protección preventiva para superficies oclusales.', 'Prevención', 95000, 40, 1],
  ['Endodoncia unirradicular', 'Tratamiento de conducto en pieza de una raíz.', 'Endodoncia', 480000, 90, 1]
];

const equiposNuevos = [
  ['Ultrasonido dental', 'Detartrador', 'Woodpecker', 'UDS-P', 'BIDA-OCT-001', '2026-10-01', 'Disponible', 'Consultorio 3', '2027-10-01', 'Equipo incorporado para profilaxis'],
  ['Sensor radiográfico digital', 'Radiografía', 'Carestream', 'RVG 6200', 'BIDA-OCT-002', '2026-10-01', 'Disponible', 'Consultorio 2', '2027-10-01', 'Equipo de apoyo diagnóstico']
];

async function insertarSiNoExiste(db, consultaExistencia, parametrosExistencia, consultaInsercion, parametrosInsercion) {
  const [filas] = await db.query(consultaExistencia, parametrosExistencia);
  if (filas.length) return false;
  await db.query(consultaInsercion, parametrosInsercion);
  return true;
}

async function ejecutar() {
  const requeridas = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const faltantes = requeridas.filter((nombre) => !process.env[nombre]);
  if (faltantes.length) throw new Error(`Faltan variables de conexión: ${faltantes.join(', ')}`);

  console.log(`Destino de carga: ${config.host}:${config.port}/${config.database}${config.ssl ? ' (SSL)' : ''}`);
  const db = await mysql.createConnection(config);
  let creadas = 0;

  try {
    await db.beginTransaction();

    for (const paciente of pacientesNuevos) {
      const creado = await insertarSiNoExiste(
        db,
        'SELECT idCliente FROM cliente WHERE documentoIdentidad = ? OR correo = ? LIMIT 1',
        [paciente[2], paciente[7]],
        'INSERT INTO cliente (nombre, apellido, documentoIdentidad, fechaNacimiento, genero, direccion, telefono, correo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        paciente
      );
      if (creado) creadas += 1;
    }

    for (const producto of productosNuevos) {
      const creado = await insertarSiNoExiste(
        db,
        'SELECT idProducto FROM producto WHERE codigoBarra = ? LIMIT 1',
        [producto[1]],
        'INSERT INTO producto (nombre, codigoBarra, precioVenta, precioCompra, categoria, unidadMedida, fechaVencimiento) VALUES (?, ?, ?, ?, ?, ?, ?)',
        producto
      );
      if (creado) creadas += 1;
    }

    for (const tratamiento of tratamientosNuevos) {
      const creado = await insertarSiNoExiste(
        db,
        'SELECT idTratamiento FROM tratamiento WHERE nombre = ? LIMIT 1',
        [tratamiento[0]],
        'INSERT INTO tratamiento (nombre, descripcion, categoria, costo, duracionMinutos, activo) VALUES (?, ?, ?, ?, ?, ?)',
        tratamiento
      );
      if (creado) creadas += 1;
    }

    for (const equipo of equiposNuevos) {
      const creado = await insertarSiNoExiste(
        db,
        'SELECT idEquipo FROM equipoOdontologico WHERE serial = ? LIMIT 1',
        [equipo[4]],
        'INSERT INTO equipoOdontologico (nombre, tipo, marca, modelo, serial, fechaAdquisicion, estado, ubicacion, proximoMantenimiento, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        equipo
      );
      if (creado) creadas += 1;
    }

    const [productos] = await db.query('SELECT idProducto FROM producto WHERE codigoBarra IN (?, ?, ?)', productosNuevos.map((producto) => producto[1]));
    for (const producto of productos) {
      const creado = await insertarSiNoExiste(
        db,
        'SELECT idInventario FROM inventario WHERE idProducto = ? AND ubicacion = ? LIMIT 1',
        [producto.idProducto, 'Bodega principal'],
        'INSERT INTO inventario (idProducto, ubicacion, stockActual, stockMinimo, fechaUltimaActualizacion) VALUES (?, ?, ?, ?, NOW())',
        [producto.idProducto, 'Bodega principal', 40, 8]
      );
      if (creado) creadas += 1;
    }

    const [doctores] = await db.query(`SELECT idEmpleado, nombre, apellido FROM empleado
      WHERE LOWER(especialidad) <> 'administración' ORDER BY idEmpleado`);
    const [pacientes] = await db.query('SELECT nombre, apellido, documentoIdentidad, telefono FROM cliente ORDER BY idCliente');
    const [tratamientos] = await db.query('SELECT nombre FROM tratamiento WHERE activo = 1 ORDER BY idTratamiento');
    if (!doctores.length || !pacientes.length || !tratamientos.length) {
      throw new Error('No hay médicos, pacientes o tratamientos suficientes para crear la agenda.');
    }

    const horas = ['08:00:00', '09:30:00', '11:00:00', '14:00:00', '15:30:00'];
    let indice = 0;
    let citasCreadas = 0;
    for (let dia = 13; dia <= 31; dia += 1) {
      const fecha = `2026-10-${String(dia).padStart(2, '0')}`;
      for (let turno = 0; turno < horas.length; turno += 1) {
        const doctor = doctores[indice % doctores.length];
        const paciente = pacientes[indice % pacientes.length];
        const tratamiento = tratamientos[indice % tratamientos.length];
        const observacion = `Agenda octubre 2026 · ${fecha} · turno ${turno + 1}`;
        const creado = await insertarSiNoExiste(
          db,
          'SELECT idCita FROM cita WHERE observacion = ? LIMIT 1',
          [observacion],
          'INSERT INTO cita (fecha, hora, paciente, documento, telefono, idEmpleado, tratamiento, estado, observacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [fecha, horas[turno], `${paciente.nombre} ${paciente.apellido}`, paciente.documentoIdentidad, paciente.telefono, doctor.idEmpleado, tratamiento.nombre, turno === 0 ? 'Confirmada' : 'Programada', observacion]
        );
        if (creado) citasCreadas += 1;
        indice += 1;
      }
    }

    const [administradores] = await db.query("SELECT idEmpleado FROM empleado WHERE LOWER(especialidad) IN ('administración', 'administracion') ORDER BY idEmpleado LIMIT 1");
    if (administradores.length) {
      const creado = await insertarSiNoExiste(
        db,
        'SELECT idNovedad FROM novedad WHERE titulo = ? LIMIT 1',
        ['Agenda de octubre actualizada'],
        'INSERT INTO novedad (titulo, descripcion, idEmpleado) VALUES (?, ?, ?)',
        ['Agenda de octubre actualizada', 'La agenda cuenta con cinco citas diarias del 13 al 31 de octubre de 2026.', administradores[0].idEmpleado]
      );
      if (creado) creadas += 1;
    }

    await db.commit();
    console.log(`Carga completada: ${citasCreadas} citas creadas y ${creadas} registros complementarios creados.`);
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    await db.end();
  }
}

ejecutar().catch((error) => {
  console.error('No fue posible cargar la agenda de octubre:', error.message || error.code || error);
  process.exitCode = 1;
});
