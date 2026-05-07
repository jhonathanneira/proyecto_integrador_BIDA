const express = require ('express');
const ruta = express.Router();

module.exports = (connection) => {


//===========================================
// Metodo POST para registrar una venta completa con transacción (venta y stock)
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


// funcion auxiliar para envolver la consulta en una promise

    const queryPromise= (sql, values) => {
        return new Promise((resolve, reject) => {
            connection.query(sql, values, (error, res) => {
                if (error) return reject(error);
                resolve(res);
            });
        });
    };


    try {
         
        // inicio de la transaccion 

        await queryPromise('START TRANSACTION');

        // insertar la venta y obtener el id generado  

        const ventaData = {
            fechaHora: new Date(),
            totalPagar: totalPagar.toFixed(2),
            metodoPago: metodoPago,
            estado: 'FINALIZADA',
            idEmpleado: idEmpleado,
            idCliente: idCliente
        };


        const insertVentaSql = 'INSERT INTO venta SET ?' 
        const ventaResult = await queryPromise(insertVentaSql, ventaData);
        const idVenta = ventaResult.insertId;

        // insertar en tabla detalle_venta y actualizar inventario

        for (const item of productos) {

            const detalleData = {
                idVenta: idVenta,
                idProducto: item.idProducto,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
                subTotal: (item.cantidad * item.precioUnitario).toFixed(2)
            };

            const insertDetalleSql = 'INSERT INTO detalle_venta SET ?'; 
            await queryPromise(insertDetalleSql, detalleData);

            // actualizar el inventario restando la cantidad vendida

            const updateInventarioSql = 'UPDATE inventario SET stockActual = stockActual - ?, fechaUltimaActualizacion = ? WHERE idProducto = ?';
            const inventarioResult = await queryPromise(updateInventarioSql, [item.cantidad, new Date(), item.idProducto]);


            // Validacion: si no se afecto ninguna fila, significa que el producto no existe o no hay suficiente stock
            if (inventarioResult.affectedRows === 0) {
                // generar un error para que el bloque catch ejecute el rollback
                throw new Error('Producto ID ${item.idProducto} no encontrado o stock insuficiente');
            }
        }

        // Commit de la transaccion si todo fue exitoso

        await queryPromise('COMMIT');
        
        // Respuesta exitosa al cliente


        res.status(201).send({ 
            mensaje: 'Venta registrada exitosamente y stock actualizado', 
            idVenta: idVenta 
            totalPagar: totalPagar.toFixed(2) 
        });





    } catch (error) {


        // En caso de error, hacer rollback de la transaccion   
        console.error('intentando ROLLBACK debido a un error:$ {error.message}');
        try {
            await queryPromise('ROLLBACK');
        } catch (rollbackError) {
            console.error("Error durante ROLLBACK:", rollbackError);
        }

        //respuesta de error al cliente
        console.error('Error en la transacción de la venta:', error.message || error);
        res.status(500).send({ 
            mensaje: "Fallo al procesar la venta. La transacción fue revertida.", 
            errorDetails: error.message 
        });
        
       

    }
    

    })
    return ruta;
    
}
