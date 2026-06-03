const request = require('supertest');
const app = require('../app'); // Sube un nivel para llegar a app.js desde la carpeta 'test'

describe('Pruebas de Integración para Productos', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Limpia simulaciones si las hubiera
  });

  // CASO 1: Obtener todos los productos (GET)
  it('GET /productos -> Debería devolver la lista de productos', async () => {
    
    const response = await request(app)
      .get('/productos') // Cambia '/productos' por la ruta real que configuraste en tu app.js
      .send();

    // Nota: Como no hemos configurado mocks reales todavía, 
    // esta prueba intentará pegarle a lo que sea que tenga tu código por defecto.
    expect(response.statusCode).toBe(200);
  });

  // CASO 2: Crear un producto (POST)
  it('POST /productos -> Debería responder correctamente al intentar crear', async () => {
    const nuevoProducto = {
      nombre: "Teclado Mecánico",
      precio: 85000
    };

    const response = await request(app)
      .post('/productos') // Cambia por tu ruta real de creación
      .send(nuevoProducto);

    // Ajusta el código de estado esperado según lo que responda tu servidor (200 o 201)
    expect(response.statusCode).toBe(201); 
  });

});