const request = require('supertest');

// 1. MOCK DE MYSQL2 Producto 
jest.mock('mysql2', () => {
  return {
    createConnection: jest.fn().mockReturnValue({
      connect: jest.fn((callback) => {
        if (callback) callback(null); 
      }),
      query: jest.fn((sql, params, callback) => {
        // Caso A: Si se ejecuta una consulta SIN parámetros array (Ej: SELECT * FROM producto)
        // El segundo argumento 'params' es directamente la función callback
        if (typeof params === 'function') {
          return params(null, [{ idProducto: 1, nombre: 'Producto Mocked' }], {});
        }
        
        // Caso B: Si se ejecuta una consulta CON parámetros array (Ej: SELECT ... WHERE idProducto = ?)
        // El tercer argumento es la función callback real
        if (typeof callback === 'function') {
          
          // Si es un DELETE o UPDATE, simulamos las filas afectadas para que no falle
          if (sql.toUpperCase().includes('DELETE') || sql.toUpperCase().includes('UPDATE')) {
            return callback(null, { affectedRows: 1, insertId: null }, {});
          }
          
          // Si es un INSERT (POST), simulamos la creación del ID
          if (sql.toUpperCase().includes('INSERT')) {
            return callback(null, { insertId: 45, affectedRows: 1 }, {});
          }

          // Por defecto, asumimos que es el GET por ID y devolvemos un array con un producto simulado
          return callback(null, [{ idProducto: 1, nombre: 'Producto Individual Mocked' }], {});
        }
      })
    })
  };
});

// Importamos la aplicación Express una vez configurado el mock
const app = require('../app'); 

describe('Pruebas de Integración - Módulo Productos', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CASO 1: Obtener todos los productos (GET)
  it('GET /app/producto -> Debería retornar estado 200 y el listado de productos', async () => {
    const response = await request(app)
      .get('/app/producto') // Ruta corregida según tu archivo de rutas
      .send();

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('nombre', 'Producto Mocked');
  });

  // CASO 2: Crear un producto nuevo (POST)
  it('POST /app/producto -> Debería crear un producto con éxito y retornar 201', async () => {
    const nuevoProducto = {
      nombre: "Resina Dental Z350",
      codigoBarra: "7701234567890",
      precioVenta: 120000,
      precioCompra: 80000,
      categoria: "Materiales",
      unidadMedida: "Jeringa",
      fechaVencimiento: "2027-12-31"
    };

    const response = await request(app)
      .post('/app/producto') // Ruta corregida según tu archivo de rutas
      .send(nuevoProducto);

    // Tu ruta responde con 201 en caso de éxito
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Producto creado con éxito');
    expect(response.body).toHaveProperty('idProducto', 45); // El ID mockeado arriba
  });

});

// Caso 3: Obtener un producto específico por ID (GET /:id)

it('GET /app/producto/:idProducto -> Debería devolver un solo producto', async () => {
    const response = await request(app)
      .get('/app/producto/1')
      .send();

    expect(response.statusCode).toBe(200);
    // Tu ruta devuelve la primera posición de la fila: res.status(200).send(fila[0])
    expect(response.body).toHaveProperty('idProducto');
  });


  // Caso 4: Eliminar un producto (DELETE)

  it('DELETE /app/producto/:idProducto -> Debería eliminar y retornar 204', async () => {
    const response = await request(app)
      .delete('/app/producto/1')
      .send();

    // Tu ruta responde con 204 (No Content) en caso de éxito al eliminar
    expect(response.statusCode).toBe(204);
  });