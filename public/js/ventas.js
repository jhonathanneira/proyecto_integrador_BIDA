document.addEventListener('DOMContentLoaded', () => {
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
        const url = 'http://localhost:3000/app/venta';

        fetch(url)
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
