const request = require('supertest');

// Mock adaptado para empleados
jest.mock('mysql2', () => {
  return {
    createConnection: jest.fn().mockReturnValue({
      connect: jest.fn((callback) => { if (callback) callback(null); }),
      query: jest.fn((sql, params, callback) => {
        const cb = typeof callback === 'function' ? callback : params;
        
        if (typeof cb === 'function') {
          const sqlUpper = sql.toUpperCase();

          // 1. Mock para DELETE o UPDATE
          if (sqlUpper.includes('DELETE') || sqlUpper.includes('UPDATE')) {
            return cb(null, { affectedRows: 1 }, {});
          }

          // 2. Mock para INSERT (POST '/empleado')
          if (sqlUpper.includes('INSERT')) {
            return cb(null, { insertId: 10 }, {});
          }

          // 3. Mock para el GET general y GET por ID ('/empleado')
          const listaMocked = [
            { idEmpleado: 1, nombre: 'Dr. Carlos', apellido: 'Restrepo', rol: 'Odontólogo' }
          ];
          
          return cb(null, listaMocked, {});
        }
      })
    })
  };
});

const app = require('../app');

describe('Pruebas de Integración - Módulo Empleados', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: GET General
  it('GET /app/empleado -> Debería retornar estado 200 y la lista', async () => {
    const response = await request(app).get('/app/empleado').send();
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('mensaje', 'lista de empleados obtenidos exitosamente');
  });

  // Test 2: GET por ID
  it('GET /app/empleado/:id -> Debería retornar un empleado específico', async () => {
    const response = await request(app).get('/app/empleado/1').send();
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('mensaje', 'Detalles del empleado 1 obtenidos.');
  });

  // Test 3: POST Crear
  it('POST /app/empleado -> Debería crear un empleado exitosamente', async () => {
    const nuevoEmpleado = {
      nombre: "Ana",
      apellido: "Gómez",
      documento: "10234567",
      rol: "Odontóloga",
      especialidad: "Endodoncia",
      telefono: "3201234567",
      email: "ana@bida.com",
      usuario: "ana.endo",
      PASSWORD: "password123"
    };
    const response = await request(app).post('/app/empleado').send(nuevoEmpleado);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('idEmpleado', 10);
  });

  // Test 4: PUT Actualizar (Ruta en singular)
  it('PUT /app/empleado/:id -> Debería actualizar al empleado', async () => {
    const datos = { nombre: "Ana María", rol: "Especialista" };
    const response = await request(app).put('/app/empleado/1').send(datos);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('mensaje', 'Empleado con ID 1 actualizado exitosamente');
  });

  // Test 5: DELETE Eliminar (Ruta en singular)
  it('DELETE /app/empleado/:id -> Debería eliminar al empleado', async () => {
    const response = await request(app).delete('/app/empleado/1').send();
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('mensaje', 'Empleado con ID 1 eliminado exitosamente');
  });

});
