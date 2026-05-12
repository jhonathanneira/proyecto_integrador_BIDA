const express = require('express');
const ruta = express.Router();

module.exports = (db) => {

    ruta.post('/venta', async (req, res) => {
        const { idEmpleado, idCliente, metodoPago, productos } = req.body;

        // 1. Validación inicial
        if (!idEmpleado || !idCliente || !metodoPago || !productos || productos.length === 0) {
            return res.status(400).send({ mensaje: 'Datos incompletos' });
        }

        let totalPagar = 0;
        for (const item of productos) {
            if (!item.idProducto || !item.cantidad || !item.precioUnitario || item.cantidad <= 0) {
                return res.status(400).send({ mensaje: 'Items inválidos' });
            }
            totalPagar += item.cantidad * item.precioUnitario;
        }

        const queryPromise = (sql, values) => {
            return new Promise((resolve, reject) => {
                db.query(sql, values, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
            });
        };

        try {
            await queryPromise('START TRANSACTION');

            // INSERT VENTA (Corregido a camelCase para tu nueva DB)
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

            // INSERT DETALLES Y UPDATE STOCK
            for (const item of productos) {
                const detalleData = {
                    idVenta: idVenta,
                    idProducto: item.idProducto,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    subTotal: (item.cantidad * item.precioUnitario).toFixed(2)
                };

                await queryPromise('INSERT INTO detalleventa SET ?', detalleData);

                const updateSql = `
                    UPDATE inventario 
                    SET stockActual = stockActual - ?, fechaUltimaActualizacion = ? 
                    WHERE idProducto = ? AND stockActual >= ?`;
                
                const invRes = await queryPromise(updateSql, [item.cantidad, new Date(), item.idProducto, item.cantidad]);

                if (invRes.affectedRows === 0) {
                    throw new Error(`Stock insuficiente para el producto ID: ${item.idProducto}`);
                }
            }

            await queryPromise('COMMIT');
            res.status(201).send({ mensaje: 'Venta exitosa', idVenta, totalPagar: totalPagar.toFixed(2) });

        } catch (error) {
            await queryPromise('ROLLBACK');
            console.error("Error en venta:", error.message);
            res.status(500).send({ mensaje: "Error procesando venta", error: error.message });
        }
    });

    return ruta;
};