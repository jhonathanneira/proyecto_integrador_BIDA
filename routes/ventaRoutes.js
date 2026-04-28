const express = require ('express');
const ruta = express.Router();

module.exports = (connection) => {


//===========================================
// Metodo para registrar una venta
//===========================================


ruta.post('/venta', async (req, res) => {

//1- obtenemos datos y calculo del total

    const { idEmpleado, idCliente, metodoPago, productos } = req.body;

//2- validacion de datos obligatorios

    if (!idEmpleado || !idCliente || !metodoPago || !productos || !productos.length === 0) {
        return res.status(400).send({ 
            mensaje: 'Datos incompletos para registrar la venta' 
        });
    }

// calcular el total a pagar y validar detalles de los productos

    let totalPagar = 0;
    for (const item of productos) {
        if (!item.idProducto || !item.cantidad || item.precioUnitario <= 0) {
            return res.status(400).send({ 
                mensaje: 'detalles de producto incompletos o inválidos' 
            });
        }



        totalPagar += item.cantidad * item.precioUnitario;
    
}


//usamos la conexion global para ejecutar la transaccion

    let connection = connection



})
    return ruta;
    
}
