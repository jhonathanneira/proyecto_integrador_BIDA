const express = require('express');
const ruta = express.Router();

module.exports = (db) => {

    // ======================================
    // Metodo POST para registrar una venta con detalles y actualizar stock
    ruta.post('/venta', async (req, res) => {

        // Obtenemos datos del body
        const { idEmpleado, idCliente, metodoPago, productos } = req.body;

        // Validación de datos obligatorios
        if (!idEmpleado || !idCliente || !metodoPago || !productos || productos.length === 0) {
            return res.status(400).send({ mensaje: 'Datos incompletos' });
        }

        // Calcular el total a pagar y validar detalles de los productos
        let totalPagar = 0;
        for (const item of productos) {
            if (!item.idProducto || !item.cantidad || !item.precioUnitario || item.cantidad <= 0) {
                return res.status(400).send({ mensaje: 'Detalles del producto inválidos' });
            }
            totalPagar += item.cantidad * item.precioUnitario;
        }

        // Función auxiliar para envolver las consultas en promesas
        const queryPromise = (sql, values) => {
            return new Promise((resolve, reject) => {
                db.query(sql, values, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
            });
        };

        try {
            // Inicio de la transacción
            await queryPromise('START TRANSACTION');

            // Insertar en la tabla venta
            const ventaData = {
                fechaHora: new Date(),
                totalPagar: totalPagar.toFixed(2),
                metodoPago: metodoPago,
                estado: 'FINALIZADA',
                idEmpleado: idEmpleado, 
                idCliente: idCliente    
            };

            const ventaResult = await queryPromise('INSERT INTO venta SET ?', ventaData);
            const idVenta = ventaResult.insertId;

            // Insertar en tabla detalles y actualizar inventario para cada producto
            for (const item of productos) {
                const detalleData = {
                    idVenta: idVenta,
                    idProducto: item.idProducto, // Asegúrate que en la DB sea idProducto
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    subTotal: (item.cantidad * item.precioUnitario).toFixed(2)
                };

                await queryPromise('INSERT INTO detalleventa SET ?', detalleData);

                // Actualizar stock en inventario
                const updateSql = `UPDATE inventario SET stockActual = stockActual - ?, fechaUltimaActualizacion = ? WHERE idProducto = ? AND stockActual >= ?`;
                const invRes = await queryPromise(updateSql, [item.cantidad, new Date(), item.idProducto, item.cantidad]);

                // Validación de stock insuficiente
                if (invRes.affectedRows === 0) {
                    throw new Error(`Stock insuficiente para el producto ID: ${item.idProducto}`);
                }
            }

            // Commit de la transacción si todo salió bien
            await queryPromise('COMMIT');

            // Respuesta exitosa
            res.status(201).send({ 
                mensaje: 'Venta exitosa', 
                idVenta, 
                totalPagar: totalPagar.toFixed(2) 
            });

        } catch (error) {
            // ROLLBACK de la transacción si algo falló
            console.error(`Intentando ROLLBACK debido a un error: ${error.message}`);
            try {
                await queryPromise('ROLLBACK');
            } catch (rollbackError) {
                console.error("Error durante el ROLLBACK:", rollbackError);
            }

            // Respuesta de error al cliente
            res.status(500).send({
                message: "Fallo al procesar la venta. La transacción fue revertida.",
                errorDetails: error.message
            });
        }
    });

    //===================================
    // metodo get para listar todas las ventas registradas
    //===================================

    ruta.get('/venta', (req, res) => {
        const sql = `
            SELECT 
                V.idVenta,
                V.fechaHora,
                V.totalPagar,
                V.metodoPago,
                V.estado,
                V.idEmpleado,
                V.idCliente,
                E.nombre AS nombreEmpleado,
                C.nombre AS nombreCliente
            FROM venta V
            LEFT JOIN empleado E ON V.idEmpleado = E.idEmpleado
            LEFT JOIN cliente C ON V.idCliente = C.idCliente
            ORDER BY V.idVenta DESC`;

        db.query(sql, (error, filas) => {
            if (error) {
                console.error('Error al listar ventas:', error);
                return res.status(500).send({
                    mensaje: 'Error al listar ventas',
                    errorDetails: error.sqlMessage || error.code
                });
            }

            return res.status(200).send(filas);
        });
    });

    //===================================
    //metodo get para consultar detalle de una venta por su id
    //===================================

ruta.get('/venta/:idVenta', (req, res) => {
    const idVenta = req.params.idVenta;

    // consulta sql para obtener los productos

    const sql = `
    SELECT 
    V.idVenta,
    V.fechaHora,
    V.totalPagar,
    V.metodoPago,
    E.nombre AS nombreEmpleado,
    C.nombre AS nombreCliente,
    DV.cantidad,
    DV.precioUnitario,
    DV.subtotal AS subtotalLinea,
    P.nombre AS nombreProducto,
    P.codigoBarra
FROM venta V
JOIN empleado E ON V.idEmpleado = E.idEmpleado
LEFT JOIN cliente C ON V.idCliente = C.idCliente
JOIN detalleventa DV ON V.idVenta = DV.idVenta
JOIN producto P ON DV.idProducto = P.idProducto
WHERE V.idVenta = ?`;

// ejecutar la consulta
db.query(sql, [idVenta], (error, filas) => {

    // manejo de errores

    if (error) {
        console.error(`Error al consultar la venta ${idVenta}:`, error);
        return res.status(500).send({ 
            mensaje: 'Error al consultar la venta', 
            errorDetails: error.sqlMessage || error.code
        });
    }

    // si no se encuentra la venta

    if (filas.length === 0) {
        return res.status(404).send({ 
            mensaje: `Venta con ID ${idVenta} no encontrada` 
        });
    }

    // estructura de respuesta

    const ventaDetalle = {
        idVenta: filas[0].idVenta,
        fechaHora: filas[0].fechaHora,
        totalPagar: filas[0].totalPagar,
        metodoPago: filas[0].metodoPago,
        nombreEmpleado: filas[0].nombreEmpleado,
        nombreCliente: filas[0].nombreCliente,
        productos: [] // se llenará después
    }

    // extraer los detalles de los productos 

        filas.forEach(fila => {    
        ventaDetalle.productos.push({
        nombreProducto: fila.nombreProducto,
        codigoBarra: fila.codigoBarra,
        cantidad: fila.cantidad,
        precioUnitario: fila.precioUnitario,
        subtotalLinea: fila.subtotalLinea
    });
});

    // enviar la respuesta estructurada

    res.status(200).send(ventaDetalle);
       

});

});

    return ruta;
};