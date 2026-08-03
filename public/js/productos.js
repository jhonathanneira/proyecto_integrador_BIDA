//Espera a que el DOM cargue
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
});

//Funcion que Llama a la API GET /app/producto.
function cargarProductos() {
    const tablaBody = document.getElementById("tbody-productos");

    if (!tablaBody) {
        console.error("No se encontró el contenedor tbody-productos.");
        return;
    }

    tablaBody.innerHTML = '<div class="data-row">Cargando datos...</div>';

    fetch("http://localhost:3000/app/producto")
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            return res.json();
        })
        .then(productos => {
            if (!Array.isArray(productos)) {
                console.error("La API no devolvió un array:", productos);
                tablaBody.innerHTML = '<div class="data-row">No se pudieron cargar los productos.</div>';
                return;
            }

            if (productos.length === 0) {
                tablaBody.innerHTML = '<div class="data-row">No hay productos registrados.</div>';
                return;
            }

            tablaBody.innerHTML = productos.map(prod => `
                <div class="data-row">
                    <div><div class="main-text">${prod.idProducto ?? ''}</div></div>
                    <div><div class="main-text">${prod.nombre ?? ''}</div></div>
                    <div><div class="main-text">${prod.codigoBarra ?? ''}</div></div>
                    <div><div class="main-text">${Number(prod.precioVenta || 0).toLocaleString('es-CO')}</div></div>
                    <div><div class="main-text">${Number(prod.precioCompra || 0).toLocaleString('es-CO')}</div></div>
                    <div><div class="main-text">${prod.categoria ?? ''}</div></div>
                    <div><div class="main-text">${prod.unidadMedida ?? ''}</div></div>
                    <div><div class="main-text">${prod.fechaVencimiento ? formatearFecha(prod.fechaVencimiento) : ''}</div></div>
                    <div>
                        <button class="btn-editar" onclick="editarProducto(${prod.idProducto})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarProducto(${prod.idProducto})">Eliminar</button>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error("Error al conectar con la API:", err);
            tablaBody.innerHTML = '<div class="data-row">Error al cargar productos.</div>';
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
        const response = await fetch(`http://localhost:3000/app/producto/${idProducto}`, {
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
