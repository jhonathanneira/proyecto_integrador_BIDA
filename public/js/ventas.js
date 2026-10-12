document.addEventListener('DOMContentLoaded', () => {
    const btnNuevaVenta = document.getElementById('btn-nuevo');
    const modalVenta = document.getElementById('modal-nueva-venta');
    const formVenta = document.getElementById('form-nueva-venta');
    const btnCerrarVenta = document.getElementById('btn-cerrar-venta');
    const btnCancelarVenta = document.getElementById('btn-cancelar-venta');
    const selectCliente = document.getElementById('venta-cliente');
    const selectProducto = document.getElementById('venta-producto');
    const inputCantidad = document.getElementById('venta-cantidad');
    const itemsContainer = document.getElementById('venta-items');
    const totalElement = document.getElementById('venta-total');
    const mensajeVenta = document.getElementById('mensaje-nueva-venta');
    const itemsVenta = [];
    let productosDisponibles = [];

    const encabezadosSesion = () => ({
        Authorization: `Bearer ${sessionStorage.getItem('sesionToken') || ''}`
    });

    const dinero = valor => Number(valor || 0).toLocaleString('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    });

    async function cargarOpcionesVenta() {
        try {
            const [respuestaProductos, respuestaClientes] = await Promise.all([
                fetch('/app/producto'),
                fetch('/app/cliente')
            ]);
            if (!respuestaProductos.ok || !respuestaClientes.ok) throw new Error('No fue posible cargar productos o clientes.');
            productosDisponibles = await respuestaProductos.json();
            const datosClientes = await respuestaClientes.json();
            const clientes = datosClientes.clientes || datosClientes;
            selectProducto.innerHTML = productosDisponibles.length
                ? productosDisponibles.map(p => `<option value="${p.idProducto}">${p.nombre} - ${dinero(p.precioVenta)}</option>`).join('')
                : '<option value="">No hay productos disponibles</option>';
            selectCliente.innerHTML = clientes.length
                ? clientes.map(c => `<option value="${c.idCliente}">${c.nombre} ${c.apellido || ''} - ${c.documentoIdentidad || ''}</option>`).join('')
                : '<option value="">No hay clientes registrados</option>';
        } catch (error) {
            mensajeVenta.textContent = error.message;
        }
    }

    function renderizarItems() {
        if (!itemsVenta.length) {
            itemsContainer.innerHTML = '<p>No hay productos agregados.</p>';
        } else {
            itemsContainer.innerHTML = itemsVenta.map((item, indice) => `
                <div class="venta-item">
                    <span>${item.nombre} x ${item.cantidad}</span>
                    <strong>${dinero(item.cantidad * item.precioUnitario)}</strong>
                    <button type="button" data-quitar-item="${indice}" aria-label="Quitar producto">Quitar</button>
                </div>`).join('');
            itemsContainer.querySelectorAll('[data-quitar-item]').forEach(boton => {
                boton.addEventListener('click', () => {
                    itemsVenta.splice(Number(boton.dataset.quitarItem), 1);
                    renderizarItems();
                });
            });
        }
        totalElement.textContent = dinero(itemsVenta.reduce((total, item) => total + item.cantidad * item.precioUnitario, 0));
    }

    function abrirModalVenta() {
        modalVenta.hidden = false;
        mensajeVenta.textContent = '';
        cargarOpcionesVenta();
    }

    function cerrarModalVenta() {
        modalVenta.hidden = true;
        formVenta.reset();
        itemsVenta.length = 0;
        renderizarItems();
        mensajeVenta.textContent = '';
    }

    btnNuevaVenta?.addEventListener('click', abrirModalVenta);
    btnCerrarVenta?.addEventListener('click', cerrarModalVenta);
    btnCancelarVenta?.addEventListener('click', cerrarModalVenta);

    document.getElementById('btn-agregar-producto')?.addEventListener('click', () => {
        const producto = productosDisponibles.find(p => String(p.idProducto) === selectProducto.value);
        const cantidad = Number(inputCantidad.value);
        if (!producto || !Number.isInteger(cantidad) || cantidad <= 0) {
            mensajeVenta.textContent = 'Selecciona un producto y una cantidad valida.';
            return;
        }
        const existente = itemsVenta.find(item => item.idProducto === producto.idProducto);
        if (existente) existente.cantidad += cantidad;
        else itemsVenta.push({ idProducto: producto.idProducto, nombre: producto.nombre, cantidad, precioUnitario: Number(producto.precioVenta) });
        mensajeVenta.textContent = '';
        renderizarItems();
    });

    formVenta?.addEventListener('submit', async evento => {
        evento.preventDefault();
        const empleado = JSON.parse(sessionStorage.getItem('empleado') || '{}');
        if (!empleado.idEmpleado || !selectCliente.value || !document.getElementById('venta-metodo-pago').value || !itemsVenta.length) {
            mensajeVenta.textContent = 'Completa cliente, metodo de pago y agrega al menos un producto.';
            return;
        }
        try {
            const respuesta = await fetch('/app/venta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...encabezadosSesion() },
                body: JSON.stringify({
                    idEmpleado: empleado.idEmpleado,
                    idCliente: Number(selectCliente.value),
                    metodoPago: document.getElementById('venta-metodo-pago').value,
                    productos: itemsVenta.map(item => ({ idProducto: item.idProducto, cantidad: item.cantidad, precioUnitario: item.precioUnitario }))
                })
            });
            const datos = await respuesta.json().catch(() => ({}));
            if (!respuesta.ok) throw new Error(datos.mensaje || datos.message || 'No fue posible registrar la venta.');
            cerrarModalVenta();
            cargarDatos('ventas');
        } catch (error) {
            mensajeVenta.textContent = error.message;
        }
    });

    const btnLogout = document.getElementById('btn-logout');

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('empleado');
            window.location.href = '../WEB Y APP/BIDA_Inicio de sesion_login.html';
        });
    }

    const ventasPrueba = Array.isArray(window.ventasBD) ? window.ventasBD : [];

    function limpiarVista(modulo) {
        const tbody = document.getElementById(`tbody-${modulo}`);
        if (!tbody) return;
        tbody.innerHTML = '<div class="data-row">Cargando datos...</div>';
        cargarDatos(modulo);
    }

    function cargarDatos(modulo) {
        const url = '/app/venta';

        const token = sessionStorage.getItem('sesionToken') || '';
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => renderizarVentas(data))
            .catch(err => {
                console.warn('No fue posible cargar desde backend, usando datos de prueba:', err.message);
                renderizarVentasPrueba();
            });
    }

    function renderizarVentasPrueba() {
        const tbody = document.getElementById('tbody-ventas');
        if (!ventasPrueba.length) {
            tbody.innerHTML = '<div class="data-row">No hay ventas de prueba configuradas.</div>';
            return;
        }

        tbody.innerHTML = ventasPrueba.map(venta => `
            <div class="data-row">
                <div><div class="main-text">${venta.idVenta || ''}</div></div>
                <div><div class="main-text">${venta.fechaHora || ''}</div></div>
                <div><div class="main-text" style="font-size: 1.1rem; color: #005792;">$${parseFloat(venta.totalPagar || 0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${venta.metodoPago || ''}</div></div>
                <div><span class="status-badge status-active">${venta.estado || ''}</span></div>
                <div><div class="main-text">${venta.idEmpleado || ''}</div></div>
                <div><div class="main-text">${venta.idCliente || ''}</div></div>
            </div>
        `).join('');
    }

    function renderizarVentas(data) {
        const lista = Array.isArray(data) ? data : (data.ventas || data);
        const tbody = document.getElementById('tbody-ventas');
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<div class="data-row">No hay ventas registradas.</div>';
            return;
        }

        tbody.innerHTML = lista.map(venta => `
            <div class="data-row">
                <div><div class="main-text">${venta.idVenta || venta.id || ''}</div></div>
                <div><div class="main-text">${venta.fechaHora || ''}</div></div>
                <div><div class="main-text" style="font-size: 1.1rem; color: #005792;">$${parseFloat(venta.totalPagar||0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${venta.metodoPago || ''}</div></div>
                <div><span class="status-badge status-active">${venta.estado || ''}</span></div>
                <div><div class="main-text">${venta.idEmpleado || ''}</div></div>
                <div><div class="main-text">${venta.idCliente || ''}</div></div>
            </div>
        `).join('');
    }

    const tbodyVentas = document.getElementById('tbody-ventas');
    tbodyVentas.innerHTML = '<div class="data-row">Cargando datos...</div>';
    cargarDatos('ventas');
});
