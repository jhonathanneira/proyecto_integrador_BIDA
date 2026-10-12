const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bida'
};

async function ejecutar() {
  const db = await mysql.createConnection(config);
  try {
    await db.beginTransaction();

    await db.query(`INSERT INTO cliente
      (nombre, apellido, documentoIdentidad, fechaNacimiento, genero, direccion, telefono, correo)
      VALUES
      ('Laura', 'Martínez', '1012345678', '1994-03-18', 'Femenino', 'Cra 12 #45-20', '3001112233', 'laura.martinez.demo@email.com'),
      ('Diego', 'Castro', '1023456789', '1988-11-02', 'Masculino', 'Calle 80 #10-15', '3012223344', 'diego.castro.demo@email.com'),
      ('Sofía', 'Navarro', '1034567890', '2001-07-25', 'Femenino', 'Carrera 7 #32-11', '3023334455', 'sofia.navarro.demo@email.com')`);

    await db.query(`INSERT INTO producto
      (nombre, codigoBarra, precioVenta, precioCompra, categoria, unidadMedida, fechaVencimiento)
      VALUES
      ('Guantes de nitrilo talla M', '7700000001001', 28000, 18000, 'Bioseguridad', 'Caja x 100', '2028-12-31'),
      ('Hilo dental profesional', '7700000001002', 18000, 10000, 'Higiene oral', 'Unidad', '2029-06-30'),
      ('Fluoruro de sodio en gel', '7700000001003', 42000, 26000, 'Prevención', 'Frasco', '2028-09-30')`);

    const [productos] = await db.query(
      'SELECT idProducto, nombre, precioVenta FROM producto WHERE codigoBarra IN (?, ?, ?)',
      ['7700000001001', '7700000001002', '7700000001003']
    );
    for (const producto of productos) {
      await db.query(
        `INSERT INTO inventario (idProducto, ubicacion, stockActual, stockMinimo, fechaUltimaActualizacion)
         VALUES (?, 'Bodega principal', 30, 5, NOW())`,
        [producto.idProducto]
      );
    }

    await db.query(`INSERT INTO tratamiento
      (nombre, descripcion, categoria, costo, duracionMinutos, activo)
      VALUES
      ('Limpieza dental profesional', 'Remoción de placa y cálculo dental.', 'Prevención', 85000, 45, 1),
      ('Blanqueamiento dental', 'Sesión de blanqueamiento con valoración previa.', 'Estética', 420000, 90, 1),
      ('Restauración con resina', 'Restauración de pieza dental con resina estética.', 'Operatoria', 180000, 60, 1)`);

    await db.query(`INSERT INTO equipoodontologico
      (nombre, tipo, marca, modelo, serial, fechaAdquisicion, estado, ubicacion, proximoMantenimiento, observaciones)
      VALUES
      ('Lámpara de fotocurado', 'Lámpara dental', 'Woodpecker', 'LED.H', 'BIDA-DEMO-001', '2024-02-10', 'Disponible', 'Consultorio 1', '2027-02-10', 'Equipo de demostración'),
      ('Compresor odontológico', 'Compresor', 'Dürr Dental', 'Tornado', 'BIDA-DEMO-002', '2023-08-15', 'En mantenimiento', 'Cuarto técnico', '2026-11-15', 'Revisión preventiva programada'),
      ('Cámara intraoral', 'Cámara', 'Carestream', 'CS 1200', 'BIDA-DEMO-003', '2025-01-20', 'Disponible', 'Consultorio 2', '2027-01-20', 'Equipo de apoyo diagnóstico')`);

    const [[empleado]] = await db.query('SELECT idEmpleado FROM empleado WHERE usuario = ? LIMIT 1', ['anar']);
    const [[cliente]] = await db.query('SELECT idCliente FROM cliente WHERE documentoIdentidad = ? LIMIT 1', ['1012345678']);
    if (!empleado || !cliente) throw new Error('No se encontró el empleado o cliente de demostración.');

    await db.query(`INSERT INTO cita
      (fecha, hora, paciente, documento, telefono, idEmpleado, tratamiento, estado, observacion)
      VALUES
      ('2026-11-05', '09:00:00', 'Laura Martínez', '1012345678', '3001112233', ?, 'Limpieza dental profesional', 'Programada', 'Cita de demostración'),
      ('2026-11-05', '11:30:00', 'Diego Castro', '1023456789', '3012223344', ?, 'Blanqueamiento dental', 'Confirmada', 'Paciente de demostración')`,
      [empleado.idEmpleado, empleado.idEmpleado]
    );

    await db.query(
      'INSERT INTO novedad (titulo, descripcion, idEmpleado) VALUES (?, ?, ?)',
      ['Jornada de prevención', 'Se programó una jornada de higiene oral para pacientes nuevos.', empleado.idEmpleado]
    );

    const [productoVenta] = await db.query(
      'SELECT idProducto, precioVenta FROM producto WHERE codigoBarra = ? LIMIT 1',
      ['7700000001001']
    );
    const [productoVenta2] = await db.query(
      'SELECT idProducto, precioVenta FROM producto WHERE codigoBarra = ? LIMIT 1',
      ['7700000001002']
    );
    const ventaItems = [
      { idProducto: productoVenta[0].idProducto, cantidad: 2, precio: Number(productoVenta[0].precioVenta) },
      { idProducto: productoVenta2[0].idProducto, cantidad: 1, precio: Number(productoVenta2[0].precioVenta) }
    ];
    const total = ventaItems.reduce((suma, item) => suma + item.cantidad * item.precio, 0);
    const [venta] = await db.query(
      `INSERT INTO venta (fechaHora, totalPagar, metodoPago, estado, idEmpleado, idCliente)
       VALUES (NOW(), ?, 'EFECTIVO', 'FINALIZADA', ?, ?)`,
      [total, empleado.idEmpleado, cliente.idCliente]
    );
    for (const item of ventaItems) {
      await db.query(
        `INSERT INTO detalleventa (idVenta, idProducto, cantidad, precioUnitario, subTotal)
         VALUES (?, ?, ?, ?, ?)`,
        [venta.insertId, item.idProducto, item.cantidad, item.precio, item.cantidad * item.precio]
      );
      await db.query(
        `UPDATE inventario SET stockActual = stockActual - ?, fechaUltimaActualizacion = NOW()
         WHERE idProducto = ? AND stockActual >= ?`,
        [item.cantidad, item.idProducto, item.cantidad]
      );
    }

    await db.commit();
    console.log('Datos de demostración insertados correctamente.');
    console.log(`Venta de demostración creada: ${venta.insertId}`);
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    await db.end();
  }
}

ejecutar().catch(error => {
  console.error('No fue posible insertar los datos de demostración:', error.message);
  process.exitCode = 1;
});
