const request = require('supertest');

const mockConnection = {
  connect: jest.fn(),
  query: jest.fn()
};

jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => mockConnection)
}));

const app = require('../app');

const cita = {
  fecha: '2026-08-10',
  hora: '09:30:00',
  paciente: 'María Pérez',
  documento: '123456789',
  telefono: '3001234567',
  idEmpleado: 1,
  tratamiento: 'Limpieza dental',
  estado: 'Programada',
  observacion: 'Primera consulta'
};

function responderUnaConsulta(resultado, error = null) {
  mockConnection.query.mockImplementationOnce((sql, valores, callback) => {
    const responder = typeof valores === 'function' ? valores : callback;
    responder(error, resultado);
  });
}

async function iniciarSesionAdministracion() {
  responderUnaConsulta([{ idEmpleado: 1, nombre: 'Ana', especialidad: 'Administración', PASSWORD: 'clave' }]);
  const respuesta = await request(app).post('/app/empleado/login').send({ usuario: 'ana', password: 'clave' });
  return respuesta.body.token;
}

describe('Pruebas de integración - agenda', () => {
  beforeEach(() => {
    mockConnection.query.mockReset();
  });

  it('GET /app/cita devuelve la agenda', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ idEmpleado: 1, especialidad: 'Administración' }]);
    responderUnaConsulta([{ idCita: 1, ...cita }]);

    const respuesta = await request(app).get('/app/cita').set('Authorization', `Bearer ${token}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toMatchObject({ total: 1, citas: [{ idCita: 1, paciente: cita.paciente }] });
  });

  it('GET /app/cita filtra la agenda para un profesional no administrativo', async () => {
    responderUnaConsulta([{ idEmpleado: 3, nombre: 'Carlos', especialidad: 'Odontología', PASSWORD: 'clave' }]);
    const login = await request(app).post('/app/empleado/login').send({ usuario: 'carlos', password: 'clave' });
    responderUnaConsulta([{ idEmpleado: 3, especialidad: 'Odontología' }]);
    responderUnaConsulta([{ idCita: 1, ...cita, idEmpleado: 3 }]);

    const respuesta = await request(app).get('/app/cita').set('Authorization', `Bearer ${login.body.token}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.citas).toHaveLength(1);
    expect(mockConnection.query.mock.calls[2][1]).toEqual([3]);
  });

  it('GET /app/cita/:id devuelve una cita', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ idEmpleado: 1, especialidad: 'Administración' }]);
    responderUnaConsulta([{ idCita: 1, ...cita }]);

    const respuesta = await request(app).get('/app/cita/1').set('Authorization', `Bearer ${token}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toMatchObject({ cita: { idCita: 1, tratamiento: cita.tratamiento } });
  });

  it('GET /app/cita/:id devuelve 404 cuando la cita no existe', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ idEmpleado: 1, especialidad: 'Administración' }]);
    responderUnaConsulta([]);

    const respuesta = await request(app).get('/app/cita/999').set('Authorization', `Bearer ${token}`);

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.body.mensaje).toContain('no encontrada');
  });

  it('POST /app/cita crea una cita', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ especialidad: 'Administración' }]);
    responderUnaConsulta({ insertId: 12 });

    const respuesta = await request(app).post('/app/cita').set('Authorization', `Bearer ${token}`).send(cita);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body).toEqual({ mensaje: 'Cita creada exitosamente', idCita: 12 });
  });

  it('POST /app/cita valida los datos obligatorios', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ especialidad: 'Administración' }]);
    const respuesta = await request(app).post('/app/cita').set('Authorization', `Bearer ${token}`).send({ paciente: cita.paciente });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.mensaje).toContain('obligatorios');
    expect(mockConnection.query).toHaveBeenCalledTimes(2);
  });

  it('POST /app/cita rechaza a empleados sin especialidad Administración', async () => {
    responderUnaConsulta([{ idEmpleado: 2, nombre: 'Carlos', especialidad: 'Odontología', PASSWORD: 'clave' }]);
    const login = await request(app).post('/app/empleado/login').send({ usuario: 'carlos', password: 'clave' });
    responderUnaConsulta([{ especialidad: 'Odontología' }]);

    const respuesta = await request(app).post('/app/cita').set('Authorization', `Bearer ${login.body.token}`).send(cita);

    expect(respuesta.statusCode).toBe(403);
  });

  it('rechaza editar o eliminar citas si la especialidad no es Administración', async () => {
    responderUnaConsulta([{ idEmpleado: 2, nombre: 'Lina', especialidad: 'Ortodoncia', PASSWORD: 'clave' }]);
    const login = await request(app).post('/app/empleado/login').send({ usuario: 'lina', password: 'clave' });
    responderUnaConsulta([{ especialidad: 'Ortodoncia' }]);

    const edicion = await request(app).put('/app/cita/1').set('Authorization', `Bearer ${login.body.token}`).send(cita);

    expect(edicion.statusCode).toBe(403);
    responderUnaConsulta([{ especialidad: 'Ortodoncia' }]);
    const eliminacion = await request(app).delete('/app/cita/1').set('Authorization', `Bearer ${login.body.token}`);
    expect(eliminacion.statusCode).toBe(403);
  });

  it('PUT /app/cita/:id actualiza una cita', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ especialidad: 'Administración' }]);
    responderUnaConsulta({ affectedRows: 1 });

    const respuesta = await request(app)
      .put('/app/cita/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...cita, estado: 'Confirmada' });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.mensaje).toContain('actualizada exitosamente');
  });

  it('PUT /app/cita/:id devuelve 404 para una cita inexistente', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ especialidad: 'Administración' }]);
    responderUnaConsulta({ affectedRows: 0 });

    const respuesta = await request(app).put('/app/cita/999').set('Authorization', `Bearer ${token}`).send(cita);

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.body.mensaje).toContain('no encontrada');
  });

  it('DELETE /app/cita/:id elimina una cita', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ especialidad: 'Administración' }]);
    responderUnaConsulta({ affectedRows: 1 });

    const respuesta = await request(app).delete('/app/cita/1').set('Authorization', `Bearer ${token}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.mensaje).toContain('eliminada exitosamente');
  });

  it('DELETE /app/cita/:id devuelve 404 para una cita inexistente', async () => {
    const token = await iniciarSesionAdministracion();
    responderUnaConsulta([{ especialidad: 'Administración' }]);
    responderUnaConsulta({ affectedRows: 0 });

    const respuesta = await request(app).delete('/app/cita/999').set('Authorization', `Bearer ${token}`);

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.body.mensaje).toContain('no encontrada');
  });
});
