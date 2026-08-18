const request = require('supertest');

const mockConnection = {
  connect: jest.fn(),
  query: jest.fn()
};

jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => mockConnection)
}));

const app = require('../app');

const producto = {
  nombre: 'Resina Dental Z350',
  codigoBarra: '7701234567890',
  precioVenta: 120000,
  precioCompra: 80000,
  categoria: 'Materiales',
  unidadMedida: 'Jeringa',
  fechaVencimiento: '2027-12-31'
};

function responderUnaConsulta(resultado, error = null) {
  mockConnection.query.mockImplementationOnce((sql, valores, callback) => {
    const responder = typeof valores === 'function' ? valores : callback;
    responder(error, resultado);
  });
}

describe('Pruebas de integración - productos', () => {
  beforeEach(() => {
    mockConnection.query.mockReset();
  });

  it('GET /app/producto devuelve el listado de productos', async () => {
    responderUnaConsulta([{ idProducto: 1, ...producto }]);

    const respuesta = await request(app).get('/app/producto');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toEqual([{ idProducto: 1, ...producto }]);
  });

  it('GET /app/producto/:idProducto devuelve un producto', async () => {
    responderUnaConsulta([{ idProducto: 1, ...producto }]);

    const respuesta = await request(app).get('/app/producto/1');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toMatchObject({ idProducto: 1, nombre: producto.nombre });
  });

  it('GET /app/producto/:idProducto devuelve 404 si no existe', async () => {
    responderUnaConsulta([]);

    const respuesta = await request(app).get('/app/producto/999');

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.body.message).toContain('no encontrado');
  });

  it('POST /app/producto crea un producto', async () => {
    responderUnaConsulta({ insertId: 45 });

    const respuesta = await request(app).post('/app/producto').send(producto);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body).toEqual({
      message: 'Producto creado con éxito',
      idProducto: 45
    });
  });

  it('PUT /app/producto/:idProducto actualiza un producto', async () => {
    responderUnaConsulta({ affectedRows: 1 });

    const respuesta = await request(app)
      .put('/app/producto/1')
      .send({ ...producto, nombre: 'Resina Dental Z350 XT' });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toMatchObject({ affectedRows: 1 });
    expect(respuesta.body.message).toContain('actualizado correctamente');
  });

  it('DELETE /app/producto/:idProducto elimina un producto', async () => {
    responderUnaConsulta({ affectedRows: 1 });

    const respuesta = await request(app).delete('/app/producto/1');

    expect(respuesta.statusCode).toBe(204);
    expect(respuesta.text).toBe('');
  });

  it('devuelve 500 cuando falla la consulta a productos', async () => {
    responderUnaConsulta(null, { code: 'ECONNREFUSED' });

    const respuesta = await request(app).get('/app/producto');

    expect(respuesta.statusCode).toBe(500);
    expect(respuesta.body).toMatchObject({ message: 'Error al obtener productos' });
  });
});
