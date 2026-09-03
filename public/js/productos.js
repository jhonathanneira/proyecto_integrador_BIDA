//Espera a que el DOM cargue
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    document.getElementById('form-editar-producto')?.addEventListener('submit', guardarEdicionProducto);
    document.querySelectorAll('[data-cerrar-edicion-producto]').forEach(boton => boton.addEventListener('click', cerrarEdicionProducto));
});

let productosPorId = new Map();

//Funcion que Llama a la API GET /app/producto.
function cargarProductos() {
    const tablaBody = document.getElementById("tbody-productos");

    if (!tablaBody) {
        console.error("No se encontró el contenedor tbody-productos.");
        return;
    }

    tablaBody.innerHTML = '<div class="data-row">Cargando datos...</div>';

    fetch("/app/producto")
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

            productosPorId = new Map(productos.map(producto => [String(producto.idProducto), producto]));

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
                        <button class="btn-editar" type="button" data-editar-producto="${prod.idProducto}">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarProducto(${prod.idProducto})">Eliminar</button>
                    </div>
                </div>
            `).join('');
            tablaBody.querySelectorAll('[data-editar-producto]').forEach(boton => {
                boton.addEventListener('click', () => editarProducto(boton.dataset.editarProducto));
            });
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
        const response = await fetch(`/app/producto/${idProducto}`, {
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
function editarProducto(idProducto) {
    const producto = productosPorId.get(String(idProducto));
    if (!producto) return alert('No se encontró el producto seleccionado.');

    document.getElementById('editar-producto-id').value = producto.idProducto;
    document.getElementById('editar-producto-nombre').value = producto.nombre || '';
    document.getElementById('editar-producto-codigo').value = producto.codigoBarra || '';
    document.getElementById('editar-producto-precio-venta').value = producto.precioVenta ?? '';
    document.getElementById('editar-producto-precio-compra').value = producto.precioCompra ?? '';
    document.getElementById('editar-producto-categoria').value = producto.categoria || '';
    document.getElementById('editar-producto-unidad').value = producto.unidadMedida || '';
    document.getElementById('editar-producto-fecha').value = producto.fechaVencimiento ? String(producto.fechaVencimiento).slice(0, 10) : '';
    document.getElementById('mensaje-editar-producto').textContent = '';
    document.getElementById('modal-editar-producto').classList.add('is-open');
}

function cerrarEdicionProducto() {
    document.getElementById('modal-editar-producto').classList.remove('is-open');
}

async function guardarEdicionProducto(evento) {
    evento.preventDefault();
    const idProducto = document.getElementById('editar-producto-id').value;
    const mensaje = document.getElementById('mensaje-editar-producto');
    const producto = {
        nombre: document.getElementById('editar-producto-nombre').value.trim(),
        codigoBarra: document.getElementById('editar-producto-codigo').value.trim(),
        precioVenta: Number(document.getElementById('editar-producto-precio-venta').value),
        precioCompra: Number(document.getElementById('editar-producto-precio-compra').value),
        categoria: document.getElementById('editar-producto-categoria').value.trim(),
        unidadMedida: document.getElementById('editar-producto-unidad').value.trim(),
        fechaVencimiento: document.getElementById('editar-producto-fecha').value || null
    };

    try {
        const respuesta = await fetch(`/app/producto/${idProducto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...encabezadosSesion() },
            body: JSON.stringify(producto)
        });
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.mensaje || datos.message || 'No fue posible actualizar el producto.');
        cerrarEdicionProducto();
        cargarProductos();
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

function encabezadosSesion() {
    const token = sessionStorage.getItem('sesionToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
