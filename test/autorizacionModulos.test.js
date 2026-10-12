const request = require('supertest');
const { crearSesion } = require('../routes/sesionesAutenticacion');

const mockConnection = {
  connect: jest.fn(),
  query: jest.fn()
};

jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => mockConnection)
}));

const app = require('../app');

describe('Autorización de módulos sensibles', () => {
  const entornoOriginal = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    mockConnection.query.mockReset();
  });

  afterAll(() => {
    process.env.NODE_ENV = entornoOriginal;
  });

  test.each([
    ['producto', () => request(app).post('/app/producto').send({ nombre: 'Producto' })],
    ['venta', () => request(app).post('/app/venta').send({})],
    ['cliente', () => request(app).post('/app/cliente').send({})]
  ])('rechaza con 401 una operación de %s sin sesión', async (_modulo, ejecutar) => {
    const respuesta = await ejecutar();

    expect(respuesta.statusCode).toBe(401);
    expect(mockConnection.query).not.toHaveBeenCalled();
  });

  test('rechaza con 403 a un empleado que no pertenece a Administración', async () => {
    const token = crearSesion(25);
    mockConnection.query.mockImplementationOnce((sql, valores, callback) => {
      callback(null, [{ especialidad: 'Odontología' }]);
    });

    const respuesta = await request(app)
      .post('/app/venta')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.mensaje).toContain('Administración');
  });
});
