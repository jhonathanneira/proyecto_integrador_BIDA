document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('empleado');
            window.location.href = '../WEB Y APP/BIDA_Inicio de sesion_login.html';
        });
    }

    const productosPrueba = Array.isArray(window.productosBD) ? window.productosBD : [];

    function limpiarVista(modulo) {
        const tbody = document.getElementById(`tbody-${modulo}`);
        if (!tbody) return;
        tbody.innerHTML = '<div class="data-row">Cargando datos...</div>';
        cargarDatos(modulo);
    }

    function cargarDatos(modulo) {
        const url = 'http://localhost:3000/app/producto';

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => renderizarProductos(data))
            .catch(err => {
                console.warn('No fue posible cargar desde backend, usando datos de prueba:', err.message);
                renderizarProductosPrueba();
            });
    }

    function renderizarProductosPrueba() {
        const tbody = document.getElementById('tbody-productos');
        if (!productosPrueba.length) {
            tbody.innerHTML = '<div class="data-row">No hay productos de prueba configurados.</div>';
            return;
        }

        tbody.innerHTML = productosPrueba.map(prod => `
            <div class="data-row">
                <div><div class="main-text">${prod.idProducto || ''}</div></div>
                <div><div class="main-text">${prod.nombre || ''}</div></div>
                <div><div class="main-text">${prod.codigoBarra}</div></div>
                <div><div class="main-text" style="color: #15803d;">$${(prod.precioVenta || 0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">$${(prod.precioCompra || 0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${prod.categoria || ''}</div></div>
                <div><div class="main-text">${prod.unidadMedida || ''}</div></div>
                <div><div class="main-text">${prod.fechaVencimiento}</div></div>
            </div>
        `).join('');
    }

    function renderizarProductos(data) {
        const lista = Array.isArray(data) ? data : (data.productos || data);
        const tbody = document.getElementById('tbody-productos');
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<div class="data-row">No hay productos registrados.</div>';
            return;
        }

        tbody.innerHTML = lista.map(prod => `
            <div class="data-row">
                <div><div class="main-text">${prod.idProducto || prod.id || ''}</div></div>
                <div><div class="main-text">${prod.nombre || ''}</div></div>
                <div><div class="main-text">${prod.codigoBarra || ''}</div></div>
                <div><div class="main-text" style="color: #15803d;">$${(prod.precioVenta||0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">$${(prod.precioCompra||0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${prod.categoria || ''}</div></div>
                <div><div class="main-text">${prod.unidadMedida || ''}</div></div>
                <div><div class="main-text">${prod.fechaVencimiento || ''}</div></div>
            </div>
        `).join('');
    }

    const tbodyProductos = document.getElementById('tbody-productos');
    tbodyProductos.innerHTML = '<div class="data-row">Cargando datos...</div>';
    cargarDatos('productos');
});
