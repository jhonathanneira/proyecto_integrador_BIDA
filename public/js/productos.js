//Espera a que el DOM cargue
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
});

//Funcion que Llama a la API GET /app/productos.
function cargarProductos() {
    fetch("http://localhost:3000/app/productos")
        .then(res => res.json())
        .then(productos => {

            // VALIDACIÓN DE SEGURIDAD - Valida que la respuesta sea un array.
            if (!Array.isArray(productos)) {
                console.error("La API no devolvió un array:", productos);
                return;
            }

            const tablaBody = document.querySelector("#tablaProductos tbody");

            tablaBody.innerHTML = ""; // limpiar por si se recarga

            //Limpia la tabla y crea filas <tr> con los datos de cada producto.
            productos.forEach(prod => {
                const fila = document.createElement("tr");

                fila.innerHTML = `
    <td>${prod.idProducto}</td>
    <td>${prod.nombre}</td>
    <td>${prod.codigoBarra}</td>
    <td>${prod.precioVenta}</td>
    <td>${prod.precioCompra}</td>
    <td>${prod.categoria}</td>
    <td>${prod.unidadMedida}</td>
    <td>${formatearFecha(prod.fechaVencimiento)}</td>
    <td>
        <button class="btn-editar" onclick="editarProducto(${prod.idProducto})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarProducto(${prod.idProducto})">Eliminar</button>
    </td>
`;
//Agregamos la fila a la tabla
tablaBody.appendChild(fila);

});
    })
    .catch(err => {
        console.error("Error al conectar con la API:", err);
    });
}

//Formatea la fecha de vencimiento para mostrarse en formato es-CO.
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

//========================================================
// Funcion eliminar producto
//========================================================

/*function eliminarProducto(id) {
    alert("Eliminar producto " + id);
}*/

async function eliminarProducto(idProducto) {
    try {
        const response = await fetch(`http://localhost:3000/app/productos/${idProducto}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

         // Validar si la respuesta contiene JSON
        const text = await response.text();
        const data = text ? JSON.parse(text) : { mensaje: "¿Está seguro que desea eliminar el producto?" };

        // Confirmación al usuario
        confirm(data.mensaje);

        // Recargar lista de productos
        cargarProductos();

    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Ocurrió un error al eliminar el producto.");
    }
}

//=============================================
// Función editar producto
//=============================================
function editarProducto(id) {
    alert("Editar producto " + id); 



};
