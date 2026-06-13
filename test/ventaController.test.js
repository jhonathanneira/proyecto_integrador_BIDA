const request = require('supertest');

// Mock especial transaccional para el módulo de ventas
jest.mock('mysql2', () => {
  return {
    createConnection: jest.fn().mockReturnValue({
      connect: jest.fn((callback) => { if (callback) callback(null); }),
      query: jest.fn((sql, params, callback) => {
        // Manejo estándar de argumentos de consulta de mysql2
        const actualCallback = typeof callback === 'function' ? callback : params;

        if (typeof actualCallback === 'function') {
          const sqlUpper = sql.toUpperCase();

          // 1. Simular éxito de comandos de transacción
          if (sqlUpper.includes('START TRANSACTION') || sqlUpper.includes('COMMIT') || sqlUpper.includes('ROLLBACK')) {
            return actualCallback(null, {}, {});
          }
          // 2. Simular inserción de la Venta (POST) o Detalle
          if (sqlUpper.includes('INSERT INTO VENTA')) {
            return actualCallback(null, { insertId: 777 }, {});
          }
          if (sqlUpper.includes('INSERT INTO DETALLEVENTA')) {
            return actualCallback(null, { affectedRows: 1 }, {});
          }
          // 3. Simular actualización de stock en inventario con filas afectadas > 0 (Éxito)
          if (sqlUpper.includes('UPDATE INVENTARIO')) {
            return actualCallback(null, { affectedRows: 1 }, {});
          }
          // 4. Simular respuesta del GET por ID (Join complejo de ventas)
          return actualCallback(null, [
            {
              idVenta: 50,
              fechaHora: new Date(),
              totalPagar: "135000.00",
              metodoPago: "EFECTIVO",
              nombreEmpleado: "Carlos",
              nombreCliente: "Diego",
              cantidad: 2,
              precioUnitario: 45000,
              subtotalLinea: "90000.00",
              nombreProducto: "Sutura Resorbible",
              codigoBarra: "123456"
            }
          ], {});
        }
      })
    })
  };
});

const app = require('../app');

describe('Pruebas de Integración - Módulo Ventas', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  // POST (CREAR VENTA CON DETALLES)
  it('POST /app/venta -> Debería procesar la transacción y registrar la venta con éxito', async () => {
    const nuevaVenta = {
      idEmpleado: 1,
      idCliente: 3,
      metodoPago: "TARJETA",
      productos: [
        { idProducto: 15, cantidad: 2, precioUnitario: 45000 }
      ]
    };

    const response = await request(app).post('/app/venta').send(nuevaVenta);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('mensaje', 'Venta exitosa');
    expect(response.body).toHaveProperty('idVenta', 777);
  });

  // GET DETALLE DE VENTA
  it('GET /app/venta/:idVenta -> Debería reconstruir el JSON estructurado de la venta', async () => {
    const response = await request(app).get('/app/venta/50').send();
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('idVenta', 50);
    expect(Array.isArray(response.body.productos)).toBe(true);
    expect(response.body.productos[0]).toHaveProperty('nombreProducto', 'Sutura Resorbible');
  });
});