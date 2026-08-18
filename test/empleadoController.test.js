const request = require('supertest');

const mockConnection = {
  connect: jest.fn(),
  query: jest.fn()
};

jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => mockConnection)
}));

const app = require('../app');

const empleado = {
  nombre: 'Ana',
  apellido: 'Gómez',
  documento: '10234567',
  rol: 'Odontóloga',
  especialidad: 'Endodoncia',
  telefono: '3201234567',
  email: 'ana@bida.com',
  usuario: 'ana.endo',
  PASSWORD: 'password123'
};

function responderUnaConsulta(resultado, error = null) {
  mockConnection.query.mockImplementationOnce((sql, valores, callback) => {
    const responder = typeof valores === 'function' ? valores : callback;
    responder(error, resultado);
  });
}

describe('Pruebas de integración - empleados', () => {
  beforeEach(() => {
    mockConnection.query.mockReset();
  });

  it('GET /app/empleado devuelve los empleados', async () => {
    responderUnaConsulta([{ idEmpleado: 1, ...empleado }]);

    const respuesta = await request(app).get('/app/empleado');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toMatchObject({
      total: 1,
      empleados: [{ idEmpleado: 1, nombre: 'Ana' }]
    });
  });

  it('GET /app/empleado/:id devuelve un empleado', async () => {
    responderUnaConsulta([{ idEmpleado: 1, ...empleado }]);

    const respuesta = await request(app).get('/app/empleado/1');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toMatchObject({ empleado: { idEmpleado: 1, nombre: 'Ana' } });
  });

  it('POST /app/empleado crea un empleado', async () => {
    responderUnaConsulta({ insertId: 10 });

    const respuesta = await request(app).post('/app/empleado').send(empleado);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body).toMatchObject({ idEmpleado: 10, empleado: { nombre: 'Ana' } });
  });

  it('POST /app/empleado valida los datos obligatorios', async () => {
    const respuesta = await request(app).post('/app/empleado').send({ nombre: 'Ana' });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.mensaje).toContain('Faltan datos obligatorios');
    expect(mockConnection.query).not.toHaveBeenCalled();
  });

  it('PUT /app/empleado/:id actualiza los campos enviados', async () => {
    responderUnaConsulta({ affectedRows: 1 });

    const respuesta = await request(app)
      .put('/app/empleado/1')
      .send({ nombre: 'Ana María', rol: 'Especialista', password: 'nueva-clave' });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.mensaje).toContain('actualizado exitosamente');
  });

  it('PUT /app/empleado/:id requiere al menos un campo válido', async () => {
    const respuesta = await request(app).put('/app/empleado/1').send({ apellido: 'Gómez' });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.mensaje).toContain('No hay campos válidos');
  });

  it('DELETE /app/empleado/:id elimina el empleado', async () => {
    responderUnaConsulta({ affectedRows: 1 });

    const respuesta = await request(app).delete('/app/empleado/1');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.mensaje).toContain('eliminado exitosamente');
  });

  it('POST /app/empleado devuelve 409 ante documento o usuario duplicado', async () => {
    responderUnaConsulta(null, { code: 'ER_DUP_ENTRY' });

    const respuesta = await request(app).post('/app/empleado').send(empleado);

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.body.mensaje).toContain('ya existe');
  });
});
