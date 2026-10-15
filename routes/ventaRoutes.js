const express = require('express');
const { requiereAdministracion } = require('./autorizacion');
const ruta = express.Router();

module.exports = (db) => {
    const soloAdmin = requiereAdministracion(db);

    ruta.post('/venta', soloAdmin, async (req, res) => {
        const { idEmpleado: idEmpleadoEnviado, idCliente, metodoPago, productos } = req.body;
        const idEmpleado = req.sesion?.idEmpleado || idEmpleadoEnviado;
        if (!Number.isInteger(Number(idEmpleado)) || !Number.isInteger(Number(idCliente)) || !metodoPago || !Array.isArray(productos) || !productos.length) {
            return res.status(400).send({ mensaje: 'Datos incompletos' });
        }

        // El cliente solo envia cantidades; el precio se obtiene de la base de datos.
        const productosSolicitados = new Map();
        for (const item of productos) {
            if (!Number.isInteger(Number(item.idProducto)) || Number(item.idProducto) <= 0 || !Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
                return res.status(400).send({ mensaje: 'Detalles del producto inválidos' });
            }
            const idProducto = Number(item.idProducto);
            productosSolicitados.set(idProducto, (productosSolicitados.get(idProducto) || 0) + Number(item.cantidad));
        }

        const obtenerConexion = () => new Promise((resolve, reject) => {
            if (typeof db.getConnection !== 'function') return resolve(db);
            db.getConnection((error, conexion) => error ? reject(error) : resolve(conexion));
        });
        let conexion;
        let transaccionIniciada = false;
        const query = (sql, values) => new Promise((resolve, reject) => {
            const callback = (error, resultado) => error ? reject(error) : resolve(resultado);
            if (values === undefined) conexion.query(sql, callback);
            else conexion.query(sql, values, callback);
        });

        try {
            // Con un pool, todas las consultas deben usar la misma conexion.
            conexion = await obtenerConexion();
            await query('START TRANSACTION');
            transaccionIniciada = true;
            const detalles = [];
            let totalPagar = 0;

            for (const [idProducto, cantidad] of productosSolicitados) {
                const filas = await query(
                    `SELECT P.idProducto, P.precioVenta, I.idInventario, I.stockActual
                     FROM producto P INNER JOIN inventario I ON I.idProducto = P.idProducto
                     WHERE P.idProducto = ? ORDER BY I.idInventario ASC LIMIT 1 FOR UPDATE`,
                    [idProducto]
                );
                const producto = filas[0];
                if (!producto) {
                    const error = new Error(`Producto o inventario no encontrado para el producto ID: ${idProducto}`);
                    error.codigo = 'PRODUCTO_NO_DISPONIBLE';
                    throw error;
                }
                if (Number(producto.stockActual) < cantidad) {
                    const error = new Error(`Stock insuficiente para el producto ID: ${idProducto}`);
                    error.codigo = 'STOCK_INSUFICIENTE';
                    throw error;
                }
                const precioUnitario = Number(producto.precioVenta);
                detalles.push({ idProducto, idInventario: producto.idInventario, cantidad, precioUnitario });
                totalPagar += cantidad * precioUnitario;
            }

            const venta = await query('INSERT INTO venta SET ?', {
                fechaHora: new Date(), totalPagar: totalPagar.toFixed(2), metodoPago,
                estado: 'FINALIZADA', idEmpleado, idCliente
            });
            for (const item of detalles) {
                await query('INSERT INTO detalleventa SET ?', {
                    idVenta: venta.insertId, idProducto: item.idProducto, cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario, subTotal: (item.cantidad * item.precioUnitario).toFixed(2)
                });
                const inventario = await query(
                    'UPDATE inventario SET stockActual = stockActual - ?, fechaUltimaActualizacion = ? WHERE idInventario = ? AND stockActual >= ?',
                    [item.cantidad, new Date(), item.idInventario, item.cantidad]
                );
                if (!inventario.affectedRows) {
                    const error = new Error(`Stock insuficiente para el producto ID: ${item.idProducto}`);
                    error.codigo = 'STOCK_INSUFICIENTE';
                    throw error;
                }
            }
            await query('COMMIT');
            transaccionIniciada = false;
            return res.status(201).send({ mensaje: 'Venta exitosa', idVenta: venta.insertId, totalPagar: totalPagar.toFixed(2) });
        } catch (error) {
            console.error(`No fue posible registrar la venta: ${error.message}`);
            try { if (transaccionIniciada) await query('ROLLBACK'); } catch (rollbackError) { console.error('Error durante el ROLLBACK:', rollbackError); }
            const conflicto = error.codigo === 'STOCK_INSUFICIENTE' || error.codigo === 'PRODUCTO_NO_DISPONIBLE';
            return res.status(conflicto ? 409 : 500).send({
                mensaje: conflicto ? error.message : 'Fallo al procesar la venta. La transaccion fue revertida.',
                ...(conflicto ? {} : { errorDetails: error.message })
            });
        } finally {
            if (conexion && typeof conexion.release === 'function') conexion.release();
        }
    });

    ruta.get('/venta', soloAdmin, (req, res) => {
        const sql = `SELECT V.idVenta, V.fechaHora, V.totalPagar, V.metodoPago, V.estado, V.idEmpleado, V.idCliente,
            E.nombre AS nombreEmpleado, C.nombre AS nombreCliente FROM venta V
            LEFT JOIN empleado E ON V.idEmpleado = E.idEmpleado LEFT JOIN cliente C ON V.idCliente = C.idCliente ORDER BY V.idVenta DESC`;
        db.query(sql, (error, filas) => {
            if (error) return res.status(500).send({ mensaje: 'Error al listar ventas', errorDetails: error.sqlMessage || error.code });
            return res.status(200).send(filas);
        });
    });

    ruta.get('/venta/:idVenta', soloAdmin, (req, res) => {
        const sql = `SELECT V.idVenta, V.fechaHora, V.totalPagar, V.metodoPago, E.nombre AS nombreEmpleado, C.nombre AS nombreCliente,
            DV.cantidad, DV.precioUnitario, DV.subtotal AS subtotalLinea, P.nombre AS nombreProducto, P.codigoBarra
            FROM venta V JOIN empleado E ON V.idEmpleado = E.idEmpleado LEFT JOIN cliente C ON V.idCliente = C.idCliente
            JOIN detalleventa DV ON V.idVenta = DV.idVenta JOIN producto P ON DV.idProducto = P.idProducto WHERE V.idVenta = ?`;
        db.query(sql, [req.params.idVenta], (error, filas) => {
            if (error) return res.status(500).send({ mensaje: 'Error al consultar la venta', errorDetails: error.sqlMessage || error.code });
            if (!filas.length) return res.status(404).send({ mensaje: `Venta con ID ${req.params.idVenta} no encontrada` });
            return res.status(200).send({
                idVenta: filas[0].idVenta, fechaHora: filas[0].fechaHora, totalPagar: filas[0].totalPagar,
                metodoPago: filas[0].metodoPago, nombreEmpleado: filas[0].nombreEmpleado, nombreCliente: filas[0].nombreCliente,
                productos: filas.map(fila => ({ nombreProducto: fila.nombreProducto, codigoBarra: fila.codigoBarra, cantidad: fila.cantidad, precioUnitario: fila.precioUnitario, subtotalLinea: fila.subtotalLinea }))
            });
        });
    });

    return ruta;
};
