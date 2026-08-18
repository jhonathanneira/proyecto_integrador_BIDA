const request = require('supertest');

const mockConnection = { connect: jest.fn(), query: jest.fn() };
jest.mock('mysql2', () => ({ createConnection: jest.fn(() => mockConnection) }));

const app = require('../app');

function responder(resultado, error = null) {
    mockConnection.query.mockImplementationOnce((sql, valores, callback) => {
        const responderConsulta = typeof valores === 'function' ? valores : callback;
        responderConsulta(error, resultado);
    });
}

describe('POST /app/novedad', () => {
    beforeEach(() => mockConnection.query.mockReset());

    it('rechaza publicaciones sin una sesión autenticada', async () => {
        const respuesta = await request(app).post('/app/novedad').send({ titulo: 'Aviso', descripcion: 'Prueba' });

        expect(respuesta.statusCode).toBe(401);
        expect(mockConnection.query).not.toHaveBeenCalled();
    });

    it('permite publicar solo a la sesión de un empleado con especialidad Administración', async () => {
        responder([{ idEmpleado: 7, nombre: 'Andrea', especialidad: 'Administración', PASSWORD: 'clave' }]);
        const login = await request(app).post('/app/empleado/login').send({ usuario: 'andrea', password: 'clave' });

        responder([{ especialidad: 'Administración' }]);
        responder({ insertId: 3 });
        const respuesta = await request(app)
            .post('/app/novedad')
            .set('Authorization', `Bearer ${login.body.token}`)
            .send({ titulo: 'Aviso', descripcion: 'Prueba' });

        expect(respuesta.statusCode).toBe(201);
        expect(respuesta.body.idNovedad).toBe(3);
        expect(mockConnection.query.mock.calls[2][1]).toEqual(['Aviso', 'Prueba', 7]);
    });
});
