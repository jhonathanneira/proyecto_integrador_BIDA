const request = require('supertest');

const mockConnection = { connect: jest.fn(), query: jest.fn() };
jest.mock('mysql2', () => ({ createConnection: jest.fn(() => mockConnection) }));

const app = require('../app');

describe('POST /app/registro', () => {
    beforeEach(() => mockConnection.query.mockReset());

    it('registra un paciente con sus datos requeridos', async () => {
        mockConnection.query.mockImplementationOnce((sql, datos, callback) => callback(null, { insertId: 12 }));
        const respuesta = await request(app).post('/app/registro').send({
            tipo: 'cliente', nombre: 'Ana', apellido: 'Rojas', documentoIdentidad: '123', fechaNacimiento: '1990-01-01',
            genero: 'Femenino', direccion: 'Calle 1', telefono: '3000000000', correo: 'ana@bida.test'
        });

        expect(respuesta.statusCode).toBe(201);
        expect(respuesta.body.idCliente).toBe(12);
        expect(mockConnection.query.mock.calls[0][0]).toBe('INSERT INTO cliente SET ?');
    });

    it('registra empleados sin permitir especialidad Administración', async () => {
        mockConnection.query.mockImplementationOnce((sql, datos, callback) => callback(null, { insertId: 5 }));
        const respuesta = await request(app).post('/app/registro').send({
            tipo: 'empleado', nombre: 'Luis', apellido: 'Díaz', documento: '456', especialidad: 'Odontología',
            telefono: '3000000001', email: 'luis@bida.test', usuario: 'luis', password: 'ClaveSegura123'
        });

        expect(respuesta.statusCode).toBe(201);
        expect(respuesta.body.idEmpleado).toBe(5);
        expect(mockConnection.query.mock.calls[0][1][3]).toBe('Empleado');
        expect(mockConnection.query.mock.calls[0][1][8]).not.toBe('ClaveSegura123');
    });

    it('impide registrar una cuenta de Administración públicamente', async () => {
        const respuesta = await request(app).post('/app/registro').send({
            tipo: 'empleado', nombre: 'Luisa', apellido: 'Díaz', documento: '789', especialidad: 'Administración',
            telefono: '3000000002', email: 'luisa@bida.test', usuario: 'luisa', password: 'ClaveSegura123'
        });

        expect(respuesta.statusCode).toBe(403);
        expect(mockConnection.query).not.toHaveBeenCalled();
    });
});
