const request = require('supertest');

const mockConnection = {
  connect: jest.fn(),
  query: jest.fn()
};

jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => mockConnection)
}));

const app = require('../app');

function callbackDe(valores, callback) {
  return typeof valores === 'function' ? valores : callback;
}

function configurarVentaExitosa() {
  mockConnection.query.mockImplementation((sql, valores, callback) => {
    const responder = callbackDe(valores, callback);
    const consulta = sql.toUpperCase();

    if (consulta.includes('START TRANSACTION') || consulta.includes('COMMIT') || consulta.includes('ROLLBACK')) {
      return responder(null, {});
    }
    if (consulta.includes('INSERT INTO VENTA')) {
      return responder(null, { insertId: 777 });
    }
    if (consulta.includes('INSERT INTO DETALLEVENTA')) {
      return responder(null, { affectedRows: 1 });
    }
    if (consulta.includes('UPDATE INVENTARIO')) {
      return responder(null, { affectedRows: 1 });
    }

    return responder(null, []);
  });
}

function responderUnaConsulta(resultado, error = null) {
  mockConnection.query.mockImplementationOnce((sql, valores, callback) => {
    callbackDe(valores, callback)(error, resultado);
  });
}

describe('Pruebas de integración - ventas', () => {
  const venta = {
    idEmpleado: 1,
    idCliente: 3,
    metodoPago: 'TARJETA',
    productos: [{ idProducto: 15, cantidad: 2, precioUnitario: 45000 }]
  };

  beforeEach(() => {
    mockConnection.query.mockReset();
  });

  it('POST /app/venta registra una venta y calcula el total', async () => {
    configurarVentaExitosa();

    const respuesta = await request(app).post('/app/venta').send(venta);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body).toEqual({
      mensaje: 'Venta exitosa',
      idVenta: 777,
      totalPagar: '90000.00'
    });
  });

  it('POST /app/venta valida los datos obligatorios', async () => {
    const respuesta = await request(app).post('/app/venta').send({ idEmpleado: 1 });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.mensaje).toBe('Datos incompletos');
    expect(mockConnection.query).not.toHaveBeenCalled();
  });

  it('POST /app/venta valida cada detalle de producto', async () => {
    const respuesta = await request(app)
      .post('/app/venta')
      .send({ ...venta, productos: [{ idProducto: 15, cantidad: 0, precioUnitario: 45000 }] });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.mensaje).toBe('Detalles del producto inválidos');
  });

  it('POST /app/venta revierte la transacción cuando no hay inventario', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConnection.query.mockImplementation((sql, valores, callback) => {
      const responder = callbackDe(valores, callback);
      const consulta = sql.toUpperCase();

      if (consulta.includes('UPDATE INVENTARIO')) {
        return responder(null, { affectedRows: 0 });
      }
      if (consulta.includes('INSERT INTO VENTA')) {
        return responder(null, { insertId: 777 });
      }
      return responder(null, {});
    });

    const respuesta = await request(app).post('/app/venta').send(venta);

    expect(respuesta.statusCode).toBe(500);
    expect(respuesta.body.errorDetails).toContain('Stock insuficiente');
    expect(mockConnection.query.mock.calls.some(([sql]) => sql === 'ROLLBACK')).toBe(true);
    consoleError.mockRestore();
  });

  it('GET /app/venta devuelve el listado de ventas', async () => {
    responderUnaConsulta([{ idVenta: 50, totalPagar: '90000.00', metodoPago: 'TARJETA' }]);

    const respuesta = await request(app).get('/app/venta');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toEqual([{ idVenta: 50, totalPagar: '90000.00', metodoPago: 'TARJETA' }]);
  });

  it('GET /app/venta/:idVenta devuelve una venta con sus productos', async () => {
    responderUnaConsulta([
      {
        idVenta: 50,
        fechaHora: '2026-08-02T10:00:00.000Z',
        totalPagar: '90000.00',
        metodoPago: 'TARJETA',
        nombreEmpleado: 'Carlos',
        nombreCliente: 'Diego',
        nombreProducto: 'Resina',
        codigoBarra: '123456',
        cantidad: 2,
        precioUnitario: 45000,
        subtotalLinea: '90000.00'
      }
    ]);

    const respuesta = await request(app).get('/app/venta/50');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toMatchObject({
      idVenta: 50,
      productos: [{ nombreProducto: 'Resina', cantidad: 2 }]
    });
  });

  it('GET /app/venta/:idVenta devuelve 404 si la venta no existe', async () => {
    responderUnaConsulta([]);

    const respuesta = await request(app).get('/app/venta/999');

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.body.mensaje).toContain('no encontrada');
  });
});
